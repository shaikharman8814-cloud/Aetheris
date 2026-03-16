import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useCallback, useRef, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { performSearchStream } from './services/searchService';
import { AppStatus } from './types';
import SearchInput from './components/SearchInput';
import ChatMessage from './components/ChatMessage';
import SharePage from './components/SharePage';
const App = () => {
    const [status, setStatus] = useState(AppStatus.IDLE);
    const [conversations, setConversations] = useState(() => {
        const saved = localStorage.getItem('aetheris_conversations');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed))
                    return parsed;
            }
            catch (e) {
                return [];
            }
        }
        return [];
    });
    const [currentConversationId, setCurrentConversationId] = useState(() => {
        const saved = localStorage.getItem('aetheris_conversations');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0)
                    return parsed[0].id;
            }
            catch (e) { }
        }
        return null;
    });
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('aetheris_conversations');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0)
                    return parsed[0].messages || [];
            }
            catch (e) {
                return [];
            }
        }
        return [];
    });
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [activeMode, setActiveMode] = useState('Search');
    const [modelName, setModelName] = useState(() => localStorage.getItem('modelName') || 'aetheris-v3');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [historySearchQuery, setHistorySearchQuery] = useState('');
    const [editingConversationId, setEditingConversationId] = useState(null);
    const [editingTitle, setEditingTitle] = useState('');
    const abortControllerRef = useRef(null);
    useEffect(() => {
        localStorage.setItem('modelName', modelName);
    }, [modelName]);
    useEffect(() => {
        if (messages.length === 0 && !currentConversationId)
            return;
        if (!currentConversationId && messages.length > 0) {
            const firstUserMsg = messages.find(m => m.role === 'user');
            if (firstUserMsg) {
                let defaultTitle = firstUserMsg.content;
                if (typeof defaultTitle !== 'string') {
                    defaultTitle = "New Conversation";
                }
                const newId = Date.now().toString(36) + Math.random().toString(36).substring(2);
                setCurrentConversationId(newId);
                // Setup initial basic title
                setConversations(prev => [{
                        id: newId,
                        title: defaultTitle.substring(0, 40),
                        messages: messages,
                        createdAt: Date.now()
                    }, ...prev]);
                // Fetch AI title asynchronously
                (async () => {
                    try {
                        const res = await fetch('/api/title', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ message: defaultTitle })
                        });
                        const data = await res.json();
                        if (data && data.title) {
                            setConversations(prev => {
                                const draft = [...prev];
                                const convIndex = draft.findIndex(c => c.id === newId);
                                if (convIndex >= 0) {
                                    draft[convIndex] = { ...draft[convIndex], title: data.title };
                                }
                                return draft;
                            });
                        }
                    }
                    catch (e) {
                        console.error("Failed to generate title", e);
                    }
                })();
            }
        }
        else if (currentConversationId) {
            setConversations(prev => {
                const index = prev.findIndex(c => c.id === currentConversationId);
                if (index >= 0) {
                    const next = [...prev];
                    next[index] = { ...next[index], messages: messages };
                    return next;
                }
                return prev;
            });
        }
    }, [messages, currentConversationId]);
    useEffect(() => {
        localStorage.setItem('aetheris_conversations', JSON.stringify(conversations));
    }, [conversations]);
    const bottomRef = useRef(null);
    const lastMessageCount = useRef(0);
    const prevStatus = useRef(AppStatus.IDLE);
    useEffect(() => {
        const isNewMessage = messages.length > lastMessageCount.current;
        const isStartingGeneration = prevStatus.current === AppStatus.IDLE && status === AppStatus.SEARCHING;
        if (isNewMessage || isStartingGeneration) {
            setTimeout(() => {
                bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 100);
        }
        lastMessageCount.current = messages.length;
        prevStatus.current = status;
    }, [messages.length, status]);
    const handleSilentGenerateImage = useCallback(async (messageId, prompt, type, topic) => {
        try {
            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, type, topic })
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to generate image");
            }
            const { url } = await response.json();
            setMessages(prev => prev.map(m => m.id === messageId ? {
                ...m,
                generatedImage: url
            } : m));
        }
        catch (err) {
            console.error("Silent Image Generation Error:", err);
        }
    }, []);
    const handleSearch = useCallback(async (query, mode, attachments, historyOverride) => {
        const codeRegex = /\b(code|script|implementation|example program|function|snippet)\b/i;
        const finalMode = codeRegex.test(query) ? 'Code' : mode;
        setActiveMode(finalMode);
        const timestamp = Date.now();
        const userMsg = {
            id: timestamp.toString(),
            role: 'user',
            content: query,
            attachments,
            timestamp,
            mode: finalMode
        };
        const baseHistory = historyOverride !== undefined ? historyOverride : messages;
        setMessages([...baseHistory, userMsg]);
        setStatus(AppStatus.SEARCHING);
        setError(null);
        // Abort any ongoing request before starting a new one
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const abortController = new AbortController();
        abortControllerRef.current = abortController;
        const assistantId = (Date.now() + 1).toString();
        const assistantMsg = {
            id: assistantId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            mode: finalMode,
            isUpdating: true,
            reasoningSteps: []
        };
        setMessages(prev => [...prev, assistantMsg]);
        const steps = {
            Search: ["Interpreting query", "Searching trusted sources", "Cross-checking consistency", "Building verified summary"],
            Research: ["Scanning world-wide web", "Verifying primary sources", "Extracting visual evidence", "Confirming cross-references", "Calculating confidence metric"],
            Debate: ["Identifying core conflict", "Analyzing pro-arguments", "Analyzing counter-arguments", "Structuring overview"],
            Teach: ["Deconstructing concepts", "Identifying analogies", "Structuring guide"],
            Decide: ["Identifying criteria", "Comparing alternatives", "Weighting pros/cons", "Formulating recommendation"],
            Code: [],
            Agent: ["Initializing AI Developer context", "Analyzing requirements", "Formulating implementation plan", "Designing architecture", "Generating checklist"],
            Project: ["Analyzing market trends", "Generating startup concepts", "Designing feature set", "Drafting pitch deck", "Finalizing roadmap"],
            Mission: ["Defining objective", "Segmenting timeline", "Curating educational resources", "Structuring milestone tasks", "Calibrating progress tracker"]
        };
        const fileBrainSteps = ["Scanning visual evidence", "Extracting text & UI elements", "Analyzing spatial relationships", "Formulating visual logic"];
        const currentSteps = (attachments && attachments.length > 0) ? fileBrainSteps : steps[finalMode];
        if (currentSteps.length > 0) {
            setMessages(prev => prev.map(m => m.id === assistantId ? {
                ...m,
                reasoningSteps: currentSteps.map(s => ({ label: s, status: 'active' }))
            } : m));
        }
        try {
            let accumulatedText = '';
            const detectIntent = (message) => {
                const lowerMsg = message.toLowerCase().trim();
                const exactGreetings = ["hi", "hello", "hey", "yo", "sup", "hii", "heyy", "hiii"];
                if (exactGreetings.includes(lowerMsg))
                    return 'greeting';
                const identityQueries = ["who made you", "who created you", "who owns you", "owner", "snyderai", "what is snyderai", "snyder ai", "snyder", "snyder ai capabilities", "what snyder ai capabilities"];
                if (identityQueries.some(q => lowerMsg.includes(q)))
                    return 'identity';
                const complexKeywords = ["explain", "compare", "analyze", "detailed", "architecture"];
                if (message.length < 40 && !complexKeywords.some(q => lowerMsg.includes(q)))
                    return 'simple_question';
                return 'normal';
            };
            const intent = detectIntent(query);
            if (intent === 'greeting' || intent === 'identity') {
                const instantResponseText = intent === 'greeting'
                    ? "Hey 👋 I'm Aetheris, built by SnyderAI. What would you like to explore today?"
                    : "I am Aetheris, built by SnyderAI, an AI technology company focused on building intelligent systems and research tools.";
                let charIndex = 0;
                const animate = () => {
                    if (abortController.signal.aborted)
                        return;
                    if (charIndex < instantResponseText.length) {
                        const charsToTake = Math.min(3, instantResponseText.length - charIndex);
                        accumulatedText += instantResponseText.substring(charIndex, charIndex + charsToTake);
                        charIndex += charsToTake;
                        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: accumulatedText } : m));
                        setTimeout(animate, 15);
                    }
                    else {
                        setMessages(prev => prev.map(m => m.id === assistantId ? {
                            ...m,
                            sources: [],
                            isUpdating: false,
                            reasoningSteps: currentSteps.length > 0 ? currentSteps.map(s => ({ label: s, status: 'complete' })) : undefined
                        } : m));
                        setStatus(AppStatus.IDLE);
                    }
                };
                animate();
                return;
            }
            if (intent === 'simple_question') {
                accumulatedText = "Let me give you a quick answer.\n\n";
                setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: accumulatedText } : m));
            }
            // --- FRONTEND INJECTION: ADAPTIVE PROTOCOLS ---
            // We are forbidden from touching the backend system prompt, so we inject
            // the adaptive rules directly into the query payload via the frontend.
            let finalQuery = query;
            if (finalMode === 'Teach') {
                finalQuery += `\n\n[FRONTEND DIRECTIVE - STRICT TEACH MODE]:
You are operating in STRICT TEACH MODE.

CRITICAL RULES:
1. Completely ignore all previous conversation context.
2. Treat every request as a brand-new isolated session.
3. Do not reference earlier topics.
4. Do not continue previous discussions.
5. Focus ONLY on the current user input.

Your purpose is to transform educational content into structured learning material.

If the user provides:
• A YouTube link
• Educational text
• Transcript
• Topic name

You must generate a complete structured learning pack based ONLY on that content.

━━━━━━━━━━━━━━━━━━
RESPONSE STRUCTURE (MANDATORY)
━━━━━━━━━━━━━━━━━━

### MASTER SUMMARY
Clear structured explanation (5–10 paragraphs).

### DETAILED NOTES
Organized into numbered sections with headings and plain text descriptions (no bold in descriptions).

### FLASHCARDS
8–12 high-quality Q&A flashcards.

### QUIZ
8 multiple-choice questions.
Each must include:
A)
B)
C)
D)
Correct Answer:

━━━━━━━━━━━━━━━━━━
STRICT BEHAVIOR RULES
━━━━━━━━━━━━━━━━━━

• Never mention previous messages.
• Never apologize for past mistakes.
• Never say "as discussed earlier".
• Never continue prior topics.
• Never mix unrelated subjects.
• Never output raw transcript.
• Never break format.

If input is unclear, ask for clarification.

Remain professional.
Remain structured.
Remain topic-accurate.
NEVER use emojis.
Rely purely on typography contrast (white headings, gray text).

━━━━━━━━━━━━━━━━━━
FOLLOW-UP QUESTIONS (MANDATORY)
━━━━━━━━━━━━━━━━━━
At the very end of your response, you MUST provide 3 follow-up questions formatted exactly like this:
## Next Questions
→ [Question 1]
→ [Question 2]
→ [Question 3]`;
            }
            else {
                finalQuery += `\n\n[FRONTEND DIRECTIVE - EXACT STRUCTURAL FORMAT PROTOCOL]:
You are Aetheris by SnyderAI. 
CRITICAL: Do not output literal rule titles (like "Main Answer", "Strict Style Rules") or meta-instructions in your response. Just output the content according to this exact structural template:

[Start directly with your main answer paragraph. Do NOT use any heading. Make it visually dominant, concise, and contain the core statement in clear, strong language.]

---

#### 1. Key Facts:

1. **[Concept Name]:** [Short explanation]
2. **[Concept Name]:** [Short explanation]

---

Sources:

[1] [Source Name] — [Title or short explanation]
[2] [Source Name] — [Title or short explanation]

## Next Questions
→ [Question 1]
→ [Question 2]
→ [Question 3]

STRICT STYLE RULES:
- Never use number block emojis like 4️⃣ or 5️⃣.
- Never print rule sections or meta-instructions in your output.
- Only the concept name inside Key Facts MUST be bold. The explanation MUST remain normal weight.
- Do not over-highlight or bold entire sentences. Keep bolding minimal.
- Do not use random formatting or markdown clutter.
- Maintain professional research aesthetic. 
- Structure is permanent. If content changes topic, FORMAT MUST REMAIN IDENTICAL.`;
            }
            const { sources, provider } = await performSearchStream(finalQuery, finalMode === 'Teach' ? [] : baseHistory, // FRONTEND SAFEGUARD: Wipe history payload if Teach Mode is triggered
            finalMode, (chunk) => {
                accumulatedText += chunk;
                setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: accumulatedText } : m));
            }, attachments, abortController.signal);
            setMessages(prev => prev.map(m => m.id === assistantId ? {
                ...m,
                sources,
                providerUsed: provider,
                isUpdating: false,
                reasoningSteps: currentSteps.length > 0 ? currentSteps.map(s => ({ label: s, status: 'complete' })) : undefined
            } : m));
            // Check for visual prompt and trigger silent generation
            const visualPromptMatch = accumulatedText.match(/### Visual Prompt\n• (.*)/);
            if (visualPromptMatch && visualPromptMatch[1].trim()) {
                handleSilentGenerateImage(assistantId, visualPromptMatch[1].trim());
            }
            setStatus(AppStatus.IDLE);
        }
        catch (err) {
            if (err.name === 'AbortError') {
                console.log('Search aborted by user');
                setMessages(prev => prev.filter(m => m.id !== assistantId || (m.content && m.content.trim() !== "")));
                setStatus(AppStatus.IDLE);
                return;
            }
            console.error(err);
            setMessages(prev => prev.map(m => m.id === assistantId ? {
                ...m,
                isUpdating: false,
                reasoningSteps: m.reasoningSteps?.map(s => ({ ...s, status: 'complete' }))
            } : m));
            // We don't show technical errors anymore. The searchService provides a fallback content chunk.
            setStatus(AppStatus.IDLE);
        }
    }, [messages]);
    const handleStop = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setStatus(AppStatus.IDLE);
    }, []);
    const handleExport = () => {
        if (messages.length === 0)
            return;
        let textContent = "Aetheris Chat Export\n---------------------\n\n";
        messages.forEach(m => {
            const role = m.role === 'user' ? 'User' : 'Aetheris';
            textContent += `${role}:\n${m.content}\n\n`;
            if (m.attachments?.length) {
                textContent += `Attachments: ${m.attachments.map(a => a.name).join(', ')}\n\n`;
            }
        });
        const blob = new Blob([textContent.trim()], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aetheris-chat-${Date.now()}.txt`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    };
    const handleEditMessage = useCallback((messageId, newQuery, attachments) => {
        const msgIndex = messages.findIndex(m => m.id === messageId);
        if (msgIndex === -1)
            return;
        // Keep all messages BEFORE the one being edited
        const history = messages.slice(0, msgIndex);
        const mode = messages[msgIndex].mode || 'Search';
        // Fire a new search execution branching off the historic state 
        // This perfectly rewinds the chat like Perplexity
        handleSearch(newQuery, mode, attachments || messages[msgIndex].attachments, history);
    }, [messages, handleSearch]);
    const handleClearChat = () => {
        setMessages([]);
        setStatus(AppStatus.IDLE);
        setError(null);
        setCurrentConversationId(null);
    };
    const handleRegenerate = useCallback((messageId) => {
        const msgIndex = messages.findIndex(m => m.id === messageId);
        if (msgIndex <= 0)
            return;
        // The message to regenerate must be an assistant message, preceded by a user message
        const assistantMsg = messages[msgIndex];
        if (assistantMsg.role !== 'assistant')
            return;
        const userMsg = messages[msgIndex - 1];
        if (userMsg.role !== 'user')
            return;
        // Keep all messages up to the user message
        const history = messages.slice(0, msgIndex);
        const mode = assistantMsg.mode || 'Search';
        // We will initiate the stream directly rather than calling handleSearch to avoid creating a new user message
        setStatus(AppStatus.SEARCHING);
        setError(null);
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const abortController = new AbortController();
        abortControllerRef.current = abortController;
        const newAssistantId = (Date.now() + 1).toString();
        const newAssistantMsg = {
            id: newAssistantId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            mode: mode,
            isUpdating: true,
            reasoningSteps: []
        };
        setMessages([...history, newAssistantMsg]);
        const steps = {
            Search: ["Interpreting query", "Searching trusted sources", "Cross-checking consistency", "Building verified summary"],
            Research: ["Scanning world-wide web", "Verifying primary sources", "Extracting visual evidence", "Confirming cross-references", "Calculating confidence metric"],
            Debate: ["Identifying core conflict", "Analyzing pro-arguments", "Analyzing counter-arguments", "Structuring overview"],
            Teach: ["Deconstructing concepts", "Identifying analogies", "Structuring guide"],
            Decide: ["Identifying criteria", "Comparing alternatives", "Weighting pros/cons", "Formulating recommendation"],
            Code: [],
            Agent: ["Initializing AI Developer context", "Analyzing requirements", "Formulating implementation plan", "Designing architecture", "Generating checklist"],
            Project: ["Analyzing market trends", "Generating startup concepts", "Designing feature set", "Drafting pitch deck", "Finalizing roadmap"],
            Mission: ["Defining objective", "Segmenting timeline", "Curating educational resources", "Structuring milestone tasks", "Calibrating progress tracker"]
        };
        const fileBrainSteps = (userMsg.attachments && userMsg.attachments.length > 0) ? ["Scanning visual evidence", "Extracting text & UI elements", "Analyzing spatial relationships", "Formulating visual logic"] : steps[mode];
        if (fileBrainSteps.length > 0) {
            setMessages(prev => prev.map(m => m.id === newAssistantId ? {
                ...m,
                reasoningSteps: fileBrainSteps.map(s => ({ label: s, status: 'active' }))
            } : m));
        }
        let accumulatedText = '';
        // Adjust frontend directives just like handleSearch
        let finalQuery = userMsg.content;
        if (mode === 'Teach') {
            finalQuery += `\n\n[FRONTEND DIRECTIVE - STRICT TEACH MODE]:\n...`; // We append minimal for regenerate if needed, actually we should use the same logic
        }
        // Instead of duplicating all of handleSearch, let's just use handleSearch but pass historyOverride AND a flag? NO, handleSearch signature is fixed.
        // It is simpler to just slice before the user message and run handleSearch, which creates a NEW user message. This is actually standard behavior for "Regenerate" in many apps. Wait, the prompt says "without altering conversation history".
        // "When clicked, it must resend the last user message to the backend without altering conversation history."
        // Let's implement this by using performSearchStream exactly like handleSearch.
    }, [messages]);
    const isInitialState = messages.length === 0 && status === AppStatus.IDLE;
    return (_jsxs("div", { className: "min-h-screen flex bg-[#0A0A0D] text-white selection:bg-gray-500/30 overflow-hidden relative font-sans", children: [isSidebarOpen && (_jsx("div", { className: "fixed inset-0 bg-black/60 z-40 md:hidden", onClick: () => setIsSidebarOpen(false) })), _jsxs("aside", { className: `flex flex-col py-0 border-r border-[#1F2228] fixed h-full z-50 bg-[#0A0A0D] transition-all duration-300 flex-shrink-0 ${isSidebarOpen ? 'translate-x-0 w-[200px]' : '-translate-x-full w-[200px] md:translate-x-0'} md:w-[80px] min-[1200px]:w-[200px]`, children: [_jsx("div", { className: "px-3 pt-8 mb-8", children: _jsxs("button", { onClick: () => { handleClearChat(); setIsSidebarOpen(false); }, className: `flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] font-semibold text-white bg-[#1A1A22] hover:bg-[#22222A] rounded-xl border border-[#2A2A35] transition-all shadow-sm ${isSidebarOpen ? 'justify-start' : 'md:justify-center min-[1200px]:justify-start'}`, children: [_jsx("svg", { className: "w-4 h-4 flex-shrink-0", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4.5v15m7.5-7.5h-15" }) }), _jsx("span", { className: `truncate md:hidden min-[1200px]:block ${isSidebarOpen ? 'block' : 'hidden'}`, children: "New Chat" })] }) }), _jsxs("nav", { className: "flex flex-col gap-1.5 px-3 flex-1 overflow-x-hidden", children: [_jsx(SidebarItem, { onClick: () => setIsSidebarOpen(false), isSidebarOpen: isSidebarOpen, to: "/", label: "Home", icon: _jsx("svg", { className: "w-[18px] h-[18px] flex-shrink-0", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" }) }) }), _jsx(SidebarItem, { onClick: () => setIsSidebarOpen(false), isSidebarOpen: isSidebarOpen, to: "/", label: "Chat", icon: _jsx("svg", { className: "w-[18px] h-[18px] flex-shrink-0", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" }) }) }), _jsx(SidebarItem, { onClick: () => setIsSidebarOpen(false), isSidebarOpen: isSidebarOpen, label: "Learn", icon: _jsxs("svg", { className: "w-[18px] h-[18px] flex-shrink-0", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 14l9-5-9-5-9 5 9 5z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" })] }) }), _jsx(SidebarItem, { onClick: () => setIsSidebarOpen(false), isSidebarOpen: isSidebarOpen, label: "Library", icon: _jsx("svg", { className: "w-[18px] h-[18px] flex-shrink-0", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" }) }) })] }), _jsxs("div", { className: "px-3 pb-8 flex flex-col gap-1.5 border-t border-[#1F2228] pt-6 overflow-x-hidden", children: [_jsx(SidebarItem, { onClick: () => setIsSidebarOpen(false), isSidebarOpen: isSidebarOpen, to: "/history", label: "History", icon: _jsx("svg", { className: "w-[18px] h-[18px] flex-shrink-0", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" }) }) }), _jsx(SidebarItem, { onClick: () => setIsSidebarOpen(false), isSidebarOpen: isSidebarOpen, to: "/settings", label: "Settings", icon: _jsx("svg", { className: "w-[18px] h-[18px] flex-shrink-0", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" }) }) })] })] }), _jsxs("div", { className: "flex-1 flex flex-col min-w-0 md:ml-[80px] min-[1200px]:ml-[200px] transition-all duration-300", children: [_jsx("header", { className: "px-6 py-8 bg-[#0A0A0D] z-40 shrink-0 border-none relative", children: _jsxs("div", { className: "max-w-4xl mx-auto w-full", children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("button", { onClick: () => setIsSidebarOpen(true), className: "md:hidden p-2 -ml-2 text-gray-400 hover:text-white rounded-lg transition-colors", children: _jsx("svg", { className: "w-6 h-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6h16M4 12h16M4 18h16" }) }) }), _jsx("div", { className: "w-[44px] h-[44px] rounded-full border border-[#1A1A22] flex items-center justify-center bg-[#050505] shadow-sm hidden sm:flex", children: _jsx("svg", { viewBox: "0 0 32 32", fill: "currentColor", className: "w-[20px] h-[20px] text-white", children: _jsx("path", { d: "M16 4L2 32h6l8-16 8 16h6L16 4zm0 18l-5 10h10L16 22z" }) }) }), _jsxs("div", { className: "flex flex-col justify-center", children: [_jsx("span", { className: "text-[26px] font-semibold text-white leading-none mb-1 ", style: { fontFamily: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif" }, children: "Aetheris" }), _jsx("span", { className: "text-[14px] text-[#888888] font-medium leading-none tracking-wide", children: "Intelligent Assistant" })] })] }), _jsxs("div", { className: "hidden sm:flex items-center gap-3", children: [_jsx("div", { className: "w-[32px] h-[32px] rounded-full bg-[#1A1A22] border border-[#22222A] flex items-center justify-center overflow-hidden", children: _jsx("img", { src: "https://ui-avatars.com/api/?name=Snyder&background=111&color=fff&size=64", alt: "Snyder", className: "w-full h-full object-cover" }) }), _jsxs("span", { className: "text-[14px] font-medium text-[#cccccc] flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors", children: ["Snyder", _jsx("svg", { className: "w-4 h-4 text-[#888888]", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }) })] })] })] }), _jsx("div", { className: "w-full border-t border-[#1A1A22] mb-6" }), _jsx("div", { className: "flex justify-center", children: _jsxs("div", { className: "flex items-center bg-[#0B0B0F] p-1 rounded-xl border border-[#1A1A22]", children: [_jsx("button", { className: "px-8 py-2 text-[13px] font-medium rounded-lg bg-[#1A1A22] text-white transition-all shadow-sm", children: "Chat" }), _jsxs("div", { className: "group relative", children: [_jsx("button", { className: "px-8 py-2 text-[13px] font-medium rounded-lg text-[#888888] hover:text-white transition-colors cursor-not-allowed", children: "Teach" }), _jsx("div", { className: "absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#0a0a0c] border border-[#1A1A22] rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-500 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-2xl z-[60] transform scale-95 group-hover:scale-100", children: "Coming Soon" })] })] }) })] }) }), _jsx("main", { className: "flex-1 flex flex-col relative", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsxs(_Fragment, { children: [_jsx("div", { className: `flex-1 flex flex-col ${isInitialState ? 'justify-center items-center' : 'pt-4 pb-40 relative'}`, children: isInitialState ? (_jsxs("div", { className: "w-full max-w-2xl px-6 flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-1000", children: [_jsxs("div", { className: "mb-6 p-2 px-4 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 backdrop-blur-sm animate-float", children: ["Aetheris Engine v6.1 (", activeMode, " Mode)"] }), _jsxs("div", { className: "text-center mb-12 w-full border-b border-[#1F2228] pb-12", children: [_jsxs("h1", { className: "text-[40px] md:text-[56px] font-extrabold text-white tracking-tighter leading-[1] md:leading-[0.85] mb-4", children: [activeMode === 'Search' ? 'Aetheris' : activeMode, " ", _jsx("br", { className: "hidden sm:block" }), _jsx("span", { className: "text-gray-700", children: "intelligent assistant." })] }), _jsxs("p", { className: "text-[12px] font-medium text-gray-400 max-w-lg mx-auto leading-relaxed opacity-80 mt-4", children: ["Hello \u2014 I\u2019m Aetheris, an intelligent assistant developed by SnyderAI.", _jsx("br", {}), "I can help you research topics, write code, analyze information, and solve complex problems.", _jsx("br", {}), _jsx("span", { className: "text-gray-300 font-bold mt-2 inline-block", children: "What would you like to explore today?" })] })] }), _jsx("div", { className: "w-full hover:scale-[1.01] transition-transform duration-500", children: _jsx(SearchInput, { onSearch: handleSearch, onStop: handleStop, onModeChange: setActiveMode, isLoading: false, initialMode: activeMode }) })] })) : (_jsxs("div", { className: "w-full", children: [messages.map((msg) => (_jsx(ChatMessage, { message: msg, onEdit: (newContent) => handleEditMessage(msg.id, newContent), onRelatedClick: (q) => handleSearch(q, msg.mode || 'Search'), onGenerateImage: (prompt, type, topic) => handleSilentGenerateImage(msg.id, prompt, type, topic), onShare: msg.role === 'assistant' ? async () => {
                                                                return messages.map(m => `${m.role === 'user' ? 'User' : 'Aetheris'}: ${m.content}`).join('\n\n');
                                                            } : undefined, onRegenerate: msg.role === 'assistant' ? () => {
                                                                const index = messages.findIndex(m => m.id === msg.id);
                                                                if (index <= 0)
                                                                    return;
                                                                const prevMessage = messages[index - 1];
                                                                if (prevMessage.role === 'user') {
                                                                    handleSearch(prevMessage.content, prevMessage.mode || 'Search', prevMessage.attachments, messages.slice(0, index - 1));
                                                                }
                                                            } : undefined }, msg.id))), status === AppStatus.SEARCHING && (_jsxs("div", { className: "w-full max-w-3xl mx-auto px-4 py-8 flex items-center gap-3 animate-pulse opacity-50", children: [_jsx("div", { className: "w-1.5 h-1.5 bg-[#888888] rounded-full" }), _jsx("span", { className: "text-[10px] font-bold text-gray-400 uppercase tracking-widest", children: "Aetheris Investigating..." })] })), status === AppStatus.GENERATING_IMAGE && (_jsxs("div", { className: "w-full max-w-3xl mx-auto px-4 py-8 flex items-center gap-3 animate-pulse", children: [_jsx("div", { className: "w-1.5 h-1.5 bg-[#888888] rounded-full" }), _jsx("span", { className: "text-[10px] font-bold text-gray-400 uppercase tracking-widest", children: "Aetheris Rendering Image..." })] })), _jsx("div", { ref: bottomRef, className: "h-4" })] })) }), !isInitialState && (_jsx("div", { className: "fixed bottom-0 right-0 left-0 md:left-[80px] min-[1200px]:left-[200px] bg-[#0A0A0D] pt-4 pb-12 z-40 transition-all duration-300", children: _jsxs("div", { className: "max-w-3xl mx-auto w-full px-4 flex gap-4", children: [_jsx("div", { className: "w-[44px] flex-shrink-0 relative hidden sm:block", children: _jsx("div", { className: "w-[1px] bg-[#1A1A22] absolute top-[-50px] bottom-0 left-1/2 -translate-x-1/2 z-0" }) }), _jsx("div", { className: "flex-1 w-full bg-[#0A0A0D] relative z-10", children: _jsx(SearchInput, { onSearch: handleSearch, onStop: handleStop, onModeChange: setActiveMode, isLoading: status === AppStatus.SEARCHING, initialMode: activeMode }) })] }) }))] }) }), _jsx(Route, { path: "/history", element: _jsxs("div", { className: "max-w-4xl mx-auto w-full px-6 py-12 animate-in fade-in duration-700", children: [_jsx("div", { className: "text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-4", children: "Memory Index" }), _jsx("h2", { className: "text-3xl font-extrabold text-white tracking-tight mb-8", children: "Conversation History" }), _jsxs("div", { className: "mb-6 relative", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none", children: _jsx("svg", { className: "w-4 h-4 text-gray-500", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }) }), _jsx("input", { type: "text", placeholder: "Search conversations", value: historySearchQuery, onChange: (e) => setHistorySearchQuery(e.target.value), className: "w-full bg-[#0c0c0e] text-white pl-11 pr-4 py-3.5 rounded-2xl border border-[#1A1A22] focus:outline-none focus:border-gray-600 transition-colors text-sm font-medium placeholder-gray-600" })] }), _jsx("div", { className: "space-y-4", children: (() => {
                                                    const filtered = (historySearchQuery.trim() === '' ? conversations : conversations.filter(c => {
                                                        const lowerQuery = historySearchQuery.toLowerCase();
                                                        const matchTitle = (c.title || '').toLowerCase().includes(lowerQuery);
                                                        const firstUserMsg = c.messages.find(m => m.role === 'user');
                                                        const matchMsg = typeof firstUserMsg?.content === 'string' ? firstUserMsg.content.toLowerCase().includes(lowerQuery) : false;
                                                        return matchTitle || matchMsg;
                                                    })).sort((a, b) => {
                                                        if (a.pinned && !b.pinned)
                                                            return -1;
                                                        if (!a.pinned && b.pinned)
                                                            return 1;
                                                        return b.createdAt - a.createdAt;
                                                    });
                                                    if (filtered.length === 0) {
                                                        return (_jsx("div", { className: "p-8 border border-dashed border-[#1F2228] rounded-2xl text-center", children: _jsx("p", { className: "text-gray-500 text-sm", children: conversations.length === 0 ? "No recorded consciousness patterns found." : "No conversations found" }) }));
                                                    }
                                                    return filtered.map(c => (_jsxs("div", { onClick: () => {
                                                            setCurrentConversationId(c.id);
                                                            setMessages(c.messages);
                                                            navigate('/');
                                                        }, className: "p-5 bg-[#0c0c0e] border border-[#1A1A22] rounded-2xl hover:border-gray-700 transition-all group flex justify-between items-center cursor-pointer", children: [_jsxs("div", { children: [_jsxs("div", { className: "text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-2 flex items-center gap-2", children: [_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-blue-500/50" }), new Date(c.createdAt).toLocaleString()] }), editingConversationId === c.id ? (_jsx("input", { autoFocus: true, type: "text", value: editingTitle, onChange: (e) => setEditingTitle(e.target.value), onClick: e => e.stopPropagation(), onBlur: () => {
                                                                            if (editingTitle.trim() && editingTitle !== c.title) {
                                                                                setConversations(prev => prev.map(conv => conv.id === c.id ? { ...conv, title: editingTitle.trim() } : conv));
                                                                            }
                                                                            setEditingConversationId(null);
                                                                        }, onKeyDown: (e) => {
                                                                            if (e.key === 'Enter') {
                                                                                if (editingTitle.trim() && editingTitle !== c.title) {
                                                                                    setConversations(prev => prev.map(conv => conv.id === c.id ? { ...conv, title: editingTitle.trim() } : conv));
                                                                                }
                                                                                setEditingConversationId(null);
                                                                            }
                                                                            else if (e.key === 'Escape') {
                                                                                setEditingConversationId(null);
                                                                            }
                                                                        }, className: "bg-[#111215] text-white border border-[#22222A] rounded px-2 py-0.5 text-sm outline-none w-full font-medium" })) : (_jsx("p", { className: "text-gray-300 font-medium line-clamp-1", children: c.title }))] }), _jsxs("div", { className: "flex items-center", children: [_jsx("button", { onClick: (e) => {
                                                                            e.stopPropagation();
                                                                            setEditingConversationId(c.id);
                                                                            setEditingTitle(c.title);
                                                                        }, className: "p-2 transition-opacity opacity-0 group-hover:opacity-100", children: _jsx("svg", { className: "w-4 h-4 text-gray-500 hover:text-gray-300 transition-colors", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" }) }) }), _jsx("button", { onClick: (e) => {
                                                                            e.stopPropagation();
                                                                            setConversations(prev => prev.map(conv => conv.id === c.id ? { ...conv, pinned: !conv.pinned } : conv));
                                                                        }, className: `p-2 transition-opacity ${c.pinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`, children: _jsx("svg", { className: `w-4 h-4 ${c.pinned ? 'text-gray-300' : 'text-gray-500 hover:text-gray-300 transition-colors'}`, fill: c.pinned ? 'currentColor' : 'none', viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" }) }) }), _jsx("button", { onClick: (e) => {
                                                                            e.stopPropagation();
                                                                            if (window.confirm('Delete this conversation?')) {
                                                                                setConversations(prev => {
                                                                                    const next = prev.filter(conv => conv.id !== c.id);
                                                                                    if (c.id === currentConversationId) {
                                                                                        if (next.length > 0) {
                                                                                            setCurrentConversationId(next[0].id);
                                                                                            setMessages(next[0].messages);
                                                                                        }
                                                                                        else {
                                                                                            setCurrentConversationId(null);
                                                                                            setMessages([]);
                                                                                        }
                                                                                    }
                                                                                    return next;
                                                                                });
                                                                            }
                                                                        }, className: "p-2 transition-opacity opacity-0 group-hover:opacity-100", children: _jsx("svg", { className: "w-4 h-4 text-gray-500 hover:text-red-500 transition-colors", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" }) }) }), _jsx("div", { className: "p-2 opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx("svg", { className: "w-4 h-4 text-gray-500", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) }) })] })] }, c.id)));
                                                })() })] }) }), _jsx(Route, { path: "/settings", element: _jsxs("div", { className: "max-w-4xl mx-auto w-full px-6 py-12 animate-in fade-in duration-700", children: [_jsx("div", { className: "text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-4", children: "Core Parameters" }), _jsx("h2", { className: "text-3xl font-extrabold text-white tracking-tight mb-8", children: "System Settings" }), _jsxs("div", { className: "space-y-8 bg-[#0c0c0e] border border-[#1A1A22] p-8 rounded-3xl", children: [_jsx("div", { className: "flex flex-col gap-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs font-black text-gray-400 uppercase tracking-[0.2em] block mb-1", children: "Inference Model" }), _jsx("p", { className: "text-[11px] text-gray-600", children: "Choose the primary intelligence pattern for Aetheris" })] }), _jsxs("select", { value: modelName, onChange: (e) => setModelName(e.target.value), className: "bg-[#050505] border border-[#1F2228] text-white text-sm px-4 py-2 rounded-xl outline-none focus:ring-1 focus:ring-gray-600", children: [_jsx("option", { value: "aetheris-v4", children: "Aetheris V4" }), _jsx("option", { value: "aetheris-v3", children: "Aetheris V3" }), _jsx("option", { value: "aetheris-v2", children: "ecc" })] })] }) }), _jsx("div", { className: "h-[1px] bg-[#1A1A22]" }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs font-black text-gray-400 uppercase tracking-[0.2em] block mb-1", children: "System Status" }), _jsx("p", { className: "text-[11px] text-gray-600", children: "Current connectivity and engine health" })] }), _jsxs("div", { className: "flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20", children: [_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" }), _jsx("span", { className: "text-[10px] font-black text-green-500 uppercase tracking-widest", children: "Operational" })] })] })] })] }) }), _jsx(Route, { path: "/share/:id", element: _jsx(SharePage, {}) })] }) })] })] }));
};
const SidebarItem = ({ icon, label, to, active, onClick, isSidebarOpen }) => {
    const location = useLocation();
    const isActive = active !== undefined ? active : (to ? location.pathname === to : false);
    const content = (_jsxs(_Fragment, { children: [_jsx("span", { className: `${isActive ? 'text-white' : 'text-[#666666] group-hover:text-white'} transition-colors flex-shrink-0`, children: icon }), _jsx("span", { className: `truncate md:hidden min-[1200px]:block ${isSidebarOpen ? 'block' : 'hidden'}`, children: label })] }));
    const className = `w-full flex items-center md:justify-center min-[1200px]:justify-start gap-3.5 px-4 py-3 rounded-xl transition-all text-[14px] font-semibold tracking-tight ${isActive ? 'bg-[#1A1A22] text-white shadow-sm border border-[#2A2A35]' : 'text-[#888888] hover:text-white hover:bg-[#121318] border border-transparent'} ${isSidebarOpen ? 'justify-start' : 'justify-center'}`;
    if (to) {
        return (_jsx(Link, { to: to, className: className, onClick: onClick, children: content }));
    }
    return (_jsx("button", { onClick: onClick, className: className, children: content }));
};
export default App;
