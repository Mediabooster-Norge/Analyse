import { scrapeUrl, parseHtml } from '@/lib/services/scraper';
import { analyzeSEO } from './seo-analyzer';
import { analyzeContent } from './content-analyzer';
import { analyzeSecurity, analyzeSecurityQuick } from './security-analyzer';
import { analyzePageSpeed } from '@/lib/services/pagespeed';
import { estimatePerformanceFromScrape } from '@/lib/analyzers/quick-performance';
import { generateAIAnalysis, generateKeywordResearch, KeywordData, checkAIVisibility, AIVisibilityData } from '@/lib/services/openai';
import type { SEOResults, ContentResults, SecurityResults, AISummary, PageSpeedResults } from '@/types';

// Feature flag: Disable AI visibility to reduce analysis time
// Set to true when ready to enable AI visibility feature
const AI_VISIBILITY_ENABLED = false;

export interface FullAnalysisResult {
  seoResults: SEOResults;
  contentResults: ContentResults;
  securityResults: SecurityResults;
  pageSpeedResults?: PageSpeedResults;
  aiSummary: AISummary | null;
  keywordResearch?: KeywordData[];
  aiVisibility?: AIVisibilityData;
  overallScore: number;
  tokensUsed: number;
  aiModel: string;
  costUsd: number;
}

