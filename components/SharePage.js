import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ChatMessage from './ChatMessage';
const SharePage = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetch(`/api/share/${id}`)
            .then(res => res.json())
            .then(json => {
            if (!json.error)
                setData(json);
            setLoading(false);
        })
            .catch(() => setLoading(false));
    }, [id]);
    if (loading)
        return _jsx("div", { className: "min-h-screen bg-[#0A0A0D] flex items-center justify-center text-gray-500 font-bold uppercase tracking-widest text-[11px]", children: "Loading..." });
    if (!data)
        return _jsx("div", { className: "min-h-screen bg-[#0A0A0D] flex items-center justify-center text-gray-500 font-bold uppercase tracking-widest text-[11px]", children: "Conversation not found or expired." });
    const questionMessage = { id: 'q', role: 'user', content: data.question, timestamp: 0 };
    const answerMessage = { id: 'a', role: 'assistant', content: data.answer, timestamp: 0 };
    return (_jsx("div", { className: "min-h-screen flex bg-[#0A0A0D] text-white selection:bg-gray-500/30 overflow-auto relative font-sans", children: _jsxs("div", { className: "flex-1 flex flex-col pt-12", children: [_jsx("div", { className: "max-w-4xl mx-auto w-full px-6 mb-8 text-center", children: _jsx("div", { className: "inline-block px-5 py-2 border border-[#1A1A22] bg-[#0c0c0c] rounded-full text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] shadow-sm", children: "Shared Conversation" }) }), _jsxs("div", { className: "w-full pb-32", children: [_jsx(ChatMessage, { message: questionMessage }), _jsx(ChatMessage, { message: answerMessage })] })] }) }));
};
export default SharePage;
