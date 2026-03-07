
import React from 'react';
import { SearchResult } from '../types';

interface ResultDisplayProps {
  result: SearchResult;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  // Format the answer text to handle bullet points and basic markdown-like structures
  const formattedAnswer = result.answer.split('\n').map((line, idx) => {
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      return (
        <li key={idx} className="mb-2 ml-4 list-disc text-gray-800 leading-relaxed">
          {line.trim().substring(2)}
        </li>
      );
    }
    if (line.trim() === '') return <div key={idx} className="h-4" />;
    return <p key={idx} className="mb-4 text-gray-800 leading-relaxed text-lg">{line}</p>;
  });

  return (
    <div className="w-full max-w-3xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-semibold mb-6 text-gray-900">{result.query}</h1>

      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
          </div>
          <span className="text-xs font-bold tracking-widest text-blue-600 uppercase">AI Answer</span>
        </div>

        <div className="prose prose-blue max-w-none">
          {formattedAnswer}
        </div>
      </div>

      {result.sources.length > 0 && (
        <div className="px-2">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Verified Sources</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 min-[1200px]:grid-cols-4 gap-3">
            {result.sources.map((source, idx) => (
              <a
                key={idx}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col p-4 bg-white border border-gray-100 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 line-clamp-1 mb-1">
                  {source.title}
                </span>
                <span className="text-xs text-gray-400 line-clamp-1 truncate">
                  {source.url.replace(/^https?:\/\//, '')}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;
