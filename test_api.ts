async function test() {
    const res = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "explain how to build a boat", history: [], mode: "Search", modelName: "llama-3.1-8b-instant" })
    });
    console.log(res.status);
    const text = await res.text();
    console.log(text);
}
test();
