import React from 'react';
import { renderToString } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const CodeComponent = ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    if (!inline && match) {
        return React.createElement('div', { className: "CODE-BLOCK" },
            React.createElement('span', null, match[1]),
            React.createElement('pre', null, String(children))
        );
    }
    return React.createElement('code', null, children || '');
};

const markdownComponents = {
    pre: ({ children }: any) => React.createElement(React.Fragment, null, children),
    code: CodeComponent as any,
};

const content = "```html\n<!DOCTYPE html>\n<html>\n<head>\n<title>My Simple Webpage █";

console.log("RENDERED:", renderToString(React.createElement(ReactMarkdown, { components: markdownComponents, remarkPlugins: [remarkGfm] }, content)));
