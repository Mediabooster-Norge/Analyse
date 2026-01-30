'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Globe,
  Search,
  Shield,
  FileText,
  Eye,
  Sparkles,
  BarChart3,
  Tag,
  X,
  Loader2,
  CheckCircle2,
  Clock,
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
  suggestedKeywordCount: number;
  setSuggestedKeywordCount: (n: number) => void;
  suggestingKeywords: boolean;
  suggestKeywords: () => void;
  FREE_COMPETITOR_LIMIT: number;
  FREE_KEYWORD_LIMIT: number;
  onRunAnalysis: () => void;
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
  suggestedKeywordCount,
  setSuggestedKeywordCount,
  suggestingKeywords,
  suggestKeywords,
  FREE_COMPETITOR_LIMIT,
  FREE_KEYWORD_LIMIT,
  onRunAnalysis,
}: AnalysisDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl min-h-[75vh] max-h-[92vh] overflow-y-auto p-0">
        {analyzing ? (
          <>
            <div className="px-6 pt-6 pb-2">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-neutral-900 flex items-center justify-center shrink-0">
                  {(() => {
                    const StepIcon = analysisSteps[analysisStep]?.icon || Loader2;
                    return (
                      <StepIcon className="h-5 w-5 text-white text-neutral-200 opacity-90 motion-safe:animate-[pulse_2.5s_ease-in-out_infinite]" />
                    );
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <DialogHeader className="p-0 space-y-0.5">
                    <DialogTitle className="text-lg font-semibold text-neutral-900">Analyse pågår</DialogTitle>
                    <DialogDescription className="text-sm text-neutral-500">
                      {analysisSteps[analysisStep]?.label} · SEO, sikkerhet, innhold og AI-synlighet
                    </DialogDescription>
                  </DialogHeader>
                </div>
                <span className="shrink-0 px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-600 text-sm font-medium tabular-nums">
                  {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
            <div className="space-y-6 px-6 pb-6 pt-2">
              <div className="py-3.5 px-4 rounded-xl bg-neutral-50 border border-neutral-100">
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-neutral-400 shrink-0" />
                  <span className="text-sm font-medium text-neutral-800 truncate">{companyUrl || url || '—'}</span>
                </div>
              </div>
              <div className="flex items-center gap-5 py-4 px-4 rounded-xl bg-neutral-50/80 border border-neutral-100">
                <div className="relative w-12 h-12 shrink-0">
                  <div className="absolute inset-0 rounded-full border-2 border-neutral-200" />
                  <svg className="absolute inset-0 w-12 h-12 -rotate-90 text-neutral-800" viewBox="0 0 48 48" aria-hidden>
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      className="transition-[stroke-dasharray] duration-700 ease-out"
                      strokeDasharray={`${((analysisStep + 1) / analysisSteps.length) * 125.6} 125.6`}
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900">{analysisSteps[analysisStep]?.label}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{analysisSteps[analysisStep]?.description}</p>
                </div>
              </div>
              <div className="rounded-xl border border-neutral-100 overflow-hidden bg-white">
                <div className="relative py-1">
                  <div className="absolute left-[19px] top-2 bottom-2 w-px bg-neutral-100" />
                  <div
                    className="absolute left-[19px] top-2 w-px bg-neutral-300 transition-[height] duration-700 ease-out"
                    style={{ height: `${(analysisStep / Math.max(1, analysisSteps.length - 1)) * 100}%` }}
                  />
                  <div className="divide-y divide-neutral-50">
                    {analysisSteps.map((step, index) => {
                      const StepIcon = step.icon;
                      const isComplete = index < analysisStep;
                      const isCurrent = index === analysisStep;
                      const isPending = index > analysisStep;
                      return (
                        <div
                          key={index}
                          className={`relative flex items-center gap-4 px-4 py-3.5 transition-colors duration-300 ${isCurrent ? 'bg-neutral-50/70' : ''}`}
                        >
                          <div
                            className={`relative z-10 w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300 ${
                              isComplete ? 'bg-neutral-800' : isCurrent ? 'bg-neutral-900' : 'bg-neutral-100'
                            }`}
                          >
                            {isComplete ? (
                              <CheckCircle2 className="h-4 w-4 text-white" />
                            ) : isCurrent ? (
                              <StepIcon className="h-4 w-4 text-white/95 motion-safe:animate-[pulse_2.5s_ease-in-out_infinite]" />
                            ) : (
                              <StepIcon className={`h-4 w-4 ${isPending ? 'text-neutral-300' : 'text-neutral-500'}`} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium ${isComplete ? 'text-neutral-600' : isCurrent ? 'text-neutral-900' : 'text-neutral-400'}`}
                            >
                              {step.label}
                            </p>
                            <p className="text-xs text-neutral-400 mt-0.5">{step.description}</p>
                          </div>
                          <span className="text-xs font-medium text-neutral-400 tabular-nums shrink-0">
                            {isComplete ? '✓' : step.duration}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="py-3.5 px-4 rounded-xl bg-neutral-50/80 border border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                    <Clock className="h-3.5 w-3.5 text-neutral-500" />
                  </div>
                  <p className="text-sm text-neutral-600">
                    <span className="font-medium text-neutral-800">Analysen kjører.</span> Vanligvis ferdig under ett minutt.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="p-6 pb-0">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-700 flex items-center justify-center">
                  <Search className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogHeader className="p-0 space-y-0">
                    <DialogTitle className="text-lg">Start nettside-analyse</DialogTitle>
                    <DialogDescription className="text-sm">SEO, sikkerhet, innhold og AI-synlighet</DialogDescription>
                  </DialogHeader>
                </div>
              </div>
            </div>
            <div className="space-y-5 p-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="url" className="text-sm font-medium text-neutral-700">Nettside URL</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <Input
                    id="url"
                    placeholder="https://dinbedrift.no"
                    value={url || companyUrl || ''}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-11 h-12 rounded-xl border-neutral-200"
                  />
                </div>
                {companyUrl && url !== companyUrl && (
                  <button
                    type="button"
                    onClick={() => setUrl(companyUrl)}
                    className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
                  >
                    ← Tilbake til {companyName || new URL(companyUrl).hostname}
                  </button>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl bg-neutral-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="competitor" className="text-sm font-medium text-neutral-700">
                      Sammenlign med konkurrenter
                    </Label>
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-neutral-900 text-xs font-medium">
                      {competitorUrls.length}/{FREE_COMPETITOR_LIMIT}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <BarChart3 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <Input
                        id="competitor"
                        placeholder="konkurrent.no"
                        value={competitorInput}
                        onChange={(e) => setCompetitorInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCompetitor();
                          }
                        }}
                        className="pl-11 h-11 rounded-xl border-neutral-200 bg-white"
                        disabled={competitorUrls.length >= FREE_COMPETITOR_LIMIT}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addCompetitor}
                      disabled={competitorUrls.length >= FREE_COMPETITOR_LIMIT || !competitorInput.trim()}
                      className="h-11 px-4 rounded-xl border-neutral-200 bg-white"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {competitorUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                      {competitorUrls.map((competitor) => (
                        <span
                          key={competitor}
                          className="px-3 py-1.5 rounded-full bg-white text-neutral-700 text-sm font-medium border border-neutral-200 cursor-pointer hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors group flex items-center gap-1.5 shrink-0"
                          onClick={() => removeCompetitor(competitor)}
                        >
                          {new URL(competitor).hostname}
                          <X className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100" />
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-4 rounded-xl bg-neutral-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-neutral-700">Nøkkelord for analyse</Label>
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-neutral-900 text-xs font-medium">
                      {keywords.length}/{FREE_KEYWORD_LIMIT}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
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
                        className="pl-11 h-11 rounded-xl border-neutral-200 bg-white"
                        disabled={keywords.length >= FREE_KEYWORD_LIMIT}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addKeyword}
                      disabled={keywords.length >= FREE_KEYWORD_LIMIT || !keywordInput.trim()}
                      className="h-11 px-4 rounded-xl border-neutral-200 bg-white"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {(() => {
                    const keywordCountOptions = [10, 20, 30, 50].filter((n) => n <= FREE_KEYWORD_LIMIT);
                    const maxAllowed = keywordCountOptions.length ? Math.max(...keywordCountOptions) : 10;
                    const displayCount = keywordCountOptions.includes(suggestedKeywordCount) ? suggestedKeywordCount : maxAllowed;
                    return (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <Label className="text-sm text-neutral-600 shrink-0">Antall å foreslå:</Label>
                        <select
                          value={displayCount}
                          onChange={(e) => setSuggestedKeywordCount(Number(e.target.value))}
                          className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-400 max-w-[100px]"
                        >
                          {keywordCountOptions.map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={suggestKeywords}
                    disabled={suggestingKeywords || keywords.length >= FREE_KEYWORD_LIMIT}
                    className="w-full h-10 rounded-xl border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100"
                  >
                    {suggestingKeywords ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Henter forslag...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Foreslå nøkkelord ({Math.min(suggestedKeywordCount, FREE_KEYWORD_LIMIT)} stk)
                      </>
                    )}
                  </Button>
                  {keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                      {keywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="px-3 py-1.5 rounded-full bg-white text-neutral-700 text-sm font-medium border border-neutral-200 cursor-pointer hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors group flex items-center gap-1.5 shrink-0"
                          onClick={() => removeKeyword(keyword)}
                        >
                          {keyword}
                          <X className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100" />
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 pt-2">
                {[
                  { icon: Search, label: 'SEO' },
                  { icon: Shield, label: 'Sikkerhet' },
                  { icon: FileText, label: 'Innhold' },
                  { icon: Eye, label: 'AI-søk' },
                  { icon: Sparkles, label: 'AI-tips' },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-neutral-50">
                    <item.icon className="h-4 w-4 text-neutral-600" />
                    <span className="text-[10px] text-neutral-500 font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
              <Button
                onClick={onRunAnalysis}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-neutral-900 to-neutral-800 hover:from-neutral-800 hover:to-neutral-700 text-white font-medium shadow-lg shadow-neutral-900/20 transition-all hover:shadow-xl hover:shadow-neutral-900/30"
                disabled={!url}
              >
                <Search className="mr-2 h-5 w-5" />
                Start analyse
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
