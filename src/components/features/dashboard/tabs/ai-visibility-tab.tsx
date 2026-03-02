'use client';

import React, { useState, useEffect } from 'react';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { DashboardAnalysisResult, AIVisibilityData } from '@/types/dashboard';
import {
  Eye,
  Lock,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Search,
  X,
  Loader2,
  Sparkles,
  Clock,
  Bell,
} from 'lucide-react';

function getHostname(url: string): string {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** Samme suffiks som i API (route.ts PROMPT_INSTRUCTION_SUFFIX); fjernes fra spørsmålstekst slik at kun ren spørsmålstekst vises. */
const PROMPT_INSTRUCTION_SUFFIX =
  ' Svar i 1–2 setninger. Fokuser kun på spørsmålet. Ikke inkluder nettsideadresser i parentes (f.eks. (domene.no)) i svaret. Unngå å gjenta samme firmabeskrivelse i hvert svar—svar kun på det som spørres.';

/** Fjerner prompt-instruksjoner, "Søk:" og (domene) fra spørsmålstekst slik at kun ren spørsmålstekst vises. */
function cleanQueryForDisplay(rawQuery: string, domain: string): string {
  return rawQuery
    .replace(PROMPT_INSTRUCTION_SUFFIX, '')
    .replace(/^Søk:\s*/i, '')
    .replaceAll(` (${domain})`, '')
    .trim();
}

/** Fjerner (domene.no)-lignende parenteser fra AI-svar for ryddigere visning. */
function cleanAiResponseForDisplay(text: string): string {
  return text
    .replace(/\s*\([a-z0-9][a-z0-9.-]*\.[a-z]{2,}\)(\.)?\s*/gi, (_, period) => (period ? '. ' : ' '))
    .replace(/\s{2,}/g, ' ')
    .trim();
}

type TextSegment = { type: 'text'; content: string };
type LinkSegment = { type: 'link'; content: string; href: string };

function shortUrlDisplay(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.length > 40 ? url.slice(0, 37) + '…' : url;
  }
}

function formatAiResponseSegments(text: string): Array<TextSegment | LinkSegment> {
  const segments: Array<TextSegment | LinkSegment> = [];

  function addTextWithRawUrls(rest: string) {
    const urlRegex = /https?:\/\/[^\s)\]"]+/g;
    let last = 0;
    let match;
    while ((match = urlRegex.exec(rest)) !== null) {
      if (match.index > last) {
        segments.push({ type: 'text', content: rest.slice(last, match.index) });
      }
      const href = match[0].replace(/[.,;:!?)\]]+$/, '');
      segments.push({ type: 'link', content: shortUrlDisplay(href), href });
      last = urlRegex.lastIndex;
    }
    if (last < rest.length) {
      segments.push({ type: 'text', content: rest.slice(last) });
    }
  }

  const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let lastEnd = 0;
  let m;
  while ((m = mdLinkRegex.exec(text)) !== null) {
    if (m.index > lastEnd) {
      addTextWithRawUrls(text.slice(lastEnd, m.index));
    }
    segments.push({ type: 'link', content: m[1], href: m[2] });
    lastEnd = mdLinkRegex.lastIndex;
  }
  if (lastEnd < text.length) {
    addTextWithRawUrls(text.slice(lastEnd));
  }
  if (segments.length === 0 && text) {
    segments.push({ type: 'text', content: text });
  }
  return segments;
}

