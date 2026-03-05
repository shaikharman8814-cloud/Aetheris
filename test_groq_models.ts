import dotenv from "dotenv";
dotenv.config({ path: '.env.local' });

const apiKey = process.env.GROQ_API_KEY?.trim();

const fetchGroq = async () => {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${apiKey}`
        }
    });
    const data = await res.json();
    console.log("Models:", data.data.map((m: any) => m.id));
}
fetchGroq();
