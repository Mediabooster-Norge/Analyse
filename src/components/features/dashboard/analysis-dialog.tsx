'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Globe,
  Search,
  Sparkles,
  Tag,
  X,
  Loader2,
  CheckCircle2,
  Clock,
  BarChart3,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AnalysisStepConfig {
  label: string;
  description: string;
  duration: string;
  icon: LucideIcon;
}

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
  const showStepLabel = showCompetitorsStep ? 'Henter konkurrenter' : showPageSpeedStep ? 'Måler hastighet (PageSpeed)' : analysisSteps[analysisStep]?.label;
  const showStepDesc = showCompetitorsStep && competitorProgress
    ? `Konkurrent ${competitorProgress.current} av ${competitorProgress.total}`
    : showPageSpeedStep
      ? 'Henter ytelsesdata fra Google PageSpeed Insights'
      : analysisSteps[analysisStep]?.description;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0 mx-1 max-[400px]:mx-1 min-[401px]:mx-2 sm:mx-auto rounded-xl w-[calc(100vw-0.5rem)] max-[400px]:w-[calc(100vw-0.5rem)] min-[401px]:w-[calc(100vw-1rem)] sm:w-full max-w-[95vw]">
        {analyzing ? (
          <>
            {/* Header - simple */}
            <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
              <div className="flex items-center gap-3">
                <div className="relative w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                  <Loader2 className="h-4 sm:h-5 w-4 sm:w-5 text-neutral-600 animate-spin" />
                </div>
                <div className="flex-1 min-w-0">
                  <DialogHeader className="p-0 space-y-0">
                    <DialogTitle className="text-sm sm:text-base font-semibold text-neutral-900">
                      {showCompetitorsStep ? 'Henter konkurrenter' : showPageSpeedStep ? 'Måler hastighet' : 'Analyserer nettside'}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-neutral-500 truncate">
                      {showCompetitorsStep && competitorProgress
                        ? `Konkurrent ${competitorProgress.current} av ${competitorProgress.total}`
                        : showPageSpeedStep
                          ? 'Fullfører PageSpeed-analyse – vanligvis under 1 min'
                          : (url || companyUrl || '—')}
                    </DialogDescription>
                  </DialogHeader>
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
              {/* Current step or PageSpeed step */}
              <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-3 sm:p-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Progress ring - subtle */}
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
                        className="transition-all duration-700 ease-out"
                        strokeDasharray={showPageSpeedStep ? '150.8 150.8' : `${((analysisStep + 1) / analysisSteps.length) * 150.8} 150.8`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-neutral-700 text-xs sm:text-sm font-semibold">
                        {showPageSpeedStep ? '6/6' : `${analysisStep + 1}/${analysisSteps.length}`}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-neutral-900 text-sm sm:text-base font-medium flex items-center gap-2">
                        {showStepLabel}
                        <span className="inline-flex gap-0.5">
                          <span className="w-1 h-1 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1 h-1 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1 h-1 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      </p>
                    </div>
                    <p className="text-neutral-500 text-xs sm:text-sm hidden sm:block">
                      {showStepDesc}
                    </p>
                  </div>

                  {/* Timer - subtle */}
                  <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white border border-neutral-200">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs sm:text-sm font-medium text-neutral-700 tabular-nums">
                      {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Steps list - clean styling */}
              <div className="rounded-xl border border-neutral-200 overflow-hidden bg-white">
                <div className="divide-y divide-neutral-100">
                  {analysisSteps.map((step, index) => {
                    const StepIcon = step.icon;
                    const isComplete = showPageSpeedStep || showCompetitorsStep ? true : index < analysisStep;
                    const isCurrent = showPageSpeedStep || showCompetitorsStep ? false : index === analysisStep;
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-3 px-4 py-2.5 transition-all duration-300 ${
                          isCurrent ? 'bg-neutral-50' : ''
                        }`}
                      >
                        <div
                          className={`relative w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-all duration-300 ${
                            isComplete 
                              ? 'bg-green-100' 
                              : isCurrent 
                                ? 'bg-neutral-200' 
                                : 'bg-neutral-100'
                          }`}
                        >
                          {isComplete ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          ) : isCurrent ? (
                            <>
                              <StepIcon className="h-3.5 w-3.5 text-neutral-700" />
                              <span className="absolute inset-0 rounded-md border border-neutral-300 animate-pulse" />
                            </>
                          ) : (
                            <StepIcon className="h-3.5 w-3.5 text-neutral-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${
                            isComplete ? 'text-green-700 font-medium' : isCurrent ? 'text-neutral-900 font-medium' : 'text-neutral-400'
                          }`}>
                            {step.label}
                          </p>
                        </div>
                        <span className={`text-xs tabular-nums shrink-0 ${
                          isComplete ? 'text-green-600' : isCurrent ? 'text-neutral-600' : 'text-neutral-300'
                        }`}>
                          {isComplete ? '✓' : isCurrent ? 'Pågår' : step.duration}
                        </span>
                      </div>
                    );
                  })}
                  {showPageSpeedStep && (
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-neutral-50">
                      <div className="relative w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-neutral-200">
                        <Loader2 className="h-3.5 w-3.5 text-neutral-700 animate-spin" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900">Måler hastighet (PageSpeed)</p>
                      </div>
                      <span className="text-xs tabular-nums shrink-0 text-neutral-600">Pågår</span>
                    </div>
                  )}
                  {showCompetitorsStep && competitorProgress && (
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-neutral-50">
                      <div className="relative w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-neutral-200">
                        <Loader2 className="h-3.5 w-3.5 text-neutral-700 animate-spin" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900">Henter konkurrenter</p>
                        <p className="text-xs text-neutral-500">Konkurrent {competitorProgress.current} av {competitorProgress.total}</p>
                      </div>
                      <span className="text-xs tabular-nums shrink-0 text-neutral-600">Pågår</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status message */}
              <p className="text-center text-xs text-neutral-400">
                {showPageSpeedStep ? 'Vanligvis under 1 min' : 'Vanligvis rundt 1 min'}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-2 sm:pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-lg bg-gradient-to-br from-neutral-900 to-neutral-700 flex items-center justify-center shrink-0">
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
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <Input
                    id="url"
                    placeholder="https://dinbedrift.no"
                    value={url || companyUrl || ''}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-10 h-10 rounded-lg border-neutral-200 text-sm"
                  />
                </div>
                {!isSubpageMode && companyUrl && url !== companyUrl && (
                  <button
                    type="button"
                    onClick={() => setUrl(companyUrl)}
                    className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors whitespace-nowrap shrink-0"
                  >
                    ← Tilbake
                  </button>
                )}
              </div>

              {/* Competitors – under vår hoved-URL, nøytral styling */}
              <div className="p-3 rounded-lg bg-neutral-50 space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="competitor" className="text-xs font-medium text-neutral-700">
                    {isSubpageMode ? 'Legg til konkurrenter med tilsvarende side (valgfritt)' : 'Sammenlign med konkurrenter (valgfritt)'}
                  </Label>
                  <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-neutral-900 text-[10px] font-medium">
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
                        className="px-2 py-1 rounded-md bg-white text-neutral-700 text-xs font-medium border border-neutral-200 cursor-pointer hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors group flex items-center gap-1"
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
                  <Label className="text-sm font-medium text-neutral-700">Nøkkelord for analyse</Label>
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
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-neutral-900 text-xs font-medium">
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
                        <Sparkles className="mr-2 h-4 w-4" />
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
                        className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-xs font-medium cursor-pointer hover:bg-red-50 hover:text-red-700 transition-colors group flex items-center gap-1 shrink-0"
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
                className="w-full h-11 rounded-lg bg-gradient-to-r from-neutral-900 to-neutral-800 hover:from-neutral-800 hover:to-neutral-700 text-white font-medium shadow-lg shadow-neutral-900/20 transition-all hover:shadow-xl hover:shadow-neutral-900/30"
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
