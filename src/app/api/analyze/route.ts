import { NextRequest, NextResponse } from 'next/server';
import { runFullAnalysis, runCompetitorAnalysis } from '@/lib/analyzers';
import { createClient } from '@/lib/supabase/server';
import { getPremiumStatusServer } from '@/lib/premium-server';

export const maxDuration = 60; // Allow up to 60 seconds for analysis

interface AnalyzeRequest {
  url?: string;
  competitorUrls?: string[];
  keywords?: string[];
  includeAI?: boolean;
  usePremiumAI?: boolean;
  industry?: string;
  companyName?: string;
  websiteName?: string;
  /** Kjør samme analyse på nytt med data fra denne analysen (teller som ny analyse for gratis) */
  rerunFromAnalysisId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AnalyzeRequest;
    const { rerunFromAnalysisId, includeAI = true, usePremiumAI = false, industry } = body;

    // Check authentication first
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    let url: string;
    let competitorUrls: string[];
    let keywords: string[];
    let companyName: string | undefined;
    let websiteName: string | undefined;

    if (rerunFromAnalysisId) {
      // Load existing analysis and use its data (same URL, competitors, keywords)
      const { data: existingAnalysis, error: fetchError } = await supabase
        .from('analyses')
        .select('website_url, website_name, competitor_results, keyword_research')
        .eq('id', rerunFromAnalysisId)
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError || !existingAnalysis?.website_url) {
        return NextResponse.json(
          { error: 'Analysen finnes ikke eller du har ikke tilgang.' },
          { status: 404 }
        );
      }

      url = existingAnalysis.website_url;
      websiteName = existingAnalysis.website_name ?? undefined;
      companyName = websiteName;
      competitorUrls = Array.isArray(existingAnalysis.competitor_results)
        ? (existingAnalysis.competitor_results as Array<{ url: string }>).map((c) => c.url)
        : [];
      keywords = Array.isArray(existingAnalysis.keyword_research)
        ? (existingAnalysis.keyword_research as Array<{ keyword: string }>).map((k) => k.keyword)
        : [];
    } else {
      const {
        url: bodyUrl,
        competitorUrls: bodyCompetitors = [],
        keywords: bodyKeywords = [],
        companyName: bodyCompanyName,
        websiteName: bodyWebsiteName,
      } = body;

      if (!bodyUrl) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
      }

      url = bodyUrl;
      competitorUrls = bodyCompetitors;
      keywords = bodyKeywords;
      companyName = bodyCompanyName;
      websiteName = bodyWebsiteName;
    }

    // Normalize URL
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

    try {
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Check premium status for limits (server-side)
    const premiumStatus = await getPremiumStatusServer(user);
    const { isPremium } = premiumStatus;
    const FREE_MONTHLY_LIMIT = premiumStatus.monthlyAnalysisLimit;
    
    // Check monthly analysis limit
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    const { data: monthlyAnalyses } = await supabase
      .from('analyses')
      .select('id, created_at')
      .eq('user_id', userId)
      .gte('created_at', firstDayOfMonth);

    const analysisCount = monthlyAnalyses?.length || 0;

    if (analysisCount >= FREE_MONTHLY_LIMIT && FREE_MONTHLY_LIMIT < 999) {
      return NextResponse.json(
        { 
          error: `Du har brukt opp dine ${FREE_MONTHLY_LIMIT} gratis analyser denne måneden. Oppgrader til Premium for ubegrensede analyser!`,
          limitReached: true,
          analysisCount,
          monthlyLimit: FREE_MONTHLY_LIMIT,
          remainingAnalyses: 0,
          contactUrl: 'https://mediabooster.no/kontakt/'
        },
        { status: 429 }
      );
    }

    // Run the analysis
    let result;
    let competitors: Array<{ url: string; results: unknown }> = [];
    
    if (competitorUrls.length > 0) {
      const competitorAnalysis = await runCompetitorAnalysis(normalizedUrl, competitorUrls, {
        usePremiumAI,
        industry,
        targetKeywords: keywords,
        companyName: companyName || websiteName,
        isPremium,
      });
      result = competitorAnalysis.mainResults;
      competitors = competitorAnalysis.competitorResults;
    } else {
      result = await runFullAnalysis(normalizedUrl, {
        includeAI,
        usePremiumAI,
        industry,
        targetKeywords: keywords,
        companyName: companyName || websiteName,
        isPremium,
      });
    }

    // Save analysis with user_id
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .insert({
        user_id: userId,
        website_url: normalizedUrl,
        website_name: websiteName || new URL(normalizedUrl).hostname,
        status: 'completed',
        seo_results: result.seoResults,
        content_results: result.contentResults,
        security_results: result.securityResults,
        competitor_results: competitors.length > 0 ? competitors : null,
        ai_summary: result.aiSummary,
        keyword_research: result.keywordResearch || null,
        ai_visibility: result.aiVisibility || null,
        overall_score: result.overallScore,
        ai_model: result.aiModel,
        tokens_used: result.tokensUsed,
        cost_usd: result.costUsd,
      })
      .select()
      .single();

    if (analysisError) {
      console.error('Failed to save analysis:', analysisError);
    }

    // Update API usage
    const today = new Date().toISOString().split('T')[0];
    await supabase.rpc('increment_api_usage', {
      p_user_id: userId,
      p_date: today,
      p_tokens: result.tokensUsed,
      p_cost: result.costUsd,
    });

    return NextResponse.json({
      success: true,
      analysisId: analysis?.id,
      ...result,
      competitors,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
