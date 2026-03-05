import dotenv from "dotenv";
dotenv.config({ path: '.env.local' });

async function check() {
    const query = "hello";
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.ANTHROPIC_API_KEY}`,
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Aetheris"
        },
        body: JSON.stringify({
            model: "google/gemini-2.0-flash-lite-preview-02-05:free", // let's see if 3 works
            messages: [
                { role: "user", content: query }
            ],
            max_tokens: 1500
        })
    });

    const text = await res.text();
    console.log("RAW RESPONSE:", text);
}
check();
