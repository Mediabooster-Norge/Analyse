import { NextRequest, NextResponse } from 'next/server';
import { runFullAnalysis, runCompetitorAnalysis } from '@/lib/analyzers';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60; // Allow up to 60 seconds for analysis

interface AnalyzeRequest {
  url: string;
  competitorUrls?: string[];
  companyId?: string;
  keywords?: string[];
  includeAI?: boolean;
  usePremiumAI?: boolean;
  industry?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AnalyzeRequest;
    const { url, competitorUrls = [], companyId, keywords = [], includeAI = true, usePremiumAI = false, industry } = body;

    // Validate URL
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Normalize URL
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

    try {
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Check authentication and rate limits if companyId is provided
    let userId: string | null = null;
    if (companyId) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = user.id;

      // Check monthly analysis limit (2 per month for free users)
      const FREE_MONTHLY_LIMIT = 2;
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const { data: monthlyAnalyses, error: countError } = await supabase
        .from('analyses')
        .select('id, created_at')
        .eq('company_id', companyId)
        .gte('created_at', firstDayOfMonth);

      const analysisCount = monthlyAnalyses?.length || 0;
      const remainingAnalyses = FREE_MONTHLY_LIMIT - analysisCount;

      if (analysisCount >= FREE_MONTHLY_LIMIT) {
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
    }

    // Run the analysis
    let result;
    let competitors: Array<{ url: string; results: unknown }> = [];
    
    if (competitorUrls.length > 0) {
      const competitorAnalysis = await runCompetitorAnalysis(normalizedUrl, competitorUrls, {
        usePremiumAI,
        industry,
        targetKeywords: keywords,
      });
      result = competitorAnalysis.mainResults;
      competitors = competitorAnalysis.competitorResults;
    } else {
      result = await runFullAnalysis(normalizedUrl, {
        includeAI,
        usePremiumAI,
        industry,
        targetKeywords: keywords,
      });
    }

    // Save to database if authenticated
    if (userId && companyId) {
      const supabase = await createClient();

      // Save analysis
      const { data: analysis, error: analysisError } = await supabase
        .from('analyses')
        .insert({
          company_id: companyId,
          status: 'completed',
          seo_results: result.seoResults,
          content_results: result.contentResults,
          security_results: result.securityResults,
          competitor_results: competitors.length > 0 ? competitors : null,
          ai_summary: result.aiSummary,
          keyword_research: result.keywordResearch || null,
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
    }

    return NextResponse.json({
      success: true,
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
