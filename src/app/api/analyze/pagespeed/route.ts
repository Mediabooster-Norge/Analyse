import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzePageSpeed } from '@/lib/services/pagespeed';
import { calculateOverallScore } from '@/lib/analyzers';

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
    let domain = '';
    try {
      domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '');
    } catch { /* ignore */ }

    if (domain) {
      const { data: cached } = await supabase
        .from('analyses')
        .select('pagespeed_results')
        .eq('user_id', user.id)
        .not('pagespeed_results', 'is', null)
        .gte('created_at', sevenDaysAgo)
        .ilike('website_url', `%${domain}%`)
        .neq('id', analysisId) // don't re-use the current (empty) row
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cached?.pagespeed_results) {
        console.log(`[PageSpeed] Using DB-cached results for ${domain}`);
        const cachedResults = cached.pagespeed_results as import('@/types').PageSpeedResults;
        const overallScore = calculateOverallScore(seoScore, contentScore, securityScore, cachedResults.performance);
        await supabase
          .from('analyses')
          .update({ pagespeed_results: cachedResults, overall_score: overallScore })
          .eq('id', analysisId)
          .eq('user_id', user.id);
        return NextResponse.json({ success: true, pageSpeedResults: cachedResults, overallScore });
      }
    }

    const pageSpeedResults = await analyzePageSpeed(url, { timeout: PAGE_SPEED_MAX_MS }).catch((err) => {
      console.error('PageSpeed analysis failed or timed out:', err);
      return null;
    });

    if (!pageSpeedResults) {
      return NextResponse.json({
        success: true,
        pageSpeedResults: null,
        overallScore: analysis.overall_score ?? undefined,
      });
    }

    const overallScore = calculateOverallScore(seoScore, contentScore, securityScore, pageSpeedResults.performance);

    await supabase
      .from('analyses')
      .update({ pagespeed_results: pageSpeedResults, overall_score: overallScore })
      .eq('id', analysisId)
      .eq('user_id', user.id);

    return NextResponse.json({ success: true, pageSpeedResults, overallScore });
  } catch (error) {
    console.error('PageSpeed API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'PageSpeed analysis failed' },
      { status: 500 }
    );
  }
}
