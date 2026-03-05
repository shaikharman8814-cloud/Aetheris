import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const startTime = Date.now();
console.log('Sending request to Groq...');

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

async function main() {
  try {
    const stream = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: "Tell me a joke." }],
      stream: true,
      max_tokens: 50
    });
    let first = true;
    for await (const chunk of stream) {
      if (first) {
        console.log(`First token received in: ${Date.now() - startTime}ms`);
        first = false;
      }
      process.stdout.write(chunk.choices[0]?.delta?.content || "");
    }
    console.log(`\n\nTotal time: ${Date.now() - startTime}ms`);
  } catch (err) {
    console.error(err);
  }
}
main();
