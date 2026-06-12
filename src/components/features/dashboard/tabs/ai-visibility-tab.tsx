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
  Search,
  X,
  Loader2,
  Clock,
  Bell,
  Tag,
} from 'lucide-react';
import { RocketIcon } from '../rocket-icon';
import {
  getVisibilityKeywordOptions,
  hasKeywordsForAiVisibility,
  resolveAiVisibilityData,
  normalizeVisibilityKeyword,
} from '@/lib/utils/visibility-keywords';
import { formatVisibilityTestLabel } from '@/lib/ai-visibility-models';

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
            className="text-neutral-900 hover:text-neutral-800 hover:underline break-all"
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
  currentAnalysisId: string | null;
  aiVisibilityAnalysisId: string | null;
  companyUrl: string | null;
  url: string;
  companyName: string | null;
  checkingAiVisibility: boolean;
  /** Sekunder siden sjekk startet (viser i modal) */
  aiVisibilityElapsedTime: number;
  aiVisibilityKeyword: string | null;
  setAiVisibilityKeyword: (keyword: string | null) => void;
  onCheckAiVisibility: () => Promise<void>;
  onGoToKeywords: () => void;
}

export function AiVisibilityTab({
  result,
  isPremium,
  aiVisibilityResult,
  currentAnalysisId,
  aiVisibilityAnalysisId,
  companyUrl,
  url,
  companyName,
  checkingAiVisibility,
  aiVisibilityElapsedTime = 0,
  aiVisibilityKeyword,
  setAiVisibilityKeyword,
  onCheckAiVisibility,
  onGoToKeywords,
}: AiVisibilityTabProps) {
  const [checkMessageIndex, setCheckMessageIndex] = useState(0);
  const keywordOptions = getVisibilityKeywordOptions(result);
  const hasKeywords = hasKeywordsForAiVisibility(result);
  const selectedKeyword =
    aiVisibilityKeyword && keywordOptions.includes(aiVisibilityKeyword)
      ? aiVisibilityKeyword
      : keywordOptions[0] ?? null;

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
            <div className="w-12 h-12 max-[400px]:w-10 max-[400px]:h-10 min-[401px]:w-12 min-[401px]:h-12 sm:w-14 sm:h-14 mx-auto rounded-xl bg-gradient-to-br from-[#f5f3ff] to-[#ddd6fe] flex items-center justify-center">
              <RocketIcon className="w-6 h-6 max-[400px]:w-5 max-[400px]:h-5 min-[401px]:w-6 sm:w-7 sm:h-7 text-[#7c3aed]" />
            </div>
            
            <div className="space-y-1.5 max-[400px]:space-y-1.5">
              <h4 className="text-base max-[400px]:text-sm min-[401px]:text-lg sm:text-xl font-semibold text-neutral-900">AI-synlighet kommer snart!</h4>
              <p className="text-xs max-[400px]:text-[11px] min-[401px]:text-sm sm:text-base text-neutral-600">
                Vi jobber med AI-synlighet. Snart kan du teste om OpenAI ChatGPT kjenner til og anbefaler bedriften din.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-[400px]:gap-2 min-[401px]:gap-4 pt-3 sm:pt-4">
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-neutral-900/10 flex items-center justify-center">
                  <Search className="w-5 h-5 text-neutral-900" />
                </div>
                <p className="text-sm font-medium text-neutral-900">AI-spørringer</p>
                <p className="text-xs text-neutral-500 mt-1">Test om AI kjenner deg</p>
              </div>
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-amber-100 flex items-center justify-center">
                  <RocketIcon className="w-5 h-5 text-amber-700" />
                </div>
                <p className="text-sm font-medium text-neutral-900">Anbefalinger</p>
                <p className="text-xs text-neutral-500 mt-1">Tips for bedre synlighet</p>
              </div>
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-green-50 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm font-medium text-neutral-900">Score</p>
                <p className="text-xs text-neutral-500 mt-1">Din AI-synlighet</p>
              </div>
            </div>

            <div className="pt-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f5f3ff] border border-[#ddd6fe] text-[#6d28d9] text-sm">
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
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-900 animate-pulse" />
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
          <p className="text-[10px] sm:text-sm text-neutral-500">
            Tester om OpenAI ChatGPT kjenner til og anbefaler bedriften din (live websøk, Norge).
          </p>
        </div>
        {isPremium && (
          <div className="shrink-0 flex flex-col items-end gap-1">
            <Button
              onClick={onCheckAiVisibility}
              disabled={checkingAiVisibility || !hasKeywords}
              className="w-full sm:w-auto rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white disabled:opacity-70"
            >
              {checkingAiVisibility ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sjekker...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Kjør sjekk
                </>
              )}
            </Button>
            {selectedKeyword && hasKeywords && (
              <span className="text-[10px] sm:text-xs text-neutral-500 text-right">
                Sjekker for: {selectedKeyword}
              </span>
            )}
          </div>
        )}
      </div>
      {isPremium && !hasKeywords && (
        <div className="px-3 max-[400px]:px-2 min-[401px]:px-4 sm:px-6 py-3 sm:py-4 border-b border-amber-100 bg-amber-50/80">
          <p className="text-xs sm:text-sm text-amber-900 font-medium mb-1">Nøkkelord kreves</p>
          <p className="text-[11px] sm:text-sm text-amber-800/90 mb-3">
            AI-synlighetssjekken bruker nøkkelord fra analysen for å stille relevante spørsmål om bransjen din.
            Legg til nøkkelord og oppdater analysen først.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onGoToKeywords}
            className="rounded-lg border-amber-200 bg-white hover:bg-amber-50 text-amber-900"
          >
            <Tag className="mr-1.5 h-3.5 w-3.5" />
            Gå til SEO / Nøkkelord
          </Button>
        </div>
      )}
      {isPremium && hasKeywords && (
        <div className="px-3 max-[400px]:px-2 min-[401px]:px-4 sm:px-6 pb-3 sm:pb-4 border-b border-neutral-100 bg-neutral-50/50">
          <p className="text-[10px] sm:text-xs font-medium text-neutral-600 mb-2">Velg bransjenøkkelord for sjekken</p>
          <div className="flex flex-wrap gap-1.5">
            {keywordOptions.map((keyword) => {
              const active = keyword === selectedKeyword;
              return (
                <button
                  key={keyword}
                  type="button"
                  onClick={() => setAiVisibilityKeyword(keyword)}
                  disabled={checkingAiVisibility}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    active
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                  } disabled:opacity-50`}
                >
                  <Tag className="h-3 w-3 shrink-0" />
                  {keyword}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-neutral-400 mt-2">
            Ett nøkkelord om gangen – bytt og kjør ny sjekk for å teste andre temaer (bruker én av månedens AI-synlighetssjekker).
          </p>
        </div>
      )}
      <div className="p-3 max-[400px]:p-2 min-[401px]:p-4 sm:p-6 space-y-4 min-[401px]:space-y-6">
        {isPremium && checkingAiVisibility ? null : !isPremium ? (
          <div className="space-y-4 min-[401px]:space-y-6">
            <div className="rounded-xl border border-amber-200 bg-amber-400/10 p-3 min-[401px]:p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Lock className="h-5 w-5 text-amber-700" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm sm:text-base font-semibold text-amber-700">AI-synlighet er en Premium-funksjon</h4>
                  <p className="text-xs sm:text-sm text-neutral-700 mt-1">
                    Med Premium får du full rapport om hvordan OpenAI ChatGPT ser og anbefaler bedriften din.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-3 min-[401px]:p-4">
              <h4 className="text-xs sm:text-sm font-semibold text-neutral-900 mb-2">Hvorfor er dette viktig?</h4>
              <p className="text-[11px] sm:text-sm text-neutral-600 leading-relaxed">
                Flere bruker nå AI-assistenter til å finne tjenester og bedrifter.
                Hvis ChatGPT ikke kjenner til deg eller ikke anbefaler deg på nøytrale spørsmål, går potensielle kunder til konkurrentene.
                Rapporten viser hvor du står i OpenAI og hva du kan gjøre for å bli mer synlig.
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
          const visData = resolveAiVisibilityData(
            result,
            aiVisibilityResult,
            currentAnalysisId,
            aiVisibilityAnalysisId
          );

          if (visData) {
            return (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  <div className="rounded-2xl border border-neutral-200 bg-white p-5 text-center">
                    <div
                      className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center mb-3 ${
                        visData.level === 'high'
                          ? 'bg-green-50'
                          : visData.level === 'medium'
                            ? 'bg-amber-50'
                            : 'bg-red-50'
                      }`}
                    >
                      <div>
                        <span
                          className={`text-4xl font-bold ${
                            visData.level === 'high'
                              ? 'text-green-600'
                              : visData.level === 'medium'
                                ? 'text-amber-700'
                                : 'text-red-600'
                          }`}
                        >
                          {visData.score}
                        </span>
                        <span className="text-sm text-neutral-400">/100</span>
                      </div>
                    </div>
                    <h4
                      className={`font-semibold ${
                        visData.level === 'high'
                          ? 'text-green-600'
                          : visData.level === 'medium'
                            ? 'text-amber-700'
                            : 'text-red-600'
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
                    <p className="text-sm text-neutral-500 mt-1 leading-relaxed">{visData.description}</p>
                    {visData.focusKeyword && (
                      <span className="inline-flex items-center gap-1 mt-3 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 text-xs font-medium">
                        <Tag className="h-3 w-3" />
                        {visData.focusKeyword}
                      </span>
                    )}
                    {selectedKeyword &&
                      visData.focusKeyword &&
                      normalizeVisibilityKeyword(selectedKeyword) !==
                        normalizeVisibilityKeyword(visData.focusKeyword) && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5 mt-3 text-left">
                          Resultatet er for «{visData.focusKeyword}». Du har valgt «{selectedKeyword}» – kjør ny sjekk for å oppdatere.
                        </p>
                      )}
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100">
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-neutral-600">Spørsmål stilt til AI</span>
                      <span className="text-lg font-semibold text-neutral-900">{visData.details.queriesTested}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-neutral-600">AI kjente bedriften</span>
                      <span className="text-lg font-semibold text-green-600">{visData.details.timesCited}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-neutral-600">Usikre treff</span>
                      <span className="text-lg font-semibold text-amber-700">{visData.details.timesMentioned}</span>
                    </div>
                  </div>

                  {formatVisibilityTestLabel(visData.source, visData.modelProfile) && (
                    <p className="text-[10px] text-neutral-400 text-center">
                      {formatVisibilityTestLabel(visData.source, visData.modelProfile)}
                    </p>
                  )}

                  {visData.recommendations.length > 0 && (
                    <div className={`p-4 rounded-xl border ${
                      visData.level === 'high' 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-[#f5f3ff] border-[#ddd6fe]'
                    }`}>
                      <h5 className={`font-medium text-sm mb-3 flex items-center gap-2 ${
                        visData.level === 'high' ? 'text-green-600' : 'text-[#6d28d9]'
                      }`}>
                        <RocketIcon className="w-4 h-4" />
                        {visData.level === 'high' ? 'Tips for å holde deg på topp' : 'Forbedringer'}
                      </h5>
                      <ul className="space-y-2">
                        {visData.recommendations.map((rec, i) => (
                          <li key={i} className={`text-xs flex items-start gap-2 ${
                            visData.level === 'high' ? 'text-green-600' : 'text-[#6d28d9]'
                          }`}>
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-medium mt-0.5 ${
                              visData.level === 'high' 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-[#ddd6fe] text-[#6d28d9]'
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

                  {(visData.details.insight || (visData.details.competitorsMentioned?.length ?? 0) > 0) && (
                    <div className="mb-4 p-4 rounded-xl border border-[#ddd6fe] bg-[#f5f3ff]">
                      <h4 className="text-sm font-semibold text-[#6d28d9] mb-1.5">
                        Hvem anbefaler AI i stedet?
                      </h4>
                      {visData.details.insight && (
                        <p className="text-xs sm:text-sm text-[#6d28d9] leading-relaxed mb-2">
                          {visData.details.insight}
                        </p>
                      )}
                      {(visData.details.competitorsMentioned?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {visData.details.competitorsMentioned!.map((competitor) => (
                            <span
                              key={competitor}
                              className="px-2.5 py-1 rounded-full bg-white border border-[#ddd6fe] text-[#6d28d9] text-xs font-medium"
                            >
                              {competitor}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mb-4">
                    <h4 className="font-medium text-neutral-900">AI-svar på spørsmål</h4>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Nøytrale spørsmål nevner ikke bedriften – navngitte gjør det. Klikk for å åpne/lukke svar.
                    </p>
                  </div>
                  <Accordion type="single" collapsible className="space-y-2">
                    {visData.details.queries.map((q, i) => (
                      <AccordionItem
                        key={i}
                        value={`q-${i}`}
                        className={`rounded-xl border overflow-hidden ${
                          q.cited
                            ? 'bg-green-50 border-green-200'
                            : q.mentioned
                              ? 'bg-amber-50 border-amber-200'
                              : 'bg-neutral-50/50 border-neutral-200'
                        }`}
                      >
                        <AccordionTrigger className="px-3 sm:px-4 py-3 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-neutral-200/80">
                          <div className="flex items-start justify-between gap-3 text-left w-full">
                            <div className="flex-1 min-w-0 pr-2">
                              {q.type && (
                                <span className="inline-block mb-1 text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 font-medium">
                                  {q.type === 'unprompted' ? 'Nøytralt spørsmål' : 'Navngitt'}
                                </span>
                              )}
                              <p className="text-sm sm:text-base text-neutral-800 leading-snug break-words">
                                {cleanQueryForDisplay(q.query, getHostname(companyUrl || url))}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 text-[10px] px-2.5 py-1 rounded-full font-medium ${
                                q.cited ? 'bg-green-50 text-green-600' : q.mentioned ? 'bg-amber-50 text-amber-700' : 'bg-neutral-200 text-neutral-600'
                              }`}
                            >
                              {q.cited ? 'Kjent' : q.mentioned ? 'Usikker' : 'Ukjent'}
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
                    <div className="w-10 h-10 rounded-xl bg-[#f5f3ff] flex items-center justify-center shrink-0">
                      <Eye className="w-5 h-5 text-[#7c3aed]" />
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
                            ? 'bg-green-50 border-green-200'
                            : 'bg-white border-neutral-100 hover:border-neutral-200'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            factor.pass ? 'bg-green-50' : 'bg-neutral-100'
                          }`}
                        >
                          {factor.pass ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <X className="w-4 h-4 text-neutral-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-medium block ${factor.pass ? 'text-green-600' : 'text-neutral-700'}`}>
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
