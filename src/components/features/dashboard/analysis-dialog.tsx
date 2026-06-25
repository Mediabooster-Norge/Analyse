'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Globe,
  Search,
  Tag,
  X,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { RocketIcon } from './rocket-icon';
import { AnalysisProgressView } from './analysis-progress-view';
import { ANALYSIS_STEPS, ANALYSIS_STEP_INDEX } from './analysis-steps';
import type { AnalysisStepConfig } from './analysis-steps';

export type { AnalysisStepConfig, AnalysisStepId } from './analysis-steps';
export { ANALYSIS_STEPS, ANALYSIS_STEP_INDEX, ANALYSIS_MAIN_PHASE_LAST_INDEX, GUEST_ANALYSIS_STEPS, getAnalysisStepIndex } from './analysis-steps';

export interface AnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  analyzing: boolean;
  analysisStep: number;
  analysisSteps: AnalysisStepConfig[];
  elapsedTime: number;
  url: string;
  setUrl: (url: string) => void;
  companyUrl: string | null;
  companyName: string | null;
  competitorUrls: string[];
  competitorInput: string;
  setCompetitorInput: (v: string) => void;
  addCompetitor: () => void;
  removeCompetitor: (url: string) => void;
  keywords: string[];
  keywordInput: string;
  setKeywordInput: (v: string) => void;
  addKeyword: () => void;
  removeKeyword: (keyword: string) => void;
  clearKeywords: () => void;
  suggestedKeywordCount: number;
  setSuggestedKeywordCount: (n: number) => void;
  suggestingKeywords: boolean;
  suggestKeywords: () => void;
  FREE_COMPETITOR_LIMIT: number;
  FREE_KEYWORD_LIMIT: number;
  onRunAnalysis: () => void;
  /** True mens hastighet (PageSpeed) hentes i eget kall – viser «Måler hastighet» og holder modalen åpen */
  loadingPageSpeed?: boolean;
  /** True mens konkurrenter hentes (ett API-kall per konkurrent) */
  loadingCompetitors?: boolean;
  competitorProgress?: { current: number; total: number } | null;
  /** Subpage mode: hides competitors, shows simplified header */
  isSubpageMode?: boolean;
}

