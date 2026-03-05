import dotenv from "dotenv";
dotenv.config({ path: '.env.local' });

const apiKey = process.env.GROQ_API_KEY?.trim();
console.log("Key starts with:", apiKey?.substring(0, 4));

const fetchGroq = async () => {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: "test" }],
            temperature: 0.7
        })
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Groq response:", text);
}
fetchGroq();
