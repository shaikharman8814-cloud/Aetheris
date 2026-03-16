import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
const modes = ['Search', 'Research', 'Debate', 'Teach', 'Decide', 'Code', 'Agent', 'Project', 'Mission'];
const modeConfig = {
    Search: {
        placeholder: "Ask Aetheris anything...",
        icon: _jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) })
    },
    Research: {
        placeholder: "What would you like to deep-dive into?",
        icon: _jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" }) })
    },
    Debate: {
        placeholder: "Enter a topic to explore both sides...",
        icon: _jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" }) })
    },
    Teach: {
        placeholder: "What concept should I explain to you?",
        icon: _jsxs("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M12 14l9-5-9-5-9 5 9 5z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" })] })
    },
    Decide: {
        placeholder: "What options are you choosing between?",
        icon: _jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" }) })
    },
    Code: {
        placeholder: "Describe the code you need...",
        icon: _jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" }) })
    },
    Agent: {
        placeholder: "I'm your AI developer. What can I build for you?",
        icon: _jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" }) })
    },
    Project: {
        placeholder: "PROJECT BUILDER MODE: What should I build for you today?",
        icon: _jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M13 10V3L4 14h7v7l9-11h-7z" }) })
    },
    Mission: {
        placeholder: "What is your main mission? (e.g., Learn Python in 30 days)",
        icon: _jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" }) })
    }
};
const SearchInput = ({ onSearch, onModeChange, isLoading, onStop, initialMode = 'Search' }) => {
    const [query, setQuery] = useState('');
    const [mode, setMode] = useState(initialMode);
    const [attachments, setAttachments] = useState([]);
    const [isListening, setIsListening] = useState(false);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const handleSpeech = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition)
            return;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            setQuery(prev => (prev + ' ' + transcript).trim());
        };
        recognition.onspeechend = () => recognition.stop();
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
        recognition.start();
    };
    const handleModeChange = (newMode) => {
        setMode(newMode);
        onModeChange?.(newMode);
    };
    const handleFileChange = async (e) => {
        const files = e.target.files;
        if (!files)
            return;
        const newAttachments = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            const promise = new Promise((resolve) => {
                reader.onload = (e) => resolve(e.target?.result);
            });
            reader.readAsDataURL(file);
            const url = await promise;
            newAttachments.push({
                url,
                name: file.name,
                type: file.type
            });
        }
        setAttachments(prev => [...prev, ...newAttachments]);
        if (fileInputRef.current)
            fileInputRef.current.value = '';
    };
    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };
    const handleSubmit = (e) => {
        e?.preventDefault();
        if ((query.trim() || attachments.length > 0) && !isLoading) {
            onSearch(query.trim(), mode, attachments);
            setQuery('');
            setAttachments([]);
        }
    };
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [query]);
    useEffect(() => {
        setMode(initialMode);
    }, [initialMode]);
    return (_jsxs("div", { className: "w-full max-w-3xl mx-auto px-4", children: [_jsxs("div", { className: "bg-[#121318] rounded-[24px] border border-[#1F2228] overflow-hidden transition-all", children: [_jsx("div", { className: "hidden items-center gap-1 p-2 border-b border-[#1F2228]", children: modes.map(m => (_jsxs("button", { onClick: () => handleModeChange(m), className: `px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase transition-all flex items-center gap-2 ${mode === m ? 'bg-white text-black' : 'text-[#666] hover:text-white'}`, children: [mode === m && _jsx("span", { className: "opacity-70 scale-75", children: modeConfig[m].icon }), m] }, m))) }), _jsxs("div", { className: "relative", children: [attachments.length > 0 && (_jsx("div", { className: "px-6 pt-4 flex flex-wrap gap-2", children: attachments.map((file, idx) => (_jsxs("div", { className: "relative group", children: [file.type.startsWith('image/') ? (_jsx("img", { src: file.url, alt: "", className: "w-12 h-12 rounded-lg object-cover border border-[#1F2228]" })) : (_jsx("div", { className: "w-12 h-12 rounded-lg bg-[#111] border border-[#1F2228] flex items-center justify-center text-[10px] font-bold text-gray-500 uppercase p-1 text-center truncate", children: file.name.split('.').pop() })), _jsx("button", { onClick: () => removeAttachment(idx), className: "absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#1F2228] border border-[#1F2228] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx("svg", { className: "w-2.5 h-2.5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 3, d: "M6 18L18 6M6 6l12 12" }) }) })] }, idx))) })), _jsx("textarea", { ref: textareaRef, rows: 1, value: query, onChange: (e) => setQuery(e.target.value), onKeyDown: (e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit()), placeholder: "Ask Aetheris anything...", className: "w-full bg-transparent pt-4 pb-14 pl-6 pr-16 text-white placeholder-[#888888] focus:outline-none resize-none block text-[15px] leading-relaxed font-medium" }), _jsxs("div", { className: "absolute left-4 bottom-3 flex items-center gap-2", children: [_jsx("input", { type: "file", ref: fileInputRef, onChange: handleFileChange, className: "hidden", multiple: true, accept: "image/*,application/pdf,text/*,.c,.cpp,.java,.py,.js,.ts,.tsx,.html,.css,.json" }), _jsxs("div", { className: "relative group/attach", children: [_jsx("button", { onClick: (e) => e.preventDefault(), className: "p-1.5 text-[#444] cursor-not-allowed transition-colors", disabled: true, children: _jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.414a6 6 0 108.486 8.486L20.5 13" }) }) }), _jsx("div", { className: "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-[#1F2228] border border-[#2F3238] text-[10px] font-bold text-white rounded-lg opacity-0 group-hover/attach:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none shadow-2xl backdrop-blur-sm", children: "Coming Soon" })] }), _jsx("button", { onClick: (e) => { e.preventDefault(); handleSpeech(); }, className: `p-1.5 transition-colors ${isListening ? 'text-white animate-pulse' : 'text-[#888888] hover:text-white'}`, title: "Dictate", children: _jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" }) }) })] }), _jsx("div", { className: "absolute right-4 bottom-3", children: isLoading && onStop ? (_jsx("button", { onClick: (e) => {
                                        e.preventDefault();
                                        onStop();
                                    }, className: "w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-[#0A0A0D] border border-[#1F2228] text-white hover:bg-[#1f2228]", title: "Stop generation", children: _jsx("svg", { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { d: "M6 6h12v12H6z" }) }) })) : (_jsx("button", { onClick: () => handleSubmit(), disabled: isLoading || !query.trim(), className: `w-8 h-8 rounded-lg transition-all flex items-center justify-center ${isLoading || !query.trim() ? 'bg-[#0A0A0D] border border-[#1F2228] text-[#444]' : 'bg-white text-black hover:bg-gray-200'}`, children: isLoading ? (_jsx("div", { className: "w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" })) : (_jsx("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2.5, d: "M5 12h14M12 5l7 7-7 7" }) })) })) })] })] }), _jsx("div", { className: "text-center mt-2 text-[#666666] text-[11px] font-medium tracking-tight", children: "Aetheris may generate incorrect information. Verify important details." })] }));
};
export default SearchInput;
