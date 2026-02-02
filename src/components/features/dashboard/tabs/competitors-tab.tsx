'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DashboardAnalysisResult } from '@/types/dashboard';
import type { CompetitorSort } from '@/types/dashboard';
import {
  BarChart3,
  Plus,
  X,
  Globe,
  Loader2,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Zap,
  Clock,
} from 'lucide-react';

// Feature flag: Set to true when AI visibility is ready
const AI_VISIBILITY_ENABLED = false;

export interface CompetitorsTabProps {
  result: DashboardAnalysisResult;
  isPremium: boolean;
  companyUrl: string | null;
  url: string;
  companyName: string | null;
  editingCompetitors: boolean;
  editCompetitorUrls: string[];
  editCompetitorInput: string;
  setEditCompetitorInput: (v: string) => void;
  remainingCompetitorUpdates: number;
  FREE_COMPETITOR_LIMIT: number;
  FREE_UPDATE_LIMIT: number;
  competitorSort: CompetitorSort | null;
  setCompetitorSort: (v: CompetitorSort | null) => void;
  updatingCompetitors: boolean;
  startEditingCompetitors: () => void;
  addEditCompetitor: () => void;
  removeEditCompetitor: (url: string) => void;
  cancelEditingCompetitors: () => void;
  updateCompetitorAnalysis: () => void;
}

