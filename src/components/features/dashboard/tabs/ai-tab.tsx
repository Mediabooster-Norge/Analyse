'use client';

import { Sparkles, CheckCircle2, AlertCircle, Lightbulb, TrendingUp } from 'lucide-react';
import { ActionPlanTabs } from '@/components/features/dashboard';
import type { DashboardAnalysisResult } from '@/types/dashboard';

export interface AiTabProps {
  result: DashboardAnalysisResult;
  fetchAISuggestion: (
    element: string,
    currentValue: string,
    status: 'good' | 'warning' | 'bad',
    issue?: string
  ) => void;
}

export function AiTab({ result, fetchAISuggestion }: AiTabProps) {
  return (
    <>
      {result.aiSummary ? (
        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
          <div className="p-6 border-b border-neutral-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-900 text-sm font-medium mb-3">
                  <Sparkles className="h-4 w-4 text-neutral-600" />
                  AI-analyse
                </h3>
                <p className="text-sm text-neutral-600">AI-genererte innsikter og anbefalinger basert på analysen</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column - AI Summary & Key Findings */}
              <div>
                <h4 className="text-sm font-semibold text-neutral-700 mb-3">AI-vurdering</h4>
                <p className="text-sm text-neutral-600 leading-relaxed mb-6">
                  {result.aiSummary.overallAssessment}
                </p>

                <h5 className="text-sm font-medium text-neutral-700 mb-3">Viktigste funn</h5>
                <div className="space-y-2">
                  {result.aiSummary.keyFindings.slice(0, 5).map((finding, i) => {
                    const isObject = typeof finding === 'object' && finding !== null;
                    const text = isObject ? (finding as { text: string }).text : (finding as string);
                    let type = isObject ? (finding as { type: string }).type : 'neutral';
                    if (!isObject && typeof text === 'string') {
                      const lowerText = text.toLowerCase();
                      const positiveWords = ['god', 'bra', 'utmerket', 'optimal', 'sterk', 'riktig', 'komplett', 'sikker', 'rask', 'fungerer', 'har', 'inneholder', 'oppfyller', 'tilfredsstillende', 'effektiv', 'ingen bilder uten'];
                      const negativeWords = ['mangler', 'ikke godt', 'feil', 'svak', 'dårlig', 'treg', 'vanskelig', 'kort', 'for', 'bør', 'burde', 'anbefales', 'forbedres', 'problem', 'utfordring', 'kritisk', 'lav', 'ingen', 'uten', 'kan økes', 'kan hindre'];
                      const hasPositive = positiveWords.some((word) => lowerText.includes(word));
                      const hasNegative = negativeWords.some((word) => lowerText.includes(word));
                      if (hasNegative && !hasPositive) type = 'negative';
                      else if (hasPositive && !hasNegative) type = 'positive';
                      else if (hasPositive && hasNegative) {
                        type = (lowerText.includes('ikke') || lowerText.includes('mangler') || lowerText.includes('bør') || lowerText.includes('kan hindre') || lowerText.includes('vanskelig')) ? 'negative' : 'positive';
                      }
                    }
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                          type === 'positive' ? 'bg-green-50 text-green-700' :
                          type === 'negative' ? 'bg-amber-50 text-amber-700' :
                          'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {type === 'positive' ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                        ) : type === 'negative' ? (
                          <AlertCircle className="w-4 h-4 shrink-0" />
                        ) : (
                          <Lightbulb className="w-4 h-4 shrink-0" />
                        )}
                        <span>{text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column - Recommendations & Action Plan */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-medium text-neutral-700">Anbefalinger</h5>
                  <span className="text-xs text-neutral-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Klikk for AI-forslag
                  </span>
                </div>
                <div className="space-y-2 mb-6">
                  {result.aiSummary.recommendations.slice(0, 4).map((rec, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        fetchAISuggestion(
                          rec.title,
                          rec.description,
                          rec.priority === 'high' ? 'bad' : rec.priority === 'medium' ? 'warning' : 'good',
                          `Anbefaling: ${rec.description}${rec.expectedImpact ? `. Forventet effekt: ${rec.expectedImpact}` : ''}`
                        );
                      }}
                      className="p-3 bg-white rounded-xl border-2 border-neutral-200 hover:border-neutral-400 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-medium ${
                              rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                              rec.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                              'bg-green-100 text-green-700'
                            }`}
                          >
                            {rec.priority === 'high' ? 'høy' : rec.priority === 'medium' ? 'medium' : 'lav'}
                          </span>
                          <span className="text-sm font-medium text-neutral-800">{rec.title}</span>
                        </div>
                        <Sparkles className="w-4 h-4 text-neutral-300 group-hover:text-amber-500 transition-colors" />
                      </div>
                      <p className="text-xs text-neutral-500">{rec.description}</p>
                      {rec.expectedImpact && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {rec.expectedImpact}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {result.aiSummary.actionPlan && (
                  <ActionPlanTabs actionPlan={result.aiSummary.actionPlan} />
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-neutral-400" />
          </div>
          <h3 className="font-semibold text-neutral-900 mb-2">Ingen AI-analyse</h3>
          <p className="text-sm text-neutral-500 max-w-md mx-auto">
            AI-analysen genereres automatisk ved neste kjøring.
          </p>
        </div>
      )}
    </>
  );
}
