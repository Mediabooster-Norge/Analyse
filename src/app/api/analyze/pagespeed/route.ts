import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzePageSpeed } from '@/lib/services/pagespeed';

export const maxDuration = 60; // Eget kall – full tid til PageSpeed

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
    const PAGE_SPEED_MAX_MS = 55_000; // God margin under 60s

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

    const seoScore = (analysis.seo_results as { score?: number })?.score ?? 0;
    const contentScore = (analysis.content_results as { score?: number })?.score ?? 0;
    const securityScore = (analysis.security_results as { score?: number })?.score ?? 0;
    const performanceScore = pageSpeedResults.performance ?? 0;

    const overallScore = Math.round(
      seoScore * 0.35 +
      contentScore * 0.25 +
      securityScore * 0.25 +
      performanceScore * 0.15
    );

    await supabase
      .from('analyses')
      .update({
        pagespeed_results: pageSpeedResults,
        overall_score: overallScore,
      })
      .eq('id', analysisId)
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      pageSpeedResults,
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
