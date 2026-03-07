import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ChatMessage from './ChatMessage';
import { Message } from '../types';

const SharePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<{ question: string, answer: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/share/${id}`)
            .then(res => res.json())
            .then(json => {
                if (!json.error) setData(json);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="min-h-screen bg-[#0A0A0D] flex items-center justify-center text-gray-500 font-bold uppercase tracking-widest text-[11px]">Loading...</div>;
    if (!data) return <div className="min-h-screen bg-[#0A0A0D] flex items-center justify-center text-gray-500 font-bold uppercase tracking-widest text-[11px]">Conversation not found or expired.</div>;

    const questionMessage: Message = { id: 'q', role: 'user', content: data.question, timestamp: 0 };
    const answerMessage: Message = { id: 'a', role: 'assistant', content: data.answer, timestamp: 0 };

    return (
        <div className="min-h-screen flex bg-[#0A0A0D] text-white selection:bg-gray-500/30 overflow-auto relative font-sans">
            <div className="flex-1 flex flex-col pt-12">
                <div className="max-w-4xl mx-auto w-full px-6 mb-8 text-center">
                    <div className="inline-block px-5 py-2 border border-[#1A1A22] bg-[#0c0c0c] rounded-full text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] shadow-sm">
                        Shared Conversation
                    </div>
                </div>
                <div className="w-full pb-32">
                    <ChatMessage message={questionMessage} />
                    <ChatMessage message={answerMessage} />
                </div>
            </div>
        </div>
    );
};

export default SharePage;
