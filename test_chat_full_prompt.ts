import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config({ path: '.env.local' });

const apiKey = process.env.GROQ_API_KEY?.trim();
const isGroq = !!apiKey;

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: isGroq ? "https://api.groq.com/openai/v1" : "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Aetheris AI",
  }
});

async function run() {
  try {
    const response = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: "hello".repeat(500) }, { role: "user", content: "test request" }],
      stream: true,
      temperature: 0.2,
      max_tokens: 8000,
    });

    for await (const chunk of response) {
      process.stdout.write(chunk.choices[0]?.delta?.content || "");
    }
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}
run();
