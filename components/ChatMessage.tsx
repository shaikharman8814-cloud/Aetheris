import React, { useState } from 'react';
import { Message, Source } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ProjectWorkbench } from './ProjectWorkbench';

const CodeComponent = ({ node, inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const rawCode = String(children).replace(/\n$/, '');

  if (!inline && match) {
    const handleCopy = () => navigator.clipboard.writeText(rawCode);
    return (
      <div className="rounded-xl overflow-hidden border border-[#1A1A22] bg-black my-4 max-w-full">
        <div className="px-4 py-2 bg-[#0c0c0c] border-b border-[#1a1a1a] flex justify-between items-center group">
          <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{match[1]}</span>
          <button onClick={handleCopy} className="text-[9px] font-bold text-gray-500 group-hover:text-gray-400 transition-colors uppercase tracking-widest cursor-pointer">Copy</button>
        </div>
        <SyntaxHighlighter
          style={vscDarkPlus as any}
          language={match[1]}
          PreTag="div"
          customStyle={{ background: 'transparent', padding: '1rem', margin: 0, textShadow: 'none' }}
          {...props}
        >
          {rawCode}
        </SyntaxHighlighter>
      </div>
    );
  }

  if (!inline && !match) {
    return <div className="text-[15px] font-medium text-gray-200 whitespace-pre-wrap leading-relaxed py-2">{children}</div>;
  }

  return (
    <code className="bg-[#1a1a1a] px-1.5 py-0.5 rounded text-gray-400 text-[13px] font-mono" {...props}>
      {children}
    </code>
  );
};

const markdownComponents = {
  h1: ({ children }: any) => <h1 className="text-[17px] font-medium text-white block mb-6 leading-relaxed">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-[17px] font-medium text-white block mb-6 leading-relaxed">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-[17px] font-medium text-white block mb-6 leading-relaxed">{children}</h3>,
  h4: ({ children }: any) => {
    return (
      <div className="flex items-center gap-4 mb-4 mt-8">
        <h4 className="text-[14px] font-bold text-white whitespace-nowrap">{children}</h4>
        <div className="flex-1 h-[1px] bg-[#1A1A22]" />
      </div>
    );
  },
  p: ({ children }: any) => <p className="leading-[1.6] mb-5 text-[15.5px] font-normal text-[#cccccc] first-of-type:text-white first-of-type:font-medium first-of-type:text-[16px]">{children}</p>,
  ul: ({ children }: any) => <ul className="list-none space-y-2.5 mb-5">{children}</ul>,
  li: ({ children }: any) => <li className="relative pl-5 before:content-[''] before:absolute before:left-1 before:top-2.5 before:w-1 before:h-1 before:bg-[#888888] before:rounded-full leading-[1.6] text-[15px] font-normal text-[#cccccc]">{children}</li>,
  ol: ({ children }: any) => <ol className="list-decimal pl-5 space-y-2 mb-4 text-[15px] font-medium text-[#cccccc] marker:text-[#888888] marker:font-semibold">{children}</ol>,
  a: ({ href, children }: any) => <a href={href} className="text-gray-300 hover:text-white underline underline-offset-4 transition-colors" target="_blank" rel="noopener noreferrer">{children}</a>,
  strong: ({ children }: any) => <strong className="text-white font-semibold">{children}</strong>,
  pre: ({ children }: any) => <>{children}</>,
  hr: () => <hr className="border-t border-[#1A1A22] my-8 opacity-50" />,
  code: CodeComponent as any,
};

interface ChatMessageProps {
  message: Message;
  onEdit?: (newContent: string) => void;
  onRelatedClick?: (query: string) => void;
  onGenerateImage?: (prompt: string, type?: 'diagram' | 'timeline' | 'comparison', topic?: string) => void;
  onRegenerate?: () => void;
  onShare?: () => Promise<string>;
}

const TrustMetric = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="flex-1">
    <div className="flex justify-between text-[8px] font-bold text-gray-500 uppercase mb-1 tracking-tighter">
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <div className="h-1 w-full bg-[#1a1a1a] rounded-full overflow-hidden">
      <div
        className={`h-full ${color} transition-all duration-700 ease-out`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

const TrustNode: React.FC<{ source: Source }> = ({ source }) => {
  const domain = new URL(source.url).hostname.replace('www.', '');
  const avgTrust = Math.round((source.authorityScore + source.freshnessScore + source.agreementScore) / 3);

  return (
    <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-xl p-3 flex flex-col gap-3 hover:border-gray-400/30 transition-all group shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded bg-[#161616] flex items-center justify-center flex-shrink-0">
          <img src={source.favicon} alt="" className="w-3.5 h-3.5 grayscale group-hover:grayscale-0 transition-all" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold text-gray-300 truncate group-hover:text-white uppercase tracking-tighter leading-none mb-1">{domain}</div>
          <div className="text-[9px] text-gray-600 truncate">{source.title}</div>
        </div>
        <div className={`text-[10px] font-mono font-black ${avgTrust > 90 ? 'text-gray-400' : 'text-gray-300'}`}>
          {avgTrust}
        </div>
      </div>

      <div className="flex gap-2.5">
        <TrustMetric label="Auth" value={source.authorityScore} color="bg-gray-400" />
        <TrustMetric label="Fresh" value={source.freshnessScore} color="bg-gray-400" />
        <TrustMetric label="Cons" value={source.agreementScore} color="bg-gray-400" />
      </div>
    </div>
  );
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onEdit, onRelatedClick, onGenerateImage, onRegenerate, onShare }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const copyToClipboardFallback = async (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
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
    } catch (err) {
      console.error("Fallback clipboard copy failed:", err);
      return false;
    }
  };

  const handleShareButton = async () => {
    if (!onShare || isSharing) return;
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
          } catch (err: any) {
            if (err.name !== 'AbortError') {
              const success = await copyToClipboardFallback(contentToCopy);
              if (success) {
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 2500);
              }
            }
          }
        } else {
          const success = await copyToClipboardFallback(contentToCopy);
          if (success) {
            setShareCopied(true);
            setTimeout(() => setShareCopied(false), 2500);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
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
          return (
            <div className="w-full max-w-5xl mx-auto py-12 px-4 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-4 ml-2">Project Synthesis Active</div>
              <ProjectWorkbench data={data} />
              {message.isUpdating && (
                <div className="flex items-center justify-center gap-3 text-[10px] text-gray-500 font-bold uppercase tracking-widest animate-pulse mt-6">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  Generating Project Files...
                </div>
              )}
            </div>
          );
        }
      }
    } catch (e) {
      // Stream in progress
    }
  }

  if (isUser) {
    return (
      <div className="w-full">
        <div className="max-w-4xl mx-auto px-6">
          <div className="w-full border-t border-[#1A1A22] mb-10" />
          <div className="flex justify-end mb-4">
            <div className="flex items-center gap-3 w-max max-w-xl group relative z-10">
              {isEditing ? (
                <div className="w-full space-y-2">
                  <textarea
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full bg-[#111215] text-gray-200 px-5 py-3 rounded-xl text-[15px] border border-gray-400/50 focus:outline-none focus:ring-1 focus:ring-gray-400/30 font-medium resize-none min-h-[100px]"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditValue(message.content);
                      }}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (editValue.trim() && editValue !== message.content) {
                          onEdit?.(editValue.trim());
                        }
                        setIsEditing(false);
                      }}
                      className="px-4 py-1.5 rounded-lg bg-white text-black text-[11px] font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 w-full justify-end flex-nowrap">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 p-2 text-gray-600 hover:text-white transition-all order-1"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <div className="bg-[#1A1A22] text-[#e0e0e0] px-5 py-3 rounded-[16px] text-[15px] border border-[#22222A] order-2 font-medium max-w-full shadow-sm relative break-words">
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {message.attachments.map((att, idx) => (
                          <div key={idx} className="relative">
                            {att.type.startsWith('image/') ? (
                              <img src={att.url} alt="" className="w-20 h-20 rounded-lg object-cover border border-[#333]" />
                            ) : (
                              <div className="w-20 h-20 rounded-lg bg-[#0a0a0a] border border-[#333] flex flex-col items-center justify-center p-2 text-center">
                                <svg className="w-6 h-6 text-gray-600 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                <span className="text-[8px] text-gray-500 truncate w-full">{att.name}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {message.content}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
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
  let related: string[] = [];
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

  const extractSection = (text: string, header: string | RegExp, nextHeaderLookahead: RegExp) => {
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
    } else {
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
  const renderRichText = (text: string) => {
    if (!text) return null;

    // Process ONLY semantic tags: <key>, <cmd>, <code>, <imp>, <def>
    // We must NOT split on all <tag> elements, as it breaks HTML code blocks across multiple ReactMarkdown instances.
    const semanticTagsMatch = /(<(?:key|cmd|code|imp|def)>[\s\S]*?<\/(?:key|cmd|code|imp|def)>)/g;
    const parts = text.split(semanticTagsMatch);

    return parts.map((part, i) => {
      const match = part.match(/<(key|cmd|code|imp|def)>([\s\S]*?)<\/\1>/);
      if (match) {
        const tag = match[1];
        const content = match[2];
        const styles: Record<string, string> = {
          key: 'text-gray-300 font-bold px-1 rounded bg-gray-400/5',
          cmd: 'text-gray-300 font-mono font-bold px-1 rounded bg-gray-400/5',
          code: 'text-gray-300 font-mono px-1 rounded bg-gray-400/5',
          imp: 'text-gray-300 font-bold px-1 rounded bg-gray-400/5',
          def: 'text-gray-300 italic font-medium px-1'
        };
        return <span key={i} className={styles[tag] || 'text-gray-400'}>{content}</span>;
      }
      return (
        <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {part}
        </ReactMarkdown>
      );
    });
  };

  // Image Search Queries extraction
  const imageQueriesMatch = mainContent.match(/IMAGE_SEARCH_QUERIES:\s*(\[[\s\S]*?\])/);
  let imageQueries: string[] = [];
  if (imageQueriesMatch) {
    try {
      imageQueries = JSON.parse(imageQueriesMatch[1]);
      mainContent = mainContent.replace(imageQueriesMatch[0], '').trim();
    } catch (e) { }
  }

  // Source Search Queries extraction
  const sourceQueriesMatch = mainContent.match(/SOURCE_SEARCH_QUERIES:\s*(\[[\s\S]*?\])/);
  let sourceQueries: string[] = [];
  if (sourceQueriesMatch) {
    try {
      sourceQueries = JSON.parse(sourceQueriesMatch[1]);
      mainContent = mainContent.replace(sourceQueriesMatch[0], '').trim();
    } catch (e) { }
  }

  // Only show the global layout loader if we are streaming and have absolutely no investigation steps to show.
  const isStreaming = !message.content && !message.sources?.length && message.isUpdating !== false && (!message.reasoningSteps || message.reasoningSteps.length === 0);

  if (isStreaming) {
    return (
      <div className="w-full max-w-3xl mx-auto py-12 px-4 flex flex-col items-center">
        <div className="w-10 h-0.5 bg-[#111215] rounded-full overflow-hidden mb-3">
          <div className="h-full bg-white w-1/3 animate-[loading_1s_infinite_linear]" />
        </div>
        <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Searching</div>
        <style>{`@keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }`}</style>
      </div>
    );
  }

  if (!message.content && !message.sources?.length && message.isUpdating === false && (!message.reasoningSteps || message.reasoningSteps.length === 0)) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-6 flex items-start gap-4 mb-8 mt-2">

      {/* AI Avatar */}
      <div className="w-[36px] h-[36px] rounded-full bg-[#0a0a0c] border border-[#22222a] flex items-center justify-center overflow-hidden flex-shrink-0 mt-8 shadow-md">
        <svg viewBox="0 0 32 32" fill="currentColor" className="w-[18px] h-[18px] text-white">
          <path d="M16 4L2 32h6l8-16 8 16h6L16 4zm0 18l-5 10h10L16 22z" />
        </svg>
      </div>

      {/* AI CONTENT WRAPPER */}
      <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-700">

        <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">
          PRIMARY ANSWER
        </div>

        <div className="border border-[#1A1A22] bg-[#0c0c0e] rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-[#1A1A22] flex justify-between items-center bg-[#0a0a0c]">
            <div>
              <span className="text-[14px] font-bold text-white tracking-wide">Aetheris</span>
              <span className="text-[13px] font-medium text-[#888888] ml-1.5">by SnyderAI explains:</span>
            </div>
            {message.mode && (
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                {message.mode} MODE
              </span>
            )}
          </div>

          <div className="p-5 space-y-6 break-words">
            {/* 1. Investigation Steps Strip */}
            {message.reasoningSteps && message.reasoningSteps.length > 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-1000">
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.15em]">
                  Investigation Steps
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  {message.reasoningSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 transition-all duration-500 ${step.status === 'active'
                        ? 'text-gray-300'
                        : step.status === 'complete'
                          ? 'text-gray-500'
                          : 'text-gray-800'
                        }`}
                    >
                      <div className="flex items-center justify-center flex-shrink-0">
                        {step.status === 'complete' ? (
                          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <div className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                        )}
                      </div>
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${step.status === 'active' ? 'animate-pulse' : ''}`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Trust Intelligence Graph */}
            {message.sources && message.sources.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Source Trust Graph</div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-gray-400" /><span className="text-[8px] font-bold text-gray-500 uppercase">Authority</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-gray-400" /><span className="text-[8px] font-bold text-gray-500 uppercase">Freshness</span></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 min-[1200px]:grid-cols-4 gap-3">
                  {message.sources.slice(0, 4).map((s, idx) => <TrustNode key={idx} source={s} />)}
                </div>
              </div>
            )}

            {/* 2. Main Answer Hub */}
            <div className="space-y-8">
              {thinkingSection && (
                <div className="space-y-4 p-5 rounded-xl bg-gray-400/5 border border-gray-400/10 backdrop-blur-sm animate-in fade-in slide-in-from-left-4 duration-700">
                  <div className="text-[11px] font-black text-gray-300 uppercase tracking-[0.3em] flex items-center gap-2">
                    🧠 Thinking Process
                  </div>
                  <div className="space-y-3 text-gray-400/80">
                    {renderRichText(thinkingSection)}
                  </div>
                </div>
              )}

              {planSection && (
                <div className="space-y-4 p-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm italic text-gray-400">
                  <div className="text-[11px] font-black text-gray-500 uppercase tracking-[0.3em]">Execution Plan</div>
                  <div className="space-y-2">
                    {renderRichText(planSection)}
                  </div>
                </div>
              )}

              {finalPrimaryAnswer && (
                <div className="space-y-4">
                  <div className="text-[11px] font-bold text-[#888888] uppercase tracking-[0.2em] flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {message.mode ? `${message.mode.toUpperCase()} MODE` : 'RESEARCH MODE'}
                      {message.isUpdating && <div className="flex gap-1"><div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} /><div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} /><div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} /></div>}
                    </div>
                    {providerMessage && (
                      <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-sm">
                        Layer: {providerMessage}
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 transition-all duration-300 ease-in-out">
                    {renderRichText(finalPrimaryAnswer + (message.isUpdating ? ' █' : ''))}
                  </div>
                </div>
              )}

              {connectionLostMessage && (
                <div className="space-y-4 p-5 rounded-xl bg-gray-400/5 border border-gray-400/10 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-700">
                  <div className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    Network Interruption
                  </div>
                  <div className="text-[13px] font-medium text-gray-400/80">
                    {connectionLostMessage}
                    <br />
                    <span className="text-gray-500 italic mt-2 block">System is waiting for a valid signal. Please check parameters or retry.</span>
                  </div>
                </div>
              )}

              {keyPoints && (
                <>
                  <div className="relative my-8 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#1A1A22]"></div>
                    </div>
                    <span className="relative bg-[#0c0c0e] px-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] z-10">
                      Quick Summary
                    </span>
                  </div>
                  <div className="space-y-3">
                    {renderRichText(keyPoints)}
                  </div>
                </>
              )}

              {codeBlock && (
                <div className="space-y-4">
                  <div className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Code Solution</div>
                  <div className="rounded-xl overflow-hidden">
                    {renderRichText(codeBlock)}
                  </div>
                </div>
              )}

              {optionalSteps && (
                <div className="space-y-4 p-5 rounded-xl bg-gray-400/5 border border-gray-400/10">
                  <div className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    🚀 Actionable Steps
                  </div>
                  <div className="space-y-3">
                    {renderRichText(optionalSteps)}
                  </div>
                </div>
              )}

              {message.generatedImage && (
                <div className="space-y-4 animate-in zoom-in-95 duration-1000">
                  <div className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Generated Visualization</div>
                  <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/40 aspect-square sm:aspect-video">
                    <img
                      src={message.generatedImage}
                      alt="Generated by Aetheris"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                      <button
                        onClick={() => window.open(message.generatedImage, '_blank')}
                        className="px-4 py-2 rounded-xl bg-white text-black text-[11px] font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors"
                      >
                        Open Full Resolution
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {verifiedSources && (
                <div className="space-y-4">
                  <div className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-2.5 h-2.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    Verified Sources
                  </div>
                  <div className="text-[15px] text-gray-400 leading-relaxed font-light pl-4 border-l border-gray-400/20">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ ...markdownComponents, p: ({ children }: any) => <p className="mb-2">{children}</p>, li: ({ children }: any) => <li className="relative pl-4 before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-gray-400/40 before:rounded-full">{children}</li> }}>
                      {verifiedSources}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {imageToCheck && (
                <div className="space-y-4 p-5 rounded-xl bg-gray-400/5 border border-gray-400/10">
                  <div className="text-[11px] font-black text-gray-300 uppercase tracking-[0.3em]">Images to check</div>
                  <div className="text-[14px] text-gray-300 leading-relaxed italic">
                    {renderRichText(imageToCheck)}
                  </div>
                </div>
              )}

              {confidenceLevel && (
                <div className="mt-8 p-5 rounded-xl bg-white/5 border border-white/10 space-y-2 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      Confidence Score
                    </div>
                    <div className="px-2 py-1 rounded bg-gray-400/20 text-gray-300 text-[10px] font-mono font-bold">
                      {confidenceLevel.trim()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Source Cards (Simplified) */}
            {message.sources && message.sources.length > 0 && (
              <div className="pt-8 space-y-4">
                <div className="w-full h-[1px] bg-[#1A1A22] mb-6" />
                <div className="flex gap-2">
                  <div className="text-[14px] font-bold text-white whitespace-nowrap min-w-max">Sources:</div>
                  <div className="flex flex-col gap-2">
                    {message.sources.map((s, idx) => (
                      <a
                        key={idx}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex text-[14px] text-[#888888] hover:text-white transition-colors gap-2 leading-relaxed"
                      >
                        <span className="font-semibold text-gray-400">[{idx + 1}]</span>
                        <span>{new URL(s.url).hostname.replace('www.', '')} — {s.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 flex flex-wrap justify-end gap-2 mb-2">
              {onRegenerate && !message.isUpdating && (
                <button
                  onClick={onRegenerate}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#050505] border border-[#1A1A22] hover:border-[#22222A] transition-all group shadow-sm"
                >
                  <svg className="w-3 h-3 text-gray-500 group-hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-[10px] font-bold text-gray-500 group-hover:text-gray-300 uppercase tracking-widest">Regenerate</span>
                </button>
              )}
              {onShare && !message.isUpdating && (
                <button
                  onClick={handleShareButton}
                  disabled={isSharing}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#050505] border border-[#1A1A22] hover:border-[#22222A] transition-all group shadow-sm disabled:opacity-50"
                >
                  {shareCopied ? (
                    <>
                      <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Chat copied. You can paste it anywhere.</span>
                    </>
                  ) : (
                    <>
                      {isSharing ? (
                        <div className="w-3 h-3 border-2 border-gray-500 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-3 h-3 text-gray-500 group-hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                      )}
                      <span className="text-[10px] font-bold text-gray-500 group-hover:text-gray-300 uppercase tracking-widest">{isSharing ? 'Copying...' : 'Share Chat'}</span>
                    </>
                  )}
                </button>
              )}
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#050505] border border-[#1A1A22] hover:border-[#22222A] transition-all group shadow-sm"
              >
                {copied ? (
                  <>
                    <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Copied</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3 text-gray-500 group-hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    <span className="text-[10px] font-bold text-gray-500 group-hover:text-gray-300 uppercase tracking-widest">Copy Full Answer</span>
                  </>
                )}
              </button>
            </div>

            {/* 4. Related Pathing */}
            {related.length > 0 && (
              <div className="pt-8 border-t border-[#1a1a1a] space-y-5">
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Ask a follow-up</div>
                <div className="flex flex-col gap-2">
                  {related.map((q, i) => {
                    if (!q) return null;
                    return (
                      <button
                        key={i}
                        onClick={() => onRelatedClick?.(q)}
                        className="group flex items-center justify-between text-left p-3.5 rounded-xl bg-[#080808] border border-[#141414] hover:border-gray-400/30 hover:bg-[#0c0c0c] transition-all"
                      >
                        <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">{q}</span>
                        <span className="text-gray-600 group-hover:text-gray-400 text-xs font-bold px-1 transition-colors">+</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