export async function runFullAnalysis(
  url: string,
  options: {
    includeAI?: boolean;
    usePremiumAI?: boolean;
    quickSecurityScan?: boolean;
    industry?: string;
    targetKeywords?: string[];
    companyName?: string;
    checkAiVisibility?: boolean;
    isPremium?: boolean;
    /** Reuse existing security results (same domain = same security) */
    cachedSecurityResults?: SecurityResults;
    /** Reuse existing AI visibility results (same domain = same visibility) */
    cachedAiVisibility?: AIVisibilityData;
    /** Skip PageSpeed – brukes for første kall; hastighet hentes i eget API-kall etterpå */
    skipPageSpeed?: boolean;
  } = {}
): Promise<FullAnalysisResult> {
  const {
    includeAI = true,
    usePremiumAI = false,
    quickSecurityScan = false,
    skipPageSpeed = false,
    industry,
    targetKeywords = [],
    companyName,
    checkAiVisibility: shouldCheckVisibility = true,
    isPremium = false,
    cachedSecurityResults,
    cachedAiVisibility,
  } = options;

  // Step 1: Scrape the URL
  console.log(`Scraping ${url}...`);
  const scrapedData = await scrapeUrl(url);
  const $ = parseHtml(scrapedData.html);

  // Step 2: Run analyses in parallel
  // Security is domain-level, so reuse cached results if available (same domain)
  // PageSpeed: 25s cap – når API timeout’er må total analyse fortsatt være under 60s (25s + AI ~25s + buffer)
  console.log('Running analyses...');
  const [seoResults, contentResults, securityResults, pageSpeedResults] = await Promise.all([
    analyzeSEO($, url),
    Promise.resolve(analyzeContent($)),
    cachedSecurityResults
      ? Promise.resolve(cachedSecurityResults)
      : quickSecurityScan
        ? analyzeSecurityQuick(url, scrapedData.headers)
        : analyzeSecurity(url, scrapedData.headers),
    skipPageSpeed
      ? Promise.resolve(null)
      : analyzePageSpeed(url, { timeout: 25_000 }).catch((err) => {
          console.error('PageSpeed analysis failed or timed out:', err);
          return null;
        }),
  ]);
  
  if (cachedSecurityResults) {
    console.log(`[Security] Used cached security results (grade: ${cachedSecurityResults.ssl.grade})`);
  }

  // Step 3: Calculate overall score (now includes performance if available)
  // Weight distribution: SEO 35%, Content 25%, Security 25%, Performance 15%
  const performanceScore = pageSpeedResults?.performance ?? 0;
  const hasPageSpeed = pageSpeedResults && pageSpeedResults.performance > 0;
  
  const overallScore = hasPageSpeed
    ? Math.round(
        seoResults.score * 0.35 + 
        contentResults.score * 0.25 + 
        securityResults.score * 0.25 + 
        performanceScore * 0.15
      )
    : Math.round(
        seoResults.score * 0.4 + 
        contentResults.score * 0.3 + 
        securityResults.score * 0.3
      );

  // Step 4: Generate AI analysis, keyword research, and AI visibility check (if enabled)
  let aiSummary: AISummary | null = null;
  let keywordResearch: KeywordData[] | undefined;
  let aiVisibility: AIVisibilityData | undefined;
  let tokensUsed = 0;
  let aiModel = 'none';
  let costUsd = 0;

  // Extract domain for AI visibility check
  const domain = new URL(url).hostname.replace('www.', '');

  if (includeAI) {
    console.log('Generating AI analysis...');
    
    // Use cached AI visibility if available (same domain = same visibility)
    // AI_VISIBILITY_ENABLED flag controls whether this feature is active
    const shouldRunVisibilityCheck = AI_VISIBILITY_ENABLED && shouldCheckVisibility && isPremium && !cachedAiVisibility;
    if (cachedAiVisibility && AI_VISIBILITY_ENABLED) {
      console.log(`[AI Visibility] Using cached results for domain: ${domain}`);
    }
    
    // Run AI analysis, keyword research, and visibility check in parallel
    const [aiResult, keywordResult, visibilityResult] = await Promise.all([
      generateAIAnalysis(
        {
          url,
          seoResults,
          contentResults,
          securityResults,
          pageSpeedResults: pageSpeedResults ?? undefined,
          industry,
          targetKeywords,
        },
        usePremiumAI
      ).catch(error => {
        console.error('AI analysis failed:', error);
        return null;
      }),
      targetKeywords.length > 0 
        ? generateKeywordResearch(targetKeywords, industry).catch(error => {
            console.error('Keyword research failed:', error);
            return null;
          })
        : Promise.resolve(null),
      shouldRunVisibilityCheck
        ? checkAIVisibility(domain, companyName, targetKeywords).catch(error => {
            console.error('AI visibility check failed:', error);
            return null;
          })
        : Promise.resolve(null),
    ]);

    if (aiResult) {
      aiSummary = aiResult.summary;
      tokensUsed = aiResult.tokensUsed;
      aiModel = aiResult.model;
      costUsd = aiResult.costUsd;
    }

    if (keywordResult && keywordResult.keywords.length > 0) {
      keywordResearch = keywordResult.keywords;
      tokensUsed += keywordResult.tokensUsed;
      costUsd += keywordResult.costUsd;
    }
    
    // Use cached AI visibility or new result
    if (cachedAiVisibility) {
      aiVisibility = cachedAiVisibility;
    } else if (visibilityResult) {
      aiVisibility = visibilityResult.visibility;
      tokensUsed += visibilityResult.tokensUsed;
      costUsd += visibilityResult.costUsd;
    }

    // Premium: hvis bruker ikke oppga nøkkelord, hent CPC/søkevolum for AI-forslåtte nøkkelord
    if (isPremium && !keywordResearch && aiSummary?.keywordAnalysis) {
      const primary = aiSummary.keywordAnalysis.primaryKeywords || [];
      const missing = aiSummary.keywordAnalysis.missingKeywords || [];
      const aiKeywords = [...primary, ...missing].slice(0, 20);
      if (aiKeywords.length > 0) {
        try {
          const fallbackKeywordResult = await generateKeywordResearch(aiKeywords, industry);
          if (fallbackKeywordResult?.keywords?.length) {
            keywordResearch = fallbackKeywordResult.keywords;
            tokensUsed += fallbackKeywordResult.tokensUsed;
            costUsd += fallbackKeywordResult.costUsd;
          }
        } catch (err) {
          console.error('Premium fallback keyword research failed:', err);
        }
      }
    }
  }

  return {
    seoResults,
    contentResults,
    securityResults,
    pageSpeedResults: pageSpeedResults ?? undefined,
    aiSummary,
    keywordResearch,
    aiVisibility,
    overallScore,
    tokensUsed,
    aiModel,
    costUsd,
  };
}

