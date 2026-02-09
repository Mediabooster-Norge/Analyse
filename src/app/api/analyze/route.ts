import { NextRequest, NextResponse } from 'next/server';
import { runFullAnalysis, runCompetitorAnalysis } from '@/lib/analyzers';
import { createClient } from '@/lib/supabase/server';
import { getPremiumStatusServer } from '@/lib/premium-server';
import type { AIVisibilityData } from '@/lib/services/openai';

export const maxDuration = 300; // Krever Fluid Compute (Hobby eller Pro). Uten Fluid: Hobby 60s. Med Fluid: 300s på begge.

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
    
    // Enforce competitor limits (Free: 1, Premium: 3)
    const MAX_COMPETITORS = isPremium ? 5 : 1;
    if (competitorUrls.length > MAX_COMPETITORS) {
      competitorUrls = competitorUrls.slice(0, MAX_COMPETITORS);
      console.log(`[Analyze] Trimmed competitors to ${MAX_COMPETITORS} (isPremium: ${isPremium})`);
    }
    
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

    // Check for cached security and AI visibility results from recent analyses (within 24 hours)
    // Both security and AI visibility are domain-level, so we can reuse them
    const urlDomain = new URL(normalizedUrl).hostname;
    let cachedSecurityResults = null;
    const cachedAiVisibilityByDomain: Record<string, AIVisibilityData> = {};
    
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentAnalyses } = await supabase
      .from('analyses')
      .select('security_results, ai_visibility, website_url, competitor_results')
      .eq('user_id', userId)
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false })
      .limit(20);
    
    // Build cache of security and AI visibility results by domain
    if (recentAnalyses && recentAnalyses.length > 0) {
      for (const analysis of recentAnalyses) {
        try {
          const analysisDomain = new URL(analysis.website_url).hostname;
          
          // Cache main site's security and AI visibility
          if (analysisDomain === urlDomain && !cachedSecurityResults && analysis.security_results) {
            cachedSecurityResults = analysis.security_results;
            console.log(`[Security] Reusing cached security results for domain: ${urlDomain}`);
          }
          
          if (analysis.ai_visibility && !cachedAiVisibilityByDomain[analysisDomain]) {
            cachedAiVisibilityByDomain[analysisDomain] = analysis.ai_visibility as AIVisibilityData;
          }
          
          // Also cache competitor AI visibility results
          if (Array.isArray(analysis.competitor_results)) {
            for (const comp of analysis.competitor_results as Array<{ url: string; results?: { aiVisibility?: AIVisibilityData } }>) {
              try {
                const compDomain = new URL(comp.url).hostname;
                if (comp.results?.aiVisibility && !cachedAiVisibilityByDomain[compDomain]) {
                  cachedAiVisibilityByDomain[compDomain] = comp.results.aiVisibility;
                }
              } catch { /* ignore invalid URLs */ }
            }
          }
        } catch { /* ignore invalid URLs */ }
      }
      
      if (Object.keys(cachedAiVisibilityByDomain).length > 0) {
        console.log(`[AI Visibility] Found cached results for ${Object.keys(cachedAiVisibilityByDomain).length} domains`);
      }
    }

    // Run the analysis – hard cap 1s under maxDuration (119s når maxDuration=120) så respons rekkes
    const ANALYSIS_DEADLINE_MS = (typeof maxDuration === 'number' ? maxDuration - 1 : 119) * 1000;
    const deadlinePromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('ANALYSIS_DEADLINE')), ANALYSIS_DEADLINE_MS);
    });

    const runAnalysis = async () => {
      let result: Awaited<ReturnType<typeof runFullAnalysis>>;
      let competitors: Array<{ url: string; results: unknown }> = [];

      if (competitorUrls.length > 0) {
        const competitorAnalysis = await runCompetitorAnalysis(normalizedUrl, competitorUrls, {
          includeAI,
          usePremiumAI,
          industry,
          targetKeywords: keywords,
          companyName: companyName || websiteName,
          isPremium,
          cachedSecurityResults,
          cachedAiVisibilityByDomain,
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
          cachedSecurityResults,
          cachedAiVisibility: cachedAiVisibilityByDomain[urlDomain],
          skipPageSpeed: true, // Hastighet hentes i eget API-kall etterpå (holder første kall under 60s)
          quickSecurityScan: true, // Full SSL-sjekk kan overstige 60s; bruk rask sjekk i produksjon
        });
      }
      return { result, competitors };
    };

    let result;
    let competitors: Array<{ url: string; results: unknown }> = [];

    try {
      const outcome = await Promise.race([runAnalysis(), deadlinePromise]);
      result = outcome.result;
      competitors = outcome.competitors;
    } catch (err) {
      if (err instanceof Error && err.message === 'ANALYSIS_DEADLINE') {
        return NextResponse.json(
          {
            error: 'Analysen tok for lang tid. Prøv igjen med færre konkurrenter eller uten nøkkelord.',
            code: 'DEADLINE_EXCEEDED',
          },
          { status: 504 }
        );
      }
      throw err;
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
        pagespeed_results: result.pageSpeedResults || null,
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
