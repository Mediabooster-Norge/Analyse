'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { AISuggestionData } from '@/types/dashboard';
import { Lightbulb, CheckCircle2, AlertCircle, Sparkles, Zap, Loader2, Copy, Check, ExternalLink, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const loadingSteps = [
  'Leser innholdet ditt',
  'Sammenligner med beste praksis',
  'Finner forbedringsmuligheter',
  'Genererer forslag',
];

export interface AISuggestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedElement: { name: string; value: string; status: 'good' | 'warning' | 'bad'; relatedUrls?: string[] } | null;
  aiSuggestion: AISuggestionData | null;
  loadingSuggestion: boolean;
}

export function AISuggestionDialog({
  open,
  onOpenChange,
  selectedElement,
  aiSuggestion,
  loadingSuggestion,
}: AISuggestionDialogProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Loading step animation
  useEffect(() => {
    if (!loadingSuggestion) {
      setActiveStep(0);
      setElapsed(0);
      return;
    }
    setActiveStep(0);
    setElapsed(0);

    const stepInterval = setInterval(() => {
      setActiveStep((prev) => Math.min(prev + 1, loadingSteps.length - 1));
    }, 2000);

    const timerInterval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(stepInterval);
      clearInterval(timerInterval);
    };
  }, [loadingSuggestion]);

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success('Kopiert til utklippstavle');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Kunne ikke kopiere');
    }
  }, []);

  const statusConfig = {
    good: { bg: 'bg-green-100', icon: <CheckCircle2 className="h-4 w-4 text-green-600" />, label: 'Bra', labelBg: 'bg-green-100 text-green-700' },
    warning: { bg: 'bg-amber-100', icon: <AlertCircle className="h-4 w-4 text-amber-600" />, label: 'Kan forbedres', labelBg: 'bg-amber-100 text-amber-700' },
    bad: { bg: 'bg-red-100', icon: <AlertCircle className="h-4 w-4 text-red-600" />, label: 'Bør fikses', labelBg: 'bg-red-100 text-red-700' },
  };

  const status = selectedElement ? statusConfig[selectedElement.status] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
        {/* Header */}
        <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-neutral-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-violet-600" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-semibold text-neutral-900">
                  AI-forbedringsforslag
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral-500 truncate">
                  {selectedElement?.name || 'Analyserer...'}
                </DialogDescription>
              </div>
            </div>
            {selectedElement && status && (
              <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium ${status.labelBg}`}>
                {status.label}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loadingSuggestion ? (
            <div className="px-5 sm:px-6 py-6 sm:py-8">
              {/* Current element being analyzed */}
              {selectedElement && (
                <div className="mb-6 p-3 rounded-lg bg-neutral-50 border border-neutral-200">
                  <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-1">Analyserer</p>
                  <p className="text-sm font-medium text-neutral-900">{selectedElement.name}</p>
                  {selectedElement.value && (
                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{selectedElement.value}</p>
                  )}
                </div>
              )}

              {/* Steps progress */}
              <div className="space-y-2.5">
                {loadingSteps.map((step, i) => {
                  const isDone = i < activeStep;
                  const isCurrent = i === activeStep;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 ${
                        isCurrent ? 'bg-neutral-50' : ''
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all duration-300 ${
                        isDone ? 'bg-green-100' : isCurrent ? 'bg-neutral-200' : 'bg-neutral-100'
                      }`}>
                        {isDone ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        ) : isCurrent ? (
                          <Loader2 className="h-3.5 w-3.5 text-neutral-600 animate-spin" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                        )}
                      </div>
                      <span className={`text-sm transition-colors duration-300 ${
                        isDone ? 'text-green-700 font-medium' : isCurrent ? 'text-neutral-900 font-medium' : 'text-neutral-400'
                      }`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Timer */}
              <div className="flex items-center justify-center gap-1.5 mt-6">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-medium text-neutral-500 tabular-nums">
                  {elapsed}s
                </span>
              </div>
            </div>
          ) : aiSuggestion ? (
            <div className="px-5 sm:px-6 py-4 sm:py-5 space-y-4">
              {/* Current value */}
              {selectedElement && (
                <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-5 h-5 rounded flex items-center justify-center ${status?.bg}`}>
                      {status?.icon}
                    </div>
                    <p className="text-xs font-medium text-neutral-500">Nåværende: {selectedElement.name}</p>
                  </div>
                  <p className="text-sm text-neutral-700 line-clamp-3">{selectedElement.value || <span className="italic text-neutral-400">Ingen verdi</span>}</p>
                </div>
              )}

              {/* Quick Win - highlighted */}
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-amber-600" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Rask forbedring</p>
                  <button
                    onClick={() => copyToClipboard(aiSuggestion.quickWin, 'quickwin')}
                    className="ml-auto p-1 rounded hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    {copiedId === 'quickwin' ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-amber-500" />
                    )}
                  </button>
                </div>
                <p className="text-sm leading-relaxed text-amber-900">{aiSuggestion.quickWin}</p>
              </div>

              {/* Problem (if any) */}
              {aiSuggestion.problem && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-red-800 mb-0.5">Problem</p>
                    <p className="text-sm text-red-700 leading-relaxed">{aiSuggestion.problem}</p>
                  </div>
                </div>
              )}

              {/* Related URLs */}
              {selectedElement?.relatedUrls && selectedElement.relatedUrls.length > 0 && (
                <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200">
                  <p className="text-xs font-medium text-neutral-500 mb-2">
                    {selectedElement.name.includes('Bilder') ? 'Bilder som mangler alt-tekst' : 'Relaterte lenker'} ({selectedElement.relatedUrls.length})
                  </p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {selectedElement.relatedUrls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 p-1.5 rounded text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors truncate"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate">{url}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-neutral-400" />
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Forslag ({aiSuggestion.suggestions.length})
                  </p>
                </div>
                <div className="space-y-2.5">
                  {aiSuggestion.suggestions.map((suggestion, i) => (
                    <div key={i} className="rounded-xl bg-white border border-neutral-200 overflow-hidden">
                      <div className="p-3.5">
                        <div className="flex items-start gap-2.5">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-[11px] font-bold mt-0.5 ${
                            suggestion.priority === 'høy'
                              ? 'bg-red-100 text-red-700'
                              : suggestion.priority === 'medium'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-green-100 text-green-700'
                          }`}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-sm font-semibold text-neutral-900">{suggestion.title}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                suggestion.priority === 'høy'
                                  ? 'bg-red-100 text-red-700'
                                  : suggestion.priority === 'medium'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-green-100 text-green-700'
                              }`}>
                                {suggestion.priority}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-600 leading-relaxed">{suggestion.description}</p>
                          </div>
                        </div>
                      </div>
                      {suggestion.example && (
                        <div className="px-3.5 pb-3.5">
                          <div className="flex items-center justify-between mb-1.5 pl-[34px]">
                            <div className="flex items-center gap-1.5">
                              <ArrowRight className="h-3 w-3 text-neutral-400" />
                              <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide">Eksempel</p>
                            </div>
                            <button
                              onClick={() => copyToClipboard(suggestion.example!, `example-${i}`)}
                              className="p-1 rounded hover:bg-neutral-100 transition-colors cursor-pointer"
                            >
                              {copiedId === `example-${i}` ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3 text-neutral-400" />
                              )}
                            </button>
                          </div>
                          <div className="ml-[34px] p-2.5 rounded-lg bg-neutral-50 border border-neutral-200">
                            <p className="text-xs text-neutral-800 font-mono leading-relaxed break-all">{suggestion.example}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-violet-50 border border-violet-200">
                <Sparkles className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-violet-700 mb-0.5">Oppsummering</p>
                  <p className="text-sm text-violet-800 leading-relaxed">{aiSuggestion.summary}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3 border-t border-neutral-100 bg-white flex items-center justify-between">
          <p className="text-[11px] text-neutral-400">Generert av AI · Verifiser før implementering</p>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="rounded-lg text-xs h-8 cursor-pointer">
            Lukk
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