export async function runCompetitorAnalysis(
  mainUrl: string,
  competitorUrls: string[],
  options: {
    includeAI?: boolean;
    usePremiumAI?: boolean;
    industry?: string;
    targetKeywords?: string[];
    companyName?: string;
    isPremium?: boolean;
    /** Reuse existing security results for main URL (same domain = same security) */
    cachedSecurityResults?: SecurityResults;
    /** Reuse existing AI visibility results by domain */
    cachedAiVisibilityByDomain?: Record<string, AIVisibilityData>;
  } = {}
): Promise<{
  mainResults: FullAnalysisResult;
  competitorResults: Array<{ url: string; results: FullAnalysisResult }>;
}> {
  const { includeAI = true, usePremiumAI = false, industry, targetKeywords = [], companyName, isPremium = false, cachedSecurityResults, cachedAiVisibilityByDomain = {} } = options;
  const hasCompetitors = competitorUrls.length > 0;

  // Step 1: Scrape main URL
  console.log(`Scraping main URL ${mainUrl}...`);
  const mainScrapedData = await scrapeUrl(mainUrl);
  const main$ = parseHtml(mainScrapedData.html);

  // Step 2: Run main analysis
  // With competitors: use quick security for main to stay under 60s. PageSpeed for main hentes i eget kall (skipPageSpeedForMain).
  console.log('Analyzing main URL...');
  const mainSecurityPromise = cachedSecurityResults
    ? Promise.resolve(cachedSecurityResults)
    : hasCompetitors
      ? analyzeSecurityQuick(mainUrl, mainScrapedData.headers)
      : analyzeSecurity(mainUrl, mainScrapedData.headers);

  // Hastighet for main URL hentes alltid i eget API-kall (/api/analyze/pagespeed) – holder dette kall under 60s
  const mainPageSpeedResults: PageSpeedResults | null = null as PageSpeedResults | null;

  const [mainSeoResults, mainContentResults, mainSecurityResults] = await Promise.all([
    analyzeSEO(main$, mainUrl),
    Promise.resolve(analyzeContent(main$)),
    mainSecurityPromise,
  ]);

  if (cachedSecurityResults) {
    console.log(`[Security] Used cached security results for main URL (grade: ${cachedSecurityResults.ssl.grade})`);
  } else if (hasCompetitors) {
    console.log('[Security] Using quick security for main URL (competitor mode, 60s limit)');
  }

  // Calculate overall score (includes performance if available)
  const mainPerformanceScore = mainPageSpeedResults?.performance ?? 0;
  const hasMainPageSpeed = mainPageSpeedResults && mainPageSpeedResults.performance > 0;
  
  const mainOverallScore = hasMainPageSpeed
    ? Math.round(
        mainSeoResults.score * 0.35 + 
        mainContentResults.score * 0.25 + 
        mainSecurityResults.score * 0.25 + 
        mainPerformanceScore * 0.15
      )
    : Math.round(
        mainSeoResults.score * 0.4 + 
        mainContentResults.score * 0.3 + 
        mainSecurityResults.score * 0.3
      );

  // Step 3: Analyze competitors with full security scan for accurate comparison
  const competitorResults: Array<{ url: string; results: FullAnalysisResult }> = [];
  
  if (competitorUrls.length > 0) {
    // Process all competitors in parallel for better performance
    const competitorPromises = competitorUrls.map(async (competitorUrl) => {
      console.log(`Analyzing competitor ${competitorUrl}...`);
      
      try {
        const compScrapedData = await scrapeUrl(competitorUrl);
        const comp$ = parseHtml(compScrapedData.html);
        
        // Use quick security + quick performance estimate for competitors (no PageSpeed API; fits 60s limit)
        const compPageSpeedResults = estimatePerformanceFromScrape({
          html: compScrapedData.html,
          loadTimeMs: compScrapedData.loadTime,
          headers: compScrapedData.headers,
        });
        const [compSeoResults, compContentResults, compSecurityResults] = await Promise.all([
          analyzeSEO(comp$, competitorUrl),
          Promise.resolve(analyzeContent(comp$)),
          analyzeSecurityQuick(competitorUrl, compScrapedData.headers),
        ]);

        const compOverallScore = Math.round(
          compSeoResults.score * 0.35 +
          compContentResults.score * 0.25 +
          compSecurityResults.score * 0.25 +
          compPageSpeedResults.performance * 0.15
        );

        return {
          url: competitorUrl,
          results: {
            seoResults: compSeoResults,
            contentResults: compContentResults,
            securityResults: compSecurityResults,
            pageSpeedResults: compPageSpeedResults,
            aiSummary: null,
            overallScore: compOverallScore,
            tokensUsed: 0,
            aiModel: 'none',
            costUsd: 0,
          },
        };
      } catch (error) {
        console.error(`Failed to analyze competitor ${competitorUrl}:`, error);
        return null;
      }
    });

    const results = await Promise.all(competitorPromises);
    competitorResults.push(...results.filter((r): r is NonNullable<typeof r> => r !== null));
  }

  // Step 4: Generate AI analysis and keyword research with competitor comparison (optional; skip to stay under 60s)
  let aiSummary: AISummary | null = null;
  let keywordResearch: KeywordData[] | undefined;
  let tokensUsed = 0;
  let aiModel = 'none';
  let costUsd = 0;
  let aiVisibility: AIVisibilityData | undefined;
  let competitorResultsWithVisibility = competitorResults.map((c) => ({ ...c, results: { ...c.results, aiVisibility: undefined as AIVisibilityData | undefined } }));

  if (includeAI) {
    console.log('Generating AI analysis with competitor comparison...');
    const domain = new URL(mainUrl).hostname.replace('www.', '');
    const mainCachedVisibility = AI_VISIBILITY_ENABLED
      ? (cachedAiVisibilityByDomain[domain] || cachedAiVisibilityByDomain[domain.replace('www.', '')])
      : undefined;
    const shouldCheckMainVisibility = AI_VISIBILITY_ENABLED && isPremium && !mainCachedVisibility;

    if (mainCachedVisibility && AI_VISIBILITY_ENABLED) {
      console.log(`[AI Visibility] Using cached results for main domain: ${domain}`);
    }

    const competitorVisibilityPromises = (AI_VISIBILITY_ENABLED && isPremium)
      ? competitorResults.map((c) => {
          const compDomain = new URL(c.url).hostname.replace('www.', '');
          const cachedVisibility = cachedAiVisibilityByDomain[compDomain] || cachedAiVisibilityByDomain[`www.${compDomain}`];
          if (cachedVisibility) {
            console.log(`[AI Visibility] Using cached results for competitor: ${compDomain}`);
            return Promise.resolve({ visibility: cachedVisibility, tokensUsed: 0, costUsd: 0, cached: true });
          }
          return checkAIVisibility(compDomain, undefined, []).catch((err) => {
            console.error(`AI visibility check failed for ${c.url}:`, err);
            return null;
          });
        })
      : [];

    const allPromiseResults = await Promise.all([
      generateAIAnalysis(
        {
          url: mainUrl,
          seoResults: mainSeoResults,
          contentResults: mainContentResults,
          securityResults: mainSecurityResults,
          pageSpeedResults: mainPageSpeedResults ?? undefined,
          competitorResults: competitorResults.length > 0 ? {
            competitors: competitorResults.map(c => ({ url: c.url, overallScore: c.results.overallScore, results: c.results })),
            strengths: [],
            weaknesses: [],
          } : undefined,
          industry,
          targetKeywords,
        },
        usePremiumAI
      ).catch(error => { console.error('AI analysis failed:', error); return null; }),
      targetKeywords.length > 0
        ? generateKeywordResearch(targetKeywords, industry).catch(error => { console.error('Keyword research failed:', error); return null; })
        : Promise.resolve(null),
      shouldCheckMainVisibility
        ? checkAIVisibility(domain, companyName, targetKeywords).catch(error => { console.error('AI visibility check failed:', error); return null; })
        : Promise.resolve(null),
      ...competitorVisibilityPromises,
    ]);

    const aiResult = allPromiseResults[0];
    const keywordResult = allPromiseResults[1];
    const visibilityResult = allPromiseResults[2];
    const competitorVisibilityResults = allPromiseResults.slice(3) as Array<{ visibility: AIVisibilityData; tokensUsed: number; costUsd: number; cached?: boolean } | null>;

    if (aiResult) {
      aiSummary = aiResult.summary;
      tokensUsed = aiResult.tokensUsed;
      aiModel = aiResult.model;
      costUsd = aiResult.costUsd;
    }
    if (keywordResult && keywordResult.keywords.length > 0) {
      keywordResearch = keywordResult.keywords;
      tokensUsed += keywordResult.tokensUsed;
      costUsd += keywordResult.costUsd;
    }
    if (mainCachedVisibility) {
      aiVisibility = mainCachedVisibility;
    } else if (visibilityResult) {
      aiVisibility = visibilityResult.visibility;
      tokensUsed += visibilityResult.tokensUsed;
      costUsd += visibilityResult.costUsd;
    }

    competitorResultsWithVisibility = competitorResults.map((c, i) => {
      const vis = competitorVisibilityResults[i];
      if (vis) {
        tokensUsed += vis.tokensUsed;
        costUsd += vis.costUsd;
      }
      return { ...c, results: { ...c.results, aiVisibility: vis?.visibility } };
    });

    if (isPremium && !keywordResearch && aiSummary?.keywordAnalysis) {
      const primary = aiSummary.keywordAnalysis.primaryKeywords || [];
      const missing = aiSummary.keywordAnalysis.missingKeywords || [];
      const aiKeywords = [...primary, ...missing].slice(0, 20);
      if (aiKeywords.length > 0) {
        try {
          const fallbackKeywordResult = await generateKeywordResearch(aiKeywords, industry);
          if (fallbackKeywordResult?.keywords?.length) {
            keywordResearch = fallbackKeywordResult.keywords;
            tokensUsed += fallbackKeywordResult.tokensUsed;
            costUsd += fallbackKeywordResult.costUsd;
          }
        } catch (err) {
          console.error('Premium fallback keyword research failed:', err);
        }
      }
    }
  }

  return {
    mainResults: {
      seoResults: mainSeoResults,
      contentResults: mainContentResults,
      securityResults: mainSecurityResults,
      pageSpeedResults: mainPageSpeedResults ?? undefined,
      aiSummary,
      keywordResearch,
      aiVisibility,
      overallScore: mainOverallScore,
      tokensUsed,
      aiModel,
      costUsd,
    },
    competitorResults: competitorResultsWithVisibility,
  };
}

