import express from "express";
import path from "path";

import OpenAI from "openai";
import dotenv from "dotenv";
import Tesseract from "tesseract.js";
import crypto from "crypto";
import mammoth from "mammoth";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfImport = require("pdf-parse");
const pdf = typeof pdfImport === 'function' ? pdfImport : (pdfImport.default || pdfImport);
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const cors = require("cors");
const xss = require("xss");

import { getInstantResponse } from "./instantResponse.ts";

dotenv.config({ path: '.env.local' });
dotenv.config();

import { getSystemInstruction } from "./services/searchService.ts";
import { ragService } from "./services/ragService.ts";
import { detectSearchIntent, performWebSearch, formatSearchContext } from "./services/webSearchService.ts";

const documentMemory = new Map<string, string>(); // memory cache for documents

async function extractDocumentText(att: any): Promise<string> {
  if (!att.url || !att.url.includes(',')) return "";
  const base64 = att.url.split(',')[1];

  const fileHash = crypto.createHash('sha256').update(base64).digest('hex');

  if (documentMemory.has(fileHash)) {
    return documentMemory.get(fileHash)!;
  }

  const buffer = Buffer.from(base64, 'base64');
  let extracted = "";

  try {
    if (att.type === 'application/pdf') {
      const data = await pdf(buffer);
      extracted = data.text;
    } else if (att.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || att.name?.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      extracted = result.value;
    } else if (att.type?.startsWith('image/')) {
      const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
      extracted = text;
    } else {
      extracted = buffer.toString('utf-8');
    }

    if (extracted) {
      documentMemory.set(fileHash, extracted);
    }
    return extracted;
  } catch (error) {
    console.error(`Error extracting ${att.name}:`, error);
    return `[Error extracting text from ${att.name}]`;
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", "ws://localhost:*", "http://localhost:*", "https://api.groq.com", "https://openrouter.ai"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    strictTransportSecurity: { maxAge: 31536000, includeSubDomains: true, preload: true },
    frameguard: { action: 'deny' },
    noSniff: true,
  }));

  // Set Permissions-Policy explicitly
  app.use((req, res, next) => {
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    next();
  });

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://aetheris-mc8c.onrender.com'];

  app.use(cors({
    origin: (origin: any, callback: any) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  const perMinuteLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60, // allow more overall API throughput here per IP, but distinct endpoints will have deeper limits
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: "Too many requests. Please wait a moment before trying again."
    }
  });

  app.use('/api', perMinuteLimiter);

  // Deep sanitization middleware to prevent XSS and Injection across all inputs globally
  const sanitizeValue = (val: any): any => {
    if (typeof val === 'string') return xss(val.trim());
    if (Array.isArray(val)) return val.map(sanitizeValue);
    if (val !== null && typeof val === 'object') {
      const sanitizedObj: any = {};
      for (const [k, v] of Object.entries(val)) {
        sanitizedObj[xss(k)] = sanitizeValue(v);
      }
      return sanitizedObj;
    }
    return val;
  };

  app.use('/api', (req, res, next) => {
    req.body = sanitizeValue(req.body);
    const sanitizedQuery = sanitizeValue({ ...req.query });
    req.params = sanitizeValue(req.params);
    next();
  });

  const ipDailyUsage: Record<string, { count: number, resetTime: number }> = {};
  const sharedConversations = new Map<string, { question: string, answer: string, timestamp: number }>();

  const dailyLimitMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!ipDailyUsage[ip] || now > ipDailyUsage[ip].resetTime) {
      ipDailyUsage[ip] = { count: 0, resetTime: now + 24 * 60 * 60 * 1000 };
    }

    if (ipDailyUsage[ip].count >= 200) {
      return res.status(429).json({ error: "You have reached today's usage limit. Please try again tomorrow." });
    }

    ipDailyUsage[ip].count++;
    next();
  };

  const lastRequestPerIp = new Map<string, number>();

  // Chat Endpoint with Instant Response Layer
  app.post("/api/chat", dailyLimitMiddleware, async (req, res) => {
    let { query, history, mode, attachments, modelName } = req.body;

    // Bot Protection: 2 second delay between requests
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const lastRequest = lastRequestPerIp.get(ip) || 0;
    const now = Date.now();
    if (now - lastRequest < 2000) {
      return res.status(429).json({ error: "Please wait a moment between messages." });
    }
    lastRequestPerIp.set(ip, now);

    // Explicit secondary input sanitization just to be absolutely sure for query length limiting
    if (query && typeof query === 'string') {
      query = query.slice(0, 2000);
    }

    if (!query || query.length === 0) {
      return res.status(400).json({ message: "Invalid request." });
    }

    // 1. Instant Response Check
    const instantRes = getInstantResponse(query);
    if (instantRes) {
      console.log(`[Instant Response] Matched: "${query}"`);
      return res.json({ content: instantRes, isInstant: true });
    }

    const groqKey = process.env.GROQ_API_KEY?.trim();
    const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();

    if (!groqKey && !openRouterKey) {
      return res.status(500).json({ error: "No API keys configured on server" });
    }

    try {
      const allAttachments: any[] = [];
      if (history && Array.isArray(history)) {
        history.forEach((msg: any) => {
          if (msg.attachments && Array.isArray(msg.attachments)) {
            allAttachments.push(...msg.attachments);
          }
        });
      }
      if (attachments && Array.isArray(attachments)) {
        allAttachments.push(...attachments);
      }

      const uniqueAttachmentsMap = new Map();
      allAttachments.forEach(att => {
        if (att.url) {
          uniqueAttachmentsMap.set(att.url, att);
        }
      });
      const uniqueAttachments = Array.from(uniqueAttachmentsMap.values());

      // Temporary Feature Lock: Intercept Image and PDF uploads only for the CURRENT request
      if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        const hasBlockedFile = attachments.some(att =>
          att.type?.startsWith('image/') ||
          att.type === 'application/pdf' ||
          att.name?.toLowerCase().endsWith('.pdf') ||
          /\.(jpg|jpeg|png|webp|pdf)$/i.test(att.name || "")
        );

        if (hasBlockedFile) {
          return res.json({
            content: "📎 File analysis is coming soon.\n\nAetheris will soon support:\n• PDF document analysis\n• Image understanding\n\nThis feature is currently under development.",
            isInstant: true
          });
        }
      }

      let rawBase64Images: string[] = [];
      let imageTypes: string[] = [];
      const docIds: string[] = [];

      // Web Search Logic
      let searchContext = "";
      if (detectSearchIntent(query)) {
        console.log(`[Search] Triggering web search for: "${query}"`);
        const searchResults = await performWebSearch(query);
        searchContext = formatSearchContext(searchResults);
      }

      const embeddingClient = new OpenAI({
        apiKey: openRouterKey || groqKey,
        baseURL: openRouterKey ? "https://openrouter.ai/api/v1" : "https://api.groq.com/openai/v1",
      });

      for (const att of uniqueAttachments) {
        if (att.type?.startsWith('image/')) {
          const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
          if (!allowedTypes.includes(att.type)) {
            return res.status(400).json({ message: `Unsupported image format: ${att.type}` });
          }

          if (!att.url || !att.url.includes(',')) continue;

          const base64Str = att.url.split(',')[1];
          const buffer = Buffer.from(base64Str, 'base64');
          if (buffer.length > 5 * 1024 * 1024) {
            return res.status(400).json({ message: `Image ${att.name} exceeds 5MB limit.` });
          }

          rawBase64Images.push(base64Str);
          imageTypes.push(att.type);
        } else {
          const text = await extractDocumentText(att);
          if (text) {
            const docId = crypto.createHash('sha256').update(att.url + att.name).digest('hex');
            await ragService.indexDocument(docId, text, embeddingClient);
            docIds.push(docId);
          }
        }
      }

      const retrievedChunks = await ragService.retrieve(query, embeddingClient, docIds);
      const documentContext = retrievedChunks.join("\n\n---\n\n").slice(0, 5000);

      const recentHistory = (history || []).slice(-4);

      const messages: any[] = [
        { role: "system", content: getSystemInstruction(mode as any) }
      ];

      if (searchContext) {
        messages.push({
          role: "system",
          content: "Use the following web sources to answer the question:\n\n" + searchContext
        });
      }

      if (documentContext) {
        messages.push({
          role: "system",
          content: "Relevant document context:\n" + documentContext
        });
      }

      messages.push(...recentHistory.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })));

      if (rawBase64Images.length > 0) {
        const visionContent: any[] = [{ type: "text", text: query }];
        rawBase64Images.forEach((base64, idx) => {
          visionContent.push({
            type: "image_url",
            image_url: {
              url: `data:${imageTypes[idx] || 'image/png'};base64,${base64}`
            }
          });
        });
        messages.push({ role: "user", content: visionContent });
      } else {
        messages.push({ role: "user", content: query });
      }

      const abortController = new AbortController();
      // Logic for stream handling without unstable server-side manual abortion
      // req.on('close', () => { ... });

      // Stream the response back to the client immediately
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Transfer-Encoding', 'chunked');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      let usedProvider = "none";
      let response;

      // Model Routing Logic
      let primaryModel = "llama-3.1-8b-instant";
      let fallbackModel = "google/gemini-2.0-flash-lite-001";

      if (rawBase64Images.length > 0) {
        primaryModel = "openai/gpt-4o-mini";
        fallbackModel = "openai/gpt-4o-mini";
      } else if (modelName === "aetheris-v4") {
        primaryModel = "llama-3.3-70b-versatile"; // High intelligence
        fallbackModel = "google/gemini-2.0-flash-lite-001";
      } else if (modelName === "aetheris-v2") {
        primaryModel = "llama-3.1-8b-instant"; // High speed
      }

      const getAIResponse = async (msgs: any[], retryOnTokenLimit = true): Promise<any> => {
        let currentResponse;

        // Primary: Try Groq
        if (groqKey && rawBase64Images.length === 0) {
          const groqai = new OpenAI({ apiKey: groqKey, baseURL: "https://api.groq.com/openai/v1" });
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);
            currentResponse = await groqai.chat.completions.create({
              model: primaryModel,
              messages: msgs as any,
              stream: true,
              temperature: 0.7,
              max_tokens: 800,
            }, { signal: controller.signal });
            clearTimeout(timeout);
            usedProvider = "Groq";
            return currentResponse;
          } catch (e: any) {
            console.warn("[Aetheris] Groq Failed/Timeout. Falling back to OpenRouter.", e.message);
          }
        }

        // Fallback: OpenRouter
        if (usedProvider === "none" && openRouterKey) {
          const openai = new OpenAI({
            apiKey: openRouterKey,
            baseURL: "https://openrouter.ai/api/v1",
            defaultHeaders: { "HTTP-Referer": "http://localhost:3000", "X-Title": "Aetheris AI" }
          });

          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);
            currentResponse = await openai.chat.completions.create({
              model: fallbackModel,
              messages: msgs as any,
              stream: true,
              temperature: 0.7,
              max_tokens: 700,
            }, { signal: controller.signal });
            clearTimeout(timeout);
            usedProvider = "OpenRouter";
            return currentResponse;
          } catch (e: any) {
            if (retryOnTokenLimit && (e.status === 402 || e.message?.toLowerCase().includes("token") || e.code === "context_length_exceeded")) {
              console.log("[Error Shield] Token limit reached. Retrying with reduced context...");

              // Rebuild messages with reduced history (last 4 instead of 6)
              const reducedHistory = (history || []).slice(-4);
              const newMsgs: any[] = [{ role: "system", content: getSystemInstruction(mode as any) }];
              if (searchContext) newMsgs.push({ role: "system", content: "Use the following web sources to answer the question:\n\n" + searchContext });
              if (documentContext) newMsgs.push({ role: "system", content: "Relevant document context:\n" + documentContext });
              newMsgs.push(...reducedHistory.map((msg: any) => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content
              })));

              if (rawBase64Images.length > 0) {
                const visionContent: any[] = [{ type: "text", text: query }];
                rawBase64Images.forEach((base64, idx) => {
                  visionContent.push({ type: "image_url", image_url: { url: `data:${imageTypes[idx] || 'image/png'};base64,${base64}` } });
                });
                newMsgs.push({ role: "user", content: visionContent });
              } else {
                newMsgs.push({ role: "user", content: query });
              }

              return getAIResponse(newMsgs, false); // Retry once
            }
            throw e;
          }
        }
        return null;
      };

      response = await getAIResponse(messages);

      if (!response) {
        if (!res.headersSent) {
          return res.json({ content: "I'm sorry, something interrupted the response. Please try again.", isInstant: true });
        } else {
          res.write("I'm sorry, something interrupted the response. Please try again.");
          return res.end();
        }
      }

      // Stream the response back to the client immediately
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();
      }

      try {
        for await (const chunk of response) {
          const content = chunk.choices?.[0]?.delta?.content ?? chunk.choices?.[0]?.message?.content ?? "";
          if (content) {
            res.write(content);
            if ((res as any).flush) (res as any).flush();
          }
        }
      } catch (streamError: any) {
        console.error("Stream Error:", streamError);
        res.write(`\n\n⚠️ Connection interrupted. Please try again.`);
      }
      res.end();

    } catch (error: any) {
      const isAbort = error.name === 'AbortError' || error.message?.toLowerCase().includes('abort');
      if (isAbort) {
        console.log("Client aborted the connection during stream (Silent).");
        return res.end();
      }

      console.error("[Error Shield Log]:", error);

      if (!res.headersSent) {
        return res.json({
          content: "I'm sorry, something interrupted the response. Please try again.",
          isInstant: true
        });
      } else {
        res.write(`\n\nI'm sorry, something interrupted the response. Please try again.`);
        return res.end();
      }
    }
  });

  // Image Generation Endpoint
  app.post("/api/generate-image", async (req, res) => {
    const { prompt, type, topic } = req.body;

    if (!prompt && !topic) {
      return res.status(400).json({ error: "Prompt or topic is required" });
    }

    let finalPrompt = prompt;

    if (type === 'diagram') {
      finalPrompt = `Create a clean, educational diagram explaining: ${topic}. The image should: be minimal and professional, include labeled components, show relationships using arrows or flow lines, use soft neutral colors, look like a textbook or presentation diagram, avoid artistic or decorative styles.White background, clear typography, structured layout.`;
    } else if (type === 'timeline') {
      finalPrompt = `Create a horizontal timeline infographic about: ${topic}. The image should: show events in chronological order, include dates or sequence markers, use icons or small visuals for each step, be clean, modern, and readable, look like a professional history or business timeline.White or light background, structured layout, labeled events.`;
    } else if (type === 'comparison') {
      finalPrompt = `Create a structured comparison chart about: ${topic}. The image should: use columns or side - by - side layout, include headings and labeled sections, highlight differences clearly, use simple icons or symbols if useful, look like a professional presentation slide.Clean layout, readable text, minimal color palette.`;
    }

    const apiKey = (process.env.OPENROUTER_API_KEY || process.env.API_KEY || process.env.OPENAI_API_KEY)?.trim();

    if (!apiKey) {
      return res.status(500).json({ error: "API key not configured on server" });
    }

    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Aetheris AI",
      }
    });

    try {
      // Using OpenRouter's image generation model (e.g., black-forest-labs/flux-schnell or similar)
      // Note: OpenRouter often uses chat completions for images or a specific model.
      // We'll try the standard images.generate first, but OpenRouter might require a specific model name.
      const response = await openai.images.generate({
        model: "black-forest-labs/flux-schnell",
        prompt: finalPrompt,
        size: "1024x1024",
        n: 1,
      });

      const imageUrl = response.data[0].url;
      res.json({ url: imageUrl });
    } catch (error: any) {
      console.error("Image Generation Error:", error);
      res.status(500).json({
        error: "Failed to generate image",
        details: error.message || "Unknown error"
      });
    }
  });

  // Title Generation Endpoint
  app.post("/api/title", async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ title: "" });

    const apiKey = (process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY)?.trim();
    if (!apiKey) return res.json({ title: message.substring(0, 40) });

    const isGroq = !!process.env.GROQ_API_KEY;
    const baseURL = isGroq ? "https://api.groq.com/openai/v1" : "https://openrouter.ai/api/v1";
    const model = isGroq ? "llama-3.1-8b-instant" : "google/gemini-2.0-flash-lite-001";

    const ai = new OpenAI({
      apiKey,
      baseURL,
      defaultHeaders: isGroq ? undefined : {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Aetheris AI",
      }
    });

    try {
      const response = await ai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: "You are a title generator. Generate a short, concise conversation title based on the user's message. Rules: maximum 5 words, no punctuation, sentence case, must summarize the topic. Return ONLY the title string, nothing else." },
          { role: "user", content: message }
        ],
        temperature: 0.3,
        max_tokens: 15,
      });

      let title = response.choices?.[0]?.message?.content?.trim() || message.substring(0, 40);
      // clean punctuation and enforce sentence case just in case
      title = title.replace(/[^\w\s]/g, '').toLowerCase();
      title = title.charAt(0).toUpperCase() + title.slice(1);

      const words = title.split(/\s+/);
      if (words.length > 5) {
        title = words.slice(0, 5).join(' ');
      }

      res.json({ title });
    } catch (e) {
      console.error("Title Generation API Error:", e);
      res.json({ title: message.substring(0, 40) });
    }
  });

  // Share Chat Endpoints
  app.post("/api/share", (req, res) => {
    const { question, answer } = req.body;
    const id = crypto.randomUUID().split('-')[0];

    if (sharedConversations.size >= 100) {
      const oldest = Array.from(sharedConversations.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      if (oldest) sharedConversations.delete(oldest[0]);
    }

    sharedConversations.set(id, { question: question || "", answer: answer || "", timestamp: Date.now() });
    res.json({ id, url: `http://localhost:3000/share/${id}` });
  });

  app.get("/api/share/:id", (req, res) => {
    const conv = sharedConversations.get(req.params.id);
    if (!conv) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json({ question: conv.question, answer: conv.answer });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
      res.sendFile(path.resolve("dist/index.html"));
    } else {
      next();
    }
  });


  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("[Aetheris Error]", err);

    res.status(500).json({
      message: "Aetheris is temporarily unavailable. Please try again shortly."
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
