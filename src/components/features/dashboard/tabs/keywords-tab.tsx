'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DashboardAnalysisResult, KeywordResearchData, KeywordSort } from '@/types/dashboard';
import {
  Tag,
  Plus,
  X,
  Loader2,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
} from 'lucide-react';

export interface KeywordsTabProps {
  result: DashboardAnalysisResult;
  isPremium: boolean;
  editingKeywords: boolean;
  editKeywords: string[];
  editKeywordInput: string;
  setEditKeywordInput: (v: string) => void;
  remainingKeywordUpdates: number;
  FREE_KEYWORD_LIMIT: number;
  FREE_UPDATE_LIMIT: number;
  keywordSort: KeywordSort | null;
  setKeywordSort: (v: KeywordSort | null) => void;
  updatingKeywords: boolean;
  startEditingKeywords: () => void;
  addEditKeyword: () => void;
  removeEditKeyword: (keyword: string) => void;
  cancelEditingKeywords: () => void;
  updateKeywordAnalysis: () => void;
  suggestKeywords: () => void;
  suggestingKeywords: boolean;
}

export function KeywordsTab({
  result,
  isPremium,
  editingKeywords,
  editKeywords,
  editKeywordInput,
  setEditKeywordInput,
  remainingKeywordUpdates,
  FREE_KEYWORD_LIMIT,
  FREE_UPDATE_LIMIT,
  keywordSort,
  setKeywordSort,
  updatingKeywords,
  startEditingKeywords,
  addEditKeyword,
  removeEditKeyword,
  cancelEditingKeywords,
  updateKeywordAnalysis,
  suggestKeywords,
  suggestingKeywords,
}: KeywordsTabProps) {
  return (
    <>
      {/* Edit Keywords Panel */}
      {editingKeywords && (
        <div className="rounded-2xl max-[400px]:rounded-xl border border-neutral-200 bg-neutral-50/50 overflow-hidden mb-4 max-[400px]:mb-4 min-[401px]:mb-6 min-w-0">
          <div className="flex items-center justify-between p-2 max-[400px]:p-2 min-[401px]:p-3 sm:p-4 border-b border-neutral-200 bg-neutral-50">
            <div className="flex items-center gap-2 max-[400px]:gap-2 min-[401px]:gap-3 min-w-0">
              <h3 className="inline-flex items-center gap-1.5 max-[400px]:gap-1.5 px-2 max-[400px]:px-2 min-[401px]:px-3 py-1 max-[400px]:py-1 min-[401px]:py-1.5 rounded-full bg-neutral-100 text-neutral-900 text-xs max-[400px]:text-[11px] min-[401px]:text-sm font-medium">
                <Tag className="h-3.5 w-3.5 max-[400px]:h-3 max-[400px]:w-3 text-neutral-600" />
                Rediger nøkkelord
              </h3>
              {!isPremium && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-neutral-900 text-xs font-medium">
                  {remainingKeywordUpdates} oppdatering{remainingKeywordUpdates !== 1 ? 'er' : ''} igjen
                </span>
              )}
            </div>
            <button
              onClick={cancelEditingKeywords}
              disabled={updatingKeywords}
              className="p-1.5 rounded-lg hover:bg-neutral-200 text-neutral-500 hover:text-neutral-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-neutral-600">
                Legg til nøkkelord du vil analysere. Trykk Enter eller &quot;Legg til&quot; etter hvert nøkkelord.
              </p>
              {!isPremium && (
                <p className="text-xs text-neutral-500">
                  Du kan endre nøkkelord opptil {FREE_UPDATE_LIMIT} ganger per analyse.
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <Input
                  placeholder="F.eks. digital markedsføring"
                  value={editKeywordInput}
                  onChange={(e) => setEditKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addEditKeyword();
                    }
                  }}
                  className="pl-11 h-11 rounded-xl border-neutral-200 bg-white"
                  disabled={editKeywords.length >= FREE_KEYWORD_LIMIT}
                />
              </div>
              <Button
                type="button"
                onClick={addEditKeyword}
                disabled={editKeywords.length >= FREE_KEYWORD_LIMIT || !editKeywordInput.trim()}
                className="h-11 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Legg til
              </Button>
            </div>

            {editKeywords.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Lagt til ({editKeywords.length}/{FREE_KEYWORD_LIMIT})
                </p>
                <div className="flex flex-wrap gap-2">
                  {editKeywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="px-3 py-1.5 rounded-full bg-white text-neutral-700 text-sm font-medium border border-neutral-200 cursor-pointer hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors group flex items-center gap-1.5"
                      onClick={() => removeEditKeyword(keyword)}
                    >
                      {keyword}
                      <X className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100" />
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-sm text-neutral-400 border border-dashed border-neutral-200 rounded-xl">
                Ingen nøkkelord lagt til ennå
              </div>
            )}

            <Button
              onClick={updateKeywordAnalysis}
              disabled={updatingKeywords || (!isPremium && remainingKeywordUpdates <= 0) || editKeywords.length === 0}
              className="w-full rounded-xl bg-neutral-900 hover:bg-neutral-800"
            >
              {updatingKeywords ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Oppdaterer...
                </>
              ) : (
                <>
                  <Tag className="mr-2 h-4 w-4" />
                  Oppdater analyse
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {result.keywordResearch && result.keywordResearch.length > 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-neutral-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-900 text-xs sm:text-sm font-medium mb-2 sm:mb-3">
                  <Tag className="h-4 w-4 text-neutral-600" />
                  Nøkkelordanalyse
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600">Estimert søkedata for norsk marked</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {!editingKeywords && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startEditingKeywords}
                    disabled={!isPremium && remainingKeywordUpdates <= 0}
                    className="rounded-lg text-xs"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Endre nøkkelord
                    {!isPremium && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 text-xs">
                        {remainingKeywordUpdates}/{FREE_UPDATE_LIMIT}
                      </span>
                    )}
                  </Button>
                )}
                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-neutral-900 text-xs font-medium">
                  AI-estimater
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="mb-4 flex flex-col sm:flex-row gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100 text-[10px] sm:text-xs text-amber-700">
                <span className="font-medium">Om dataene:</span>
                <span className="text-amber-600">AI-estimater for norsk marked</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-[10px] sm:text-xs text-blue-700">
                <span className="font-medium">Tips:</span>
                <span className="text-blue-600">Høyt volum + lav konkurranse = best ROI</span>
              </div>
            </div>

            <div className="overflow-x-auto -mx-3 max-[400px]:-mx-3 min-[401px]:-mx-4 sm:mx-0 scrollbar-hide touch-pan-x">
              <div className="min-w-[620px] max-[400px]:min-w-[560px] px-3 max-[400px]:px-3 min-[401px]:px-4 sm:px-0">
                <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                      <button
                        onClick={() =>
                          setKeywordSort(
                            keywordSort?.column === 'keyword'
                              ? { column: 'keyword', direction: keywordSort.direction === 'asc' ? 'desc' : 'asc' }
                              : { column: 'keyword', direction: 'asc' }
                          )
                        }
                        className="flex items-center gap-1 hover:text-neutral-700 transition-colors cursor-pointer"
                      >
                        Nøkkelord
                        {keywordSort?.column === 'keyword' ? (
                          keywordSort.direction === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 text-neutral-300" />
                        )}
                      </button>
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                      <button
                        onClick={() =>
                          setKeywordSort(
                            keywordSort?.column === 'searchVolume'
                              ? { column: 'searchVolume', direction: keywordSort.direction === 'asc' ? 'desc' : 'asc' }
                              : { column: 'searchVolume', direction: 'desc' }
                          )
                        }
                        className="flex items-center justify-end gap-1 w-full hover:text-neutral-700 transition-colors cursor-pointer"
                      >
                        Søkevolum <span className="text-neutral-300">~</span>
                        {keywordSort?.column === 'searchVolume' ? (
                          keywordSort.direction === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 text-neutral-300" />
                        )}
                      </button>
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                      <button
                        onClick={() =>
                          setKeywordSort(
                            keywordSort?.column === 'cpc'
                              ? { column: 'cpc', direction: keywordSort.direction === 'asc' ? 'desc' : 'asc' }
                              : { column: 'cpc', direction: 'desc' }
                          )
                        }
                        className="flex items-center justify-end gap-1 w-full hover:text-neutral-700 transition-colors cursor-pointer"
                      >
                        CPC <span className="text-neutral-300">~</span>
                        {keywordSort?.column === 'cpc' ? (
                          keywordSort.direction === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 text-neutral-300" />
                        )}
                      </button>
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                      <button
                        onClick={() =>
                          setKeywordSort(
                            keywordSort?.column === 'competition'
                              ? { column: 'competition', direction: keywordSort.direction === 'asc' ? 'desc' : 'asc' }
                              : { column: 'competition', direction: 'asc' }
                          )
                        }
                        className="flex items-center justify-center gap-1 w-full hover:text-neutral-700 transition-colors cursor-pointer"
                      >
                        Konkurranse
                        {keywordSort?.column === 'competition' ? (
                          keywordSort.direction === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 text-neutral-300" />
                        )}
                      </button>
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                      <button
                        onClick={() =>
                          setKeywordSort(
                            keywordSort?.column === 'difficulty'
                              ? { column: 'difficulty', direction: keywordSort.direction === 'asc' ? 'desc' : 'asc' }
                              : { column: 'difficulty', direction: 'asc' }
                          )
                        }
                        className="flex items-center justify-center gap-1 w-full hover:text-neutral-700 transition-colors cursor-pointer"
                      >
                        Vanskelighet
                        {keywordSort?.column === 'difficulty' ? (
                          keywordSort.direction === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 text-neutral-300" />
                        )}
                      </button>
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                      <button
                        onClick={() =>
                          setKeywordSort(
                            keywordSort?.column === 'intent'
                              ? { column: 'intent', direction: keywordSort.direction === 'asc' ? 'desc' : 'asc' }
                              : { column: 'intent', direction: 'asc' }
                          )
                        }
                        className="flex items-center justify-center gap-1 w-full hover:text-neutral-700 transition-colors cursor-pointer"
                      >
                        Intensjon
                        {keywordSort?.column === 'intent' ? (
                          keywordSort.direction === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 text-neutral-300" />
                        )}
                      </button>
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                      <button
                        onClick={() =>
                          setKeywordSort(
                            keywordSort?.column === 'trend'
                              ? { column: 'trend', direction: keywordSort.direction === 'asc' ? 'desc' : 'asc' }
                              : { column: 'trend', direction: 'desc' }
                          )
                        }
                        className="flex items-center justify-center gap-1 w-full hover:text-neutral-700 transition-colors cursor-pointer"
                      >
                        Trend
                        {keywordSort?.column === 'trend' ? (
                          keywordSort.direction === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 text-neutral-300" />
                        )}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...result.keywordResearch]
                    .sort((a, b) => {
                      if (!keywordSort) return 0;
                      const { column, direction } = keywordSort;
                      let comparison = 0;

                      switch (column) {
                        case 'keyword':
                          comparison = a.keyword.localeCompare(b.keyword, 'nb');
                          break;
                        case 'searchVolume':
                          comparison = a.searchVolume - b.searchVolume;
                          break;
                        case 'cpc':
                          comparison = a.cpc - b.cpc;
                          break;
                        case 'competition': {
                          const compOrder = { lav: 1, medium: 2, høy: 3 };
                          comparison = compOrder[a.competition] - compOrder[b.competition];
                          break;
                        }
                        case 'difficulty':
                          comparison = a.difficulty - b.difficulty;
                          break;
                        case 'intent':
                          comparison = a.intent.localeCompare(b.intent);
                          break;
                        case 'trend': {
                          const trendOrder = { synkende: 1, stabil: 2, stigende: 3 };
                          comparison = trendOrder[a.trend] - trendOrder[b.trend];
                          break;
                        }
                      }

                      return direction === 'asc' ? comparison : -comparison;
                    })
                    .map((kw, i) => (
                      <tr key={i} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                        <td className="py-4 px-4">
                          <span className="font-medium text-neutral-900">{kw.keyword}</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="font-semibold text-neutral-900">{kw.searchVolume.toLocaleString('nb-NO')}</span>
                          <span className="text-xs text-neutral-400 ml-1">/mnd</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="font-semibold text-green-600">{kw.cpc.toFixed(2)} kr</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium text-neutral-900 ${
                              kw.competition === 'lav' ? 'bg-green-100' : kw.competition === 'medium' ? 'bg-amber-100' : 'bg-red-100'
                            }`}
                          >
                            {kw.competition}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 bg-neutral-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  kw.difficulty <= 30 ? 'bg-green-500' : kw.difficulty <= 60 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${kw.difficulty}%` }}
                              />
                            </div>
                            <span className="text-xs text-neutral-500 w-6">{kw.difficulty}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium text-neutral-900 ${
                              kw.intent === 'transactional'
                                ? 'bg-green-100'
                                : kw.intent === 'commercial'
                                  ? 'bg-blue-100'
                                  : kw.intent === 'informational'
                                    ? 'bg-cyan-100'
                                    : 'bg-neutral-100'
                            }`}
                          >
                            {kw.intent === 'transactional'
                              ? 'Kjøp'
                              : kw.intent === 'commercial'
                                ? 'Kommersiell'
                                : kw.intent === 'informational'
                                  ? 'Info'
                                  : 'Navigasjon'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`flex items-center justify-center gap-1 text-xs font-medium ${
                              kw.trend === 'stigende' ? 'text-green-600' : kw.trend === 'synkende' ? 'text-red-600' : 'text-neutral-500'
                            }`}
                          >
                            {kw.trend === 'stigende' && <TrendingUp className="h-3.5 w-3.5" />}
                            {kw.trend === 'synkende' && <TrendingDown className="h-3.5 w-3.5" />}
                            {kw.trend === 'stabil' && <Minus className="h-3.5 w-3.5" />}
                            {kw.trend}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-neutral-100">
              <div className="p-3 sm:p-4 rounded-xl bg-neutral-50">
                <p className="text-[10px] sm:text-xs text-neutral-500 uppercase tracking-wide font-medium">Est. total søkevolum</p>
                <p className="text-base sm:text-xl font-bold text-neutral-900 mt-1">
                  ~{result.keywordResearch.reduce((sum, kw) => sum + kw.searchVolume, 0).toLocaleString('nb-NO')}
                </p>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-neutral-50">
                <p className="text-[10px] sm:text-xs text-neutral-500 uppercase tracking-wide font-medium">Est. gj.snitt CPC</p>
                <p className="text-base sm:text-xl font-bold text-green-600 mt-1">
                  ~{(result.keywordResearch.reduce((sum, kw) => sum + kw.cpc, 0) / result.keywordResearch.length).toFixed(2)} kr
                </p>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-neutral-50">
                <p className="text-[10px] sm:text-xs text-neutral-500 uppercase tracking-wide font-medium">Gj.snitt vanskelighet</p>
                <p className="text-base sm:text-xl font-bold text-neutral-900 mt-1">
                  {Math.round(result.keywordResearch.reduce((sum, kw) => sum + kw.difficulty, 0) / result.keywordResearch.length)}/100
                </p>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-neutral-50">
                <p className="text-[10px] sm:text-xs text-neutral-500 uppercase tracking-wide font-medium">Beste mulighet</p>
                <p className="text-xs sm:text-sm font-semibold text-neutral-900 mt-1 truncate">
                  {result.keywordResearch.reduce(
                    (best, kw) => ((kw.searchVolume / (kw.difficulty + 1)) > (best.searchVolume / (best.difficulty + 1)) ? kw : best)
                  ).keyword}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : result.aiSummary?.keywordAnalysis ? (
        (() => {
          const primary = result.aiSummary!.keywordAnalysis!.primaryKeywords || [];
          const missing = result.aiSummary!.keywordAnalysis!.missingKeywords || [];
          const aiKeywordsAsTable: KeywordResearchData[] = [
            ...primary.map((keyword) => ({
              keyword,
              searchVolume: 0,
              cpc: 0,
              competition: 'medium' as const,
              competitionScore: 50,
              intent: 'informational' as const,
              difficulty: 50,
              trend: 'stabil' as const,
            })),
            ...missing.map((keyword) => ({
              keyword: `+ ${keyword}`,
              searchVolume: 0,
              cpc: 0,
              competition: 'medium' as const,
              competitionScore: 50,
              intent: 'commercial' as const,
              difficulty: 50,
              trend: 'stabil' as const,
            })),
          ];
          const hasAiKeywords = aiKeywordsAsTable.length > 0;
          if (!hasAiKeywords) return null;
          return (
            <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
              <div className="p-6 border-b border-neutral-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-900 text-sm font-medium mb-3">
                      <Tag className="h-4 w-4 text-neutral-600" />
                      Nøkkelordanalyse
                    </h3>
                    <p className="text-sm text-neutral-600">
                      Søkeord fra AI-analyse (CPC/søkevolum ikke tilgjengelig uten nøkkelord i analysen)
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="text-left py-3 px-4 font-medium text-neutral-600">Nøkkelord</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Søkevolum ~/mnd</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wide">CPC ~</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Konkurranse</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Vanskelighet</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aiKeywordsAsTable.map((kw, i) => (
                        <tr key={i} className="border-b border-neutral-100 last:border-b-0">
                          <td className="py-4 px-4">
                            <span className={`font-medium ${kw.keyword.startsWith('+ ') ? 'text-amber-700' : 'text-neutral-900'}`}>
                              {kw.keyword}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right text-neutral-400">–</td>
                          <td className="py-4 px-4 text-right text-neutral-400">–</td>
                          <td className="py-4 px-4 text-center text-neutral-400">–</td>
                          <td className="py-4 px-4 text-center text-neutral-400">–</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {result.aiSummary?.keywordAnalysis?.recommendations && (
                  <div className="mt-6 p-5 rounded-xl bg-neutral-50 border border-neutral-100">
                    <h5 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-neutral-900 text-sm font-medium mb-3">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      Anbefalinger
                    </h5>
                    <p className="text-sm text-neutral-700">{result.aiSummary.keywordAnalysis.recommendations}</p>
                  </div>
                )}
                <p className="mt-4 text-xs text-neutral-500">
                  Legg til nøkkelord før analyse for å få full CPC-tabell med søkevolum og konkurranse.
                </p>
              </div>
            </div>
          );
        })()
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Tag className="h-8 w-8 text-neutral-400" />
          </div>
          <h3 className="font-semibold text-neutral-900 mb-2">Ingen nøkkelordanalyse</h3>
          <p className="text-sm text-neutral-500 max-w-md mx-auto mb-4">
            Du la ikke til nøkkelord i den opprinnelige analysen.
          </p>
          {(isPremium || remainingKeywordUpdates > 0) && !editingKeywords && (
            <div className="flex items-center justify-center gap-3">
              <Button 
                variant="default" 
                onClick={suggestKeywords}
                disabled={suggestingKeywords}
                className="rounded-xl"
              >
                {suggestingKeywords ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyserer...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Foreslå nøkkelord
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={startEditingKeywords} className="rounded-xl">
                <Plus className="mr-2 h-4 w-4" />
                Legg til manuelt
                {!isPremium && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 text-xs">
                    {remainingKeywordUpdates}/{FREE_UPDATE_LIMIT}
                  </span>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
