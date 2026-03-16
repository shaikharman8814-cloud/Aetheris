import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ProjectWorkbench } from './ProjectWorkbench';
const CodeComponent = ({ node, inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    const rawCode = String(children).replace(/\n$/, '');
    if (!inline && match) {
        const handleCopy = () => navigator.clipboard.writeText(rawCode);
        return (_jsxs("div", { className: "rounded-xl overflow-hidden border border-[#1A1A22] bg-black my-4 max-w-full", children: [_jsxs("div", { className: "px-4 py-2 bg-[#0c0c0c] border-b border-[#1a1a1a] flex justify-between items-center group", children: [_jsx("span", { className: "text-[9px] font-bold text-gray-600 uppercase tracking-widest", children: match[1] }), _jsx("button", { onClick: handleCopy, className: "text-[9px] font-bold text-gray-500 group-hover:text-gray-400 transition-colors uppercase tracking-widest cursor-pointer", children: "Copy" })] }), _jsx(SyntaxHighlighter, { style: vscDarkPlus, language: match[1], PreTag: "div", customStyle: { background: 'transparent', padding: '1rem', margin: 0, textShadow: 'none' }, ...props, children: rawCode })] }));
    }
    if (!inline && !match) {
        return _jsx("div", { className: "text-[15px] font-medium text-gray-200 whitespace-pre-wrap leading-relaxed py-2", children: children });
    }
    return (_jsx("code", { className: "bg-[#1a1a1a] px-1.5 py-0.5 rounded text-gray-400 text-[13px] font-mono", ...props, children: children }));
};
const markdownComponents = {
    h1: ({ children }) => _jsx("h1", { className: "text-[17px] font-medium text-white block mb-6 leading-relaxed", children: children }),
    h2: ({ children }) => _jsx("h2", { className: "text-[17px] font-medium text-white block mb-6 leading-relaxed", children: children }),
    h3: ({ children }) => _jsx("h3", { className: "text-[17px] font-medium text-white block mb-6 leading-relaxed", children: children }),
    h4: ({ children }) => {
        return (_jsxs("div", { className: "flex items-center gap-4 mb-4 mt-8", children: [_jsx("h4", { className: "text-[14px] font-bold text-white whitespace-nowrap", children: children }), _jsx("div", { className: "flex-1 h-[1px] bg-[#1A1A22]" })] }));
    },
    p: ({ children }) => _jsx("p", { className: "leading-[1.6] mb-5 text-[15.5px] font-normal text-[#cccccc] first-of-type:text-white first-of-type:font-medium first-of-type:text-[16px]", children: children }),
    ul: ({ children }) => _jsx("ul", { className: "list-none space-y-2.5 mb-5", children: children }),
    li: ({ children }) => _jsx("li", { className: "relative pl-5 before:content-[''] before:absolute before:left-1 before:top-2.5 before:w-1 before:h-1 before:bg-[#888888] before:rounded-full leading-[1.6] text-[15px] font-normal text-[#cccccc]", children: children }),
    ol: ({ children }) => _jsx("ol", { className: "list-decimal pl-5 space-y-2 mb-4 text-[15px] font-medium text-[#cccccc] marker:text-[#888888] marker:font-semibold", children: children }),
    a: ({ href, children }) => _jsx("a", { href: href, className: "text-gray-300 hover:text-white underline underline-offset-4 transition-colors", target: "_blank", rel: "noopener noreferrer", children: children }),
    strong: ({ children }) => _jsx("strong", { className: "text-white font-semibold", children: children }),
    pre: ({ children }) => _jsx(_Fragment, { children: children }),
    hr: () => _jsx("hr", { className: "border-t border-[#1A1A22] my-8 opacity-50" }),
    code: CodeComponent,
};
const TrustMetric = ({ label, value, color }) => (_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex justify-between text-[8px] font-bold text-gray-500 uppercase mb-1 tracking-tighter", children: [_jsx("span", { children: label }), _jsxs("span", { children: [value, "%"] })] }), _jsx("div", { className: "h-1 w-full bg-[#1a1a1a] rounded-full overflow-hidden", children: _jsx("div", { className: `h-full ${color} transition-all duration-700 ease-out`, style: { width: `${value}%` } }) })] }));
const TrustNode = ({ source }) => {
    const domain = new URL(source.url).hostname.replace('www.', '');
    const avgTrust = Math.round((source.authorityScore + source.freshnessScore + source.agreementScore) / 3);
    return (_jsxs("div", { className: "bg-[#0c0c0c] border border-[#1a1a1a] rounded-xl p-3 flex flex-col gap-3 hover:border-gray-400/30 transition-all group shadow-sm", children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("div", { className: "w-6 h-6 rounded bg-[#161616] flex items-center justify-center flex-shrink-0", children: _jsx("img", { src: source.favicon, alt: "", className: "w-3.5 h-3.5 grayscale group-hover:grayscale-0 transition-all" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-[11px] font-bold text-gray-300 truncate group-hover:text-white uppercase tracking-tighter leading-none mb-1", children: domain }), _jsx("div", { className: "text-[9px] text-gray-600 truncate", children: source.title })] }), _jsx("div", { className: `text-[10px] font-mono font-black ${avgTrust > 90 ? 'text-gray-400' : 'text-gray-300'}`, children: avgTrust })] }), _jsxs("div", { className: "flex gap-2.5", children: [_jsx(TrustMetric, { label: "Auth", value: source.authorityScore, color: "bg-gray-400" }), _jsx(TrustMetric, { label: "Fresh", value: source.freshnessScore, color: "bg-gray-400" }), _jsx(TrustMetric, { label: "Cons", value: source.agreementScore, color: "bg-gray-400" })] })] }));
};
const ChatMessage = ({ message, onEdit, onRelatedClick, onGenerateImage, onRegenerate, onShare }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(message.content);
    const [copied, setCopied] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const copyToClipboardFallback = async (text) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            }
            catch (err) {
                console.warn("Clipboard API failed, trying fallback...", err);
            }
        }
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            return successful;
        }
        catch (err) {
            console.error("Fallback clipboard copy failed:", err);
            return false;
        }
    };
    const handleShareButton = async () => {
        if (!onShare || isSharing)
            return;
        setIsSharing(true);
        try {
            const contentToCopy = await onShare();
            if (contentToCopy) {
                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: "Aetheris Chat",
                            text: contentToCopy,
                            url: window.location.href,
                        });
                    }
                    catch (err) {
                        if (err.name !== 'AbortError') {
                            const success = await copyToClipboardFallback(contentToCopy);
                            if (success) {
                                setShareCopied(true);
                                setTimeout(() => setShareCopied(false), 2500);
                            }
                        }
                    }
                }
                else {
                    const success = await copyToClipboardFallback(contentToCopy);
                    if (success) {
                        setShareCopied(true);
                        setTimeout(() => setShareCopied(false), 2500);
                    }
                }
            }
        }
        catch (e) {
            console.error(e);
        }
        finally {
            setIsSharing(false);
        }
    };
    const handleCopy = async () => {
        const success = await copyToClipboardFallback(message.content);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    const isUser = message.role === 'user';
    if (!isUser && message.mode === 'Project') {
        try {
            const jsonStr = message.content.trim();
            if (jsonStr.startsWith('{')) {
                const data = JSON.parse(jsonStr);
                if (data.project_name && data.files) {
                    return (_jsxs("div", { className: "w-full max-w-5xl mx-auto py-12 px-4 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000", children: [_jsx("div", { className: "text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-4 ml-2", children: "Project Synthesis Active" }), _jsx(ProjectWorkbench, { data: data }), message.isUpdating && (_jsxs("div", { className: "flex items-center justify-center gap-3 text-[10px] text-gray-500 font-bold uppercase tracking-widest animate-pulse mt-6", children: [_jsx("div", { className: "w-1.5 h-1.5 bg-gray-400 rounded-full" }), "Generating Project Files..."] }))] }));
                }
            }
        }
        catch (e) {
            // Stream in progress
        }
    }
    if (isUser) {
        return (_jsx("div", { className: "w-full", children: _jsxs("div", { className: "max-w-4xl mx-auto px-6", children: [_jsx("div", { className: "w-full border-t border-[#1A1A22] mb-10" }), _jsx("div", { className: "flex justify-end mb-4", children: _jsx("div", { className: "flex items-center gap-3 w-max max-w-xl group relative z-10", children: isEditing ? (_jsxs("div", { className: "w-full space-y-2", children: [_jsx("textarea", { autoFocus: true, value: editValue, onChange: (e) => setEditValue(e.target.value), className: "w-full bg-[#111215] text-gray-200 px-5 py-3 rounded-xl text-[15px] border border-gray-400/50 focus:outline-none focus:ring-1 focus:ring-gray-400/30 font-medium resize-none min-h-[100px]" }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx("button", { onClick: () => {
                                                    setIsEditing(false);
                                                    setEditValue(message.content);
                                                }, className: "px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:text-white transition-colors", children: "Cancel" }), _jsx("button", { onClick: () => {
                                                    if (editValue.trim() && editValue !== message.content) {
                                                        onEdit?.(editValue.trim());
                                                    }
                                                    setIsEditing(false);
                                                }, className: "px-4 py-1.5 rounded-lg bg-white text-black text-[11px] font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors", children: "Save" })] })] })) : (_jsxs("div", { className: "flex items-center gap-4 w-full justify-end flex-nowrap", children: [_jsx("button", { onClick: () => setIsEditing(true), className: "shrink-0 opacity-0 group-hover:opacity-100 p-2 text-gray-600 hover:text-white transition-all order-1", children: _jsx("svg", { className: "w-3 h-3", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" }) }) }), _jsxs("div", { className: "bg-[#1A1A22] text-[#e0e0e0] px-5 py-3 rounded-[16px] text-[15px] border border-[#22222A] order-2 font-medium max-w-full shadow-sm relative break-words", children: [message.attachments && message.attachments.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2 mb-2", children: message.attachments.map((att, idx) => (_jsx("div", { className: "relative", children: att.type.startsWith('image/') ? (_jsx("img", { src: att.url, alt: "", className: "w-20 h-20 rounded-lg object-cover border border-[#333]" })) : (_jsxs("div", { className: "w-20 h-20 rounded-lg bg-[#0a0a0a] border border-[#333] flex flex-col items-center justify-center p-2 text-center", children: [_jsx("svg", { className: "w-6 h-6 text-gray-600 mb-1", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" }) }), _jsx("span", { className: "text-[8px] text-gray-500 truncate w-full", children: att.name })] })) }, idx))) })), message.content] })] })) }) })] }) }));
    }
    let mainContent = message.content;
    // --- FRONTEND SAFEGUARD: RAW TEXT INTERCEPTOR ---
    // We intercept and strip raw backend strings to format them beautifully in the UI.
    // This complies with CRITICAL SYSTEM RULE: strictly frontend modifications.
    const connectionLostMatch = mainContent.match(/\(Connection lost:\s*(.*?)\)/);
    const connectionLostMessage = connectionLostMatch ? connectionLostMatch[1] : null;
    if (connectionLostMatch) {
        mainContent = mainContent.replace(connectionLostMatch[0], '').trim();
    }
    const providerMatch = mainContent.match(/\*\(Provider:\s*(.*?)\)\*/);
    const providerMessage = providerMatch ? providerMatch[1] : null;
    if (providerMatch) {
        mainContent = mainContent.replace(providerMatch[0], '').trim();
    }
    // Ultra-robust extraction for follow-up questions
    const relatedMatch = mainContent.match(/##\s*(?:Next Questions|Related|Follow-up|Explore|Follow-ups|Next|Related Questions)\s*[\n\:\-]*\s*([\s\S]*?)(?=\n\s*##|$)/i) ||
        mainContent.match(/###\s*(?:Related|Follow-up|Next Questions|Explore|Follow-ups|Next|Related Questions)\s*[\n\:\-]*\s*([\s\S]*?)(?=\n\s*###|$)/i);
    let related = [];
    if (relatedMatch) {
        related = relatedMatch[1]
            .split('\n')
            .map(l => l.trim())
            .filter(l => l && (l.startsWith('→') || l.startsWith('-') || l.startsWith('*') || l.startsWith('•') || /^\d+[\.\)]/.test(l)))
            .map(l => l.replace(/^[→\-*•\d.]+[\.\)]?\s*/, '').trim())
            .filter(l => l.length > 5)
            .slice(0, 3);
        // Only strip if we actually found usable questions
        if (related.length > 0) {
            mainContent = mainContent.replace(relatedMatch[0], '').trim();
        }
    }
    const visualMatch = mainContent.match(/###\s*Visual Prompt\n([\s\S]*?)(\n###|$)/i);
    let visualPrompt = '';
    if (visualMatch) {
        visualPrompt = visualMatch[1].trim();
        mainContent = mainContent.replace(visualMatch[0], '');
    }
    const hasBarSections = mainContent.includes('━━━━━━━━');
    const hasNumberedSections = mainContent.includes('1️⃣ PRIMARY CLAIM') || /^\d[️⃣]/u.test(mainContent);
    const hasStrictHeaders = mainContent.includes('Sources:') || mainContent.includes('Confidence:') || mainContent.includes('You might also ask:');
    const hasSections = mainContent.includes('### ') || hasNumberedSections || hasBarSections || hasStrictHeaders;
    const extractSection = (text, header, nextHeaderLookahead) => {
        const headerPattern = typeof header === 'string' ? header : header.source;
        const match = text.match(new RegExp(`${headerPattern}([\\s\\S]*?)(?=${nextHeaderLookahead.source}|$)`, 'i'));
        return match ? match[1].trim() : null;
    };
    const anyH = /(?:##?\s*[🔹🧠📋🔍🔥📊]?\s*(?:[A-Za-z0-9]|THINKING|PLAN|DETAILED ANSWER|KEY TAKEAWAYS|CONFIDENCE SCORE))|(?:[1-5]️⃣\s*[A-Za-z])|━━━━━━━━|Quick Answer|Primary Answer|Key Points|Explanation|Optional Steps|Sources|Confidence|Images|Next Questions|CODE:/;
    const thinkingSection = extractSection(mainContent, /###\s*[🧠]?\s*THINKING/i, anyH);
    const planSection = extractSection(mainContent, /###\s*[📋]?\s*PLAN/i, anyH);
    let primaryAnswer = extractSection(mainContent, /###\s*[🔍]?\s*DETAILED ANSWER/i, anyH) ||
        extractSection(mainContent, /##?\s*[🔹]?\s*(?:Quick Answer|Primary Answer)/i, anyH);
    // If we have sections but haven't found a primary answer yet, 
    // and there are no other major sections, the content might be the primary answer itself
    if (hasSections && !primaryAnswer) {
        // Take everything after the last known section, or the whole thing if no sections found
        const sectionsFound = [thinkingSection, planSection].filter(Boolean);
        if (sectionsFound.length === 0) {
            primaryAnswer = mainContent;
        }
        else {
            // It's possible the model is still streaming and hasn't reached the "Detailed Answer" header yet.
            // In this case, we don't want to show nothing.
        }
    }
    const keyPoints = extractSection(mainContent, /###\s*[🔥]?\s*KEY TAKEAWAYS/i, anyH) || extractSection(mainContent, /##?\s*[🔹]?\s*(?:Key Points|Key Takeaways)/i, anyH);
    const codeBlock = extractSection(mainContent, /#+\s*[🔹]?\s*(?:Code Solution|CODE:)/i, anyH);
    const technicalExplanation = extractSection(mainContent, /##?\s*[🔹]?\s*(?:Explanation|Deep Dive)/i, anyH);
    const optionalSteps = extractSection(mainContent, /##?\s*[🔹]?\s*(?:Actionable Steps|Optional Steps)/i, anyH);
    const verifiedSources = extractSection(mainContent, /##?\s*[🔹]?\s*(?:Sources|SOURCES)/i, anyH) || extractSection(mainContent, /Sources:/i, anyH);
    const imageToCheck = extractSection(mainContent, /##?\s*[🔹]?\s*(?:If Helpful Images Exist|Images to check:)/i, anyH);
    const confidenceLevel = extractSection(mainContent, /###\s*[📊]?\s*CONFIDENCE SCORE/i, anyH) || extractSection(mainContent, /##?\s*[🔹]?\s*(?:Confidence|CONFIDENCE)/i, anyH) || extractSection(mainContent, /Confidence:/i, anyH);
    const relatedQuestions = extractSection(mainContent, /##?\s*[🔹]?\s*(?:Next Questions|You might also ask:)/i, anyH);
    // ULTIMATE FALLBACK: If we have content but absolutely nothing was extracted into the UI blocks, show it all.
    const hasDisplayableSections = thinkingSection || planSection || primaryAnswer || keyPoints || codeBlock || technicalExplanation || optionalSteps || verifiedSources || imageToCheck || confidenceLevel || relatedQuestions;
    const finalPrimaryAnswer = (!hasDisplayableSections && mainContent.trim().length > 0) ? mainContent : primaryAnswer;
    // Tag Rendering Logic for Color-Tagging System
    const renderRichText = (text) => {
        if (!text)
            return null;
        // Process ONLY semantic tags: <key>, <cmd>, <code>, <imp>, <def>
        // We must NOT split on all <tag> elements, as it breaks HTML code blocks across multiple ReactMarkdown instances.
        const semanticTagsMatch = /(<(?:key|cmd|code|imp|def)>[\s\S]*?<\/(?:key|cmd|code|imp|def)>)/g;
        const parts = text.split(semanticTagsMatch);
        return parts.map((part, i) => {
            const match = part.match(/<(key|cmd|code|imp|def)>([\s\S]*?)<\/\1>/);
            if (match) {
                const tag = match[1];
                const content = match[2];
                const styles = {
                    key: 'text-gray-300 font-bold px-1 rounded bg-gray-400/5',
                    cmd: 'text-gray-300 font-mono font-bold px-1 rounded bg-gray-400/5',
                    code: 'text-gray-300 font-mono px-1 rounded bg-gray-400/5',
                    imp: 'text-gray-300 font-bold px-1 rounded bg-gray-400/5',
                    def: 'text-gray-300 italic font-medium px-1'
                };
                return _jsx("span", { className: styles[tag] || 'text-gray-400', children: content }, i);
            }
            return (_jsx(ReactMarkdown, { remarkPlugins: [remarkGfm], components: markdownComponents, children: part }, i));
        });
    };
    // Image Search Queries extraction
    const imageQueriesMatch = mainContent.match(/IMAGE_SEARCH_QUERIES:\s*(\[[\s\S]*?\])/);
    let imageQueries = [];
    if (imageQueriesMatch) {
        try {
            imageQueries = JSON.parse(imageQueriesMatch[1]);
            mainContent = mainContent.replace(imageQueriesMatch[0], '').trim();
        }
        catch (e) { }
    }
    // Source Search Queries extraction
    const sourceQueriesMatch = mainContent.match(/SOURCE_SEARCH_QUERIES:\s*(\[[\s\S]*?\])/);
    let sourceQueries = [];
    if (sourceQueriesMatch) {
        try {
            sourceQueries = JSON.parse(sourceQueriesMatch[1]);
            mainContent = mainContent.replace(sourceQueriesMatch[0], '').trim();
        }
        catch (e) { }
    }
    // Only show the global layout loader if we are streaming and have absolutely no investigation steps to show.
    const isStreaming = !message.content && !message.sources?.length && message.isUpdating !== false && (!message.reasoningSteps || message.reasoningSteps.length === 0);
    if (isStreaming) {
        return (_jsxs("div", { className: "w-full max-w-3xl mx-auto py-12 px-4 flex flex-col items-center", children: [_jsx("div", { className: "w-10 h-0.5 bg-[#111215] rounded-full overflow-hidden mb-3", children: _jsx("div", { className: "h-full bg-white w-1/3 animate-[loading_1s_infinite_linear]" }) }), _jsx("div", { className: "text-[10px] font-bold text-gray-600 uppercase tracking-widest", children: "Searching" }), _jsx("style", { children: `@keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }` })] }));
    }
    if (!message.content && !message.sources?.length && message.isUpdating === false && (!message.reasoningSteps || message.reasoningSteps.length === 0)) {
        return null;
    }
    return (_jsxs("div", { className: "max-w-4xl mx-auto w-full px-6 flex items-start gap-4 mb-8 mt-2", children: [_jsx("div", { className: "w-[36px] h-[36px] rounded-full bg-[#0a0a0c] border border-[#22222a] flex items-center justify-center overflow-hidden flex-shrink-0 mt-8 shadow-md", children: _jsx("svg", { viewBox: "0 0 32 32", fill: "currentColor", className: "w-[18px] h-[18px] text-white", children: _jsx("path", { d: "M16 4L2 32h6l8-16 8 16h6L16 4zm0 18l-5 10h10L16 22z" }) }) }), _jsxs("div", { className: "flex-1 min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-700", children: [_jsx("div", { className: "text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1", children: "PRIMARY ANSWER" }), _jsxs("div", { className: "border border-[#1A1A22] bg-[#0c0c0e] rounded-xl overflow-hidden shadow-sm", children: [_jsxs("div", { className: "px-5 py-3 border-b border-[#1A1A22] flex justify-between items-center bg-[#0a0a0c]", children: [_jsxs("div", { children: [_jsx("span", { className: "text-[14px] font-bold text-white tracking-wide", children: "Aetheris" }), _jsx("span", { className: "text-[13px] font-medium text-[#888888] ml-1.5", children: "by SnyderAI explains:" })] }), message.mode && (_jsxs("span", { className: "text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]", children: [message.mode, " MODE"] }))] }), _jsxs("div", { className: "p-5 space-y-6 break-words", children: [message.reasoningSteps && message.reasoningSteps.length > 0 && (_jsxs("div", { className: "space-y-4 animate-in fade-in slide-in-from-top-4 duration-1000", children: [_jsx("div", { className: "text-[10px] font-black text-gray-500 uppercase tracking-[0.15em]", children: "Investigation Steps" }), _jsx("div", { className: "flex flex-wrap gap-x-6 gap-y-3", children: message.reasoningSteps.map((step, idx) => (_jsxs("div", { className: `flex items-center gap-2 transition-all duration-500 ${step.status === 'active'
                                                        ? 'text-gray-300'
                                                        : step.status === 'complete'
                                                            ? 'text-gray-500'
                                                            : 'text-gray-800'}`, children: [_jsx("div", { className: "flex items-center justify-center flex-shrink-0", children: step.status === 'complete' ? (_jsx("svg", { className: "w-3.5 h-3.5 text-gray-500", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 3, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" }) })) : (_jsx("div", { className: "w-1.5 h-1.5 bg-gray-500 rounded-full" })) }), _jsx("span", { className: `text-[11px] font-bold uppercase tracking-wider ${step.status === 'active' ? 'animate-pulse' : ''}`, children: step.label })] }, idx))) })] })), message.sources && message.sources.length > 0 && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]", children: "Source Trust Graph" }), _jsxs("div", { className: "flex gap-4", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-gray-400" }), _jsx("span", { className: "text-[8px] font-bold text-gray-500 uppercase", children: "Authority" })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-gray-400" }), _jsx("span", { className: "text-[8px] font-bold text-gray-500 uppercase", children: "Freshness" })] })] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 min-[1200px]:grid-cols-4 gap-3", children: message.sources.slice(0, 4).map((s, idx) => _jsx(TrustNode, { source: s }, idx)) })] })), _jsxs("div", { className: "space-y-8", children: [thinkingSection && (_jsxs("div", { className: "space-y-4 p-5 rounded-xl bg-gray-400/5 border border-gray-400/10 backdrop-blur-sm animate-in fade-in slide-in-from-left-4 duration-700", children: [_jsx("div", { className: "text-[11px] font-black text-gray-300 uppercase tracking-[0.3em] flex items-center gap-2", children: "\uD83E\uDDE0 Thinking Process" }), _jsx("div", { className: "space-y-3 text-gray-400/80", children: renderRichText(thinkingSection) })] })), planSection && (_jsxs("div", { className: "space-y-4 p-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm italic text-gray-400", children: [_jsx("div", { className: "text-[11px] font-black text-gray-500 uppercase tracking-[0.3em]", children: "Execution Plan" }), _jsx("div", { className: "space-y-2", children: renderRichText(planSection) })] })), finalPrimaryAnswer && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "text-[11px] font-bold text-[#888888] uppercase tracking-[0.2em] flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [message.mode ? `${message.mode.toUpperCase()} MODE` : 'RESEARCH MODE', message.isUpdating && _jsxs("div", { className: "flex gap-1", children: [_jsx("div", { className: "w-1 h-1 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0ms' } }), _jsx("div", { className: "w-1 h-1 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '150ms' } }), _jsx("div", { className: "w-1 h-1 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '300ms' } })] })] }), providerMessage && (_jsxs("div", { className: "text-[9px] font-bold text-gray-600 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-sm", children: ["Layer: ", providerMessage] }))] }), _jsx("div", { className: "space-y-3 transition-all duration-300 ease-in-out", children: renderRichText(finalPrimaryAnswer + (message.isUpdating ? ' █' : '')) })] })), connectionLostMessage && (_jsxs("div", { className: "space-y-4 p-5 rounded-xl bg-gray-400/5 border border-gray-400/10 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-700", children: [_jsx("div", { className: "text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2", children: "Network Interruption" }), _jsxs("div", { className: "text-[13px] font-medium text-gray-400/80", children: [connectionLostMessage, _jsx("br", {}), _jsx("span", { className: "text-gray-500 italic mt-2 block", children: "System is waiting for a valid signal. Please check parameters or retry." })] })] })), keyPoints && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "relative my-8 flex items-center justify-center", children: [_jsx("div", { className: "absolute inset-0 flex items-center", children: _jsx("div", { className: "w-full border-t border-[#1A1A22]" }) }), _jsx("span", { className: "relative bg-[#0c0c0e] px-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] z-10", children: "Quick Summary" })] }), _jsx("div", { className: "space-y-3", children: renderRichText(keyPoints) })] })), codeBlock && (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]", children: "Code Solution" }), _jsx("div", { className: "rounded-xl overflow-hidden", children: renderRichText(codeBlock) })] })), optionalSteps && (_jsxs("div", { className: "space-y-4 p-5 rounded-xl bg-gray-400/5 border border-gray-400/10", children: [_jsx("div", { className: "text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2", children: "\uD83D\uDE80 Actionable Steps" }), _jsx("div", { className: "space-y-3", children: renderRichText(optionalSteps) })] })), message.generatedImage && (_jsxs("div", { className: "space-y-4 animate-in zoom-in-95 duration-1000", children: [_jsx("div", { className: "text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]", children: "Generated Visualization" }), _jsxs("div", { className: "relative group rounded-xl overflow-hidden border border-white/10 bg-black/40 aspect-square sm:aspect-video", children: [_jsx("img", { src: message.generatedImage, alt: "Generated by Aetheris", className: "w-full h-full object-cover transition-transform duration-700 group-hover:scale-105", referrerPolicy: "no-referrer" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6", children: _jsx("button", { onClick: () => window.open(message.generatedImage, '_blank'), className: "px-4 py-2 rounded-xl bg-white text-black text-[11px] font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors", children: "Open Full Resolution" }) })] })] })), verifiedSources && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2", children: [_jsx("div", { className: "w-4 h-4 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0", children: _jsx("svg", { className: "w-2.5 h-2.5 text-blue-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 4.5, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" }) }) }), "Verified Sources"] }), _jsx("div", { className: "text-[15px] text-gray-400 leading-relaxed font-light pl-4 border-l border-gray-400/20", children: _jsx(ReactMarkdown, { remarkPlugins: [remarkGfm], components: { ...markdownComponents, p: ({ children }) => _jsx("p", { className: "mb-2", children: children }), li: ({ children }) => _jsx("li", { className: "relative pl-4 before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-gray-400/40 before:rounded-full", children: children }) }, children: verifiedSources }) })] })), imageToCheck && (_jsxs("div", { className: "space-y-4 p-5 rounded-xl bg-gray-400/5 border border-gray-400/10", children: [_jsx("div", { className: "text-[11px] font-black text-gray-300 uppercase tracking-[0.3em]", children: "Images to check" }), _jsx("div", { className: "text-[14px] text-gray-300 leading-relaxed italic", children: renderRichText(imageToCheck) })] })), confidenceLevel && (_jsx("div", { className: "mt-8 p-5 rounded-xl bg-white/5 border border-white/10 space-y-2 backdrop-blur-sm", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2", children: "Confidence Score" }), _jsx("div", { className: "px-2 py-1 rounded bg-gray-400/20 text-gray-300 text-[10px] font-mono font-bold", children: confidenceLevel.trim() })] }) }))] }), message.sources && message.sources.length > 0 && (_jsxs("div", { className: "pt-8 space-y-4", children: [_jsx("div", { className: "w-full h-[1px] bg-[#1A1A22] mb-6" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("div", { className: "text-[14px] font-bold text-white whitespace-nowrap min-w-max", children: "Sources:" }), _jsx("div", { className: "flex flex-col gap-2", children: message.sources.map((s, idx) => (_jsxs("a", { href: s.url, target: "_blank", rel: "noopener noreferrer", className: "flex text-[14px] text-[#888888] hover:text-white transition-colors gap-2 leading-relaxed", children: [_jsxs("span", { className: "font-semibold text-gray-400", children: ["[", idx + 1, "]"] }), _jsxs("span", { children: [new URL(s.url).hostname.replace('www.', ''), " \u2014 ", s.title] })] }, idx))) })] })] })), _jsxs("div", { className: "pt-4 flex flex-wrap justify-end gap-2 mb-2", children: [onRegenerate && !message.isUpdating && (_jsxs("button", { onClick: onRegenerate, className: "flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#050505] border border-[#1A1A22] hover:border-[#22222A] transition-all group shadow-sm", children: [_jsx("svg", { className: "w-3 h-3 text-gray-500 group-hover:text-gray-300", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" }) }), _jsx("span", { className: "text-[10px] font-bold text-gray-500 group-hover:text-gray-300 uppercase tracking-widest", children: "Regenerate" })] })), onShare && !message.isUpdating && (_jsx("button", { onClick: handleShareButton, disabled: isSharing, className: "flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#050505] border border-[#1A1A22] hover:border-[#22222A] transition-all group shadow-sm disabled:opacity-50", children: shareCopied ? (_jsxs(_Fragment, { children: [_jsx("svg", { className: "w-3 h-3 text-gray-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 3, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" }) }), _jsx("span", { className: "text-[10px] font-bold text-gray-400 uppercase tracking-widest", children: "Chat copied. You can paste it anywhere." })] })) : (_jsxs(_Fragment, { children: [isSharing ? (_jsx("div", { className: "w-3 h-3 border-2 border-gray-500 border-t-white rounded-full animate-spin" })) : (_jsx("svg", { className: "w-3 h-3 text-gray-500 group-hover:text-gray-300", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" }) })), _jsx("span", { className: "text-[10px] font-bold text-gray-500 group-hover:text-gray-300 uppercase tracking-widest", children: isSharing ? 'Copying...' : 'Share Chat' })] })) })), _jsx("button", { onClick: handleCopy, className: "flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#050505] border border-[#1A1A22] hover:border-[#22222A] transition-all group shadow-sm", children: copied ? (_jsxs(_Fragment, { children: [_jsx("svg", { className: "w-3 h-3 text-gray-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 3, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" }) }), _jsx("span", { className: "text-[10px] font-bold text-gray-400 uppercase tracking-widest", children: "Copied" })] })) : (_jsxs(_Fragment, { children: [_jsx("svg", { className: "w-3 h-3 text-gray-500 group-hover:text-gray-300", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" }) }), _jsx("span", { className: "text-[10px] font-bold text-gray-500 group-hover:text-gray-300 uppercase tracking-widest", children: "Copy Full Answer" })] })) })] }), related.length > 0 && (_jsxs("div", { className: "pt-8 border-t border-[#1a1a1a] space-y-5", children: [_jsx("div", { className: "text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]", children: "Ask a follow-up" }), _jsx("div", { className: "flex flex-col gap-2", children: related.map((q, i) => {
                                                    if (!q)
                                                        return null;
                                                    return (_jsxs("button", { onClick: () => onRelatedClick?.(q), className: "group flex items-center justify-between text-left p-3.5 rounded-xl bg-[#080808] border border-[#141414] hover:border-gray-400/30 hover:bg-[#0c0c0c] transition-all", children: [_jsx("span", { className: "text-sm text-gray-400 group-hover:text-gray-200 transition-colors", children: q }), _jsx("span", { className: "text-gray-600 group-hover:text-gray-400 text-xs font-bold px-1 transition-colors", children: "+" })] }, i));
                                                }) })] }))] })] })] })] }));
};
export default ChatMessage;
