import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { hashShareToken, isShareExpired } from '@/lib/analysis-share';

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(_: NextRequest, { params }: RouteParams) {
  const { token } = await params;
  const admin = createAdminClient();
  const tokenHash = hashShareToken(token);

  let { data: share } = await admin
    .from('analysis_shares')
    .select('analysis_id, expires_at, revoked_at')
    .eq('public_token', token)
    .maybeSingle();

  // Backward compatibility for links created before public_token column existed.
  if (!share) {
    const { data: legacyShare } = await admin
      .from('analysis_shares')
      .select('analysis_id, expires_at, revoked_at')
      .eq('token_hash', tokenHash)
      .maybeSingle();
    share = legacyShare;
  }

  if (!share || share.revoked_at || isShareExpired(share.expires_at)) {
    return NextResponse.json({ error: 'Lenken er ugyldig eller utløpt' }, { status: 404 });
  }

  const { data: analysis } = await admin
    .from('analyses')
    .select('id, website_url, website_name, overall_score, seo_results, content_results, security_results, pagespeed_results, ai_visibility, created_at')
    .eq('id', share.analysis_id)
    .maybeSingle();

  if (!analysis) {
    return NextResponse.json({ error: 'Analyse ikke funnet' }, { status: 404 });
  }

  return NextResponse.json({
    analysis: {
      id: analysis.id,
      websiteUrl: analysis.website_url,
      websiteName: analysis.website_name,
      overallScore: analysis.overall_score ?? 0,
      seoResults: analysis.seo_results,
      contentResults: analysis.content_results,
      securityResults: analysis.security_results,
      pageSpeedResults: analysis.pagespeed_results,
      aiVisibility: analysis.ai_visibility,
      createdAt: analysis.created_at,
    },
  });
}
