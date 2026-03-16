export default async function handler(req: any, res: any) {

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { query, history, mode, modelName } = req.body || {};

        if (!query) {
            return res.status(400).json({ error: "Query is required" });
        }

        const groqKey = process.env.GROQ_API_KEY;

        if (!groqKey) {
            console.error("Missing GROQ_API_KEY");
            return res.status(500).json({ error: "Server API key missing" });
        }

        const messages: any[] = [];

        messages.push({
            role: "system",
            content: "You are Aetheris, a helpful AI assistant."
        });

        if (Array.isArray(history)) {
            history.forEach((msg: any) => {
                messages.push({
                    role: msg.role === "assistant" ? "assistant" : "user",
                    content: msg.content
                });
            });
        }

        messages.push({
            role: "user",
            content: query
        });

        let activeModel = "llama-3.1-8b-instant";
        if (modelName === "aetheris-v4") {
            activeModel = "llama-3.3-70b-versatile";
        } else if (modelName === "aetheris-v2" || modelName === "aetheris-v3") {
            activeModel = "llama-3.1-8b-instant";
        } else if (modelName) {
            activeModel = modelName;
        }

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${groqKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: activeModel,
                    messages,
                    temperature: 0.7,
                    max_tokens: 800
                })
            }
        );

        if (!response.ok) {
            const text = await response.text();
            console.error("Groq error:", text);
            return res.status(response.status).json({ error: text });
        }

        const data = await response.json();

        const content = data?.choices?.[0]?.message?.content || "";

        return res.status(200).json({
            content,
            isInstant: true
        });

    } catch (error) {
        console.error("API Error:", error);

        return res.status(500).json({
            error: "AI service failed"
        });
    }
}