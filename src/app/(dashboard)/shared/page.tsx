'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TooltipProvider } from '@/components/ui/tooltip';
import { OverviewTab } from '@/components/features/dashboard/tabs';
import type { DashboardAnalysisResult } from '@/types/dashboard';

interface SharedAnalysis {
  id: string;
  websiteUrl: string | null;
  websiteName: string | null;
  overallScore: number;
  seoResults: Record<string, unknown> | null;
  contentResults: Record<string, unknown> | null;
  securityResults: Record<string, unknown> | null;
  pageSpeedResults: Record<string, unknown> | null;
  aiVisibility: DashboardAnalysisResult['aiVisibility'] | null;
  createdAt: string;
}

const defaultSeoResults: DashboardAnalysisResult['seoResults'] = {
  score: 0,
  meta: {
    title: { content: null, length: 0, isOptimal: false },
    description: { content: null, length: 0, isOptimal: false },
    ogTags: { title: null, description: null, image: null },
    canonical: null,
  },
  headings: { h1: { count: 0, contents: [] }, h2: { count: 0, contents: [] }, hasProperHierarchy: false },
  images: { total: 0, withAlt: 0, withoutAlt: 0 },
  links: { internal: { count: 0, urls: [] }, external: { count: 0 } },
};

const defaultSecurityResults: DashboardAnalysisResult['securityResults'] = {
  score: 0,
  ssl: { grade: 'Unknown', certificate: { daysUntilExpiry: null } },
  headers: {
    contentSecurityPolicy: false,
    strictTransportSecurity: false,
    xFrameOptions: false,
    xContentTypeOptions: false,
    referrerPolicy: false,
    permissionsPolicy: false,
    score: 0,
  },
  observatory: { grade: 'Unknown', score: 0 },
};

function mapSharedAnalysis(raw: SharedAnalysis): DashboardAnalysisResult {
  const seoRaw = (raw.seoResults || {}) as Partial<DashboardAnalysisResult['seoResults']>;
  const securityRaw = (raw.securityResults || {}) as Partial<DashboardAnalysisResult['securityResults']>;
  const contentRaw = (raw.contentResults || {}) as Partial<DashboardAnalysisResult['contentResults']>;

  return {
    seoResults: {
      score: seoRaw.score ?? 0,
      meta: {
        title: { ...defaultSeoResults.meta.title, ...(seoRaw.meta?.title || {}) },
        description: { ...defaultSeoResults.meta.description, ...(seoRaw.meta?.description || {}) },
        ogTags: { ...defaultSeoResults.meta.ogTags, ...(seoRaw.meta?.ogTags || {}) },
        canonical: seoRaw.meta?.canonical ?? defaultSeoResults.meta.canonical,
      },
      headings: {
        h1: { ...defaultSeoResults.headings.h1, ...(seoRaw.headings?.h1 || {}) },
        h2: { ...defaultSeoResults.headings.h2, ...(seoRaw.headings?.h2 || {}) },
        hasProperHierarchy: seoRaw.headings?.hasProperHierarchy ?? defaultSeoResults.headings.hasProperHierarchy,
      },
      images: { ...defaultSeoResults.images, ...(seoRaw.images || {}) },
      links: {
        internal: { ...defaultSeoResults.links.internal, ...(seoRaw.links?.internal || {}) },
        external: { ...defaultSeoResults.links.external, ...(seoRaw.links?.external || {}) },
      },
    },
    contentResults: {
      score: contentRaw.score ?? 0,
      wordCount: contentRaw.wordCount ?? 0,
      keywords: contentRaw.keywords,
      readability: contentRaw.readability,
    },
    securityResults: {
      score: securityRaw.score ?? 0,
      ssl: { ...defaultSecurityResults.ssl, ...(securityRaw.ssl || {}) },
      headers: { ...defaultSecurityResults.headers, ...(securityRaw.headers || {}) },
      observatory: { ...defaultSecurityResults.observatory, ...(securityRaw.observatory || {}) },
    },
    pageSpeedResults: (raw.pageSpeedResults || undefined) as DashboardAnalysisResult['pageSpeedResults'],
    overallScore: raw.overallScore ?? 0,
    aiVisibility: raw.aiVisibility || undefined,
  };
}

function SharedAnalysesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const [tokenInput, setTokenInput] = useState(tokenFromUrl);
  const [analysis, setAnalysis] = useState<SharedAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeToken = useMemo(() => tokenFromUrl || tokenInput.trim(), [tokenFromUrl, tokenInput]);

  const loadSharedAnalysis = async (token: string) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/shared/analysis/${token}`);
      const data = await res.json();
      if (!res.ok) {
        setAnalysis(null);
        setError(data.error || 'Kunne ikke laste delt analyse');
        return;
      }
      setAnalysis(data.analysis);
      if (tokenFromUrl !== token) {
        router.replace(`/shared?token=${encodeURIComponent(token)}`);
      }
    } catch {
      setAnalysis(null);
      setError('Kunne ikke laste delt analyse');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokenFromUrl) {
      void loadSharedAnalysis(tokenFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenFromUrl]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Delte analyser</h1>
        <p className="text-neutral-500">Lim inn token fra delt lenke for å åpne full readonly analyse.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Åpne delt analyse</CardTitle>
          <CardDescription>Eksempel på lenke: /preview/abc123... bruk token-delen.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2">
          <Input
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Lim inn token"
          />
          <Button onClick={() => loadSharedAnalysis(tokenInput.trim())} disabled={loading || !tokenInput.trim()}>
            {loading ? 'Laster...' : 'Åpne'}
          </Button>
          {tokenFromUrl ? (
            <Button variant="outline" onClick={() => loadSharedAnalysis(activeToken)} disabled={loading}>
              Last fra URL
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Kunne ikke åpne delt analyse</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {analysis ? (
        <TooltipProvider delayDuration={300} skipDelayDuration={0}>
          <OverviewTab
            result={mapSharedAnalysis(analysis)}
            isPremium={true}
            url={analysis.websiteUrl || analysis.websiteName || ''}
            openSubpageDialog={() => {}}
            fetchAISuggestion={() => {}}
            setActiveTab={() => {}}
            articleSuggestions={null}
            loadingArticleSuggestions={false}
            articleSuggestionsSavedAt={null}
            fetchArticleSuggestions={() => {}}
            hasCompetitors={false}
            remainingArticleGenerations={0}
            articleGenerationsLimit={0}
            generatedArticleResult={null}
            generatingArticleIndex={null}
            fetchGenerateArticle={() => {}}
            setGeneratedArticle={() => {}}
            analysisHistory={[]}
            loadingPageSpeed={false}
            aiVisibilityResult={analysis.aiVisibility ?? null}
          />
        </TooltipProvider>
      ) : null}
    </div>
  );
}

export default function SharedAnalysesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-neutral-500">Laster delte analyser...</div>}>
      <SharedAnalysesPageContent />
    </Suspense>
  );
}
