import type { DashboardAnalysisResult } from '@/types/dashboard';
import type { SharedAnalysisPayload } from '@/lib/analysis-share';

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

export function mapSharedAnalysisPayload(raw: SharedAnalysisPayload): DashboardAnalysisResult {
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
    aiVisibility: (raw.aiVisibility || undefined) as DashboardAnalysisResult['aiVisibility'],
    competitors: (raw.competitorResults || undefined) as DashboardAnalysisResult['competitors'],
    keywordResearch: (raw.keywordResearch || undefined) as DashboardAnalysisResult['keywordResearch'],
  };
}

export function getSharedVisibleTabs(
  payload: SharedAnalysisPayload
): Array<'overview' | 'competitors' | 'keywords'> {
  const tabs: Array<'overview' | 'competitors' | 'keywords'> = ['overview'];
  if (Array.isArray(payload.competitorResults) && payload.competitorResults.length > 0) {
    tabs.push('competitors');
  }
  if (Array.isArray(payload.keywordResearch) && payload.keywordResearch.length > 0) {
    tabs.push('keywords');
  }
  return tabs;
}
