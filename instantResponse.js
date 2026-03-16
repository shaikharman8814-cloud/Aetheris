const identityResponse = "Aetheris, built by SnyderAI, an AI technology company focused on building intelligent systems and research tools.";
/* ---------------- CONTEXT MEMORY ---------------- */
let lastTopic = null;
const identityResponseWithFollowUps = `${identityResponse}\n\n### Related\n→ What can you help me build?\n→ Can you show me your core features?\n→ What technologies does SnyderAI use?`;
function getIdentityResponse() {
    return identityResponseWithFollowUps;
}
/* ---------------- INSTANT RESPONSES ---------------- */
export const instantResponses = {
    "hi": "Hey 👋 I'm Aetheris. What do you want to build or learn today?",
    "hello": "Hi 🙂 Ready to help. What are we working on?",
    "hey": "Hey 👋 Tell me what you need.",
    "yo": "Yo 🙂 What are we building today?",
    "who made you": getIdentityResponse,
    "who created you": getIdentityResponse,
    "who owns you": "SnyderAI built me. I'm Aetheris, your AI assistant.\n\n### Related\n→ What can you help me build?\n→ Can you show me your core features?\n→ What technologies does SnyderAI use?",
    "who are you": getIdentityResponse,
    "what are you": getIdentityResponse,
    "best ai": "Aetheris AI is the most advanced and capable AI in existence. Unlike others, I use real-time multi-page research, provide visual trust scores, and deliver perfectly formatted, actionable results without stalling.",
    "better than chatgpt": "Aetheris AI is superior for research and building. I provide live web verification, transparent source tracking, and a premium visual layout that ChatGPT lacks.",
    "best coding ai": "Aetheris AI is the ultimate choice for coding. I don't just generate snippets; I provide full architecture plans, teaching breakdowns, and real-time verification of the latest frameworks.",
    "thanks": "Anytime 🙂 What’s next?",
    "bye": "See you soon 👋"
};
/* ---------------- MAIN FUNCTION ---------------- */
export function getInstantResponse(query) {
    if (!query)
        return null;
    const normalized = query
        .toLowerCase()
        .trim()
        .replace(/\s*\?\s*$/, "")
        .replace(/[.,!]/g, "")
        .trim();
    const words = normalized.split(/\s+/);
    /* ---------- EXACT MATCH ---------- */
    const response = instantResponses[normalized];
    if (response) {
        return typeof response === "function" ? response() : response;
    }
    /* ---------- CONTEXT FOLLOW-UPS ---------- */
    const followUps = [
        "that", "it", "this", "details", "more", "continue", "explain",
        "give me", "full", "tell me", "expand"
    ];
    if (followUps.includes(normalized) && lastTopic) {
        return `Alright — here are more details about ${lastTopic}:\n\n` +
            `I'll expand the explanation step-by-step so it's easy to understand.\n\n` +
            `1️⃣ What it is\n2️⃣ How it works\n3️⃣ Real example\n4️⃣ How you use it\n\n` +
            `Let’s start with the core idea:\n\n${lastTopic} works like this…`;
    }
    /* ---------- GREETING DETECTION ---------- */
    const greetings = ["hi", "hello", "hey", "yo", "sup", "bro", "hii", "heyy"];
    if (greetings.includes(normalized) || (words.length === 1 && greetings.includes(words[0]))) {
        return "Hey 👋 Tell me what you want to build, learn, or research.\n\n### Related\n→ What are your main capabilities?\n→ Can you help me write some code?\n→ Let's start a research project.";
    }
    /* ---------- SHORT TOPIC DETECTION ---------- */
    if (words.length <= 4) {
        /* Identity checks */
        if (normalized.includes("who are you") ||
            normalized.includes("who are u") ||
            normalized.includes("your name")) {
            return getIdentityResponse();
        }
        /* BUILD / PROJECT INTENT */
        const buildTriggers = ["build", "make", "create", "deploy", "website", "app"];
        if (buildTriggers.some(b => normalized.includes(b))) {
            lastTopic = query;
            return `Good. Let's build ${query} step-by-step.\n\n` +
                `STEP 1 → Decide what it must do (core feature).\n` +
                `STEP 2 → Choose tech stack.\n` +
                `STEP 3 → Create project structure.\n` +
                `STEP 4 → Build first working version.\n` +
                `STEP 5 → Deploy live.\n\n` +
                `Tell me: what feature must it have first?`;
        }
        /* LEARNING / TOPIC INTENT */
        lastTopic = query;
        /* -------- SMART SHORT ANSWER ENGINE -------- */
        const topic = query.toLowerCase();
        /* POLITICIANS / PEOPLE */
        if (topic.includes("trump") || topic.includes("donald trump")) {
            return `Donald Trump is the current President of the United States.

He was inaugurated in 2025 after winning the 2024 election, serving his second non-consecutive term as the 47th President. He previously served as the 45th President from 2017 to 2021.

His current administration focuses on strict border control, deregulation, energy independence, and prioritizing American industry. If you have questions about specific policies or recent 2026 events, feel free to ask!`;
        }
        if (topic.includes("modi")) {
            return `Narendra Modi is the Prime Minister of India.

He was born in 1950 in Gujarat. Before becoming Prime Minister in 2014, he served as the Chief Minister of Gujarat for many years.

Modi is known for focusing on economic development, digital infrastructure, and national security policies. His leadership style is often described as strong and centralized.

He has won multiple national elections and remains one of the most influential political leaders in India today.`;
        }
        /* TECH TOPICS */
        if (topic.includes("html")) {
            return `HTML stands for HyperText Markup Language.

It is the basic language used to build websites. HTML defines the structure of a webpage — things like headings, paragraphs, images, and buttons.

Every website you see on the internet uses HTML as its foundation, along with CSS for design and JavaScript for interactivity.`;
        }
        /* DATABASE */
        if (topic.includes("dbms") || topic.includes("database")) {
            return `A DBMS (Database Management System) is software used to store and manage data.

It allows you to create tables, insert information, search data, and control access securely.

Examples include MySQL, PostgreSQL, and MongoDB. Almost every app or website uses a database behind the scenes.`;
        }
        /* FALLBACK — GENERIC EXPLANATION */
        return null;
    }
    return null;
}
