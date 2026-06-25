'use client';

import React, { useState, useEffect } from 'react';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { RocketIcon } from '../rocket-icon';
import {
  getVisibilityKeywordOptions,
  hasKeywordsForAiVisibility,
  resolveAiVisibilityData,
  normalizeVisibilityKeyword,
  resolveVisibilityKeywordSelection,
  isValidVisibilityKeyword,
  VISIBILITY_KEYWORD_MAX_LENGTH,
} from '@/lib/utils/visibility-keywords';
import { AiVisibilityResponseBody } from '@/components/features/dashboard/ai-visibility-response';
import { buildAiVisibilityImprovements } from '@/lib/utils/ai-visibility-improvements';

const KEYWORD_CHIP_PREVIEW_COUNT = 7;

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
  onCheckAiVisibility: (keywordOverride?: string) => Promise<void>;
  onGoToKeywords: () => void;
  remainingAiVisibilityChecks: number;
  aiVisibilityChecksLimit: number;
  fetchAISuggestion?: (
    element: string,
    currentValue: string,
    status: 'good' | 'warning' | 'bad',
    issue?: string
  ) => void;
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
  remainingAiVisibilityChecks,
  aiVisibilityChecksLimit,
  fetchAISuggestion,
}: AiVisibilityTabProps) {
  const [checkMessageIndex, setCheckMessageIndex] = useState(0);
  const [customKeywordInput, setCustomKeywordInput] = useState('');
  const [showAllKeywords, setShowAllKeywords] = useState(false);
  const keywordOptions = getVisibilityKeywordOptions(result);
  const hasKeywords = hasKeywordsForAiVisibility(result);
  const selectedKeyword = resolveVisibilityKeywordSelection(aiVisibilityKeyword, keywordOptions);
  const isCustomKeyword =
    !!selectedKeyword && !keywordOptions.includes(selectedKeyword);
  const canApplyCustomKeyword = isValidVisibilityKeyword(customKeywordInput);
  const customInputTooShort =
    customKeywordInput.trim().length > 0 && !canApplyCustomKeyword;
  const visibleKeywordOptions = showAllKeywords
    ? keywordOptions
    : keywordOptions.slice(0, KEYWORD_CHIP_PREVIEW_COUNT);
  const hiddenKeywordCount = Math.max(0, keywordOptions.length - KEYWORD_CHIP_PREVIEW_COUNT);
  const keywordOptionsKey = keywordOptions.join('\0');

  const applyCustomKeyword = () => {
    const normalized = normalizeVisibilityKeyword(customKeywordInput);
    if (!isValidVisibilityKeyword(normalized)) return;
    setAiVisibilityKeyword(normalized);
    setCustomKeywordInput(normalized);
  };

  const selectAnalysisKeyword = (keyword: string) => {
    setAiVisibilityKeyword(keyword);
    setCustomKeywordInput('');
  };

  // Synk input kun når valgt nøkkelord endres utenfra (f.eks. ved innlasting) – ikke på hver render.
  useEffect(() => {
    const stored = aiVisibilityKeyword ? normalizeVisibilityKeyword(aiVisibilityKeyword) : '';
    if (!stored || !isValidVisibilityKeyword(stored)) {
      setCustomKeywordInput('');
      return;
    }
    if (!keywordOptions.includes(stored)) {
      setCustomKeywordInput(stored);
    } else {
      setCustomKeywordInput('');
    }
  }, [aiVisibilityKeyword, keywordOptionsKey]);

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
      <div className="p-3 max-[400px]:p-2 min-[401px]:p-4 sm:p-6 border-b border-neutral-100">
        <h3 className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-neutral-100 text-neutral-900 text-xs sm:text-sm font-medium mb-1.5">
          <Eye className="h-3.5 w-3.5 text-neutral-600" />
          AI-synlighet
        </h3>
          <p className="text-[10px] sm:text-sm text-neutral-600 leading-relaxed">
            Vi sjekker om AI (som ChatGPT) kjenner bedriften din når noen spør om tjenester innen et{' '}
            <span className="font-medium text-neutral-700">bransjenøkkelord</span> – for eksempel hva dere
            tilbyr, som «digital markedsføring» eller «regnskap». Du velger nøkkelordet, så tester vi om AI
            anbefaler dere uoppfordret, kjenner dere når dere navngis, og finner nettsiden deres.
          </p>
          <p className="text-[10px] sm:text-xs text-neutral-400 mt-1.5 leading-relaxed">
            Basert på OpenAI med live websøk i Norge. ChatGPT-appen kan gi andre svar (kart og lister).
          </p>
          {isPremium && aiVisibilityChecksLimit > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-2.5 text-[10px] sm:text-xs">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                <strong className="text-neutral-900">
                  {remainingAiVisibilityChecks}/{aiVisibilityChecksLimit}
                </strong>{' '}
                sjekker igjen denne måneden
              </span>
            </div>
          )}
      </div>

      {isPremium && (
        <div className="px-3 max-[400px]:px-2 min-[401px]:px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-100 bg-white">
          <p className="text-xs sm:text-sm font-medium text-neutral-900 mb-1">Bransjenøkkelord</p>
          <p className="text-[10px] sm:text-xs text-neutral-500 mb-2.5 leading-relaxed">
            Skriv inn et ord eller en kort setning som beskriver hva bedriften tilbyr. Sjekken bruker dette
            når den spør AI om anbefalinger i bransjen – uten å nevne bedriften din først.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={customKeywordInput}
              onChange={(e) => setCustomKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canApplyCustomKeyword) {
                  e.preventDefault();
                  applyCustomKeyword();
                }
              }}
              disabled={checkingAiVisibility}
              placeholder="f.eks. webløsninger og marketing"
              maxLength={VISIBILITY_KEYWORD_MAX_LENGTH}
              aria-invalid={customInputTooShort}
              className={`h-9 rounded-lg bg-white text-sm flex-1 ${
                isCustomKeyword ? 'border-neutral-900 ring-1 ring-neutral-900/20' : ''
              }`}
              aria-label="Bransjenøkkelord"
            />
            <Button
              type="button"
              onClick={applyCustomKeyword}
              disabled={checkingAiVisibility || !canApplyCustomKeyword}
              className="shrink-0 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white h-9"
            >
              Bruk nøkkelord
            </Button>
          </div>
          {customInputTooShort && (
            <p className="text-[10px] text-amber-700 mt-1.5">Bruk minst 2 tegn.</p>
          )}

          {hasKeywords && (
            <div className="mt-4 pt-4 border-t border-neutral-100">
              <p className="text-[10px] sm:text-xs font-medium text-neutral-500 mb-2">
                Forslag fra SEO-analysen
              </p>
              <div className="flex flex-wrap gap-1.5">
                {visibleKeywordOptions.map((keyword) => {
                  const active = keyword === selectedKeyword && !isCustomKeyword;
                  return (
                    <button
                      key={keyword}
                      type="button"
                      onClick={() => selectAnalysisKeyword(keyword)}
                      disabled={checkingAiVisibility}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                        active
                          ? 'bg-neutral-200 text-neutral-900 border-neutral-300'
                          : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:text-neutral-800'
                      } disabled:opacity-50`}
                    >
                      <Tag className="h-3 w-3 shrink-0 opacity-60" />
                      {keyword}
                    </button>
                  );
                })}
                {hiddenKeywordCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAllKeywords((prev) => !prev)}
                    disabled={checkingAiVisibility}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border border-dashed border-neutral-300 text-neutral-500 hover:text-neutral-800 hover:border-neutral-400 transition-colors disabled:opacity-50"
                  >
                    {showAllKeywords ? 'Vis færre' : `Vis ${hiddenKeywordCount} flere`}
                  </button>
                )}
              </div>
            </div>
          )}

          {!hasKeywords && (
            <p className="text-[10px] text-neutral-400 mt-3">
              Ingen forslag fra analysen ennå –{' '}
              <button
                type="button"
                onClick={onGoToKeywords}
                className="text-neutral-600 underline underline-offset-2 hover:text-neutral-900"
              >
                legg til under SEO / Nøkkelord
              </button>
              .
            </p>
          )}
        </div>
      )}

      {isPremium && (
        <div className="px-3 max-[400px]:px-2 min-[401px]:px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-100 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-[10px] sm:text-xs text-neutral-500 leading-relaxed">
            Du tester ett bransjenøkkelord om gangen. Vil du sjekke et annet område? Bytt nøkkelord og kjør
            sjekken på nytt.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto sm:justify-end">
            {selectedKeyword && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium min-w-0 ${
                  isCustomKeyword
                    ? 'bg-white border-neutral-900 text-neutral-900'
                    : 'bg-white border-neutral-200 text-neutral-700'
                }`}
              >
                <Tag className="h-3 w-3 shrink-0 opacity-70" />
                <span className="truncate">{selectedKeyword}</span>
                {isCustomKeyword && (
                  <span className="text-[10px] font-normal text-neutral-400 shrink-0">eget</span>
                )}
              </span>
            )}
            <Button
              onClick={() => void onCheckAiVisibility(selectedKeyword ?? undefined)}
              disabled={checkingAiVisibility || !selectedKeyword || remainingAiVisibilityChecks <= 0}
              className="w-full sm:w-auto shrink-0 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white disabled:opacity-70"
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
          </div>
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
                  <h4 className="text-sm sm:text-base font-semibold text-amber-700">AI-synlighet er en Pluss-funksjon</h4>
                  <p className="text-xs sm:text-sm text-neutral-700 mt-1">
                    Med Pluss eller Premium får du full rapport om hvordan OpenAI ChatGPT ser og anbefaler bedriften din.
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
                  Få Pluss – AI-synlighet inkludert
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
            const levelColor =
              visData.level === 'high'
                ? 'text-green-600'
                : visData.level === 'medium'
                  ? 'text-amber-700'
                  : 'text-red-600';
            const levelBg =
              visData.level === 'high'
                ? 'bg-green-50'
                : visData.level === 'medium'
                  ? 'bg-amber-50'
                  : 'bg-red-50';
            const levelLabel =
              visData.level === 'high'
                ? 'God AI-synlighet'
                : visData.level === 'medium'
                  ? 'Moderat AI-synlighet'
                  : visData.level === 'low'
                    ? 'Lav AI-synlighet'
                    : 'Ikke synlig i AI-søk';
            const improvements = buildAiVisibilityImprovements(visData, result);
            const isHighLevel = visData.level === 'high';

            return (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <div className="lg:col-span-5 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div
                        className={`w-24 h-24 sm:w-28 sm:h-28 mx-auto sm:mx-0 shrink-0 rounded-full flex items-center justify-center ${levelBg}`}
                      >
                        <div className="text-center">
                          <span className={`text-3xl sm:text-4xl font-bold tabular-nums ${levelColor}`}>
                            {visData.score}
                          </span>
                          <span className="text-sm text-neutral-400">/100</span>
                          {visData.details.scoreStability &&
                            visData.details.scoreStability.maxScore >
                              visData.details.scoreStability.minScore && (
                              <p className="text-[10px] text-neutral-500 mt-1">
                                Sannsynlig spenn: {visData.details.scoreStability.minScore}–
                                {visData.details.scoreStability.maxScore} / 100
                              </p>
                            )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 text-center sm:text-left">
                        <h4 className={`font-semibold ${levelColor}`}>{levelLabel}</h4>
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
                            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5 mt-3">
                              Resultatet er for «{visData.focusKeyword}». Du har valgt «{selectedKeyword}» – kjør ny sjekk for å oppdatere.
                            </p>
                          )}
                      </div>
                    </div>
                    {(visData.recommendationScore !== undefined || visData.knowledgeScore !== undefined || visData.discoveryScore !== undefined) && (
                      <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 w-full">
                        {visData.recommendationScore !== undefined && (
                          <div className="min-w-0 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-center sm:text-left">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                              Anbefaling
                            </p>
                            <p className="text-lg font-bold text-neutral-900 tabular-nums">
                              {visData.recommendationScore}
                              <span className="text-xs font-normal text-neutral-400">/100</span>
                            </p>
                            <p className="text-[10px] text-neutral-500 mt-0.5">Uoppfordret</p>
                          </div>
                        )}
                        {visData.knowledgeScore !== undefined && (
                          <div className="min-w-0 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-center sm:text-left">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                              Kjennskap
                            </p>
                            <p className="text-lg font-bold text-neutral-900 tabular-nums">
                              {visData.knowledgeScore}
                              <span className="text-xs font-normal text-neutral-400">/100</span>
                            </p>
                            <p className="text-[10px] text-neutral-500 mt-0.5">Navngitt</p>
                          </div>
                        )}
                        {visData.discoveryScore !== undefined && (
                          <div className="min-w-0 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-center sm:text-left">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                              Oppdagelse
                            </p>
                            <p className="text-lg font-bold text-neutral-900 tabular-nums">
                              {visData.discoveryScore}
                              <span className="text-xs font-normal text-neutral-400">/100</span>
                            </p>
                            <p className="text-[10px] text-neutral-500 mt-0.5">Søkbar</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-3 rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100">
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-neutral-600">Spørsmål i score</span>
                      <span className="text-lg font-semibold text-neutral-900">{visData.details.queriesTested}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-neutral-600">Positive treff</span>
                      <span className="text-lg font-semibold text-green-600">{visData.details.timesCited}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-neutral-600">Usikre treff</span>
                      <span className="text-lg font-semibold text-amber-700">{visData.details.timesMentioned}</span>
                    </div>
                    {(visData.details.webSearchCount !== undefined || visData.details.estimatedCount !== undefined) && (
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm text-neutral-600">Live / estimert</span>
                        <span className="text-sm font-semibold text-neutral-700 tabular-nums">
                          {visData.details.webSearchCount ?? 0} / {visData.details.estimatedCount ?? 0}
                        </span>
                      </div>
                    )}
                  </div>

                  {improvements.length > 0 && (
                    <div
                      className={`lg:col-span-4 rounded-2xl border p-3 sm:p-4 flex flex-col min-h-0 ${
                        isHighLevel ? 'bg-green-50 border-green-200' : 'bg-white border-neutral-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h5
                          className={`font-semibold text-xs sm:text-sm flex items-center gap-1.5 ${
                            isHighLevel ? 'text-green-700' : 'text-neutral-900'
                          }`}
                        >
                          <TrendingUp className={`h-3.5 w-3.5 ${isHighLevel ? 'text-green-600' : 'text-amber-700'}`} />
                          {isHighLevel ? 'Tips for å holde deg på topp' : 'Forbedringer'}
                        </h5>
                        <span className="text-[10px] text-neutral-400 shrink-0">
                          {improvements.length} tiltak
                        </span>
                      </div>
                      {fetchAISuggestion && (
                        <p className="text-[10px] text-neutral-400 mb-2 flex items-center gap-1">
                          <RocketIcon className="w-3 h-3" />
                          Klikk et tiltak for konkret AI-forslag
                        </p>
                      )}
                      <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto pr-0.5">
                        {improvements.map((item) => {
                          const clickable = !!fetchAISuggestion;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={
                                clickable
                                  ? () =>
                                      fetchAISuggestion!(
                                        item.label,
                                        item.desc,
                                        item.status,
                                        `AI-synlighet: ${item.issue}`
                                      )
                                  : undefined
                              }
                              disabled={!clickable}
                              className={`inline-flex items-center gap-1.5 p-2 rounded-lg text-left w-full transition-colors ${
                                clickable
                                  ? 'bg-neutral-50 hover:bg-neutral-100 cursor-pointer group'
                                  : 'bg-neutral-50 cursor-not-allowed opacity-70'
                              }`}
                            >
                              <div
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  item.priority === 'high'
                                    ? 'bg-red-400'
                                    : item.priority === 'medium'
                                      ? 'bg-amber-400'
                                      : 'bg-green-600'
                                }`}
                              />
                              <span className="font-medium text-[10px] sm:text-xs text-neutral-900 shrink-0">
                                {item.label}
                              </span>
                              <span className="text-neutral-300 text-[10px] shrink-0">·</span>
                              <span className="text-[10px] sm:text-xs text-neutral-500 min-w-0 truncate flex-1">
                                {item.desc}
                              </span>
                              {clickable && (
                                <ChevronRight className="w-3 h-3 text-neutral-400 group-hover:text-neutral-600 shrink-0 transition-colors" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  {!result.keywordResearch?.length && (
                    <div className="mb-4 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                      <p className="text-xs text-neutral-600">
                        {isCustomKeyword
                          ? 'Du tester med eget bransjenøkkelord. Legg til nøkkelord under Nøkkelord-fanen for flere forslag å velge mellom.'
                          : 'Skriv et bransjenøkkelord over, eller legg til nøkkelord under Nøkkelord-fanen for forslag fra analysen.'}
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
                      Nøytrale spørsmål nevner ikke bedriften – navngitte gjør det. Estimerte svar telles ikke i hovedscore.
                    </p>
                  </div>
                  <Accordion type="single" collapsible className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                              <div className="flex flex-wrap items-center gap-1 mb-1">
                                {q.type && (
                                  <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 font-medium">
                                    {q.type === 'unprompted' ? 'Nøytralt' : q.type === 'discovery' ? 'Oppdagelse' : 'Navngitt'}
                                  </span>
                                )}
                                {q.estimated && (
                                  <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                                    Estimert
                                  </span>
                                )}
                                {q.usedWebSearch && (
                                  <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                                    Live søk
                                  </span>
                                )}
                                {q.scored === false && (
                                  <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-600 font-medium">
                                    Ikke i score
                                  </span>
                                )}
                              </div>
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
                              <AiVisibilityResponseBody text={q.aiResponse} />
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

          const hasStructuredData = !!result.seoResults.structuredData?.hasAny;
          const hasOpenGraph = !!(result.seoResults.meta.ogTags.title || result.seoResults.meta.ogTags.description);
          const hasGoodContent = result.contentResults.wordCount >= 300;
          const hasMetaDescription = !!result.seoResults.meta.description.content;
          const hasProperHeadings = result.seoResults.headings.h1.count === 1 && result.seoResults.headings.h2.count > 0;
          const hasAltTexts = result.seoResults.images.total === 0 || result.seoResults.images.withoutAlt === 0;

          const factors = [
            { name: 'Strukturert data (Schema.org)', pass: hasStructuredData, tip: 'Legg til JSON-LD (f.eks. Organization) så AI forstår bedriften' },
            { name: 'Strukturert innhold', pass: hasProperHeadings, tip: 'Bruk tydelige overskrifter (H1, H2)' },
            { name: 'Meta-beskrivelse', pass: hasMetaDescription, tip: 'Legg til beskrivende meta-tekst' },
            { name: 'Innholdsmengde', pass: hasGoodContent, tip: 'Minimum 300 ord anbefales' },
            { name: 'Open Graph data', pass: hasOpenGraph, tip: 'Legg til OG-tags for deling' },
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
