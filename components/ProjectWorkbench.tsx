import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ProjectFile {
    path: string;
    language: string;
    code: string;
}

interface ProjectData {
    project_name: string;
    description: string;
    stack: string[];
    files: ProjectFile[];
    run_instructions: string[];
}

export const ProjectWorkbench: React.FC<{ data: ProjectData }> = ({ data }) => {
    const [selectedFilePath, setSelectedFilePath] = useState<string>(data.files[0]?.path || '');
    const selectedFile = data.files.find(f => f.path === selectedFilePath);

    return (
        <div className="w-full bg-[#050505] border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header */}
            <div className="px-6 py-4 bg-[#0a0a0a] border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-[13px] font-black text-white uppercase tracking-wider">{data.project_name}</h3>
                        <p className="text-[10px] text-gray-500 line-clamp-1">{data.description}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {data.stack.map((s, i) => (
                        <span key={i} className="px-2 py-1 rounded bg-white/5 text-[9px] font-bold text-gray-400 uppercase tracking-tighter border border-white/5">{s}</span>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-56 bg-[#080808] border-r border-white/5 flex flex-col">
                    <div className="p-4 text-[9px] font-black text-gray-600 uppercase tracking-widest border-b border-white/5">Explorer</div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {data.files.map((file) => (
                            <button
                                key={file.path}
                                onClick={() => setSelectedFilePath(file.path)}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all ${selectedFilePath === file.path
                                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'
                                    }`}
                            >
                                <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="text-[11px] font-medium truncate tracking-tight">{file.path.split('/').pop()}</span>
                            </button>
                        ))}
                    </div>
                    <div className="p-4 bg-indigo-500/5 mt-auto border-t border-white/5">
                        <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Instructions</div>
                        <div className="space-y-2">
                            {data.run_instructions.map((inst, i) => (
                                <div key={i} className="text-[10px] text-gray-400 leading-tight">
                                    <span className="text-indigo-500/50 mr-1.5">{i + 1}.</span>{inst}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Code View */}
                <div className="flex-1 flex flex-col bg-black overflow-hidden relative">
                    <div className="absolute top-4 right-6 z-10">
                        <button
                            onClick={() => navigator.clipboard.writeText(selectedFile?.code || '')}
                            className="px-3 py-1.5 rounded-lg bg-[#111] border border-white/10 text-[10px] font-bold text-gray-400 hover:text-white hover:border-indigo-500 transition-all uppercase tracking-widest"
                        >
                            Copy
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto">
                        {selectedFile ? (
                            <SyntaxHighlighter
                                style={vscDarkPlus as any}
                                language={selectedFile.language.toLowerCase()}
                                PreTag="div"
                                customStyle={{ background: 'transparent', padding: '1.5rem', margin: 0, fontSize: '12px' }}
                            >
                                {selectedFile.code}
                            </SyntaxHighlighter>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-700 text-[11px] uppercase tracking-[0.2em]">Select a file to view content</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