function AiResponseText({ text, className }: { text: string; className?: string }) {
  const segments = formatAiResponseSegments(text);
  return (
    <p className={className}>
      {segments.map((seg, i) =>
        seg.type === 'text' ? (
          <React.Fragment key={i}>{seg.content}</React.Fragment>
        ) : (
          <a
            key={i}
            href={seg.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 hover:underline break-all"
          >
            {seg.content}
          </a>
        )
      )}
    </p>
  );
}

const AI_VISIBILITY_ENABLED = true;

const AI_CHECK_MESSAGES = [
  'Søker etter bedriften din…',
  'Sjekker synlighet i AI-søk…',
  'Analyserer resultater…',
  'Oppsummerer…',
];

export interface AiVisibilityTabProps {
  result: DashboardAnalysisResult;
  isPremium: boolean;
  aiVisibilityResult: AIVisibilityData | null;
  companyUrl: string | null;
  url: string;
  companyName: string | null;
  checkingAiVisibility: boolean;
  /** Sekunder siden sjekk startet (viser i modal) */
  aiVisibilityElapsedTime: number;
  onCheckAiVisibility: () => Promise<void>;
}

export function AiVisibilityTab({
  result,
  isPremium,
  aiVisibilityResult,
  companyUrl,
  url,
  companyName,
  checkingAiVisibility,
  aiVisibilityElapsedTime = 0,
  onCheckAiVisibility,
}: AiVisibilityTabProps) {
  const [checkMessageIndex, setCheckMessageIndex] = useState(0);

  useEffect(() => {
    if (!checkingAiVisibility) return;
    setCheckMessageIndex(0);
    const interval = setInterval(() => {
      setCheckMessageIndex((prev) => (prev + 1) % AI_CHECK_MESSAGES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [checkingAiVisibility]);

  // Show "Coming soon" when feature is disabled
  if (!AI_VISIBILITY_ENABLED) {
    return (
      <div className="rounded-2xl max-[400px]:rounded-xl border border-neutral-200 bg-white overflow-hidden min-w-0">
        <div className="p-2 max-[400px]:p-2 min-[401px]:p-3 sm:p-6 border-b border-neutral-100">
          <div className="min-w-0">
            <h3 className="inline-flex items-center gap-1.5 max-[400px]:gap-1.5 px-2 max-[400px]:px-2 min-[401px]:px-3 py-1 max-[400px]:py-1 min-[401px]:py-1.5 rounded-full bg-neutral-100 text-neutral-900 text-xs max-[400px]:text-[11px] min-[401px]:text-sm font-medium mb-2 max-[400px]:mb-2">
              <Eye className="h-3.5 w-3.5 max-[400px]:h-3 max-[400px]:w-3 text-neutral-600" />
              AI-synlighet
            </h3>
            <p className="text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs sm:text-sm text-neutral-600">Hvor godt AI kjenner bedriften din</p>
          </div>
        </div>
        <div className="p-4 max-[400px]:p-3 min-[401px]:p-5 sm:p-8">
          <div className="max-w-lg mx-auto text-center space-y-4 max-[400px]:space-y-4 min-[401px]:space-y-5 sm:space-y-6">
            <div className="w-12 h-12 max-[400px]:w-10 max-[400px]:h-10 min-[401px]:w-12 min-[401px]:h-12 sm:w-14 sm:h-14 mx-auto rounded-xl bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center">
              <Sparkles className="w-6 h-6 max-[400px]:w-5 max-[400px]:h-5 min-[401px]:w-6 sm:w-7 sm:h-7 text-violet-600" />
            </div>
            
            <div className="space-y-1.5 max-[400px]:space-y-1.5">
              <h4 className="text-base max-[400px]:text-sm min-[401px]:text-lg sm:text-xl font-semibold text-neutral-900">AI-synlighet kommer snart!</h4>
              <p className="text-xs max-[400px]:text-[11px] min-[401px]:text-sm sm:text-base text-neutral-600">
                Vi jobber med AI-synlighet. Snart kan du se om ChatGPT, Perplexity og andre AI-verktøy kjenner til bedriften din.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-[400px]:gap-2 min-[401px]:gap-4 pt-3 sm:pt-4">
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-green-100 flex items-center justify-center">
                  <Search className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm font-medium text-neutral-900">AI-spørringer</p>
                <p className="text-xs text-neutral-500 mt-1">Test om AI kjenner deg</p>
              </div>
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-sm font-medium text-neutral-900">Anbefalinger</p>
                <p className="text-xs text-neutral-500 mt-1">Tips for bedre synlighet</p>
              </div>
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-neutral-900">Score</p>
                <p className="text-xs text-neutral-500 mt-1">Din AI-synlighet</p>
              </div>
            </div>

            <div className="pt-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 border border-violet-100 text-violet-700 text-sm">
                <Clock className="w-4 h-4" />
                Forventet lansering: Snart
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Dialog open={checkingAiVisibility} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 mx-1 max-[400px]:mx-1 min-[401px]:mx-2 sm:mx-auto rounded-xl w-[calc(100vw-0.5rem)] min-[401px]:w-[calc(100vw-1rem)] sm:w-full max-w-[95vw]">
          <VisuallyHidden.Root asChild>
            <DialogTitle>Sjekker AI-synlighet</DialogTitle>
          </VisuallyHidden.Root>
          <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
            <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-3 sm:p-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative w-12 sm:w-14 h-12 sm:h-14 shrink-0">
                  <svg className="w-12 sm:w-14 h-12 sm:h-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="#e5e5e5" strokeWidth="3" />
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      fill="none"
                      stroke="#737373"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="animate-pulse"
                      strokeDasharray="75.4 150.8"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-neutral-600 animate-spin" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-neutral-900 text-sm sm:text-base font-medium flex items-center gap-2">
                      Sjekker AI-synlighet
                      <span className="inline-flex gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-1 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-1 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </p>
                  </div>
                  <p className="text-neutral-500 text-xs sm:text-sm">
                    {AI_CHECK_MESSAGES[checkMessageIndex]}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-white border border-neutral-200">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs sm:text-sm font-medium text-neutral-700 tabular-nums">
                    {Math.floor(aiVisibilityElapsedTime / 60)}:{(aiVisibilityElapsedTime % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-neutral-400">
              Vanligvis 1–2 minutter.
            </p>
          </div>
        </DialogContent>
      </Dialog>

    <div className="rounded-2xl max-[400px]:rounded-xl border border-neutral-200 bg-white overflow-hidden min-w-0">
      <div className="p-3 max-[400px]:p-2 min-[401px]:p-4 sm:p-6 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h3 className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-neutral-100 text-neutral-900 text-xs sm:text-sm font-medium mb-1.5">
            <Eye className="h-3.5 w-3.5 text-neutral-600" />
            AI-synlighet
          </h3>
          <p className="text-[10px] sm:text-sm text-neutral-500">Spør AI om den kjenner til bedriften og kan anbefale den.</p>
        </div>
        {isPremium && (() => {
          const skip24hThrottle =
            process.env.NEXT_PUBLIC_AI_VISIBILITY_SKIP_24H_THROTTLE === 'true' ||
            process.env.NEXT_PUBLIC_AI_VISIBILITY_SKIP_24H_THROTTLE === '1';
          const visibility = result.aiVisibility ?? aiVisibilityResult;
          const checkedAt = visibility?.checked_at;
          const THRESHOLD_MS = 24 * 60 * 60 * 1000;
          const throttled =
            !skip24hThrottle && !!checkedAt && Date.now() - new Date(checkedAt).getTime() < THRESHOLD_MS;
          const nextCheckAt = throttled && checkedAt
            ? new Date(new Date(checkedAt).getTime() + THRESHOLD_MS)
            : null;
          return (
            <div className="shrink-0 flex flex-col items-end gap-1">
              <Button
                onClick={onCheckAiVisibility}
                disabled={checkingAiVisibility || throttled}
                className="w-full sm:w-auto rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white disabled:opacity-70"
              >
                {checkingAiVisibility ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sjekker...
                  </>
                ) : throttled ? (
                  'Sjekk tilgjengelig om 24 t'
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Kjør sjekk
                  </>
                )}
              </Button>
              {throttled && nextCheckAt && (
                <span className="text-[10px] sm:text-xs text-neutral-500">
                  Neste sjekk mulig fra {nextCheckAt.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })} kl. {nextCheckAt.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {!throttled && !result.keywordResearch?.length && (
                <span className="text-[10px] sm:text-xs text-neutral-500 text-right">
                  Generelle spørsmål (ingen nøkkelord)
                </span>
              )}
            </div>
          );
        })()}
      </div>
      <div className="p-3 max-[400px]:p-2 min-[401px]:p-4 sm:p-6 space-y-4 min-[401px]:space-y-6">
        {isPremium && checkingAiVisibility ? null : !isPremium ? (
          <div className="space-y-4 min-[401px]:space-y-6">
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 min-[401px]:p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Lock className="h-5 w-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm sm:text-base font-semibold text-amber-900">AI-synlighet er en Premium-funksjon</h4>
                  <p className="text-xs sm:text-sm text-amber-800 mt-1">
                    Med Premium får du full rapport om hvordan AI-modeller ser og anbefaler bedriften din.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-3 min-[401px]:p-4">
              <h4 className="text-xs sm:text-sm font-semibold text-neutral-900 mb-2">Hvorfor er dette viktig?</h4>
              <p className="text-[11px] sm:text-sm text-neutral-600 leading-relaxed">
                Flere bruker nå AI-verktøy (ChatGPT, Perplexity, Copilot) til å finne tjenester og bedrifter.
                Hvis AI ikke kjenner til deg eller ikke anbefaler deg, går potensielle kunder til konkurrentene.
                AI-synlighetsrapporten viser hvor du står og hva du kan gjøre for å bli mer synlig.
              </p>
            </div>

            <div className="pt-2">
              <Button asChild className="w-full sm:w-auto rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white">
                <a href="https://mediabooster.no/kontakt" target="_blank" rel="noopener noreferrer">
                  Få Premium – AI-synlighet inkludert
                  <ArrowRight className="ml-2 h-4 w-4 inline" />
                </a>
              </Button>
            </div>
          </div>
        ) : (() => {
          const visData = result.aiVisibility || aiVisibilityResult;

          if (visData) {
            return (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  <div className="text-center">
                    <div
                      className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-4 ${
                        visData.level === 'high'
                          ? 'bg-gradient-to-br from-green-100 to-green-200'
                          : visData.level === 'medium'
                            ? 'bg-gradient-to-br from-amber-100 to-amber-200'
                            : 'bg-gradient-to-br from-red-100 to-red-200'
                      }`}
                    >
                      <div className="text-center">
                        <span
                          className={`text-4xl font-bold ${
                            visData.level === 'high'
                              ? 'text-green-600'
                              : visData.level === 'medium'
                                ? 'text-amber-600'
                                : 'text-red-600'
                          }`}
                        >
                          {visData.score}
                        </span>
                        <p className="text-xs text-neutral-500 mt-0.5">av 100</p>
                      </div>
                    </div>
                    <h4
                      className={`font-semibold mb-1 ${
                        visData.level === 'high'
                          ? 'text-green-700'
                          : visData.level === 'medium'
                            ? 'text-amber-700'
                            : 'text-red-700'
                      }`}
                    >
                      {visData.level === 'high'
                        ? 'God AI-synlighet'
                        : visData.level === 'medium'
                          ? 'Moderat AI-synlighet'
                          : visData.level === 'low'
                            ? 'Lav AI-synlighet'
                            : 'Ikke synlig i AI-søk'}
                    </h4>
                    <p className="text-sm text-neutral-500">{visData.description}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-xl bg-neutral-50 text-center">
                      <p className="text-2xl font-bold text-neutral-900">{visData.details.queriesTested}</p>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Testet</p>
                    </div>
                    <div className="p-3 rounded-xl bg-green-50 text-center">
                      <p className="text-2xl font-bold text-green-600">{visData.details.timesCited}</p>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Kjent</p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 text-center">
                      <p className="text-2xl font-bold text-amber-600">{visData.details.timesMentioned}</p>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Delvis</p>
                    </div>
                  </div>

                  {visData.recommendations.length > 0 && (
                    <div className={`p-4 rounded-xl border ${
                      visData.level === 'high' 
                        ? 'bg-green-50 border-green-100' 
                        : 'bg-amber-50 border-amber-100'
                    }`}>
                      <h5 className={`font-medium text-sm mb-3 flex items-center gap-2 ${
                        visData.level === 'high' ? 'text-green-800' : 'text-amber-800'
                      }`}>
                        <Lightbulb className="w-4 h-4" />
                        {visData.level === 'high' ? 'Tips for å holde deg på topp' : 'Forbedringer'}
                      </h5>
                      <ul className="space-y-2">
                        {visData.recommendations.map((rec, i) => (
                          <li key={i} className={`text-xs flex items-start gap-2 ${
                            visData.level === 'high' ? 'text-green-700' : 'text-amber-700'
                          }`}>
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-medium mt-0.5 ${
                              visData.level === 'high' 
                                ? 'bg-green-200 text-green-800' 
                                : 'bg-amber-200 text-amber-800'
                            }`}>
                              {i + 1}
                            </span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-2">
                  {!result.keywordResearch?.length && (
                    <div className="mb-4 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                      <p className="text-xs text-neutral-600">
                        Sjekken bruker generelle spørsmål fordi analysen ikke har nøkkelord. Legg til nøkkelord under <strong>Nøkkelord</strong>-fanen for mer relevante spørsmål.
                      </p>
                    </div>
                  )}
                  <div className="mb-4">
                    <h4 className="font-medium text-neutral-900">AI-svar på spørsmål</h4>
                    <p className="text-xs text-neutral-500 mt-0.5">Klikk for å åpne/lukke svar</p>
                  </div>
                  <Accordion type="single" collapsible className="space-y-2">
                    {visData.details.queries.map((q, i) => (
                      <AccordionItem
                        key={i}
                        value={`q-${i}`}
                        className={`rounded-xl border overflow-hidden ${
                          q.cited
                            ? 'bg-green-50/30 border-green-200'
                            : q.mentioned
                              ? 'bg-blue-50/30 border-blue-200'
                              : 'bg-neutral-50/50 border-neutral-200'
                        }`}
                      >
                        <AccordionTrigger className="px-3 sm:px-4 py-3 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-neutral-200/80">
                          <div className="flex items-start justify-between gap-3 text-left w-full">
                            <p className="text-sm sm:text-base text-neutral-800 leading-snug break-words flex-1 min-w-0 pr-2">
                              {cleanQueryForDisplay(q.query, getHostname(companyUrl || url))}
                            </p>
                            <span
                              className={`shrink-0 text-[10px] px-2.5 py-1 rounded-full font-medium ${
                                q.cited ? 'bg-green-100 text-green-700' : q.mentioned ? 'bg-blue-100 text-blue-700' : 'bg-neutral-200 text-neutral-600'
                              }`}
                            >
                              {q.cited ? 'Kjent' : q.mentioned ? 'Delvis' : 'Ukjent'}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 sm:px-4 pb-3 pt-0">
                          {q.aiResponse ? (
                            <div className="pt-2">
                              <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1.5">
                                AI-svar
                              </p>
                              <AiResponseText
                                text={cleanAiResponseForDisplay(q.aiResponse)}
                                className="text-sm sm:text-base text-neutral-700 leading-relaxed whitespace-pre-wrap break-words"
                              />
                            </div>
                          ) : (
                            <p className="text-sm text-neutral-500">Ingen svar</p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            );
          }

          const hasStructuredData = result.seoResults.meta.ogTags.title || result.seoResults.meta.ogTags.description;
          const hasGoodContent = result.contentResults.wordCount >= 300;
          const hasMetaDescription = !!result.seoResults.meta.description.content;
          const hasProperHeadings = result.seoResults.headings.h1.count === 1 && result.seoResults.headings.h2.count > 0;
          const hasAltTexts = result.seoResults.images.total === 0 || result.seoResults.images.withoutAlt === 0;

          const factors = [
            { name: 'Strukturert innhold', pass: hasProperHeadings, tip: 'Bruk tydelige overskrifter (H1, H2)' },
            { name: 'Meta-beskrivelse', pass: hasMetaDescription, tip: 'Legg til beskrivende meta-tekst' },
            { name: 'Innholdsmengde', pass: hasGoodContent, tip: 'Minimum 300 ord anbefales' },
            { name: 'Open Graph data', pass: hasStructuredData, tip: 'Legg til OG-tags for deling' },
            { name: 'Bildetekster', pass: hasAltTexts, tip: 'Alt-tekst hjelper AI å forstå bilder' },
          ];

          return (
            <div className="space-y-4 min-[401px]:space-y-6">
              <div className="rounded-2xl border border-neutral-200 bg-gradient-to-b from-neutral-50/90 to-white overflow-hidden shadow-sm">
                <div className="p-4 min-[401px]:p-5 sm:p-6">
                  <div className="flex items-start gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                      <Eye className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-900">
                        Før du kjører live-sjekk
                      </h4>
                      <p className="text-xs sm:text-sm text-neutral-600 mt-0.5 leading-relaxed">
                        Slik ser nettsiden din ut på noen faktorer som påvirker AI-synlighet.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {factors.map((factor, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-xl border transition-colors ${
                          factor.pass
                            ? 'bg-green-50/90 border-green-100'
                            : 'bg-white border-neutral-100 hover:border-neutral-200'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            factor.pass ? 'bg-green-100' : 'bg-neutral-100'
                          }`}
                        >
                          {factor.pass ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <X className="w-4 h-4 text-neutral-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-medium block ${factor.pass ? 'text-green-800' : 'text-neutral-700'}`}>
                            {factor.name}
                          </span>
                          {!factor.pass && (
                            <p className="text-xs text-neutral-500 mt-1 leading-snug">{factor.tip}</p>
                          )}
                          {factor.pass && (
                            <span className="inline-block mt-1.5 text-[10px] font-medium uppercase tracking-wide text-green-600">
                              OK
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
    </>
  );
}
