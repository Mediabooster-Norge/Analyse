'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Globe, ExternalLink } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OverviewTab, CompetitorsTab, KeywordsTab } from '@/components/features/dashboard/tabs';
import { TabNavigation } from '@/components/features/dashboard/tab-navigation';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { SharedAnalysisPayload } from '@/lib/analysis-share';
import type { CompetitorSort, DashboardTab, KeywordSort } from '@/types/dashboard';
import { getSharedVisibleTabs, mapSharedAnalysisPayload } from '@/lib/map-shared-analysis';

export default function PublicPreviewPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;
  const [analysis, setAnalysis] = useState<SharedAnalysisPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [competitorSort, setCompetitorSort] = useState<CompetitorSort | null>(null);
  const [keywordSort, setKeywordSort] = useState<KeywordSort | null>(null);

  useEffect(() => {
    if (!token) return;

    async function load() {
      try {
        const res = await fetch(`/api/public/analysis/${token}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Kunne ikke laste delt analyse');
          return;
        }
        setAnalysis(data.analysis);
      } catch {
        setError('Kunne ikke laste delt analyse');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [token]);

  const visibleTabs = useMemo(
    () => (analysis ? getSharedVisibleTabs(analysis) : ['overview']),
    [analysis]
  );

  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) {
      setActiveTab('overview');
    }
  }, [activeTab, visibleTabs]);

  if (loading) {
    return <div className="max-w-3xl mx-auto p-6">Laster delt analyse...</div>;
  }

  if (error || !analysis) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Lenken er ikke tilgjengelig</CardTitle>
            <CardDescription>{error || 'Lenken er ugyldig eller deaktivert.'}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const result = mapSharedAnalysisPayload(analysis);
  const analyzedUrl = analysis.websiteUrl || analysis.websiteName || '';
  const hasCompetitors = Boolean(result.competitors?.length);
  const hasKeywords = Boolean(result.keywordResearch?.length);

  const sharedTabProps = {
    result,
    isPremium: false,
    readOnly: true as const,
  };

  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={0}>
      <div className="max-w-5xl mx-auto px-3 max-[400px]:px-3 min-[401px]:px-4 min-[450px]:px-5 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-8 space-y-4 max-[400px]:space-y-4 min-[401px]:space-y-6 sm:space-y-8">
        <div className="min-w-0">
          <h1 className="text-xl max-[400px]:text-lg min-[450px]:text-2xl font-semibold text-neutral-900 truncate">
            Delt analyse
          </h1>
          <p className="text-neutral-500 text-sm max-[400px]:text-xs truncate mt-0.5">
            Readonly forhåndsvisning
            {hasCompetitors || hasKeywords
              ? ' av nettside, konkurrenter og nøkkelord'
              : ' av nettside-fanen'}
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          For å få AI-forbedringsforslag og full tilgang, må du ha en bruker.
          <Link href="/register" className="ml-1 underline font-medium">
            Opprett konto
          </Link>
        </div>

        {analyzedUrl ? (
          <div className="flex items-center gap-2 py-1">
            <Globe className="h-4 w-4 text-neutral-400 shrink-0" />
            <span className="text-xs text-neutral-500 shrink-0">Analysert:</span>
            <a
              href={analyzedUrl.startsWith('http') ? analyzedUrl : `https://${analyzedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-neutral-700 hover:text-neutral-900 truncate min-w-0 underline decoration-neutral-300 hover:decoration-neutral-500"
            >
              {analyzedUrl}
            </a>
            <ExternalLink className="h-3 w-3 text-neutral-400 shrink-0" />
          </div>
        ) : null}

        {visibleTabs.length > 1 ? (
          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            competitorCount={result.competitors?.length}
            keywordCount={result.keywordResearch?.length}
            visibleTabs={visibleTabs}
          />
        ) : null}

        {activeTab === 'overview' && (
          <OverviewTab
            {...sharedTabProps}
            url={analyzedUrl}
            openSubpageDialog={() => {}}
            fetchAISuggestion={() => {}}
            setActiveTab={setActiveTab}
            articleSuggestions={null}
            loadingArticleSuggestions={false}
            articleSuggestionsSavedAt={null}
            fetchArticleSuggestions={() => {}}
            hasCompetitors={hasCompetitors}
            remainingArticleGenerations={0}
            articleGenerationsLimit={0}
            generatedArticleResult={null}
            generatingArticleIndex={null}
            fetchGenerateArticle={() => {}}
            setGeneratedArticle={() => {}}
            analysisHistory={[]}
            loadingPageSpeed={false}
            aiVisibilityResult={result.aiVisibility ?? null}
          />
        )}

        {activeTab === 'competitors' && hasCompetitors && (
          <CompetitorsTab
            {...sharedTabProps}
            companyUrl={null}
            url={analyzedUrl}
            companyName={analysis.websiteName}
            editingCompetitors={false}
            editCompetitorUrls={[]}
            editCompetitorInput=""
            setEditCompetitorInput={() => {}}
            remainingCompetitorUpdates={0}
            FREE_COMPETITOR_LIMIT={0}
            FREE_UPDATE_LIMIT={0}
            competitorSort={competitorSort}
            setCompetitorSort={setCompetitorSort}
            updatingCompetitors={false}
            startEditingCompetitors={() => {}}
            addEditCompetitor={() => {}}
            removeEditCompetitor={() => {}}
            cancelEditingCompetitors={() => {}}
            updateCompetitorAnalysis={() => {}}
          />
        )}

        {activeTab === 'keywords' && hasKeywords && (
          <KeywordsTab
            {...sharedTabProps}
            editingKeywords={false}
            editKeywords={[]}
            editKeywordInput=""
            setEditKeywordInput={() => {}}
            remainingKeywordUpdates={0}
            FREE_KEYWORD_LIMIT={0}
            FREE_UPDATE_LIMIT={0}
            keywordSort={keywordSort}
            setKeywordSort={setKeywordSort}
            updatingKeywords={false}
            startEditingKeywords={() => {}}
            addEditKeyword={() => {}}
            removeEditKeyword={() => {}}
            cancelEditingKeywords={() => {}}
            updateKeywordAnalysis={() => {}}
            suggestKeywords={() => {}}
            suggestingKeywords={false}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
