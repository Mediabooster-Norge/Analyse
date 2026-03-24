import { scrapeUrl, parseHtml } from '@/lib/services/scraper';
import { analyzeSEO } from './seo-analyzer';
import { analyzeContent } from './content-analyzer';
import { analyzeSecurity, analyzeSecurityQuick } from './security-analyzer';
import { analyzePageSpeed } from '@/lib/services/pagespeed';
import { estimatePerformanceFromScrape } from '@/lib/analyzers/quick-performance';
import { generateAIAnalysis, generateKeywordResearch, KeywordData } from '@/lib/services/openai';
import type { SEOResults, ContentResults, SecurityResults, AISummary, PageSpeedResults } from '@/types';

// AI visibility runs exclusively through the standalone /api/analyze/ai-visibility endpoint.
// It is NOT part of the main analysis pipeline (runFullAnalysis / runCompetitorAnalysis).

/**
 * Calculates the weighted overall score from individual analyzer scores.
 *
 * With PageSpeed:    SEO 35% · Content 25% · Security 25% · Performance 15%
 * Without PageSpeed: SEO 40% · Content 30% · Security 30%
 */
export function calculateOverallScore(
  seoScore: number,
  contentScore: number,
  securityScore: number,
  performanceScore?: number
): number {
  if (performanceScore !== undefined && performanceScore > 0) {
    return Math.round(
      seoScore * 0.35 +
      contentScore * 0.25 +
      securityScore * 0.25 +
      performanceScore * 0.15
    );
  }
  return Math.round(seoScore * 0.4 + contentScore * 0.3 + securityScore * 0.3);
}

/** Maximum number of competitor scrapes / analyses that run in parallel. */
const MAX_COMPETITOR_CONCURRENCY = 3;

/**
 * Runs an array of async tasks with a maximum concurrency limit.
 * Processes in sequential batches of `limit` rather than all at once.
 */
async function runWithConcurrencyLimit<T>(
  tasks: Array<() => Promise<T>>,
  limit: number
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < tasks.length; i += limit) {
    const batch = tasks.slice(i, i + limit).map((t) => t());
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
  }
  return results;
}

export interface FullAnalysisResult {
  seoResults: SEOResults;
  contentResults: ContentResults;
  securityResults: SecurityResults;
  pageSpeedResults?: PageSpeedResults;
  aiSummary: AISummary | null;
  keywordResearch?: KeywordData[];
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
    isPremium?: boolean;
    /** Reuse existing security results (same domain = same security) */
    cachedSecurityResults?: SecurityResults;
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
    isPremium = false,
    cachedSecurityResults,
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
  const hasPageSpeed = pageSpeedResults && pageSpeedResults.performance > 0;
  const overallScore = calculateOverallScore(
    seoResults.score,
    contentResults.score,
    securityResults.score,
    hasPageSpeed ? pageSpeedResults.performance : undefined
  );

  // Step 4: Generate AI analysis and keyword research in parallel
  let aiSummary: AISummary | null = null;
  let keywordResearch: KeywordData[] | undefined;
  let tokensUsed = 0;
  let aiModel = 'none';
  let costUsd = 0;

  if (includeAI) {
    console.log('Generating AI analysis...');
    const [aiResult, keywordResult] = await Promise.all([
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
      // Keyword research only runs when the user explicitly supplied keywords.
      targetKeywords.length > 0
        ? generateKeywordResearch(targetKeywords, industry).catch(error => {
            console.error('Keyword research failed:', error);
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
  }

  return {
    seoResults,
    contentResults,
    securityResults,
    pageSpeedResults: pageSpeedResults ?? undefined,
    aiSummary,
    keywordResearch,
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
  } = {}
): Promise<{
  mainResults: FullAnalysisResult;
  competitorResults: Array<{ url: string; results: FullAnalysisResult }>;
}> {
  const { includeAI = true, usePremiumAI = false, industry, targetKeywords = [], companyName, isPremium = false, cachedSecurityResults } = options;
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
  const hasMainPageSpeed = mainPageSpeedResults && mainPageSpeedResults.performance > 0;
  const mainOverallScore = calculateOverallScore(
    mainSeoResults.score,
    mainContentResults.score,
    mainSecurityResults.score,
    hasMainPageSpeed ? mainPageSpeedResults.performance : undefined
  );

  // Step 3: Analyze competitors with full security scan for accurate comparison
  const competitorResults: Array<{ url: string; results: FullAnalysisResult }> = [];
  
  if (competitorUrls.length > 0) {
    // Process competitors with a concurrency cap to avoid overwhelming the server
    const tasks = competitorUrls.map((competitorUrl) => async () => {
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
        const compOverallScore = calculateOverallScore(
          compSeoResults.score,
          compContentResults.score,
          compSecurityResults.score,
          compPageSpeedResults.performance
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
        } as { url: string; results: FullAnalysisResult };
      } catch (error) {
        console.error(`Failed to analyze competitor ${competitorUrl}:`, error);
        return null;
      }
    });
    const results = await runWithConcurrencyLimit(tasks, MAX_COMPETITOR_CONCURRENCY);
    competitorResults.push(...results.filter((r): r is NonNullable<typeof r> => r !== null));
  }

  // Step 4: Generate AI analysis and keyword research with competitor comparison
  let aiSummary: AISummary | null = null;
  let keywordResearch: KeywordData[] | undefined;
  let tokensUsed = 0;
  let aiModel = 'none';
  let costUsd = 0;

  if (includeAI) {
    console.log('Generating AI analysis with competitor comparison...');
    const [aiResult, keywordResult] = await Promise.all([
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
      // Keyword research only runs when the user explicitly supplied keywords.
      targetKeywords.length > 0
        ? generateKeywordResearch(targetKeywords, industry).catch(error => { console.error('Keyword research failed:', error); return null; })
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
  }

  return {
    mainResults: {
      seoResults: mainSeoResults,
      contentResults: mainContentResults,
      securityResults: mainSecurityResults,
      pageSpeedResults: mainPageSpeedResults ?? undefined,
      aiSummary,
      keywordResearch,
      overallScore: mainOverallScore,
      tokensUsed,
      aiModel,
      costUsd,
    },
    competitorResults,
  };
}

// Analyze only competitors (for partial updates without re-analyzing main URL)
export async function analyzeCompetitorsOnly(
  competitorUrls: string[]
): Promise<Array<{ url: string; results: FullAnalysisResult }>> {
  const competitorResults: Array<{ url: string; results: FullAnalysisResult }> = [];
  
  if (competitorUrls.length > 0) {
    const tasks = competitorUrls.map((competitorUrl) => async () => {
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
        const compOverallScore = calculateOverallScore(
          compSeoResults.score,
          compContentResults.score,
          compSecurityResults.score,
          compPageSpeedResults.performance
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
        } as { url: string; results: FullAnalysisResult };
      } catch (error) {
        console.error(`Failed to analyze competitor ${competitorUrl}:`, error);
        return null;
      }
    });
    const results = await runWithConcurrencyLimit(tasks, MAX_COMPETITOR_CONCURRENCY);
    competitorResults.push(...results.filter((r): r is NonNullable<typeof r> => r !== null));
  }

  return competitorResults;
}
