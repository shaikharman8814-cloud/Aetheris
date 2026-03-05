const q = async () => {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer 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` },
        body: JSON.stringify({ model: "google/gemini-2.0-flash-lite-001", messages: [{role:"user", content:"hi"}] })
    });
    console.log(res.status, await res.text());
}
q();
