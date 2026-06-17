import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzePageSpeedWithLighthouse } from '@/lib/services/pagespeed';
import { parseAccessibilityAudits } from '@/lib/services/accessibility-audits';
import { getPremiumStatusServer } from '@/lib/premium-server';
import { calculateOverallScore } from '@/lib/analyzers';
import {
  canUseDbPagespeedCache,
  findCachedAnalysisForDomain,
  normalizeAnalysisHostname,
} from '@/lib/utils/pagespeed-db-cache';
import type { AccessibilityResults, PageSpeedResults } from '@/types';

export const maxDuration = 120; // PageSpeed API kan være treg – 2 min med Fluid Compute

interface PageSpeedRequest {
  analysisId: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const premiumStatus = await getPremiumStatusServer(user);

    const body = (await request.json()) as PageSpeedRequest;
    const { analysisId } = body;
    if (!analysisId) {
      return NextResponse.json({ error: 'analysisId is required' }, { status: 400 });
    }

    const { data: analysis, error: fetchError } = await supabase
      .from('analyses')
      .select('id, website_url, seo_results, content_results, security_results, overall_score')
      .eq('id', analysisId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError || !analysis?.website_url) {
      return NextResponse.json(
        { error: 'Analysen finnes ikke eller du har ikke tilgang.' },
        { status: 404 }
      );
    }

    const url = analysis.website_url;
    const PAGE_SPEED_MAX_MS = 115_000;

    const seoScore = (analysis.seo_results as { score?: number })?.score ?? 0;
    const contentScore = (analysis.content_results as { score?: number })?.score ?? 0;
    const securityScore = (analysis.security_results as { score?: number })?.score ?? 0;

    // DB-backed cache: reuse recent PageSpeed results for the same user + domain (within 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const domain = normalizeAnalysisHostname(url);

    if (domain) {
      const { data: recentWithPagespeed } = await supabase
        .from('analyses')
        .select('id, website_url, pagespeed_results, accessibility_results')
        .eq('user_id', user.id)
        .not('pagespeed_results', 'is', null)
        .gte('created_at', sevenDaysAgo)
        .neq('id', analysisId)
        .order('created_at', { ascending: false })
        .limit(20);

      const cached = findCachedAnalysisForDomain(recentWithPagespeed, domain, analysisId);

      if (cached && canUseDbPagespeedCache(cached, premiumStatus.isPremium)) {
        console.log(`[PageSpeed] Using DB-cached results for ${domain}`);
        const cachedResults = cached.pagespeed_results as PageSpeedResults;
        const cachedAccessibility = premiumStatus.isPremium
          ? (cached.accessibility_results as AccessibilityResults | null)
          : null;
        const overallScore = calculateOverallScore(seoScore, contentScore, securityScore, cachedResults.performance);

        const updatePayload: Record<string, unknown> = {
          pagespeed_results: cachedResults,
          overall_score: overallScore,
        };
        if (premiumStatus.isPremium && cachedAccessibility) {
          updatePayload.accessibility_results = cachedAccessibility;
        }

        await supabase
          .from('analyses')
          .update(updatePayload)
          .eq('id', analysisId)
          .eq('user_id', user.id);

        return NextResponse.json({
          success: true,
          pageSpeedResults: cachedResults,
          accessibilityResults: cachedAccessibility ?? undefined,
          overallScore,
        });
      }
    }

    const pageSpeedAnalysis = await analyzePageSpeedWithLighthouse(url, { timeout: PAGE_SPEED_MAX_MS }).catch((err) => {
      console.error('PageSpeed analysis failed or timed out:', err);
      return null;
    });

    if (!pageSpeedAnalysis) {
      return NextResponse.json({
        success: true,
        pageSpeedResults: null,
        overallScore: analysis.overall_score ?? undefined,
      });
    }

    const { results: pageSpeedResults, lighthouse } = pageSpeedAnalysis;
    const overallScore = calculateOverallScore(seoScore, contentScore, securityScore, pageSpeedResults.performance);

    let accessibilityResults: AccessibilityResults | undefined;
    const updatePayload: Record<string, unknown> = {
      pagespeed_results: pageSpeedResults,
      overall_score: overallScore,
    };

    if (premiumStatus.isPremium && lighthouse) {
      accessibilityResults = parseAccessibilityAudits(
        lighthouse as Parameters<typeof parseAccessibilityAudits>[0]
      );
      updatePayload.accessibility_results = accessibilityResults;
    }

    await supabase
      .from('analyses')
      .update(updatePayload)
      .eq('id', analysisId)
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      pageSpeedResults,
      accessibilityResults,
      overallScore,
    });
  } catch (error) {
    console.error('PageSpeed API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'PageSpeed analysis failed' },
      { status: 500 }
    );
  }
}