export function CompetitorsTab({
  result,
  isPremium,
  companyUrl,
  url,
  companyName,
  editingCompetitors,
  editCompetitorUrls,
  editCompetitorInput,
  setEditCompetitorInput,
  remainingCompetitorUpdates,
  FREE_COMPETITOR_LIMIT,
  FREE_UPDATE_LIMIT,
  competitorSort,
  setCompetitorSort,
  updatingCompetitors,
  startEditingCompetitors,
  addEditCompetitor,
  removeEditCompetitor,
  cancelEditingCompetitors,
  updateCompetitorAnalysis,
}: CompetitorsTabProps) {
  return (
    <>
      {/* Edit Competitors Panel */}
      {editingCompetitors && (
        <div className="rounded-2xl max-[400px]:rounded-xl border border-neutral-200 bg-neutral-50/50 overflow-hidden mb-4 max-[400px]:mb-4 min-[401px]:mb-6 min-w-0">
          <div className="flex items-center justify-between p-2 max-[400px]:p-2 min-[401px]:p-3 sm:p-4 border-b border-neutral-200 bg-neutral-50">
            <div className="flex items-center gap-2 max-[400px]:gap-2 min-[401px]:gap-3 min-w-0">
              <h3 className="inline-flex items-center gap-1.5 max-[400px]:gap-1.5 px-2 max-[400px]:px-2 min-[401px]:px-3 py-1 max-[400px]:py-1 min-[401px]:py-1.5 rounded-full bg-neutral-100 text-neutral-900 text-xs max-[400px]:text-[11px] min-[401px]:text-sm font-medium">
                <BarChart3 className="h-3.5 w-3.5 max-[400px]:h-3 max-[400px]:w-3 text-neutral-600" />
                Rediger konkurrenter
              </h3>
              {!isPremium && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-neutral-900 text-xs font-medium">
                  {remainingCompetitorUpdates} oppdatering{remainingCompetitorUpdates !== 1 ? 'er' : ''} igjen
                </span>
              )}
            </div>
            <button
              onClick={cancelEditingCompetitors}
              disabled={updatingCompetitors}
              className="p-1.5 rounded-lg hover:bg-neutral-200 text-neutral-500 hover:text-neutral-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <p className="text-sm text-neutral-600">
              Legg til konkurrenter du vil sammenligne med. Trykk Enter eller &quot;Legg til&quot; etter hver URL.
            </p>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <Input
                  placeholder="https://konkurrent.no"
                  value={editCompetitorInput}
                  onChange={(e) => setEditCompetitorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addEditCompetitor();
                    }
                  }}
                  className="pl-11 h-11 rounded-xl border-neutral-200 bg-white"
                  disabled={editCompetitorUrls.length >= FREE_COMPETITOR_LIMIT}
                />
              </div>
              <Button
                type="button"
                onClick={addEditCompetitor}
                disabled={editCompetitorUrls.length >= FREE_COMPETITOR_LIMIT || !editCompetitorInput.trim()}
                className="h-11 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Legg til
              </Button>
            </div>

            {editCompetitorUrls.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Lagt til ({editCompetitorUrls.length}/{FREE_COMPETITOR_LIMIT})
                </p>
                <div className="flex flex-wrap gap-2">
                  {editCompetitorUrls.map((competitor) => (
                    <span
                      key={competitor}
                      className="px-3 py-1.5 rounded-full bg-white text-neutral-700 text-sm font-medium border border-neutral-200 cursor-pointer hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors group flex items-center gap-1.5"
                      onClick={() => removeEditCompetitor(competitor)}
                    >
                      {new URL(competitor).hostname}
                      <X className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100" />
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-sm text-neutral-400 border border-dashed border-neutral-200 rounded-xl">
                Ingen konkurrenter lagt til ennå
              </div>
            )}

            <Button
              onClick={updateCompetitorAnalysis}
              disabled={updatingCompetitors || (!isPremium && remainingCompetitorUpdates <= 0)}
              className="w-full rounded-xl bg-neutral-900 hover:bg-neutral-800"
            >
              {updatingCompetitors ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Oppdaterer...
                </>
              ) : (
                <>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Oppdater analyse
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {result.competitors && result.competitors.length > 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-neutral-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-900 text-xs sm:text-sm font-medium mb-2 sm:mb-3">
                  <BarChart3 className="h-4 w-4 text-neutral-600" />
                  Konkurrenter ({result.competitors.length})
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600">Sammenlign din nettside med konkurrentene</p>
              </div>
              {!editingCompetitors && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startEditingCompetitors}
                  disabled={!isPremium && remainingCompetitorUpdates <= 0}
                  className="rounded-lg text-xs w-full sm:w-auto"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Endre konkurrenter
                  {!isPremium && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 text-xs">
                      {remainingCompetitorUpdates}/{FREE_UPDATE_LIMIT}
                    </span>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Comparison Summary */}
            {(() => {
              const avgTotal = Math.round(result.competitors!.reduce((sum, c) => sum + c.results.overallScore, 0) / result.competitors!.length);
              const diff = result.overallScore - avgTotal;
              const isAhead = diff > 0;
              const isTied = diff === 0;
              
              return (
                <div className={`flex items-center gap-3 p-4 rounded-xl ${isAhead ? 'bg-green-50 border border-green-200' : isTied ? 'bg-neutral-50 border border-neutral-200' : 'bg-amber-50 border border-amber-200'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isAhead ? 'bg-green-100' : isTied ? 'bg-neutral-100' : 'bg-amber-100'}`}>
                    {isAhead ? (
                      <TrendingUp className={`w-5 h-5 text-green-600`} />
                    ) : isTied ? (
                      <BarChart3 className={`w-5 h-5 text-neutral-600`} />
                    ) : (
                      <TrendingUp className={`w-5 h-5 text-amber-600 rotate-180`} />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isAhead ? 'text-green-900' : isTied ? 'text-neutral-900' : 'text-amber-900'}`}>
                      {isAhead 
                        ? `Du ligger ${diff} poeng over gjennomsnittet` 
                        : isTied 
                          ? 'Du ligger likt med gjennomsnittet'
                          : `Du ligger ${Math.abs(diff)} poeng under gjennomsnittet`
                      }
                    </p>
                    <p className={`text-xs ${isAhead ? 'text-green-700' : isTied ? 'text-neutral-600' : 'text-amber-700'}`}>
                      Din score: {result.overallScore} · Konkurrentsnitt: {avgTotal}
                    </p>
                  </div>
                </div>
              );
            })()}

            <div className="overflow-x-auto -mx-3 max-[400px]:-mx-3 min-[401px]:-mx-4 sm:mx-0 scrollbar-hide touch-pan-x">
              <div className="min-w-[580px] max-[400px]:min-w-[520px] px-3 max-[400px]:px-3 min-[401px]:px-4 sm:px-0">
                <div className="overflow-hidden rounded-xl border border-neutral-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200">
                        <th className="text-left py-3 px-3 sm:px-4 font-medium text-neutral-600 text-xs sm:text-sm">Nettside</th>
                        <th className="text-center py-3 px-2 sm:px-3 font-medium text-neutral-600 text-xs sm:text-sm">
                          <button
                            onClick={() => setCompetitorSort(competitorSort?.column === 'total' ? { column: 'total', direction: competitorSort.direction === 'asc' ? 'desc' : 'asc' } : { column: 'total', direction: 'desc' })}
                            className="inline-flex items-center gap-1 hover:text-neutral-900 transition-colors cursor-pointer"
                          >
                            Total
                            {competitorSort?.column === 'total' ? (competitorSort.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 text-neutral-300" />}
                          </button>
                        </th>
                        <th className="text-center py-3 px-2 sm:px-3 font-medium text-neutral-600 text-xs sm:text-sm">
                          <button
                            onClick={() => setCompetitorSort(competitorSort?.column === 'seo' ? { column: 'seo', direction: competitorSort.direction === 'asc' ? 'desc' : 'asc' } : { column: 'seo', direction: 'desc' })}
                            className="inline-flex items-center gap-1 hover:text-neutral-900 transition-colors cursor-pointer"
                          >
                            SEO
                            {competitorSort?.column === 'seo' ? (competitorSort.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 text-neutral-300" />}
                          </button>
                        </th>
                        <th className="text-center py-3 px-2 sm:px-3 font-medium text-neutral-600 text-xs sm:text-sm">
                          <button
                            onClick={() => setCompetitorSort(competitorSort?.column === 'content' ? { column: 'content', direction: competitorSort.direction === 'asc' ? 'desc' : 'asc' } : { column: 'content', direction: 'desc' })}
                            className="inline-flex items-center gap-1 hover:text-neutral-900 transition-colors cursor-pointer"
                          >
                            Innhold
                            {competitorSort?.column === 'content' ? (competitorSort.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 text-neutral-300" />}
                          </button>
                        </th>
                        <th className="text-center py-3 px-2 sm:px-3 font-medium text-neutral-600 text-xs sm:text-sm">
                          <button
                            onClick={() => setCompetitorSort(competitorSort?.column === 'security' ? { column: 'security', direction: competitorSort.direction === 'asc' ? 'desc' : 'asc' } : { column: 'security', direction: 'desc' })}
                            className="inline-flex items-center gap-1 hover:text-neutral-900 transition-colors cursor-pointer"
                          >
                            Sikkerhet
                            {competitorSort?.column === 'security' ? (competitorSort.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 text-neutral-300" />}
                          </button>
                        </th>
                        <th className="text-center py-3 px-2 sm:px-3 font-medium text-neutral-600 text-xs sm:text-sm">
                      {AI_VISIBILITY_ENABLED ? (
                        <button
                          onClick={() => setCompetitorSort(competitorSort?.column === 'aiVisibility' ? { column: 'aiVisibility', direction: competitorSort.direction === 'asc' ? 'desc' : 'asc' } : { column: 'aiVisibility', direction: 'desc' })}
                          className="inline-flex items-center gap-1 hover:text-neutral-900 transition-colors cursor-pointer"
                        >
                          AI-søk
                          {competitorSort?.column === 'aiVisibility' ? (competitorSort.direction === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 text-neutral-300" />}
                        </button>
                      ) : (
                        <span className="inline-flex flex-col items-center gap-0.5">
                          AI-søk
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 font-medium">Snart</span>
                        </span>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const userAiScore = result.aiVisibility?.score ?? null;
                    const allEntries = [
                      {
                        type: 'user' as const,
                        url: companyUrl || url,
                        name: companyName || new URL(companyUrl || url).hostname,
                        total: result.overallScore,
                        seo: result.seoResults.score,
                        content: result.contentResults.score,
                        security: result.securityResults.score,
                        aiVisibility: userAiScore,
                      },
                      ...result.competitors.map((c, idx) => ({
                        type: 'competitor' as const,
                        url: c.url,
                        name: new URL(c.url).hostname,
                        total: c.results.overallScore,
                        seo: c.results.seoResults.score,
                        content: c.results.contentResults.score,
                        security: c.results.securityResults.score,
                        aiVisibility: c.results.aiVisibility?.score ?? null,
                        competitor: c,
                        index: idx,
                      })),
                    ];

                    if (competitorSort) {
                      allEntries.sort((a, b) => {
                        const aVal = a[competitorSort.column];
                        const bVal = b[competitorSort.column];
                        const aNum = aVal == null ? -1 : aVal;
                        const bNum = bVal == null ? -1 : bVal;
                        return competitorSort.direction === 'asc' ? aNum - bNum : bNum - aNum;
                      });
                    }

                    const avgSeo = result.competitors.reduce((sum, c) => sum + c.results.seoResults.score, 0) / result.competitors.length;
                    const avgContent = result.competitors.reduce((sum, c) => sum + c.results.contentResults.score, 0) / result.competitors.length;
                    const avgSecurity = result.competitors.reduce((sum, c) => sum + c.results.securityResults.score, 0) / result.competitors.length;

                    return allEntries.map((entry) => {
                      if (entry.type === 'user') {
                        return (
                          <tr key="user" className="border-b border-neutral-100 bg-green-50/50 hover:bg-green-50 transition-colors group">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                                  <Globe className="h-4 w-4 text-green-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-neutral-900 truncate">{entry.name}</p>
                                  <a href={entry.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:text-blue-600 hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Besøk <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              </div>
                            </td>
                            <td className="text-center py-3 px-3">
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-700 font-bold text-sm">{entry.total}</span>
                            </td>
                            <td className="text-center py-3 px-3">
                              <div className="flex flex-col items-center gap-1">
                                <span className={`font-semibold ${entry.seo >= avgSeo ? 'text-green-600' : 'text-red-600'}`}>{entry.seo}</span>
                                <div className="w-full max-w-[60px] h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                                  <div className={`h-full rounded-full ${entry.seo >= avgSeo ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${entry.seo}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="text-center py-3 px-3">
                              <div className="flex flex-col items-center gap-1">
                                <span className={`font-semibold ${entry.content >= avgContent ? 'text-green-600' : 'text-red-600'}`}>{entry.content}</span>
                                {result.contentResults?.wordCount != null && <span className="text-[10px] text-neutral-500">{result.contentResults.wordCount.toLocaleString('nb-NO')} ord</span>}
                                <div className="w-full max-w-[60px] h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                                  <div className={`h-full rounded-full ${entry.content >= avgContent ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${entry.content}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="text-center py-3 px-3">
                              <div className="flex flex-col items-center gap-1">
                                <span className={`font-semibold ${entry.security >= avgSecurity ? 'text-green-600' : 'text-red-600'}`}>{entry.security}</span>
                                <div className="w-full max-w-[60px] h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                                  <div className={`h-full rounded-full ${entry.security >= avgSecurity ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${entry.security}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="text-center py-3 px-3">
                              {AI_VISIBILITY_ENABLED ? (
                                result.aiVisibility?.score != null ? (
                                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-cyan-100 text-cyan-700 font-bold text-sm">{result.aiVisibility.score}</span>
                                ) : (
                                  <span className="text-neutral-400 text-sm">–</span>
                                )
                              ) : (
                                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-violet-50 text-violet-400">
                                  <Clock className="w-4 h-4" />
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      }

                      const competitor = entry.competitor!;
                      const index = entry.index!;
                      const isWinning = competitor.results.overallScore > result.overallScore;
                      return (
                        <tr key={competitor.url} className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 transition-colors group">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 group-hover:bg-neutral-200 transition-colors">
                                <span className="text-xs font-bold text-neutral-500">#{index + 1}</span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-neutral-700 truncate group-hover:text-neutral-900 transition-colors">{new URL(competitor.url).hostname}</p>
                                <a href={competitor.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:text-blue-600 hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  Besøk <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          </td>
                          <td className="text-center py-3 px-3">
                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${isWinning ? 'bg-red-100 text-red-700' : 'bg-neutral-100 text-neutral-600'}`}>
                              {competitor.results.overallScore}
                            </span>
                          </td>
                          <td className="text-center py-3 px-3">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`font-semibold ${competitor.results.seoResults.score > result.seoResults.score ? 'text-red-600' : 'text-neutral-600'}`}>{competitor.results.seoResults.score}</span>
                              <div className="w-full max-w-[60px] h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                                <div className="h-full rounded-full bg-neutral-400" style={{ width: `${competitor.results.seoResults.score}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="text-center py-3 px-3">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`font-semibold ${competitor.results.contentResults.score > result.contentResults.score ? 'text-red-600' : 'text-neutral-600'}`}>{competitor.results.contentResults.score}</span>
                              {competitor.results.contentResults?.wordCount != null && <span className="text-[10px] text-neutral-500">{competitor.results.contentResults.wordCount.toLocaleString('nb-NO')} ord</span>}
                              <div className="w-full max-w-[60px] h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                                <div className="h-full rounded-full bg-neutral-400" style={{ width: `${competitor.results.contentResults.score}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="text-center py-3 px-3">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`font-semibold ${competitor.results.securityResults.score > result.securityResults.score ? 'text-red-600' : 'text-neutral-600'}`}>{competitor.results.securityResults.score}</span>
                              <div className="w-full max-w-[60px] h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                                <div className="h-full rounded-full bg-neutral-400" style={{ width: `${competitor.results.securityResults.score}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="text-center py-3 px-3">
                            {AI_VISIBILITY_ENABLED ? (
                              competitor.results.aiVisibility?.score != null ? (
                                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-cyan-100 text-cyan-700 font-bold text-sm">{competitor.results.aiVisibility.score}</span>
                              ) : (
                                <span className="text-neutral-400 text-sm">–</span>
                              )
                            ) : (
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-violet-50 text-violet-400">
                                <Clock className="w-4 h-4" />
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {result.aiSummary?.competitorComparison && (
              <>
                <div className="p-4 sm:p-5 rounded-xl bg-white border border-neutral-200">
                  <h5 className="inline-flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-blue-100 text-neutral-900 text-xs sm:text-sm font-medium mb-3 sm:mb-4">
                    <Sparkles className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-blue-600" />
                    AI-vurdering
                  </h5>
                  <p className="text-xs sm:text-sm text-neutral-700">{result.aiSummary.competitorComparison.summary}</p>
                  {result.aiSummary.competitorComparison.scoreAnalysis && (
                    <p className="text-xs sm:text-sm text-neutral-500 mt-2">{result.aiSummary.competitorComparison.scoreAnalysis}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {result.aiSummary.competitorComparison.yourStrengths.length > 0 && (
                    <div className="p-4 sm:p-5 rounded-xl bg-white border border-neutral-200">
                      <h5 className="inline-flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-green-100 text-neutral-900 text-xs sm:text-sm font-medium mb-3 sm:mb-4">
                        <CheckCircle2 className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-green-600" />
                        Dine styrker
                      </h5>
                      <ul className="space-y-2">
                        {result.aiSummary.competitorComparison.yourStrengths.map((s, i) => (
                          <li key={i} className="text-xs sm:text-sm text-neutral-700">{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.aiSummary.competitorComparison.competitorStrengths.length > 0 && (
                    <div className="p-4 sm:p-5 rounded-xl bg-white border border-neutral-200">
                      <h5 className="inline-flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-red-100 text-neutral-900 text-xs sm:text-sm font-medium mb-3 sm:mb-4">
                        <AlertCircle className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-red-600" />
                        Konkurrentens styrker
                      </h5>
                      <ul className="space-y-2">
                        {result.aiSummary.competitorComparison.competitorStrengths.map((s, i) => (
                          <li key={i} className="text-xs sm:text-sm text-neutral-700">{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {result.aiSummary.competitorComparison.opportunities.length > 0 && (
                    <div className="p-4 sm:p-5 rounded-xl bg-white border border-neutral-200">
                      <h5 className="inline-flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-amber-100 text-neutral-900 text-xs sm:text-sm font-medium mb-3 sm:mb-4">
                        <TrendingUp className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-amber-600" />
                        Muligheter
                      </h5>
                      <ul className="space-y-2">
                        {result.aiSummary.competitorComparison.opportunities.map((o, i) => (
                          <li key={i} className="text-xs sm:text-sm text-neutral-700">{o}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.aiSummary.competitorComparison.quickWins && result.aiSummary.competitorComparison.quickWins.length > 0 && (
                    <div className="p-4 sm:p-5 rounded-xl bg-white border border-neutral-200">
                      <h5 className="inline-flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-purple-100 text-neutral-900 text-xs sm:text-sm font-medium mb-3 sm:mb-4">
                        <Zap className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-purple-600" />
                        Raske forbedringer
                      </h5>
                      <ul className="space-y-2">
                        {result.aiSummary.competitorComparison.quickWins.map((q, i) => (
                          <li key={i} className="text-xs sm:text-sm text-neutral-700">{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-neutral-400" />
          </div>
          <h3 className="font-semibold text-neutral-900 mb-2">Ingen konkurrentanalyse</h3>
          <p className="text-sm text-neutral-500 max-w-md mx-auto mb-4">
            Du valgte ingen konkurrenter i den opprinnelige analysen.
          </p>
          {(isPremium || remainingCompetitorUpdates > 0) && !editingCompetitors && (
            <Button variant="outline" onClick={startEditingCompetitors} className="rounded-xl">
              <Plus className="mr-2 h-4 w-4" />
              Legg til konkurrenter
              {!isPremium && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 text-xs">
                  {remainingCompetitorUpdates}/{FREE_UPDATE_LIMIT}
                </span>
              )}
            </Button>
          )}
        </div>
      )}
    </>
  );
}
