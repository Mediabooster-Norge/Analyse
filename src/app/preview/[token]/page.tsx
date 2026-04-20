'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { OverviewTab } from '@/components/features/dashboard/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { DashboardAnalysisResult } from '@/types/dashboard';

interface PublicAnalysisRaw {
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

function mapPublicAnalysis(raw: PublicAnalysisRaw): DashboardAnalysisResult {
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

export default function PublicPreviewPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params?.token;
  const [analysis, setAnalysis] = useState<PublicAnalysisRaw | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    async function init() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          router.replace(`/shared?token=${token}`);
          return;
        }

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

    init();
  }, [token, router]);

  if (loading) {
    return <div className="max-w-3xl mx-auto p-6">Laster delt analyse...</div>;
  }

  if (error || !analysis) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Lenken er ikke tilgjengelig</CardTitle>
            <CardDescription>{error || 'Lenken er ugyldig eller utløpt.'}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const result = mapPublicAnalysis(analysis);
  const analyzedUrl = analysis.websiteUrl || analysis.websiteName || '';

  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={0}>
      <div className="max-w-5xl mx-auto px-3 max-[400px]:px-3 min-[401px]:px-4 min-[450px]:px-5 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-8 space-y-4 max-[400px]:space-y-4 min-[401px]:space-y-6 sm:space-y-8">
        <div className="min-w-0">
          <h1 className="text-xl max-[400px]:text-lg min-[450px]:text-2xl font-semibold text-neutral-900 truncate">
            Delt analyse
          </h1>
          <p className="text-neutral-500 text-sm max-[400px]:text-xs truncate mt-0.5">
            Readonly forhåndsvisning av Nettside-fanen
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          For å få AI-forbedringsforslag når du trykker på kortene, må du ha en bruker.
          <Link href="/register" className="ml-1 underline font-medium">
            Opprett konto
          </Link>
        </div>

        <OverviewTab
          result={result}
          isPremium={true}
          url={analyzedUrl}
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
          aiVisibilityResult={result.aiVisibility ?? null}
        />
      </div>
    </TooltipProvider>
  );
}
