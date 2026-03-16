export async function performWebSearch(query) {
    const serperKey = process.env.SERPER_API_KEY?.trim();
    if (!serperKey) {
        console.warn("[Search] No SERPER_API_KEY found. Skipping web search.");
        return [];
    }
    try {
        const response = await fetch("https://google.serper.dev/search", {
            method: "POST",
            headers: {
                "X-API-KEY": serperKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ q: query, num: 5 }),
        });
        if (!response.ok)
            throw new Error(`Serper API error: ${response.statusText}`);
        const data = await response.json();
        const results = (data.organic || []).slice(0, 5).map((item) => ({
            title: item.title,
            snippet: item.snippet || item.snippet_highlighted || "",
            url: item.link || item.url || "",
        }));
        return results;
    }
    catch (error) {
        console.error("[Search] Web search failed:", error);
        return [];
    }
}
export function formatSearchContext(results) {
    if (results.length === 0)
        return "";
    let context = "Search Results:\n\n";
    results.forEach((res, idx) => {
        context += `[${idx + 1}] ${res.title}\n${res.snippet}\nSource: ${res.url}\n\n`;
    });
    return context.slice(0, 5000); // Limit to 5000 tokens as requested
}
export function detectSearchIntent(query) {
    const searchKeywords = [
        "news", "current", "today", "latest", "who is", "what is", "price",
        "weather", "event", "research", "compare", "vs", "versus", "fact",
        "history", "population", "capital", "stocks", "market", "report"
    ];
    const lowerQuery = query.toLowerCase();
    // Basic heuristic: length and keywords
    if (lowerQuery.length > 10 && searchKeywords.some(keyword => lowerQuery.includes(keyword))) {
        return true;
    }
    // If it looks like a factual question
    if (/^(who|what|where|when|why|how|which|whose|whom|can you tell me|search for)/i.test(lowerQuery)) {
        return true;
    }
    return false;
}
