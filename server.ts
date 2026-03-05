import express from "express";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";
import dotenv from "dotenv";
import Tesseract from "tesseract.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
const rateLimit = require("express-rate-limit");

import { getInstantResponse } from "./instantResponse";

dotenv.config({ path: '.env.local' });
dotenv.config();

import { getSystemInstruction } from "./services/searchService";

async function processAttachments(attachments: any[]): Promise<any[]> {
  const processed: any[] = [];
  for (const att of attachments) {
    try {
      if (att.type?.startsWith('image/')) {
        const base64 = att.url.split(',')[1];
        const buffer = Buffer.from(base64, 'base64');
        const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
        processed.push({
          type: "text",
          text: `[File Brain - Content of Image (OCR text extraction): ${att.name}]\n${text}`
        });
      } else if (att.type === 'application/pdf') {
        const base64 = att.url.split(',')[1];
        const buffer = Buffer.from(base64, 'base64');
        const data = await pdf(buffer);
        processed.push({
          type: "text",
          text: `[File Brain - Content of PDF: ${att.name}]\n${data.text}`
        });
      } else {
        // Assume text/code
        const base64 = att.url.split(',')[1];
        const content = Buffer.from(base64, 'base64').toString('utf-8');
        processed.push({
          type: "text",
          text: `[File Brain - Content of File: ${att.name}]\n${content}`
        });
      }
    } catch (error) {
      console.error(`Error processing attachment ${att.name}:`, error);
      processed.push({
        type: "text",
        text: `[Error reading file: ${att.name}]`
      });
    }
  }

  // Merge text-based attachments into a single block for better reasoning
  const textAtts = processed.filter(p => p.type === "text");
  const otherAtts = processed.filter(p => p.type !== "text");

  if (textAtts.length > 0) {
    const combinedText = textAtts.map(t => t.text).join("\n\n---\n\n");
    return [{ type: "text", text: combinedText }, ...otherAtts];
  }

  return processed;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const aetherisLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 25,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: "Aetheris is experiencing high demand. Please try again later."
    }
  });

  // Chat Endpoint with Instant Response Layer
  app.post("/api/chat", aetherisLimiter, async (req, res) => {
    const { query, history, mode, attachments, modelName } = req.body;

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
      let userContent: any = query;

      if (attachments && attachments.length > 0) {
        const processedAtts = await processAttachments(attachments);
        userContent = [{ type: "text", text: query }, ...processedAtts];
      }

      const messages = [
        { role: "system", content: getSystemInstruction(mode as any) },
        ...(history || []).map((msg: any) => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        })),
        { role: "user", content: userContent }
      ];

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

      if (modelName === "aetheris-v4") {
        primaryModel = "llama-3.3-70b-versatile"; // High intelligence
        fallbackModel = "google/gemini-2.0-flash-lite-001";
      } else if (modelName === "aetheris-v2") {
        primaryModel = "llama-3.1-8b-instant"; // High speed
      }

      // Primary: Try Groq (Timeout 2s rule for response init)
      if (groqKey) {
        console.log(`[Aetheris] Attempting Primary Groq via ${primaryModel}`);
        const groqai = new OpenAI({
          apiKey: groqKey,
          baseURL: "https://api.groq.com/openai/v1"
        });

        try {
          // Extend timeout to 15s to allow for heavy processing under load
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Groq Timeout (>15s)")), 15000));
          const apiCallPromise = groqai.chat.completions.create({
            model: primaryModel,
            messages: messages as any,
            stream: true,
            temperature: 0.7,
            max_tokens: 800,
          } /*, { signal: abortController.signal }*/);

          response = await Promise.race([apiCallPromise, timeoutPromise]) as any;
          usedProvider = "Groq";
        } catch (e: any) {
          console.warn("[Aetheris] Groq Failed/Timeout. Falling back to OpenRouter.", e.message);
        }
      }

      // Fallback: If Groq didn't work, immediately fallback to OpenRouter
      if (usedProvider === "none" && openRouterKey) {
        console.log(`[Aetheris] Attempting Fallback OpenRouter via ${fallbackModel}`);
        const openai = new OpenAI({
          apiKey: openRouterKey,
          baseURL: "https://openrouter.ai/api/v1",
          defaultHeaders: {
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Aetheris AI",
          }
        });

        response = await openai.chat.completions.create({
          model: fallbackModel,
          messages: messages as any,
          stream: true,
          temperature: 0.7,
          max_tokens: 8000,
        } /* , { signal: abortController.signal } */);
        usedProvider = "OpenRouter";
      }

      if (!response) {
        res.write("*(No provider stream available — check API keys or provider status)*");
        return res.end();
      }

      // Announce provider to client UI
      if ((res as any).flush) (res as any).flush();

      for await (const chunk of response) {
        const content =
          chunk.choices?.[0]?.delta?.content ??
          chunk.choices?.[0]?.message?.content ??
          "";
        if (content) {
          res.write(content);
          if ((res as any).flush) (res as any).flush();
        }
      }
      res.end();

    } catch (error: any) {
      const isAbort = error.name === 'AbortError' || error.message?.toLowerCase().includes('abort');
      if (isAbort) {
        console.log("Client aborted the connection during stream (Silent).");
        return res.end();
      }

      console.error("Chat Error:", error);

      if (!res.headersSent) {
        return res.json({
          content: `### System Error
I could not connect to OpenRouter or Groq.
**Root Cause**: ${error.message}`,
          isInstant: true
        });
      } else {
        res.write(`\n\n*(Connection lost: ${error.message})*`);
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
