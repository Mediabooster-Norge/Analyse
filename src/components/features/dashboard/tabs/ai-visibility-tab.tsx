'use client';

import { Button } from '@/components/ui/button';
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

// Feature flag: Set to true when AI visibility is ready
const AI_VISIBILITY_ENABLED = false;

export interface AiVisibilityTabProps {
  result: DashboardAnalysisResult;
  isPremium: boolean;
  aiVisibilityResult: AIVisibilityData | null;
  companyUrl: string | null;
  url: string;
  companyName: string | null;
  checkingAiVisibility: boolean;
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
  onCheckAiVisibility,
}: AiVisibilityTabProps) {
  // Show "Coming soon" when feature is disabled
  if (!AI_VISIBILITY_ENABLED) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        <div className="p-6 border-b border-neutral-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-900 text-sm font-medium mb-3">
                <Eye className="h-4 w-4 text-neutral-600" />
                AI-synlighet
                <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-medium">
                  Kommer snart
                </span>
              </h3>
              <p className="text-sm text-neutral-600">Hvor godt AI-modeller kjenner til bedriften din</p>
            </div>
          </div>
        </div>
        <div className="p-8">
          <div className="max-w-lg mx-auto text-center space-y-6">
            <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-violet-600" />
            </div>
            
            <div className="space-y-2">
              <h4 className="text-xl font-semibold text-neutral-900">AI-synlighet kommer snart!</h4>
              <p className="text-neutral-600">
                Vi jobber med å ferdigstille AI-synlighet. Snart kan du se om ChatGPT, Perplexity 
                og andre AI-verktøy kjenner til og anbefaler bedriften din.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 pt-4">
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
                <p className="text-xs text-neutral-500 mt-1">Sammenlign med konkurrenter</p>
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
    <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
      <div className="p-6 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-900 text-sm font-medium mb-3">
              <Eye className="h-4 w-4 text-neutral-600" />
              AI-synlighet
            </h3>
            <p className="text-sm text-neutral-600">Hvor godt AI-modeller kjenner til bedriften din</p>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-6">
        {!isPremium ? (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Lock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-900">AI-synlighet er en Premium-funksjon</h4>
                <p className="text-sm text-amber-800 mt-0.5">
                  Med Premium får du full rapport om hvordan AI-modeller ser og anbefaler bedriften din.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-neutral-900">Hvorfor er dette viktig?</h4>
              <p className="text-sm text-neutral-600">
                Flere bruker nå AI-verktøy (ChatGPT, Perplexity, Copilot) til å finne tjenester og bedrifter.
                Hvis AI ikke kjenner til deg eller ikke anbefaler deg, går potensielle kunder til konkurrentene.
                AI-synlighetsrapporten viser hvor du står og hva du kan gjøre for å bli mer synlig.
              </p>
            </div>

            <div className="pt-4 border-t border-neutral-100">
              <Button asChild size="lg" className="w-full sm:w-auto bg-neutral-900 hover:bg-neutral-800 text-white">
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
                  <div className="mb-4">
                    <h4 className="font-medium text-neutral-900">AI-svar på spørsmål</h4>
                  </div>
                  <div className="space-y-3">
                    {visData.details.queries.map((q, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-xl border ${
                          q.cited
                            ? 'bg-green-50/50 border-green-200'
                            : q.mentioned
                              ? 'bg-blue-50/50 border-blue-200'
                              : 'bg-neutral-50 border-neutral-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              q.cited ? 'bg-green-100' : q.mentioned ? 'bg-blue-100' : 'bg-neutral-200'
                            }`}
                          >
                            {q.cited ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : q.mentioned ? (
                              <Search className="w-4 h-4 text-blue-600" />
                            ) : (
                              <X className="w-4 h-4 text-neutral-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-neutral-800">{q.query}</p>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-medium ${
                                  q.cited ? 'bg-green-100 text-green-700' : q.mentioned ? 'bg-blue-100 text-blue-700' : 'bg-neutral-200 text-neutral-600'
                                }`}
                              >
                                {q.cited ? 'Kjent' : q.mentioned ? 'Delvis' : 'Ukjent'}
                              </span>
                            </div>
                            {q.aiResponse && (
                              <p className="text-sm text-neutral-600 leading-relaxed">{q.aiResponse}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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

          const passCount = factors.filter((f) => f.pass).length;
          const aiScore = Math.round((passCount / factors.length) * 100);

          return (
            <div className="space-y-6">
              <div className="rounded-2xl border border-neutral-200 bg-white p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div
                        className={`w-28 h-28 rounded-full flex items-center justify-center ${
                          aiScore >= 80 ? 'bg-green-100' : aiScore >= 60 ? 'bg-amber-100' : 'bg-red-100'
                        }`}
                      >
                        <span
                          className={`text-4xl font-bold ${
                            aiScore >= 80 ? 'text-green-600' : aiScore >= 60 ? 'text-amber-600' : 'text-red-600'
                          }`}
                        >
                          {aiScore}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-neutral-200 text-[10px] text-neutral-600 font-medium">
                        Estimert
                      </div>
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-lg font-semibold mb-1 ${
                          aiScore >= 80 ? 'text-green-700' : aiScore >= 60 ? 'text-amber-700' : 'text-red-700'
                        }`}
                      >
                        {aiScore >= 80 ? 'God AI-beredskap' : aiScore >= 60 ? 'Moderat AI-beredskap' : 'Lav AI-beredskap'}
                      </p>
                      <p className="text-sm text-neutral-600">
                        Estimat basert på nettsideinnhold. Kjør live-sjekk for å se faktisk AI-synlighet.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {factors.map((factor, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 p-3 rounded-lg ${factor.pass ? 'bg-green-50' : 'bg-neutral-50'}`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                            factor.pass ? 'bg-green-100' : 'bg-neutral-200'
                          }`}
                        >
                          {factor.pass ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <X className="w-3 h-3 text-neutral-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-medium ${factor.pass ? 'text-green-700' : 'text-neutral-600'}`}>
                            {factor.name}
                          </span>
                          {!factor.pass && <p className="text-xs text-neutral-500">{factor.tip}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center">
                    <Search className="w-6 h-6 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-neutral-900">Sjekk faktisk AI-synlighet</h4>
                    <p className="text-sm text-neutral-500">Spør AI om den kjenner til bedriften og kan anbefale den</p>
                  </div>
                  <Button
                    onClick={onCheckAiVisibility}
                    disabled={checkingAiVisibility}
                    className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white"
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
            </div>
          );
        })()}
      </div>
    </div>
  );
}