export function AnalysisDialog({
  open,
  onOpenChange,
  trigger,
  analyzing,
  analysisStep,
  analysisSteps,
  elapsedTime,
  url,
  setUrl,
  companyUrl,
  companyName,
  competitorUrls,
  competitorInput,
  setCompetitorInput,
  addCompetitor,
  removeCompetitor,
  keywords,
  keywordInput,
  setKeywordInput,
  addKeyword,
  removeKeyword,
  clearKeywords,
  suggestedKeywordCount,
  setSuggestedKeywordCount,
  suggestingKeywords,
  suggestKeywords,
  FREE_COMPETITOR_LIMIT,
  FREE_KEYWORD_LIMIT,
  onRunAnalysis,
  loadingPageSpeed = false,
  loadingCompetitors = false,
  competitorProgress = null,
  isSubpageMode = false,
}: AnalysisDialogProps) {
  const showPageSpeedStep = analyzing && loadingPageSpeed && !loadingCompetitors;
  const showCompetitorsStep = analyzing && loadingCompetitors;
  const isMainAnalyzePhase = analyzing && !loadingPageSpeed && !loadingCompetitors;
  const effectiveStep = showCompetitorsStep ? ANALYSIS_STEP_INDEX.competitors : analysisStep;

  const showStepLabel = showCompetitorsStep && competitorProgress
    ? `Analyserer konkurrent ${competitorProgress.current}`
    : showCompetitorsStep
      ? 'Henter konkurrenter'
      : showPageSpeedStep
        ? analysisStep >= ANALYSIS_STEP_INDEX.accessibility
          ? 'Sjekker tilgjengelighet (WCAG)'
          : 'Måler hastighet (PageSpeed)'
        : analysisSteps[analysisStep]?.label;
  const showStepDesc = showCompetitorsStep && competitorProgress
    ? (competitorProgress.current < competitorProgress.total
        ? `Neste: konkurrent ${competitorProgress.current + 1} av ${competitorProgress.total}`
        : `Konkurrent ${competitorProgress.current} av ${competitorProgress.total}`)
    : showCompetitorsStep
      ? 'Laster inn konkurrentanalyser'
      : showPageSpeedStep
        ? analysisStep >= ANALYSIS_STEP_INDEX.accessibility
          ? 'Parser Lighthouse WCAG-funn og tilgjengelighetsscore'
          : 'Henter ytelsesdata fra Google PageSpeed Insights'
        : isMainAnalyzePhase
          ? 'Vennligst vent'
          : analysisSteps[analysisStep]?.description;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 mx-1 max-[400px]:mx-1 min-[401px]:mx-2 sm:mx-auto rounded-xl w-[calc(100vw-0.5rem)] max-[400px]:w-[calc(100vw-0.5rem)] min-[401px]:w-[calc(100vw-1rem)] sm:w-full max-w-[95vw]">
        {analyzing ? (
          <>
            <VisuallyHidden.Root asChild>
              <DialogTitle>Analyserer nettside</DialogTitle>
            </VisuallyHidden.Root>
            <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6">
              <AnalysisProgressView
                analysisSteps={analysisSteps}
                effectiveStep={effectiveStep}
                elapsedTime={elapsedTime}
                showStepLabel={showStepLabel ?? 'Analyserer'}
                showStepDesc={showStepDesc}
                asyncCurrentStep={showPageSpeedStep || showCompetitorsStep}
                resolveStepLabel={(step, _index, isCurrent) => {
                  if (!isCurrent) return step.label;
                  if (showCompetitorsStep && step.id === 'competitors') return showStepLabel ?? step.label;
                  if (showPageSpeedStep && step.id === 'pagespeed') return 'Måler hastighet (PageSpeed)';
                  if (showPageSpeedStep && step.id === 'accessibility') return 'Sjekker tilgjengelighet (WCAG)';
                  return step.label;
                }}
              />
            </div>
          </>
        ) : (
          <>
            <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-2 sm:pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-lg bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center shrink-0">
                  <Search className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <DialogHeader className="p-0 space-y-0">
                    <DialogTitle className="text-sm sm:text-base">
                      {isSubpageMode ? 'Analyser underside' : 'Start nettside-analyse'}
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      {isSubpageMode ? 'SEO og innhold for denne siden' : 'SEO, sikkerhet og innhold'}
                    </DialogDescription>
                  </DialogHeader>
                </div>
              </div>
            </div>
            <div className="space-y-3 sm:space-y-4 px-4 sm:px-5 pb-4 sm:pb-5">
              {/* URL input – alltid først */}
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  id="url"
                  placeholder="dinbedrift.no"
                  value={isSubpageMode ? (url || companyUrl || '') : url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-10 h-10 rounded-lg border-neutral-200 text-sm"
                />
              </div>

              {/* Competitors – under vår hoved-URL, nøytral styling */}
              <div className="p-3 rounded-lg bg-neutral-50 space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="competitor" className="text-sm font-medium text-neutral-700">
                    {isSubpageMode ? 'Legg til konkurrenter med tilsvarende side (valgfritt)' : 'Sammenlign med konkurrenter (valgfritt)'}
                  </Label>
                  <span className="px-1.5 py-0.5 rounded-full bg-neutral-900/10 text-neutral-900 text-[10px] font-medium">
                    {competitorUrls.length}/{FREE_COMPETITOR_LIMIT}
                  </span>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <BarChart3 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input
                      id="competitor"
                      placeholder={isSubpageMode ? 'konkurrent.no/tjenester/...' : 'konkurrent.no'}
                      value={competitorInput}
                      onChange={(e) => setCompetitorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCompetitor();
                        }
                      }}
                      className="pl-9 h-9 rounded-lg border-neutral-200 bg-white text-sm"
                      disabled={competitorUrls.length >= FREE_COMPETITOR_LIMIT}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCompetitor}
                    disabled={competitorUrls.length >= FREE_COMPETITOR_LIMIT || !competitorInput.trim()}
                    className="h-9 px-3 rounded-lg border-neutral-200 bg-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {competitorUrls.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {competitorUrls.map((competitor) => (
                      <span
                        key={competitor}
                        className="px-2 py-1 rounded-md bg-white text-neutral-700 text-xs font-medium border border-neutral-200 cursor-pointer hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors group flex items-center gap-1"
                        onClick={() => removeCompetitor(competitor)}
                      >
                        {(() => {
                          try {
                            const parsed = new URL(competitor);
                            return parsed.pathname !== '/' ? `${parsed.hostname}${parsed.pathname}` : parsed.hostname;
                          } catch {
                            return competitor;
                          }
                        })()}
                        <X className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Keywords section */}
              <div className="p-4 rounded-xl bg-neutral-50 space-y-3 flex-1">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-neutral-700">Nøkkelord for analyse <span className="font-normal text-neutral-500">(valgfritt)</span></Label>
                  <div className="flex items-center gap-2">
                    {keywords.length > 0 && (
                      <button
                        type="button"
                        onClick={clearKeywords}
                        className="text-xs text-neutral-500 hover:text-red-600 transition-colors"
                      >
                        Fjern alle
                      </button>
                    )}
                    <span className="px-2 py-0.5 rounded-full bg-neutral-900/10 text-neutral-900 text-xs font-medium">
                      {keywords.length}/{FREE_KEYWORD_LIMIT}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input
                      placeholder="Skriv nøkkelord og trykk Enter..."
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addKeyword();
                        }
                      }}
                      className="pl-10 h-10 rounded-lg border-neutral-200 bg-white text-sm"
                      disabled={keywords.length >= FREE_KEYWORD_LIMIT}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addKeyword}
                    disabled={keywords.length >= FREE_KEYWORD_LIMIT || !keywordInput.trim()}
                    className="h-10 px-4 rounded-lg border-neutral-200 bg-white"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {/* Suggest keywords */}
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={suggestKeywords}
                    disabled={suggestingKeywords || keywords.length >= FREE_KEYWORD_LIMIT}
                    className="h-9 px-4 rounded-lg border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 text-sm"
                  >
                    {suggestingKeywords ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Henter forslag...
                      </>
                    ) : (
                      <>
                        <RocketIcon className="mr-2 h-4 w-4" />
                        Foreslå nøkkelord
                      </>
                    )}
                  </Button>
                  {(() => {
                    const keywordCountOptions = [10, 20, 30, 50].filter((n) => n <= FREE_KEYWORD_LIMIT);
                    const maxAllowed = keywordCountOptions.length ? Math.max(...keywordCountOptions) : 10;
                    const displayCount = keywordCountOptions.includes(suggestedKeywordCount) ? suggestedKeywordCount : maxAllowed;
                    return (
                      <select
                        value={displayCount}
                        onChange={(e) => setSuggestedKeywordCount(Number(e.target.value))}
                        className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                      >
                        {keywordCountOptions.map((n) => (
                          <option key={n} value={n}>
                            {n} stk
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                </div>
                {/* Keywords display - compact chips for more visibility */}
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto p-2 -m-1 rounded-lg bg-white border border-neutral-100">
                    {keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-xs font-medium cursor-pointer hover:bg-red-50 hover:text-red-600 transition-colors group flex items-center gap-1 shrink-0"
                        onClick={() => removeKeyword(keyword)}
                      >
                        {keyword}
                        <X className="h-3 w-3 opacity-40 group-hover:opacity-100" />
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={onRunAnalysis}
                className="w-full h-11 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium shadow-lg shadow-neutral-900/20 transition-all hover:shadow-xl hover:shadow-neutral-900/25"
                disabled={!url}
              >
                <Search className="mr-2 h-4 w-4" />
                Start analyse
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
