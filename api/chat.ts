export const config = {
    runtime: 'edge',
};

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const { query, history, mode, modelName } = await req.json();

        // Reconstruct the message array for Groq
        const messages = [];

        // System instruction can be simplified or omitted for the minimal working code, 
        // but we add a basic one if needed
        messages.push({
            role: 'system',
            content: 'You are Aetheris, a helpful AI assistant.',
        });

        if (history && Array.isArray(history)) {
            history.forEach((msg: any) => {
                messages.push({
                    role: msg.role === 'assistant' ? 'assistant' : 'user',
                    content: msg.content,
                });
            });
        }

        messages.push({ role: 'user', content: query });

        const groqKey = process.env.GROQ_API_KEY;

        if (!groqKey) {
            return new Response(JSON.stringify({ error: 'No API key configured on server' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Call Groq API
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: modelName || 'llama-3.1-8b-instant',
                messages: messages,
                temperature: 0.7,
                max_tokens: 800,
                stream: false, // We return JSON as requested
            }),
        });

        if (!groqResponse.ok) {
            const errorData = await groqResponse.json();
            return new Response(JSON.stringify({ error: errorData }), {
                status: groqResponse.status,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const data = await groqResponse.json();
        const content = data.choices[0]?.message?.content || '';

        // Return the response as JSON to the frontend
        return new Response(JSON.stringify({ content, isInstant: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
