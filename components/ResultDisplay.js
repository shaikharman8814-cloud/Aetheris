import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const ResultDisplay = ({ result }) => {
    // Format the answer text to handle bullet points and basic markdown-like structures
    const formattedAnswer = result.answer.split('\n').map((line, idx) => {
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
            return (_jsx("li", { className: "mb-2 ml-4 list-disc text-gray-800 leading-relaxed", children: line.trim().substring(2) }, idx));
        }
        if (line.trim() === '')
            return _jsx("div", { className: "h-4" }, idx);
        return _jsx("p", { className: "mb-4 text-gray-800 leading-relaxed text-lg", children: line }, idx);
    });
    return (_jsxs("div", { className: "w-full max-w-3xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500", children: [_jsx("h1", { className: "text-3xl font-semibold mb-6 text-gray-900", children: result.query }), _jsxs("div", { className: "bg-white rounded-3xl border border-gray-100 p-8 shadow-sm mb-8", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx("div", { className: "w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center", children: _jsx("div", { className: "w-2 h-2 bg-blue-600 rounded-full animate-pulse" }) }), _jsx("span", { className: "text-xs font-bold tracking-widest text-blue-600 uppercase", children: "AI Answer" })] }), _jsx("div", { className: "prose prose-blue max-w-none", children: formattedAnswer })] }), result.sources.length > 0 && (_jsxs("div", { className: "px-2", children: [_jsx("h3", { className: "text-sm font-bold text-gray-400 uppercase tracking-widest mb-4", children: "Verified Sources" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 min-[1200px]:grid-cols-4 gap-3", children: result.sources.map((source, idx) => (_jsxs("a", { href: source.url, target: "_blank", rel: "noopener noreferrer", className: "flex flex-col p-4 bg-white border border-gray-100 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all group", children: [_jsx("span", { className: "text-sm font-medium text-gray-900 group-hover:text-blue-600 line-clamp-1 mb-1", children: source.title }), _jsx("span", { className: "text-xs text-gray-400 line-clamp-1 truncate", children: source.url.replace(/^https?:\/\//, '') })] }, idx))) })] }))] }));
};
export default ResultDisplay;
