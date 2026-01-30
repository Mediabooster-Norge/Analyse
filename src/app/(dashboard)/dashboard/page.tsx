'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { OverviewTab, CompetitorsTab, KeywordsTab, AiTab, AiVisibilityTab } from '@/components/features/dashboard/tabs';

function DashboardPageContent() {
  const searchParams = useSearchParams();
  const showNewDialog = searchParams.get('new') === 'true';
  const analysisIdFromUrl = searchParams.get('analysisId');

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
    suggestKeywords,
    fetchAISuggestion,
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
    { label: 'Henter nettside', description: 'Laster inn innhold fra nettsiden', duration: '~5s', icon: Globe },
    { label: 'Analyserer SEO', description: 'Sjekker meta-tags, overskrifter og lenker', duration: '~10s', icon: Search },
    { label: 'Sjekker sikkerhet', description: 'Analyserer SSL-sertifikat og headers', duration: '~15s', icon: Shield },
    { label: 'AI-synlighet', description: 'Sjekker om AI kjenner til bedriften din', duration: '~10s', icon: Eye },
    { label: 'Genererer rapport', description: 'AI analyserer funnene og lager anbefalinger', duration: '~20s', icon: Sparkles },
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            {userName ? `Hei, ${userName}` : 'Dashboard'}
          </h1>
          <p className="text-neutral-500">
            {result ? 'Se din analyse og anbefalinger' : 'Start en analyse for å komme i gang'}
          </p>
        </div>
        <AnalysisDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          trigger={
            <Button
              className="bg-neutral-900 hover:bg-neutral-800 text-white"
              disabled={!isPremium && remainingAnalyses === 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              Ny analyse
              {!isPremium && remainingAnalyses < FREE_MONTHLY_LIMIT && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
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
        />
      </div>

      {/* Monthly Usage & Premium Banner - Combined */}
      {isPremium ? (
        // Premium user - subtle inline indicator
        result ? (
          <div className="rounded-2xl bg-white border border-neutral-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-neutral-900">Premium</span>
                <span className="text-sm text-neutral-500">· Ubegrenset analyser</span>
              </div>
            </div>
          </div>
        ) : null
      ) : remainingAnalyses === 0 ? (
        <div className="rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 p-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Analyser brukt opp</h3>
                <p className="text-sm text-neutral-500">
                  Du har brukt {FREE_MONTHLY_LIMIT}/{FREE_MONTHLY_LIMIT} analyser denne måneden.
                </p>
                <div className="flex flex-wrap gap-3 mt-2">
                  <span className="text-xs text-neutral-500">Premium gir deg:</span>
                  <span className="inline-flex items-center gap-1 text-xs text-neutral-600">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />Ubegrenset
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-neutral-600">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />Flere sider
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-neutral-600">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />Flere konkurrenter
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-neutral-600">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />AI-synlighet
                  </span>
                </div>
              </div>
            </div>
            <Button asChild className="bg-neutral-900 hover:bg-neutral-800 text-white">
              <a href="https://mediabooster.no/kontakt" target="_blank" rel="noopener noreferrer">
                Oppgrader til Premium
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      ) : result ? (
        <div className="rounded-2xl bg-white border border-neutral-200 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-900">{remainingAnalyses}</span>
                <span className="text-sm text-neutral-500">av {FREE_MONTHLY_LIMIT} analyser igjen</span>
              </div>
              <div className="w-24 h-2 bg-neutral-100 rounded-full overflow-hidden">
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
              className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Oppgrader til ubegrenset →
            </a>
          </div>
        </div>
      ) : null}

      {/* Results or Empty State */}
      {result ? (
        <>
          {/* Tab Navigation */}
          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            competitorCount={result.competitors?.length}
          />

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <OverviewTab
              result={result}
              isPremium={isPremium}
              url={url}
              setUrl={setUrl}
              setDialogOpen={setDialogOpen}
              fetchAISuggestion={fetchAISuggestion}
              setActiveTab={setActiveTab}
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
