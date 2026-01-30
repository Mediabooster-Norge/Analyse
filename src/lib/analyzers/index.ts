import { scrapeUrl, parseHtml } from '@/lib/services/scraper';
import { analyzeSEO } from './seo-analyzer';
import { analyzeContent } from './content-analyzer';
import { analyzeSecurity, analyzeSecurityQuick } from './security-analyzer';
import { generateAIAnalysis, generateKeywordResearch, KeywordData, checkAIVisibility, AIVisibilityData } from '@/lib/services/openai';
import type { SEOResults, ContentResults, SecurityResults, AISummary } from '@/types';

export interface FullAnalysisResult {
  seoResults: SEOResults;
  contentResults: ContentResults;
  securityResults: SecurityResults;
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
  } = {}
): Promise<FullAnalysisResult> {
  const {
    includeAI = true,
    usePremiumAI = false,
    quickSecurityScan = false,
    industry,
    targetKeywords = [],
    companyName,
    checkAiVisibility: shouldCheckVisibility = true,
    isPremium = false,
  } = options;

  // Step 1: Scrape the URL
  console.log(`Scraping ${url}...`);
  const scrapedData = await scrapeUrl(url);
  const $ = parseHtml(scrapedData.html);

  // Step 2: Run all analyses in parallel
  console.log('Running analyses...');
  const [seoResults, contentResults, securityResults] = await Promise.all([
    analyzeSEO($, url),
    Promise.resolve(analyzeContent($)),
    quickSecurityScan
      ? analyzeSecurityQuick(url, scrapedData.headers)
      : analyzeSecurity(url, scrapedData.headers),
  ]);

  // Step 3: Calculate overall score
  const overallScore = Math.round(
    (seoResults.score * 0.4 + contentResults.score * 0.3 + securityResults.score * 0.3)
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
    
    // Run AI analysis, keyword research, and visibility check in parallel
    const [aiResult, keywordResult, visibilityResult] = await Promise.all([
      generateAIAnalysis(
        {
          url,
          seoResults,
          contentResults,
          securityResults,
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
      shouldCheckVisibility && isPremium
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

    if (visibilityResult) {
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
    usePremiumAI?: boolean;
    industry?: string;
    targetKeywords?: string[];
    companyName?: string;
    isPremium?: boolean;
  } = {}
): Promise<{
  mainResults: FullAnalysisResult;
  competitorResults: Array<{ url: string; results: FullAnalysisResult }>;
}> {
  const { usePremiumAI = false, industry, targetKeywords = [], companyName, isPremium = false } = options;
  
  // Step 1: Scrape main URL
  console.log(`Scraping main URL ${mainUrl}...`);
  const mainScrapedData = await scrapeUrl(mainUrl);
  const main$ = parseHtml(mainScrapedData.html);

  // Step 2: Run main analysis (full SSL)
  console.log('Analyzing main URL...');
  const [mainSeoResults, mainContentResults, mainSecurityResults] = await Promise.all([
    analyzeSEO(main$, mainUrl),
    Promise.resolve(analyzeContent(main$)),
    analyzeSecurity(mainUrl, mainScrapedData.headers),
  ]);

  const mainOverallScore = Math.round(
    (mainSeoResults.score * 0.4 + mainContentResults.score * 0.3 + mainSecurityResults.score * 0.3)
  );

  // Step 3: Analyze competitors (up to 3 for free, quick security scan)
  const competitorResults: Array<{ url: string; results: FullAnalysisResult }> = [];
  
  if (competitorUrls.length > 0) {
    // Process all competitors in parallel for better performance
    const competitorPromises = competitorUrls.map(async (competitorUrl) => {
      console.log(`Analyzing competitor ${competitorUrl}...`);
      
      try {
        const compScrapedData = await scrapeUrl(competitorUrl);
        const comp$ = parseHtml(compScrapedData.html);
        
        const [compSeoResults, compContentResults, compSecurityResults] = await Promise.all([
          analyzeSEO(comp$, competitorUrl),
          Promise.resolve(analyzeContent(comp$)),
          analyzeSecurityQuick(competitorUrl, compScrapedData.headers),
        ]);

        const compOverallScore = Math.round(
          (compSeoResults.score * 0.4 + compContentResults.score * 0.3 + compSecurityResults.score * 0.3)
        );

        return {
          url: competitorUrl,
          results: {
            seoResults: compSeoResults,
            contentResults: compContentResults,
            securityResults: compSecurityResults,
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

  // Step 4: Generate AI analysis and keyword research with competitor comparison
  console.log('Generating AI analysis with competitor comparison...');
  let aiSummary: AISummary | null = null;
  let keywordResearch: KeywordData[] | undefined;
  let tokensUsed = 0;
  let aiModel = 'none';
  let costUsd = 0;

  // Extract domain for AI visibility check
  const domain = new URL(mainUrl).hostname.replace('www.', '');

  // AI-synlighet kun for premium (bruker GPT-4o – høyere kostnad)
  const competitorVisibilityPromises = isPremium
    ? competitorResults.map((c) => {
        const compDomain = new URL(c.url).hostname.replace('www.', '');
        return checkAIVisibility(compDomain, undefined, []).catch((err) => {
          console.error(`AI visibility check failed for ${c.url}:`, err);
          return null;
        });
      })
    : [];

  // Run AI analysis, keyword research, main visibility (premium) + konkurrenters AI-synlighet (premium) i parallell
  const allPromiseResults = await Promise.all([
    generateAIAnalysis(
      {
        url: mainUrl,
        seoResults: mainSeoResults,
        contentResults: mainContentResults,
        securityResults: mainSecurityResults,
        competitorResults: competitorResults.length > 0 ? {
          competitors: competitorResults.map(c => ({
            url: c.url,
            overallScore: c.results.overallScore,
            results: c.results,
          })),
          strengths: [],
          weaknesses: [],
        } : undefined,
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
    isPremium
      ? checkAIVisibility(domain, companyName, targetKeywords).catch(error => {
          console.error('AI visibility check failed:', error);
          return null;
        })
      : Promise.resolve(null),
    ...competitorVisibilityPromises,
  ]);

  const aiResult = allPromiseResults[0];
  const keywordResult = allPromiseResults[1];
  const visibilityResult = allPromiseResults[2];
  const competitorVisibilityResults = allPromiseResults.slice(3) as Array<{ visibility: AIVisibilityData; tokensUsed: number; costUsd: number } | null>;

  let aiVisibility: AIVisibilityData | undefined;

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

  if (visibilityResult) {
    aiVisibility = visibilityResult.visibility;
    tokensUsed += visibilityResult.tokensUsed;
    costUsd += visibilityResult.costUsd;
  }

  // Slå inn AI-synlighet i hver konkurrent og summer tokens/kostnad
  const competitorResultsWithVisibility = competitorResults.map((c, i) => {
    const vis = competitorVisibilityResults[i];
    if (vis) {
      tokensUsed += vis.tokensUsed;
      costUsd += vis.costUsd;
    }
    return {
      ...c,
      results: {
        ...c.results,
        aiVisibility: vis?.visibility,
      },
    };
  });

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

  return {
    mainResults: {
      seoResults: mainSeoResults,
      contentResults: mainContentResults,
      securityResults: mainSecurityResults,
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
        
        const [compSeoResults, compContentResults, compSecurityResults] = await Promise.all([
          analyzeSEO(comp$, competitorUrl),
          Promise.resolve(analyzeContent(comp$)),
          analyzeSecurityQuick(competitorUrl, compScrapedData.headers),
        ]);

        const compOverallScore = Math.round(
          (compSeoResults.score * 0.4 + compContentResults.score * 0.3 + compSecurityResults.score * 0.3)
        );

        return {
          url: competitorUrl,
          results: {
            seoResults: compSeoResults,
            contentResults: compContentResults,
            securityResults: compSecurityResults,
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
