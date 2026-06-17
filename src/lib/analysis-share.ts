import { randomBytes, createHash } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

export function generateShareToken() {
  return randomBytes(32).toString('hex');
}

export function hashShareToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

/** Shared links stay valid until the owner revokes them. */
export function getShareExpiration() {
  return null;
}

export interface SharedAnalysisPayload {
  id: string;
  websiteUrl: string | null;
  websiteName: string | null;
  overallScore: number;
  seoResults: unknown;
  contentResults: unknown;
  securityResults: unknown;
  pageSpeedResults: unknown;
  aiVisibility: unknown;
  keywordResearch: unknown;
  competitorResults: unknown;
  createdAt: string;
}

export async function resolveShareByToken(token: string) {
  const admin = createAdminClient();
  const tokenHash = hashShareToken(token);

  let { data: share } = await admin
    .from('analysis_shares')
    .select('analysis_id, revoked_at')
    .eq('public_token', token)
    .maybeSingle();

  if (!share) {
    const { data: legacyShare } = await admin
      .from('analysis_shares')
      .select('analysis_id, revoked_at')
      .eq('token_hash', tokenHash)
      .maybeSingle();
    share = legacyShare;
  }

  if (!share || share.revoked_at) {
    return null;
  }

  return share;
}

export async function getSharedAnalysisByToken(
  token: string
): Promise<SharedAnalysisPayload | null> {
  const share = await resolveShareByToken(token);
  if (!share) return null;

  const admin = createAdminClient();
  const { data: analysis } = await admin
    .from('analyses')
    .select(
      // accessibility_results is premium-only and intentionally excluded from shared previews
      'id, website_url, website_name, overall_score, seo_results, content_results, security_results, pagespeed_results, keyword_research, competitor_results, ai_visibility, created_at'
    )
    .eq('id', share.analysis_id)
    .maybeSingle();

  if (!analysis) return null;

  return {
    id: analysis.id,
    websiteUrl: analysis.website_url,
    websiteName: analysis.website_name,
    overallScore: analysis.overall_score ?? 0,
    seoResults: analysis.seo_results,
    contentResults: analysis.content_results,
    securityResults: analysis.security_results,
    pageSpeedResults: analysis.pagespeed_results,
    aiVisibility: analysis.ai_visibility,
    keywordResearch: analysis.keyword_research,
    competitorResults: analysis.competitor_results,
    createdAt: analysis.created_at,
  };
}

/** Extract token from a full preview URL or raw token string. */
export function parseShareTokenFromInput(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/preview\/([^/]+)/);
    if (match?.[1]) return match[1];
  } catch {
    // Not a URL — treat as raw token
  }

  if (/^[a-f0-9]{64}$/i.test(trimmed)) {
    return trimmed;
  }

  return null;
}
