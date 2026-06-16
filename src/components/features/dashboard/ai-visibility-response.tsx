'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { cleanAiVisibilityResponse, shortAiResponseLinkLabel } from '@/lib/utils/ai-visibility-response';

const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-sm font-semibold text-neutral-900 mt-3 mb-1.5 first:mt-0">{children}</p>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-sm font-semibold text-neutral-900 mt-3 mb-1.5 first:mt-0">{children}</p>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-sm font-medium text-neutral-900 mt-2 mb-1 first:mt-0">{children}</p>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-sm text-neutral-700 leading-relaxed mb-2 last:mb-0">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc pl-4 mb-2 space-y-1 text-sm text-neutral-700">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal pl-4 mb-2 space-y-1.5 text-sm text-neutral-700">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-neutral-900">{children}</strong>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => {
    const childText = typeof children === 'string' ? children : '';
    return (
      <span className="text-neutral-500 text-xs">{shortAiResponseLinkLabel(href, childText)}</span>
    );
  },
  hr: () => null,
};

export function AiVisibilityResponseBody({ text }: { text: string }) {
  const cleaned = cleanAiVisibilityResponse(text);
  if (!cleaned) return null;

  return (
    <div className="rounded-lg border border-neutral-200/80 bg-white/70 px-3 py-2.5">
      <ReactMarkdown components={markdownComponents}>{cleaned}</ReactMarkdown>
    </div>
  );
}
