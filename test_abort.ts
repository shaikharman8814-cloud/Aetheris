import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

async function main() {
  const ac = new AbortController();
  setTimeout(() => ac.abort(), 100);
  try {
    const stream = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: "Tell me a very long story." }],
      stream: true,
      max_tokens: 50
    }, { signal: ac.signal });
    for await (const chunk of stream) {}
  } catch (err: any) {
    console.log("ERROR NAME:", err.name);
  }
}
main();
