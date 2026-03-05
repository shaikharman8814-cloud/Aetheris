
import React, { useState, useRef, useEffect } from 'react';
import { AppMode, Attachment } from '../types';

interface SearchInputProps {
  onSearch: (query: string, mode: AppMode, attachments?: Attachment[]) => void;
  onModeChange?: (mode: AppMode) => void;
  isLoading: boolean;
  onStop?: () => void;
  placeholder?: string;
  initialMode?: AppMode;
}

const modes: AppMode[] = ['Search', 'Research', 'Debate', 'Teach', 'Decide', 'Code', 'Agent', 'Project', 'Mission'];

const modeConfig: Record<AppMode, { placeholder: string; icon: React.ReactNode }> = {
  Search: {
    placeholder: "Ask Aetheris anything...",
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
  },
  Research: {
    placeholder: "What would you like to deep-dive into?",
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
  },
  Debate: {
    placeholder: "Enter a topic to explore both sides...",
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
  },
  Teach: {
    placeholder: "What concept should I explain to you?",
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
  },
  Decide: {
    placeholder: "What options are you choosing between?",
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  },
  Code: {
    placeholder: "Describe the code you need...",
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
  },
  Agent: {
    placeholder: "I'm your AI developer. What can I build for you?",
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
  },
  Project: {
    placeholder: "PROJECT BUILDER MODE: What should I build for you today?",
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
  },
  Mission: {
    placeholder: "What is your main mission? (e.g., Learn Python in 30 days)",
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
  }
};

const SearchInput: React.FC<SearchInputProps> = ({ onSearch, onModeChange, isLoading, onStop, initialMode = 'Search' }) => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<AppMode>(initialMode);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSpeech = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setQuery(prev => (prev + ' ' + transcript).trim());
    };

    recognition.onspeechend = () => recognition.stop();
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.start();
  };

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    onModeChange?.(newMode);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      const promise = new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e?: React.FormEvent) => {
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

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="bg-[#121318] rounded-[24px] border border-[#1F2228] overflow-hidden transition-all">

        {/* Mode Selector (Hidden for minimalist layout) */}
        <div className="hidden items-center gap-1 p-2 border-b border-[#1F2228]">
          {modes.map(m => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase transition-all flex items-center gap-2 ${mode === m ? 'bg-white text-black' : 'text-[#666] hover:text-white'
                }`}
            >
              {mode === m && <span className="opacity-70 scale-75">{modeConfig[m].icon}</span>}
              {m}
            </button>
          ))}
        </div>

        <div className="relative">
          {attachments.length > 0 && (
            <div className="px-6 pt-4 flex flex-wrap gap-2">
              {attachments.map((file, idx) => (
                <div key={idx} className="relative group">
                  {file.type.startsWith('image/') ? (
                    <img src={file.url} alt="" className="w-12 h-12 rounded-lg object-cover border border-[#1F2228]" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-[#111] border border-[#1F2228] flex items-center justify-center text-[10px] font-bold text-gray-500 uppercase p-1 text-center truncate">
                      {file.name.split('.').pop()}
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#1F2228] border border-[#1F2228] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <textarea
            ref={textareaRef}
            rows={1}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit())}
            placeholder="Ask Aetheris anything..."
            className="w-full bg-transparent pt-4 pb-14 pl-6 pr-16 text-white placeholder-[#888888] focus:outline-none resize-none block text-[15px] leading-relaxed font-medium"
          />

          <div className="absolute left-4 bottom-3 flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
              accept="image/*,application/pdf,text/*,.c,.cpp,.java,.py,.js,.ts,.tsx,.html,.css,.json"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-[#888888] hover:text-white transition-colors"
              title="Attach File"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.414a6 6 0 108.486 8.486L20.5 13" /></svg>
            </button>
            <button
              onClick={(e) => { e.preventDefault(); handleSpeech(); }}
              className={`p-1.5 transition-colors ${isListening ? 'text-white animate-pulse' : 'text-[#888888] hover:text-white'}`}
              title="Dictate"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            </button>
          </div>

          <div className="absolute right-4 bottom-3">
            {isLoading && onStop ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onStop();
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-[#0A0A0D] border border-[#1F2228] text-white hover:bg-[#1f2228]"
                title="Stop generation"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h12v12H6z" /></svg>
              </button>
            ) : (
              <button
                onClick={() => handleSubmit()}
                disabled={isLoading || !query.trim()}
                className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center ${isLoading || !query.trim() ? 'bg-[#0A0A0D] border border-[#1F2228] text-[#444]' : 'bg-white text-black hover:bg-gray-200'
                  }`}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" /></svg>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="text-center mt-2 text-[#666666] text-[11px] font-medium tracking-tight">
        Aetheris may generate incorrect information. Verify important details.
      </div>
    </div>
  );
};

export default SearchInput;
