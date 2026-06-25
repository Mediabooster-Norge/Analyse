import { createHash, randomBytes } from 'crypto';
import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { DashboardAnalysisResult } from '@/types/dashboard';

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

const PREVIEW_TTL_HOURS = 24;
const MAX_PREVIEWS_PER_IP_PER_DAY = 5;

export function generatePreviewToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashPreviewToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function hashClientIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex');
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPreviewRowToResult(row: Record<string, any>): DashboardAnalysisResult {
  const mergedSecurityResults = row.security_results
    ? {
        score: clampScore(row.security_results.score ?? defaultSecurityResults.score),
        ssl: { ...defaultSecurityResults.ssl, ...(row.security_results.ssl || {}) },
        headers: {
          ...defaultSecurityResults.headers,
          ...(row.security_results.headers || {}),
        },
        observatory: {
          ...defaultSecurityResults.observatory,
          ...(row.security_results.observatory || {}),
        },
      }
    : defaultSecurityResults;

  const mergedSeoResults = row.seo_results
    ? {
        score: clampScore(row.seo_results.score ?? defaultSeoResults.score),
        meta: {
          title: { ...defaultSeoResults.meta.title, ...(row.seo_results.meta?.title || {}) },
          description: {
            ...defaultSeoResults.meta.description,
            ...(row.seo_results.meta?.description || {}),
          },
          ogTags: { ...defaultSeoResults.meta.ogTags, ...(row.seo_results.meta?.ogTags || {}) },
          canonical: row.seo_results.meta?.canonical ?? defaultSeoResults.meta.canonical,
        },
        headings: {
          h1: { ...defaultSeoResults.headings.h1, ...(row.seo_results.headings?.h1 || {}) },
          h2: { ...defaultSeoResults.headings.h2, ...(row.seo_results.headings?.h2 || {}) },
          hasProperHierarchy:
            row.seo_results.headings?.hasProperHierarchy ??
            defaultSeoResults.headings.hasProperHierarchy,
        },
        images: { ...defaultSeoResults.images, ...(row.seo_results.images || {}) },
        links: {
          internal: {
            ...defaultSeoResults.links.internal,
            ...(row.seo_results.links?.internal || {}),
          },
          external: {
            ...defaultSeoResults.links.external,
            ...(row.seo_results.links?.external || {}),
          },
        },
        structuredData: row.seo_results.structuredData ?? undefined,
      }
    : defaultSeoResults;

  const contentResults = row.content_results
    ? { ...row.content_results, score: clampScore(row.content_results.score ?? 0) }
    : { score: 0, wordCount: 0 };

  return {
    seoResults: mergedSeoResults,
    contentResults,
    securityResults: mergedSecurityResults,
    pageSpeedResults: row.pagespeed_results
      ? {
          ...row.pagespeed_results,
          performance: clampScore(row.pagespeed_results.performance ?? 0),
        }
      : undefined,
    overallScore: clampScore(row.overall_score ?? 0),
    accessibility: row.accessibility_results ?? undefined,
  };
}

export interface PreviewAnalysisPayload {
  token: string;
  websiteUrl: string;
  websiteName: string | null;
  overallScore: number;
  result: DashboardAnalysisResult;
  expiresAt: string;
  claimed: boolean;
}

export async function countRecentPreviewsForIp(ipHash: string): Promise<number> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from('preview_analyses')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', since);
  return count ?? 0;
}

export function isPreviewRateLimited(count: number): boolean {
  return count >= MAX_PREVIEWS_PER_IP_PER_DAY;
}

export async function savePreviewAnalysis(params: {
  token: string;
  websiteUrl: string;
  websiteName: string;
  overallScore: number;
  seoResults: unknown;
  contentResults: unknown;
  securityResults: unknown;
  pagespeedResults?: unknown;
  accessibilityResults?: unknown;
  ipHash?: string;
}) {
  const admin = createAdminClient();
  const expiresAt = new Date(Date.now() + PREVIEW_TTL_HOURS * 60 * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from('preview_analyses')
    .insert({
      token: params.token,
      token_hash: hashPreviewToken(params.token),
      website_url: params.websiteUrl,
      website_name: params.websiteName,
      overall_score: params.overallScore,
      seo_results: params.seoResults,
      content_results: params.contentResults,
      security_results: params.securityResults,
      pagespeed_results: params.pagespeedResults ?? null,
      accessibility_results: params.accessibilityResults ?? null,
      ip_hash: params.ipHash ?? null,
      expires_at: expiresAt,
    })
    .select('id, expires_at')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to save preview analysis');
  }

  return { id: data.id as string, expiresAt: data.expires_at as string };
}

export async function getPreviewByToken(token: string): Promise<PreviewAnalysisPayload | null> {
  const admin = createAdminClient();
  const tokenHash = hashPreviewToken(token);

  let { data: row } = await admin
    .from('preview_analyses')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (!row) {
    const { data: legacyRow } = await admin
      .from('preview_analyses')
      .select('*')
      .eq('token_hash', tokenHash)
      .maybeSingle();
    row = legacyRow;
  }

  if (!row) return null;

  if (new Date(row.expires_at as string).getTime() < Date.now()) {
    return null;
  }

  return {
    token,
    websiteUrl: row.website_url as string,
    websiteName: (row.website_name as string | null) ?? null,
    overallScore: row.overall_score as number,
    result: mapPreviewRowToResult(row),
    expiresAt: row.expires_at as string,
    claimed: Boolean(row.claimed_by),
  };
}

export async function claimPreviewAnalysis(
  token: string,
  userId: string
): Promise<{ analysisId: string } | { error: string; status: number }> {
  const admin = createAdminClient();
  const preview = await getPreviewByToken(token);

  if (!preview) {
    return { error: 'Forhåndsvisningen er utløpt eller ugyldig', status: 404 };
  }

  const { data: row } = await admin
    .from('preview_analyses')
    .select('id, claimed_by, claimed_analysis_id')
    .eq('token', token)
    .maybeSingle();

  if (!row) {
    return { error: 'Forhåndsvisningen finnes ikke', status: 404 };
  }

  if (row.claimed_analysis_id) {
    if (row.claimed_by === userId) {
      return { analysisId: row.claimed_analysis_id as string };
    }
    return { error: 'Denne analysen er allerede knyttet til en annen konto', status: 409 };
  }

  const { data: analysis, error: insertError } = await admin
    .from('analyses')
    .insert({
      user_id: userId,
      website_url: preview.websiteUrl,
      website_name: preview.websiteName || new URL(preview.websiteUrl).hostname,
      status: 'completed',
      seo_results: preview.result.seoResults,
      content_results: preview.result.contentResults,
      security_results: preview.result.securityResults,
      pagespeed_results: preview.result.pageSpeedResults || null,
      accessibility_results: preview.result.accessibility || null,
      overall_score: preview.overallScore,
      ai_summary: null,
    })
    .select('id')
    .single();

  if (insertError || !analysis) {
    return { error: 'Kunne ikke lagre analysen på kontoen din', status: 500 };
  }

  await admin
    .from('preview_analyses')
    .update({
      claimed_by: userId,
      claimed_analysis_id: analysis.id,
    })
    .eq('id', row.id);

  return { analysisId: analysis.id as string };
}
