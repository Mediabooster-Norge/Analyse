'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboard } from '@/hooks/useDashboard';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  FileText,
  Clock,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Globe,
  Sparkles,
  Tag,
  X,
  ExternalLink,
  Link2,
  ChevronRight,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Eye,
  Lock,
  FileDown,
} from 'lucide-react';

// Extracted components
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ScoreRing,
  ActionPlanTabs,
  TabNavigation,
  DashboardEmptyState,
  AISuggestionDialog,
  AnalysisDialog,
  ANALYSIS_STEPS,
} from '@/components/features/dashboard';
import { downloadAnalysisReportPdf } from '@/components/features/dashboard/analysis-report-pdf';
import { OverviewTab, CompetitorsTab, KeywordsTab, AiTab, AiVisibilityTab, ArticlesTab } from '@/components/features/dashboard/tabs';

function DashboardPageContent() {
  const searchParams = useSearchParams();
  const showNewDialog = searchParams.get('new') === 'true';
  const analysisIdFromUrl = searchParams.get('analysisId');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const dashboard = useDashboard({ analysisIdFromUrl, showNewDialog });
  const {
    limits,
    result,
    loading,
    userName,
    dialogOpen,
    setDialogOpen,
    remainingAnalyses,
    isPremium,
    activeTab,
    setActiveTab,
    url,
    setUrl,
    companyUrl,
    companyName,
    competitorUrls,
    competitorInput,
    setCompetitorInput,
    keywords,
    keywordInput,
    setKeywordInput,
    suggestedKeywordCount,
    setSuggestedKeywordCount,
    suggestingKeywords,
    analyzing,
    analysisStep,
    elapsedTime,
    loadingPageSpeed,
    loadingCompetitors,
    competitorProgress,
    editCompetitorUrls,
    editCompetitorInput,
    setEditCompetitorInput,
    editKeywords,
    editKeywordInput,
    setEditKeywordInput,
    remainingCompetitorUpdates,
    remainingKeywordUpdates,
    editingCompetitors,
    editingKeywords,
    updatingCompetitors,
    updatingKeywords,
    keywordSort,
    setKeywordSort,
    competitorSort,
    setCompetitorSort,
    aiVisibilityResult,
    checkingAiVisibility,
    suggestionSheetOpen,
    setSuggestionSheetOpen,
    selectedElement,
    aiSuggestion,
    loadingSuggestion,
    addKeyword,
    removeKeyword,
    clearKeywords,
    addCompetitor,
    removeCompetitor,
    runAnalysis,
    openSubpageDialog,
    subpageUrl,
    suggestKeywords,
    fetchAISuggestion,
    articleSuggestions,
    loadingArticleSuggestions,
    articleSuggestionsSavedAt,
    fetchArticleSuggestions,
    remainingArticleGenerations,
    articleGenerationsLimit,
    generatedArticleResult,
    generatingArticleIndex,
    fetchGenerateArticle,
    setGeneratedArticle,
    analysisHistory,
    checkAiVisibility,
    startEditingCompetitors,
    addEditCompetitor,
    removeEditCompetitor,
    cancelEditingCompetitors,
    updateCompetitorAnalysis,
    startEditingKeywords,
    addEditKeyword,
    removeEditKeyword,
    cancelEditingKeywords,
    updateKeywordAnalysis,
  } = dashboard;

  const FREE_MONTHLY_LIMIT = limits.monthlyAnalyses;
  const FREE_KEYWORD_LIMIT = limits.keywords;
  const FREE_COMPETITOR_LIMIT = limits.competitors;
  const FREE_UPDATE_LIMIT = limits.updates;

  const analysisSteps = ANALYSIS_STEPS;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-neutral-900';
    if (score >= 70) return 'text-neutral-800';
    if (score >= 50) return 'text-neutral-700';
    return 'text-neutral-500';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'bg-green-50 text-green-700 border-green-200';
    if (score >= 70) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const getTrendIcon = (score: number) => {
    if (score >= 90) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (score >= 70) return <TrendingUp className="w-4 h-4 text-emerald-600" />;
    if (score >= 50) return <Minus className="w-4 h-4 text-amber-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };
  
  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Veldig bra';
    if (score >= 70) return 'Bra';
    if (score >= 50) return 'Ok';
    return 'Trenger forbedring';
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-neutral-200">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-[400px]:space-y-4 min-[401px]:space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 max-[400px]:gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 gap-y-1">
            <h1 className="text-xl max-[400px]:text-lg min-[450px]:text-2xl font-semibold text-neutral-900 truncate">
              {userName ? `Hei, ${userName}` : 'Dashboard'}
            </h1>
            {isPremium && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] sm:text-xs font-medium border border-amber-200/60">
                <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Premium
              </span>
            )}
          </div>
          <p className="text-neutral-500 text-sm max-[400px]:text-xs truncate mt-0.5">
            {result ? 'Se din analyse og anbefalinger' : 'Start en analyse for å komme i gang'}
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <AnalysisDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            trigger={
              <Button
                className="bg-neutral-900 hover:bg-neutral-800 text-white w-full sm:w-auto text-sm max-[400px]:text-xs max-[400px]:h-9"
                disabled={!isPremium && remainingAnalyses === 0}
              >
                <Plus className="mr-1.5 max-[400px]:mr-1 h-4 w-4 max-[400px]:h-3.5 max-[400px]:w-3.5" />
                Ny analyse
                {!isPremium && remainingAnalyses < FREE_MONTHLY_LIMIT && (
                  <span className="ml-1.5 max-[400px]:ml-1 px-1.5 max-[400px]:px-1 py-0.5 rounded-full bg-white/20 text-[10px] max-[400px]:text-[9px]">
                    {remainingAnalyses} igjen
                  </span>
                )}
              </Button>
            }
            analyzing={analyzing}
            analysisStep={analysisStep}
            analysisSteps={analysisSteps}
            elapsedTime={elapsedTime}
            url={url}
            setUrl={setUrl}
            companyUrl={companyUrl}
            companyName={companyName}
            competitorUrls={competitorUrls}
            competitorInput={competitorInput}
            setCompetitorInput={setCompetitorInput}
            addCompetitor={addCompetitor}
            removeCompetitor={removeCompetitor}
            keywords={keywords}
            keywordInput={keywordInput}
            setKeywordInput={setKeywordInput}
            addKeyword={addKeyword}
            removeKeyword={removeKeyword}
            clearKeywords={clearKeywords}
            suggestedKeywordCount={suggestedKeywordCount}
            setSuggestedKeywordCount={setSuggestedKeywordCount}
            suggestingKeywords={suggestingKeywords}
            suggestKeywords={suggestKeywords}
            FREE_COMPETITOR_LIMIT={FREE_COMPETITOR_LIMIT}
            FREE_KEYWORD_LIMIT={FREE_KEYWORD_LIMIT}
            onRunAnalysis={runAnalysis}
            loadingPageSpeed={loadingPageSpeed}
            loadingCompetitors={loadingCompetitors}
            competitorProgress={competitorProgress}
            isSubpageMode={!!subpageUrl}
          />
          {result && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-xl text-xs shrink-0 w-full sm:w-auto text-neutral-400 cursor-not-allowed"
              disabled
            >
              <FileDown className="h-3.5 w-3.5 mr-1.5" />
              Last ned rapport (PDF)
              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 text-[10px] font-medium">
                Kommer snart
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Inline analysis progress - shown when analyzing without dialog */}
      {analyzing && !dialogOpen && (
        <div className="rounded-2xl bg-white border border-neutral-200 p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="relative w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mb-4">
              <Loader2 className="h-6 w-6 text-neutral-600 animate-spin" />
            </div>
            <h3 className="font-semibold text-neutral-900 text-base mb-1">
              Analyserer nettside
            </h3>
            <p className="text-sm text-neutral-500 mb-4">{url || '—'}</p>
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span>Steg {analysisStep + 1} av {analysisSteps.length}</span>
              <span>·</span>
              <span>{analysisSteps[analysisStep]?.label || 'Forbereder...'}</span>
            </div>
            <div className="w-full max-w-xs mt-4">
              <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-neutral-900 rounded-full transition-all duration-500"
                  style={{ width: `${((analysisStep + 1) / analysisSteps.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Usage – kun for gratis-brukere */}
      {!isPremium && remainingAnalyses === 0 ? (
        <div className="rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 p-4 sm:p-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 text-center sm:text-left">
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 sm:w-6 h-5 sm:h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 text-sm sm:text-base">Analyser brukt opp</h3>
                <p className="text-xs sm:text-sm text-neutral-500">
                  Du har brukt {FREE_MONTHLY_LIMIT}/{FREE_MONTHLY_LIMIT} analyser denne måneden.
                </p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3 mt-2">
                  <span className="text-[10px] sm:text-xs text-neutral-500">Premium gir:</span>
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-neutral-600">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />Ubegrenset
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-neutral-600">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />Flere konkurrenter
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-neutral-600 hidden sm:inline-flex">
                    <Clock className="h-3 w-3 text-violet-500" />AI-synlighet (snart)
                  </span>
                </div>
              </div>
            </div>
            <Button asChild className="bg-neutral-900 hover:bg-neutral-800 text-white w-full sm:w-auto">
              <a href="https://mediabooster.no/kontakt" target="_blank" rel="noopener noreferrer">
                Oppgrader til Premium
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      ) : !isPremium && result ? (
        <div className="rounded-xl bg-neutral-50 border border-neutral-100 px-3 py-2 flex flex-wrap items-center gap-2 gap-y-1">
          <span className="text-xs font-medium text-neutral-700">{remainingAnalyses} av {FREE_MONTHLY_LIMIT} igjen</span>
          <div className="flex-1 min-w-[80px] max-w-[120px] h-1.5 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${remainingAnalyses <= 1 ? 'bg-amber-500' : 'bg-neutral-700'}`}
              style={{ width: `${(remainingAnalyses / FREE_MONTHLY_LIMIT) * 100}%` }}
            />
          </div>
          <a
            href="https://mediabooster.no/kontakt"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-neutral-500 hover:text-neutral-800"
          >
            Oppgrader →
          </a>
        </div>
      ) : null}

      {/* Results or Empty State */}
      {result ? (
        <>
          {/* Analyser en annen side – øverst over fanene (kun Premium) */}
          {isPremium && (() => {
            const normalizePathForCompare = (path: string): string => {
              try {
                const decoded = decodeURIComponent(path);
                const segments = decoded.split('/').filter(Boolean);
                const normalized = segments
                  .map((s) => s.trim().replace(/\s+/g, '-').toLowerCase())
                  .join('/');
                return '/' + normalized || '/';
              } catch {
                return path.replace(/\/$/, '') || '/';
              }
            };
            const internalUrls = result.seoResults.links.internal?.urls ?? [];
            let currentPathNorm = '/';
            let baseUrl = url;
            try {
              const parsed = new URL(url);
              const raw = (parsed.pathname || '/').replace(/\/$/, '') || '/';
              baseUrl = parsed.origin;
              currentPathNorm = normalizePathForCompare(raw);
            } catch { /* ignore */ }
            const toPath = (p: string): string => {
              if (!p) return '/';
              try {
                if (p.startsWith('http://') || p.startsWith('https://')) {
                  const u = new URL(p);
                  return normalizePathForCompare((u.pathname || '/').replace(/\/$/, '') || '/');
                }
                const path = (p.startsWith('/') ? p : `/${p}`).replace(/\/$/, '') || '/';
                return normalizePathForCompare(path);
              } catch {
                return normalizePathForCompare((p.startsWith('/') ? p : `/${p}`).replace(/\/$/, '') || '/');
              }
            };
            const suggested = internalUrls.filter((p): p is string => !!p && toPath(p) !== currentPathNorm);
            return (
              <Accordion type="single" collapsible defaultValue="" className="rounded-2xl border border-blue-200/60 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 overflow-hidden mb-4">
                <AccordionItem value="analyser" className="border-none">
                  <AccordionTrigger className="px-3 sm:px-4 py-3 hover:no-underline hover:from-blue-50/80 hover:to-indigo-50/50 [&[data-state=open]]:border-b [&[data-state=open]]:border-blue-100/60">
                    <span className="font-medium text-neutral-900 flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center shrink-0">
                        <Link2 className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <span>
                        Analyser en annen side på samme domene
                        <span className="block text-xs font-normal text-neutral-500 mt-0.5">Sammenlign undersider med SEO og innholdsanalyse</span>
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="p-3 sm:p-4 pt-0 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1 flex">
                      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-neutral-200 bg-neutral-50 text-neutral-500 text-sm select-none whitespace-nowrap">
                        {baseUrl}
                      </span>
                      <input
                        type="text"
                        placeholder="/din-side"
                        className="flex-1 min-w-0 h-9 px-3 rounded-r-lg border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:border-transparent"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const pathInput = e.currentTarget.value.trim();
                            if (pathInput) {
                              const cleanPath = pathInput.startsWith('/') ? pathInput : `/${pathInput}`;
                              openSubpageDialog(`${baseUrl}${cleanPath}`);
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 rounded-lg w-full sm:w-auto"
                      onClick={(e) => {
                        const container = e.currentTarget.parentElement;
                        const input = container?.querySelector('input') as HTMLInputElement | null;
                        const pathInput = input?.value.trim();
                        if (pathInput) {
                          const cleanPath = pathInput.startsWith('/') ? pathInput : `/${pathInput}`;
                          openSubpageDialog(`${baseUrl}${cleanPath}`);
                          if (input) input.value = '';
                        }
                      }}
                    >
                      Analyser
                    </Button>
                  </div>
                  {suggested.length > 0 && (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-neutral-100" />
                        <span className="text-[10px] text-neutral-400">eller velg fra {suggested.length} funnet</span>
                        <div className="h-px flex-1 bg-neutral-100" />
                      </div>
                      <div className="grid grid-cols-1 min-[401px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5">
                        {suggested.slice(0, 10).map((pathname) => {
                          let fullUrl = '';
                          let label = pathname;
                          try {
                            if (pathname.startsWith('http://') || pathname.startsWith('https://')) {
                              fullUrl = pathname;
                              const parsedUrl = new URL(pathname);
                              label = parsedUrl.pathname === '/' ? 'Forside' : parsedUrl.pathname.replace(/^\//, '').replace(/-/g, ' ') || parsedUrl.hostname;
                            } else {
                              fullUrl = `${baseUrl}${pathname.startsWith('/') ? '' : '/'}${pathname}`;
                              label = pathname === '/' ? 'Forside' : pathname.replace(/^\//, '').replace(/-/g, ' ') || pathname;
                            }
                          } catch {
                            fullUrl = `${baseUrl}${pathname.startsWith('/') ? '' : '/'}${pathname}`;
                            label = pathname.replace(/^\//, '').replace(/-/g, ' ') || pathname;
                          }
                          return (
                            <button
                              key={pathname}
                              type="button"
                              onClick={() => openSubpageDialog(fullUrl)}
                              className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-white hover:bg-neutral-50 border border-neutral-200/60 hover:border-neutral-300 transition-all text-left group cursor-pointer shadow-sm"
                              title={fullUrl}
                            >
                              <span className="text-xs text-neutral-600 truncate flex-1 group-hover:text-neutral-900">{label}</span>
                              <ChevronRight className="w-3 h-3 text-neutral-400 group-hover:text-neutral-600 shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                      {suggested.length > 10 && (
                        <p className="text-[10px] text-neutral-400 text-center">+{suggested.length - 10} flere</p>
                      )}
                    </>
                  )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            );
          })()}

          {/* Hvilken side som er analysert – synlig på alle faner */}
          <div className="flex items-center gap-2 py-2 px-0">
            <Globe className="h-4 w-4 text-neutral-400 shrink-0" />
            <span className="text-xs text-neutral-500 truncate min-w-0">Analysert:</span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-neutral-700 hover:text-neutral-900 truncate min-w-0 underline decoration-neutral-300 hover:decoration-neutral-500"
            >
              {url}
            </a>
            <ExternalLink className="h-3 w-3 text-neutral-400 shrink-0" />
          </div>

          {/* Tab Navigation */}
          <div className="mb-4">
            <TabNavigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
              competitorCount={result.competitors?.length}
            />
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <OverviewTab
              result={result}
              isPremium={isPremium}
              url={url}
              openSubpageDialog={openSubpageDialog}
              fetchAISuggestion={fetchAISuggestion}
              setActiveTab={setActiveTab}
              articleSuggestions={articleSuggestions}
              loadingArticleSuggestions={loadingArticleSuggestions}
              articleSuggestionsSavedAt={articleSuggestionsSavedAt}
              fetchArticleSuggestions={fetchArticleSuggestions}
              hasCompetitors={Boolean(result?.competitors?.length)}
              remainingArticleGenerations={remainingArticleGenerations}
              articleGenerationsLimit={articleGenerationsLimit}
              generatedArticleResult={generatedArticleResult}
              generatingArticleIndex={generatingArticleIndex}
              fetchGenerateArticle={fetchGenerateArticle}
              setGeneratedArticle={setGeneratedArticle}
              analysisHistory={analysisHistory}
              loadingPageSpeed={loadingPageSpeed}
            />
          )}

          {activeTab === 'competitors' && (
            <CompetitorsTab
              result={result}
              isPremium={isPremium}
              companyUrl={companyUrl}
              url={url}
              companyName={companyName}
              editingCompetitors={editingCompetitors}
              editCompetitorUrls={editCompetitorUrls}
              editCompetitorInput={editCompetitorInput}
              setEditCompetitorInput={setEditCompetitorInput}
              remainingCompetitorUpdates={remainingCompetitorUpdates}
              FREE_COMPETITOR_LIMIT={FREE_COMPETITOR_LIMIT}
              FREE_UPDATE_LIMIT={FREE_UPDATE_LIMIT}
              competitorSort={competitorSort}
              setCompetitorSort={setCompetitorSort}
              updatingCompetitors={updatingCompetitors}
              startEditingCompetitors={startEditingCompetitors}
              addEditCompetitor={addEditCompetitor}
              removeEditCompetitor={removeEditCompetitor}
              cancelEditingCompetitors={cancelEditingCompetitors}
              updateCompetitorAnalysis={updateCompetitorAnalysis}
            />
          )}

          {activeTab === 'keywords' && (
            <KeywordsTab
              result={result}
              isPremium={isPremium}
              editingKeywords={editingKeywords}
              editKeywords={editKeywords}
              editKeywordInput={editKeywordInput}
              setEditKeywordInput={setEditKeywordInput}
              remainingKeywordUpdates={remainingKeywordUpdates}
              FREE_KEYWORD_LIMIT={FREE_KEYWORD_LIMIT}
              FREE_UPDATE_LIMIT={FREE_UPDATE_LIMIT}
              keywordSort={keywordSort}
              setKeywordSort={setKeywordSort}
              updatingKeywords={updatingKeywords}
              startEditingKeywords={startEditingKeywords}
              addEditKeyword={addEditKeyword}
              removeEditKeyword={removeEditKeyword}
              cancelEditingKeywords={cancelEditingKeywords}
              updateKeywordAnalysis={updateKeywordAnalysis}
              suggestKeywords={suggestKeywords}
              suggestingKeywords={suggestingKeywords}
            />
          )}

          {activeTab === 'ai' && (
            <AiTab result={result} fetchAISuggestion={fetchAISuggestion} />
          )}

          {activeTab === 'ai-visibility' && (
            <AiVisibilityTab
              result={result}
              isPremium={isPremium}
              aiVisibilityResult={aiVisibilityResult}
              companyUrl={companyUrl}
              url={url}
              companyName={companyName}
              checkingAiVisibility={checkingAiVisibility}
              onCheckAiVisibility={checkAiVisibility}
            />
          )}

          {activeTab === 'articles' && (
            <ArticlesTab
              articleSuggestions={articleSuggestions}
              loadingArticleSuggestions={loadingArticleSuggestions}
              articleSuggestionsSavedAt={articleSuggestionsSavedAt}
              fetchArticleSuggestions={fetchArticleSuggestions}
              hasCompetitors={Boolean(result?.competitors?.length)}
              remainingArticleGenerations={remainingArticleGenerations}
              articleGenerationsLimit={articleGenerationsLimit}
              generatedArticleResult={generatedArticleResult}
              generatingArticleIndex={generatingArticleIndex}
              fetchGenerateArticle={fetchGenerateArticle}
              setGeneratedArticle={setGeneratedArticle}
            />
          )}
        </>
      ) : (
        <DashboardEmptyState
          isPremium={isPremium}
          monthlyLimit={FREE_MONTHLY_LIMIT}
          onStartAnalysis={() => setDialogOpen(true)}
        />
      )}

      {/* Help section */}
      <div className="text-center py-6 border-t border-neutral-200 mt-8">
        <p className="text-sm text-neutral-500">
          Trenger du hjelp med verktøyet?{' '}
          <a 
            href="https://mediabooster.no/kontakt" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-neutral-700 hover:text-neutral-900 underline cursor-pointer"
          >
            Kontakt oss
          </a>
        </p>
      </div>

      <AISuggestionDialog
        open={suggestionSheetOpen}
        onOpenChange={setSuggestionSheetOpen}
        selectedElement={selectedElement}
        aiSuggestion={aiSuggestion}
        loadingSuggestion={loadingSuggestion}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-neutral-200">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    }>
      <DashboardPageContent />
    </Suspense>
  );
}