// Analyze only competitors (for partial updates without re-analyzing main URL)
export async function analyzeCompetitorsOnly(
  competitorUrls: string[]
): Promise<Array<{ url: string; results: FullAnalysisResult }>> {
  const competitorResults: Array<{ url: string; results: FullAnalysisResult }> = [];
  
  if (competitorUrls.length > 0) {
    // Process all competitors in parallel for better performance
    const competitorPromises = competitorUrls.map(async (competitorUrl) => {
      console.log(`Analyzing competitor ${competitorUrl}...`);
      
      try {
        const compScrapedData = await scrapeUrl(competitorUrl);
        const comp$ = parseHtml(compScrapedData.html);
        
        const compPageSpeedResults = estimatePerformanceFromScrape({
          html: compScrapedData.html,
          loadTimeMs: compScrapedData.loadTime,
          headers: compScrapedData.headers,
        });
        const [compSeoResults, compContentResults, compSecurityResults] = await Promise.all([
          analyzeSEO(comp$, competitorUrl),
          Promise.resolve(analyzeContent(comp$)),
          analyzeSecurityQuick(competitorUrl, compScrapedData.headers),
        ]);

        const compOverallScore = Math.round(
          compSeoResults.score * 0.35 +
          compContentResults.score * 0.25 +
          compSecurityResults.score * 0.25 +
          compPageSpeedResults.performance * 0.15
        );

        return {
          url: competitorUrl,
          results: {
            seoResults: compSeoResults,
            contentResults: compContentResults,
            securityResults: compSecurityResults,
            pageSpeedResults: compPageSpeedResults,
            aiSummary: null,
            overallScore: compOverallScore,
            tokensUsed: 0,
            aiModel: 'none',
            costUsd: 0,
          },
        };
      } catch (error) {
        console.error(`Failed to analyze competitor ${competitorUrl}:`, error);
        return null;
      }
    });

    const results = await Promise.all(competitorPromises);
    competitorResults.push(...results.filter((r): r is NonNullable<typeof r> => r !== null));
  }

  return competitorResults;
}
