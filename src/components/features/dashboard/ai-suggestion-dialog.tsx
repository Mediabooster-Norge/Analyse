'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { AISuggestionData } from '@/types/dashboard';
import { Lightbulb, CheckCircle2, AlertCircle, Sparkles, Zap, Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const loadingMessages = [
  'Analyserer innholdet ditt...',
  'Sjekker beste praksis for SEO...',
  'Finner forbedringsmuligheter...',
  'Genererer konkrete forslag...',
  'Tilpasser anbefalinger til din bransje...',
  'Sammenligner med topp-rangerte sider...',
  'Snart klar med forslag...',
];

export interface AISuggestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedElement: { name: string; value: string; status: 'good' | 'warning' | 'bad' } | null;
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
  const [messageIndex, setMessageIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Cycle through loading messages
  useEffect(() => {
    if (!loadingSuggestion) {
      setMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2500);

    return () => clearInterval(interval);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl min-h-[70vh] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="px-6 pt-6 pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Lightbulb className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-neutral-900">
                AI-forslag
              </DialogTitle>
              <DialogDescription className="text-sm text-neutral-500">
                {selectedElement && `Forbedringsforslag for ${selectedElement.name}`}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loadingSuggestion ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center gap-4 py-10">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-neutral-900">AI analyserer...</p>
                  <p 
                    key={messageIndex}
                    className="text-sm text-neutral-500 animate-in fade-in slide-in-from-bottom-2 duration-300"
                  >
                    {loadingMessages[messageIndex]}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-16 w-3/4 rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            </div>
          ) : aiSuggestion ? (
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-4">
                {selectedElement && (
                  <div
                    className={`p-4 rounded-xl ${
                      selectedElement.status === 'good'
                        ? 'bg-green-50 border border-green-200'
                        : selectedElement.status === 'warning'
                          ? 'bg-amber-50 border border-amber-200'
                          : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          selectedElement.status === 'good'
                            ? 'bg-green-100'
                            : selectedElement.status === 'warning'
                              ? 'bg-amber-100'
                              : 'bg-red-100'
                        }`}
                      >
                        {selectedElement.status === 'good' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : selectedElement.status === 'warning' ? (
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-neutral-900">{selectedElement.name}</p>
                        <p className="text-xs text-neutral-600 line-clamp-2">{selectedElement.value}</p>
                      </div>
                    </div>
                  </div>
                )}

                {aiSuggestion.problem && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                    <div className="flex gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-xs text-red-900 mb-1">Problem</p>
                        <p className="text-sm text-red-700 leading-relaxed">{aiSuggestion.problem}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                  <p className="text-sm text-neutral-700 leading-relaxed">{aiSuggestion.summary}</p>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="flex gap-2">
                    <Zap className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-xs text-amber-900">Rask forbedring</p>
                        <button
                          onClick={() => copyToClipboard(aiSuggestion.quickWin, 'quickwin')}
                          className="p-1 rounded hover:bg-amber-100 transition-colors"
                          title="Kopier"
                        >
                          {copiedId === 'quickwin' ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3 text-amber-500 hover:text-amber-700" />
                          )}
                        </button>
                      </div>
                      <p className="text-sm text-amber-800 leading-relaxed">{aiSuggestion.quickWin}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm text-neutral-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-neutral-400" />
                  Anbefalinger ({aiSuggestion.suggestions.length})
                </h4>
                <div className="space-y-2">
                  {aiSuggestion.suggestions.map((suggestion, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-white border border-neutral-200 hover:border-neutral-300 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 text-xs font-medium text-neutral-600">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-neutral-900">{suggestion.title}</span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${
                                suggestion.priority === 'høy'
                                  ? 'border-red-200 text-red-700 bg-red-50'
                                  : suggestion.priority === 'medium'
                                    ? 'border-amber-200 text-amber-700 bg-amber-50'
                                    : 'border-green-200 text-green-700 bg-green-50'
                              }`}
                            >
                              {suggestion.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-neutral-600 leading-relaxed">{suggestion.description}</p>
                          {suggestion.example && (
                            <div className="mt-2 p-2 rounded-lg bg-neutral-50 border border-neutral-100">
                              <div className="flex items-center justify-between mb-0.5">
                                <p className="text-[10px] text-neutral-500">Eksempel:</p>
                                <button
                                  onClick={() => copyToClipboard(suggestion.example!, `example-${i}`)}
                                  className="p-1 rounded hover:bg-neutral-200 transition-colors"
                                  title="Kopier"
                                >
                                  {copiedId === `example-${i}` ? (
                                    <Check className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Copy className="h-3 w-3 text-neutral-400 hover:text-neutral-600" />
                                  )}
                                </button>
                              </div>
                              <p className="text-xs text-neutral-800 font-mono break-all">{suggestion.example}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-neutral-500">Generert av AI · Verifiser før implementering</p>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Lukk
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
