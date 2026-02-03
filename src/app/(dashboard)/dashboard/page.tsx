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
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  FileText,
  Shield,
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
  Zap,
  FileDown,
} from 'lucide-react';

// Extracted components
import {
  ScoreRing,
  ActionPlanTabs,
  TabNavigation,
  DashboardEmptyState,
  AISuggestionDialog,
  AnalysisDialog,
} from '@/components/features/dashboard';
import { downloadAnalysisReportPdf } from '@/components/features/dashboard/analysis-report-pdf';
import { OverviewTab, CompetitorsTab, KeywordsTab, AiTab, AiVisibilityTab } from '@/components/features/dashboard/tabs';

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

  const analysisSteps = [
    { label: 'Henter nettside', description: 'Laster inn og scraper innhold fra nettsiden', duration: '~5s', icon: Globe },
    { label: 'Analyserer SEO', description: 'Sjekker meta-tags, overskrifter, lenker og innhold', duration: '~10s', icon: Search },
    { label: 'Sjekker sikkerhet', description: 'Tester SSL-sertifikat og sikkerhetsheaders', duration: '~15s', icon: Shield },
    { label: 'Måler ytelse', description: 'Henter Google PageSpeed-score og Core Web Vitals', duration: '~30s', icon: Zap },
    { label: 'Genererer rapport', description: 'AI sammenligner resultater og lager anbefalinger', duration: '~20s', icon: Sparkles },
  ];

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
          <h1 className="text-xl max-[400px]:text-lg min-[450px]:text-2xl font-semibold text-neutral-900 truncate">
            {userName ? `Hei, ${userName}` : 'Dashboard'}
          </h1>
          <p className="text-neutral-500 text-sm max-[400px]:text-xs truncate">
            {result ? 'Se din analyse og anbefalinger' : 'Start en analyse for å komme i gang'}
          </p>
        </div>
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
          isSubpageMode={!!subpageUrl}
        />
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

      {/* Monthly Usage & Premium Banner - Combined */}
      {isPremium ? (
        // Premium user - subtle inline indicator
        result ? (
          <div className="rounded-2xl bg-white border border-neutral-200 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs sm:text-sm font-medium text-neutral-900">Premium</span>
                <span className="text-xs sm:text-sm text-neutral-500 hidden sm:inline">· Ubegrenset analyser</span>
              </div>
            </div>
          </div>
        ) : null
      ) : remainingAnalyses === 0 ? (
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
      ) : result ? (
        <div className="rounded-2xl bg-white border border-neutral-200 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-medium text-neutral-900">{remainingAnalyses}</span>
                <span className="text-xs sm:text-sm text-neutral-500">av {FREE_MONTHLY_LIMIT} igjen</span>
              </div>
              <div className="flex-1 sm:flex-none sm:w-24 h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${remainingAnalyses <= 1 ? 'bg-amber-500' : 'bg-neutral-900'}`}
                  style={{ width: `${(remainingAnalyses / FREE_MONTHLY_LIMIT) * 100}%` }}
                />
              </div>
            </div>
            <a 
              href="https://mediabooster.no/kontakt" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs sm:text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Oppgrader til ubegrenset →
            </a>
          </div>
        </div>
      ) : null}

      {/* Results or Empty State */}
      {result ? (
        <>
          {/* Tab Navigation + PDF download */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <TabNavigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
              competitorCount={result.competitors?.length}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl text-xs shrink-0 w-full sm:w-auto"
              disabled={downloadingPdf}
              onClick={async () => {
                setDownloadingPdf(true);
                try {
                  await downloadAnalysisReportPdf({
                    result,
                    companyUrl: companyUrl || url || '',
                    companyName: companyName || null,
                  });
                  toast.success('Rapport lastet ned');
                } catch {
                  toast.error('Kunne ikke generere PDF');
                } finally {
                  setDownloadingPdf(false);
                }
              }}
            >
              {downloadingPdf ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Genererer…
                </>
              ) : (
                <>
                  <FileDown className="h-3.5 w-3.5 mr-1.5" />
                  Last ned rapport (PDF)
                </>
              )}
            </Button>
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
        </>
      ) : (
        <DashboardEmptyState
          isPremium={isPremium}
          monthlyLimit={FREE_MONTHLY_LIMIT}
          onStartAnalysis={() => setDialogOpen(true)}
        />
      )}

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
