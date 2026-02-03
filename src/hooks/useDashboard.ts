'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePremium, getPremiumLimits } from '@/hooks/usePremium';
import { toast } from 'sonner';
import type {
  DashboardAnalysisResult,
  DashboardTab,
  AISuggestionData,
  SelectedElement,
  KeywordSort,
  CompetitorSort,
  AIVisibilityData,
  ArticleSuggestion,
  GeneratedArticleResult,
} from '@/types/dashboard';
import { normalizeUrl } from '@/lib/utils/score-utils';

interface UseDashboardOptions {
  analysisIdFromUrl: string | null;
  showNewDialog: boolean;
}

interface DashboardState {
  // URL and company info
  url: string;
  companyId: string | null;
  companyUrl: string | null;
  companyName: string | null;
  currentAnalysisId: string | null;
  userName: string | null;
  
  // Analysis inputs
  competitorUrls: string[];
  competitorInput: string;
  keywords: string[];
  keywordInput: string;
  suggestedKeywordCount: number;
  
  // Analysis state
  analyzing: boolean;
  result: DashboardAnalysisResult | null;
  analysisStep: number;
  elapsedTime: number;
  /** True mens hastighet (PageSpeed) hentes i eget kall etter hovedanalyse */
  loadingPageSpeed: boolean;
  /** True mens konkurrenter hentes i egne kall (ett per konkurrent) */
  loadingCompetitors: boolean;
  /** Fremdrift: konkurrent X av Y */
  competitorProgress: { current: number; total: number } | null;
  
  // UI state
  dialogOpen: boolean;
  subpageUrl: string | null; // When set, dialog is in subpage mode
  activeTab: DashboardTab;
  loading: boolean;
  
  // Limits
  remainingAnalyses: number;
  remainingCompetitorUpdates: number;
  remainingKeywordUpdates: number;
  
  // Edit mode
  editingCompetitors: boolean;
  editingKeywords: boolean;
  editCompetitorUrls: string[];
  editCompetitorInput: string;
  editKeywords: string[];
  editKeywordInput: string;
  
  // Sorting
  keywordSort: KeywordSort | null;
  competitorSort: CompetitorSort | null;
  
  // AI features
  aiVisibilityResult: AIVisibilityData | null;
  checkingAiVisibility: boolean;
  suggestingKeywords: boolean;
  
  // AI Suggestions
  suggestionSheetOpen: boolean;
  selectedElement: SelectedElement | null;
  aiSuggestion: AISuggestionData | null;
  loadingSuggestion: boolean;
  
  // Article suggestions (outranking)
  articleSuggestions: ArticleSuggestion[] | null;
  loadingArticleSuggestions: boolean;
  articleSuggestionsSavedAt: string | null;
  
  // Full article generation (1 free / 30 premium per month)
  remainingArticleGenerations: number;
  articleGenerationsLimit: number;
  generatedArticleResult: GeneratedArticleResult | null;
  generatingArticleIndex: number | null;
  
  // Analysis history for trends
  analysisHistory: Array<{
    id: string;
    createdAt: string;
    overallScore: number;
    seoScore: number;
    contentScore: number;
    securityScore: number;
    performanceScore: number | null;
  }>;
  
  // Update states
  updatingCompetitors: boolean;
  updatingKeywords: boolean;
}

const defaultSeoResults = {
  score: 0,
  meta: {
    title: { content: null, length: 0, isOptimal: false },
    description: { content: null, length: 0, isOptimal: false },
    ogTags: { title: null, description: null, image: null },
    canonical: null,
  },
  headings: { h1: { count: 0, contents: [] }, h2: { count: 0, contents: [] }, hasProperHierarchy: false },
  images: { total: 0, withAlt: 0, withoutAlt: 0 },
  links: { internal: { count: 0, urls: [] }, external: { count: 0 } },
};

const defaultSecurityResults = {
  score: 0,
  ssl: { grade: 'Unknown', certificate: { daysUntilExpiry: null } },
  headers: {
    contentSecurityPolicy: false,
    strictTransportSecurity: false,
    xFrameOptions: false,
    xContentTypeOptions: false,
    referrerPolicy: false,
    permissionsPolicy: false,
    score: 0,
  },
  observatory: { grade: 'Unknown', score: 0 },
};

export function useDashboard({ analysisIdFromUrl, showNewDialog }: UseDashboardOptions) {
  const { isPremium, loading: premiumLoading } = usePremium();
  const limits = getPremiumLimits(isPremium);
  
  const FREE_MONTHLY_LIMIT = limits.monthlyAnalyses;
  const FREE_KEYWORD_LIMIT = limits.keywords;
  const FREE_COMPETITOR_LIMIT = limits.competitors;
  const FREE_UPDATE_LIMIT = isPremium ? 999 : 2;
  const ARTICLE_GENERATIONS_LIMIT = limits.articleGenerationsPerMonth ?? 1;

  // State
  const [state, setState] = useState<DashboardState>({
    url: '',
    companyId: null,
    companyUrl: null,
    companyName: null,
    currentAnalysisId: null,
    userName: null,
    competitorUrls: [],
    competitorInput: '',
    keywords: [],
    keywordInput: '',
    suggestedKeywordCount: 20,
    analyzing: false,
    result: null,
    analysisStep: 0,
    elapsedTime: 0,
    loadingPageSpeed: false,
    loadingCompetitors: false,
    competitorProgress: null,
    dialogOpen: showNewDialog,
    subpageUrl: null,
    activeTab: 'overview',
    loading: true,
    remainingAnalyses: 2,
    remainingCompetitorUpdates: 2,
    remainingKeywordUpdates: 2,
    editingCompetitors: false,
    editingKeywords: false,
    editCompetitorUrls: [],
    editCompetitorInput: '',
    editKeywords: [],
    editKeywordInput: '',
    keywordSort: null,
    competitorSort: null,
    aiVisibilityResult: null,
    checkingAiVisibility: false,
    suggestingKeywords: false,
    suggestionSheetOpen: false,
    selectedElement: null,
    aiSuggestion: null,
    loadingSuggestion: false,
    articleSuggestions: null,
    loadingArticleSuggestions: false,
    articleSuggestionsSavedAt: null,
    remainingArticleGenerations: 0,
    articleGenerationsLimit: ARTICLE_GENERATIONS_LIMIT,
    generatedArticleResult: null,
    generatingArticleIndex: null,
    analysisHistory: [],
    updatingCompetitors: false,
    updatingKeywords: false,
  });

  const [cacheKey, setCacheKey] = useState<string | null>(null);

  // Helper to update state partially
  const updateState = useCallback((updates: Partial<DashboardState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Load cached data only when viewing a specific analysis and cache matches that analysis.
  // When viewing "latest" (no analysisIdFromUrl), do not apply cache so Supabase fetch result is not overwritten.
  useEffect(() => {
    if (!cacheKey || !analysisIdFromUrl) return;

    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        if (data.currentAnalysisId === analysisIdFromUrl) {
          const cachedCompetitors = data.result?.competitors?.map((c: { url: string }) => c.url) || [];
          const cachedKeywords = data.result?.keywordResearch?.map((k: { keyword: string }) => k.keyword) || [];

          updateState({
            result: data.result || null,
            companyName: data.companyName || null,
            companyUrl: data.companyUrl || null,
            url: data.url || '',
            userName: data.userName || null,
            remainingAnalyses: data.remainingAnalyses ?? 2,
            remainingCompetitorUpdates: data.remainingCompetitorUpdates ?? 2,
            remainingKeywordUpdates: data.remainingKeywordUpdates ?? 2,
            currentAnalysisId: data.currentAnalysisId || null,
            companyId: data.companyId || null,
            competitorUrls: cachedCompetitors,
            keywords: cachedKeywords,
            loading: data.result ? false : state.loading,
          });
        }
      }
    } catch {
      // Ignore cache errors
    }
  }, [cacheKey, analysisIdFromUrl, updateState]);

  // Fetch user data and existing analysis
  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setCacheKey(`dashboard_cache_${user.id}`);
        
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
        const firstName = fullName ? fullName.split(' ')[0] : user.email?.split('@')[0];
        
        // Get monthly analysis count
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        
        const { data: monthlyAnalyses } = await supabase
          .from('analyses')
          .select('id, created_at')
          .eq('user_id', user.id)
          .gte('created_at', firstDayOfMonth);

        const analysisCount = monthlyAnalyses?.length || 0;

        const { count: articleGenCount } = await supabase
          .from('article_generations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', firstDayOfMonth);

        const remainingArticleGens = Math.max(0, ARTICLE_GENERATIONS_LIMIT - (articleGenCount ?? 0));

        // Fetch analysis
        let analysisQuery = supabase
          .from('analyses')
          .select('*, remaining_competitor_updates, remaining_keyword_updates, website_url, website_name')
          .eq('user_id', user.id);
        
        if (analysisIdFromUrl) {
          analysisQuery = analysisQuery.eq('id', analysisIdFromUrl);
        } else {
          analysisQuery = analysisQuery.order('created_at', { ascending: false }).limit(1);
        }
        
        const { data: analysis } = await analysisQuery.maybeSingle();

        if (analysis) {
          // Deep merge results with defaults
          const mergedSecurityResults = analysis.security_results ? {
            score: analysis.security_results.score ?? defaultSecurityResults.score,
            ssl: { ...defaultSecurityResults.ssl, ...(analysis.security_results.ssl || {}) },
            headers: { ...defaultSecurityResults.headers, ...(analysis.security_results.headers || {}) },
            observatory: { ...defaultSecurityResults.observatory, ...(analysis.security_results.observatory || {}) },
          } : defaultSecurityResults;

          const mergedSeoResults = analysis.seo_results ? {
            score: analysis.seo_results.score ?? defaultSeoResults.score,
            meta: {
              title: { ...defaultSeoResults.meta.title, ...(analysis.seo_results.meta?.title || {}) },
              description: { ...defaultSeoResults.meta.description, ...(analysis.seo_results.meta?.description || {}) },
              ogTags: { ...defaultSeoResults.meta.ogTags, ...(analysis.seo_results.meta?.ogTags || {}) },
              canonical: analysis.seo_results.meta?.canonical ?? defaultSeoResults.meta.canonical,
            },
            headings: {
              h1: { ...defaultSeoResults.headings.h1, ...(analysis.seo_results.headings?.h1 || {}) },
              h2: { ...defaultSeoResults.headings.h2, ...(analysis.seo_results.headings?.h2 || {}) },
              hasProperHierarchy: analysis.seo_results.headings?.hasProperHierarchy ?? defaultSeoResults.headings.hasProperHierarchy,
            },
            images: { ...defaultSeoResults.images, ...(analysis.seo_results.images || {}) },
            links: {
              internal: { ...defaultSeoResults.links.internal, ...(analysis.seo_results.links?.internal || {}) },
              external: { ...defaultSeoResults.links.external, ...(analysis.seo_results.links?.external || {}) },
            },
          } : defaultSeoResults;

          // Pre-fill competitors and keywords from the loaded analysis
          const loadedCompetitors = (analysis.competitor_results || [])
            .map((c: { url: string }) => c.url)
            .slice(0, FREE_COMPETITOR_LIMIT);
          const loadedKeywords = (analysis.keyword_research || [])
            .map((k: { keyword: string }) => k.keyword)
            .slice(0, FREE_KEYWORD_LIMIT);

          // Fetch saved article suggestions for this analysis
          let savedArticleSuggestions: ArticleSuggestion[] | null = null;
          let savedArticleSuggestionsAt: string | null = null;
          try {
            const suggestionsRes = await fetch(`/api/suggest-articles?analysisId=${analysis.id}`);
            if (suggestionsRes.ok) {
              const suggestionsData = await suggestionsRes.json();
              if (suggestionsData.suggestions && Array.isArray(suggestionsData.suggestions)) {
                savedArticleSuggestions = suggestionsData.suggestions;
                savedArticleSuggestionsAt = suggestionsData.savedAt || null;
              }
            }
          } catch {
            // Ignore errors loading saved suggestions
          }

          // Fetch analysis history for trends (same website URL, up to last 10 analyses)
          let analysisHistory: DashboardState['analysisHistory'] = [];
          if (analysis.website_url) {
            try {
              const { data: historyData } = await supabase
                .from('analyses')
                .select('id, created_at, overall_score, seo_results, content_results, security_results, pagespeed_results')
                .eq('user_id', user.id)
                .eq('website_url', analysis.website_url)
                .eq('status', 'completed')
                .order('created_at', { ascending: false })
                .limit(10);
              
              if (historyData && historyData.length > 0) {
                analysisHistory = historyData.map((h) => ({
                  id: h.id,
                  createdAt: h.created_at,
                  overallScore: h.overall_score || 0,
                  seoScore: h.seo_results?.score || 0,
                  contentScore: h.content_results?.score || 0,
                  securityScore: h.security_results?.score || 0,
                  performanceScore: h.pagespeed_results?.performance ?? null,
                })).reverse(); // Reverse to show oldest first (for chart)
              }
            } catch {
              // Ignore history fetch errors
            }
          }

          updateState({
            currentAnalysisId: analysis.id,
            companyUrl: analysis.website_url || null,
            url: analysis.website_url || '',
            companyName: analysis.website_name || null,
            remainingCompetitorUpdates: analysis.remaining_competitor_updates ?? 2,
            remainingKeywordUpdates: analysis.remaining_keyword_updates ?? 2,
            remainingAnalyses: Math.max(0, FREE_MONTHLY_LIMIT - analysisCount),
            remainingArticleGenerations: remainingArticleGens,
            articleGenerationsLimit: ARTICLE_GENERATIONS_LIMIT,
            userName: firstName || null,
            competitorUrls: loadedCompetitors,
            keywords: loadedKeywords,
            articleSuggestions: savedArticleSuggestions,
            articleSuggestionsSavedAt: savedArticleSuggestionsAt,
            analysisHistory,
            result: {
              seoResults: mergedSeoResults,
              contentResults: analysis.content_results || { score: 0, wordCount: 0 },
              securityResults: mergedSecurityResults,
              pageSpeedResults: analysis.pagespeed_results || undefined,
              overallScore: analysis.overall_score || 0,
              competitors: analysis.competitor_results || undefined,
              aiSummary: analysis.ai_summary || undefined,
              keywordResearch: analysis.keyword_research || undefined,
              aiVisibility: analysis.ai_visibility || undefined,
            },
          });
        } else {
          updateState({
            userName: firstName || null,
            remainingAnalyses: Math.max(0, FREE_MONTHLY_LIMIT - analysisCount),
            remainingArticleGenerations: remainingArticleGens,
            articleGenerationsLimit: ARTICLE_GENERATIONS_LIMIT,
          });
        }
      }
      
      updateState({ loading: false });
    }
    
    fetchData();
  }, [analysisIdFromUrl, FREE_MONTHLY_LIMIT, ARTICLE_GENERATIONS_LIMIT, isPremium, updateState]);

  // Save to cache when data changes
  useEffect(() => {
    if (state.result && !state.loading && cacheKey) {
      try {
        const cacheData = {
          result: state.result,
          companyName: state.companyName,
          companyUrl: state.companyUrl,
          url: state.url,
          userName: state.userName,
          remainingAnalyses: state.remainingAnalyses,
          remainingCompetitorUpdates: state.remainingCompetitorUpdates,
          remainingKeywordUpdates: state.remainingKeywordUpdates,
          currentAnalysisId: state.currentAnalysisId,
          companyId: state.companyId,
          timestamp: Date.now(),
        };
        sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch {
        // Ignore cache errors
      }
    }
  }, [state.result, state.companyName, state.companyUrl, state.url, state.userName, 
      state.remainingAnalyses, state.remainingCompetitorUpdates, state.remainingKeywordUpdates, 
      state.currentAnalysisId, state.companyId, state.loading, cacheKey]);

  // Timer for analysis
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state.analyzing) {
      updateState({ elapsedTime: 0 });
      interval = setInterval(() => {
        setState(prev => ({ ...prev, elapsedTime: prev.elapsedTime + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state.analyzing, updateState]);

  // Actions
  const setUrl = useCallback((url: string) => updateState({ url }), [updateState]);
  const setDialogOpen = useCallback((open: boolean) => {
    // Clear subpageUrl when closing dialog
    if (!open) {
      updateState({ dialogOpen: false, subpageUrl: null });
    } else {
      updateState({ dialogOpen: true });
    }
  }, [updateState]);
  const openSubpageDialog = useCallback((subpageUrl: string) => {
    // Clear existing competitors when opening subpage dialog - user can add specific ones manually
    updateState({ url: subpageUrl, subpageUrl, dialogOpen: true, competitorUrls: [], competitorInput: '' });
  }, [updateState]);
  const setActiveTab = useCallback((tab: DashboardTab) => updateState({ activeTab: tab }), [updateState]);
  const setCompetitorInput = useCallback((input: string) => updateState({ competitorInput: input }), [updateState]);
  const setKeywordInput = useCallback((input: string) => updateState({ keywordInput: input }), [updateState]);
  const setSuggestedKeywordCount = useCallback((count: number) => updateState({ suggestedKeywordCount: count }), [updateState]);
  const setKeywordSort = useCallback((sort: KeywordSort | null) => updateState({ keywordSort: sort }), [updateState]);
  const setCompetitorSort = useCallback((sort: CompetitorSort | null) => updateState({ competitorSort: sort }), [updateState]);
  const setSuggestionSheetOpen = useCallback((open: boolean) => updateState({ suggestionSheetOpen: open }), [updateState]);
  const setEditCompetitorInput = useCallback((input: string) => updateState({ editCompetitorInput: input }), [updateState]);
  const setEditKeywordInput = useCallback((input: string) => updateState({ editKeywordInput: input }), [updateState]);
  const setAiVisibilityResult = useCallback((data: AIVisibilityData | null) => updateState({ aiVisibilityResult: data }), [updateState]);

  const checkAiVisibility = useCallback(async () => {
    updateState({ checkingAiVisibility: true });
    try {
      const response = await fetch('/api/analyze/ai-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: state.companyUrl || state.url,
          companyName: state.companyName,
          keywords: state.result?.keywordResearch?.slice(0, 3).map((k) => k.keyword) || [],
        }),
      });
      const data = await response.json();
      if (data.estimatedOnly) {
        toast.error(data.message || 'Kunne ikke sjekke AI-synlighet');
      } else if (data.score !== undefined) {
        updateState({ aiVisibilityResult: data });
      }
    } catch {
      toast.error('En feil oppstod under sjekk av AI-synlighet');
    } finally {
      updateState({ checkingAiVisibility: false });
    }
  }, [state.companyUrl, state.url, state.companyName, state.result?.keywordResearch, updateState]);

  const addKeyword = useCallback(() => {
    const trimmed = state.keywordInput.trim().toLowerCase();
    if (!trimmed) return;
    if (state.keywords.length >= FREE_KEYWORD_LIMIT) {
      toast.error(`Maks ${FREE_KEYWORD_LIMIT} nøkkelord i gratis-versjonen`);
      return;
    }
    if (state.keywords.includes(trimmed)) {
      toast.error('Dette nøkkelordet er allerede lagt til');
      return;
    }
    updateState({
      keywords: [...state.keywords, trimmed],
      keywordInput: '',
    });
  }, [state.keywordInput, state.keywords, FREE_KEYWORD_LIMIT, updateState]);

  const removeKeyword = useCallback((keyword: string) => {
    updateState({ keywords: state.keywords.filter(k => k !== keyword) });
  }, [state.keywords, updateState]);

  const clearKeywords = useCallback(() => {
    updateState({ keywords: [] });
  }, [updateState]);

  const addCompetitor = useCallback(() => {
    const trimmed = state.competitorInput.trim().toLowerCase();
    if (!trimmed) return;
    if (state.competitorUrls.length >= FREE_COMPETITOR_LIMIT) {
      toast.error(isPremium ? 'Maks antall konkurrenter nådd' : `Maks ${FREE_COMPETITOR_LIMIT} konkurrenter i gratis-versjonen`);
      return;
    }
    const normalized = normalizeUrl(trimmed);
    if (state.competitorUrls.includes(normalized)) {
      toast.error('Denne konkurrenten er allerede lagt til');
      return;
    }
    updateState({
      competitorUrls: [...state.competitorUrls, normalized],
      competitorInput: '',
    });
  }, [state.competitorInput, state.competitorUrls, FREE_COMPETITOR_LIMIT, isPremium, updateState]);

  const removeCompetitor = useCallback((url: string) => {
    updateState({ competitorUrls: state.competitorUrls.filter(c => c !== url) });
  }, [state.competitorUrls, updateState]);

  const runAnalysis = useCallback(async () => {
    if (!state.url) {
      toast.error('Vennligst oppgi en URL');
      return;
    }

    const isSubpage = !!state.subpageUrl;
    updateState({ analyzing: true, analysisStep: 0, result: null });

    const stepTimings = [5000, 8000, 12000, 8000, 12000];
    let currentStep = 0;
    
    const advanceStep = () => {
      if (currentStep < 4) {
        currentStep++;
        updateState({ analysisStep: currentStep });
        if (currentStep < 4) {
          setTimeout(advanceStep, stepTimings[currentStep]);
        }
      }
    };
    
    const stepTimeout = setTimeout(advanceStep, stepTimings[0]);
    let willFetchPageSpeed = false;
    let willFetchCompetitors = false;

    try {
      const normalizedUrl = state.url.startsWith('http') ? state.url : `https://${state.url}`;
      const websiteName = new URL(normalizedUrl).hostname.replace(/^www\./, '');
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: state.url,
          websiteName,
          // Alltid uten konkurrenter: hovedanalysen kjører i egen batch (under 60s). Konkurrenter legges til etterpå via «Sammenlign med konkurrenter».
          competitorUrls: [],
          keywords: state.keywords.length > 0 ? state.keywords : undefined,
          includeAI: true,
        }),
      });

      clearTimeout(stepTimeout);

      if (!response.ok) {
        const isTimeout = response.status === 504 || response.status === 503;
        let errorMessage = 'Analyse feilet';
        try {
          const errorData = await response.json();
          if (errorData.limitReached) {
            updateState({ remainingAnalyses: 0, dialogOpen: false, subpageUrl: null });
            toast.error(errorData.error || 'Du har brukt opp dine gratis analyser denne måneden');
            return;
          }
          if (typeof errorData.error === 'string') errorMessage = errorData.error;
        } catch {
          // 502/504 often return HTML; use timeout message when appropriate
          if (isTimeout) errorMessage = 'timeout';
        }
        if (isTimeout || errorMessage.toLowerCase().includes('timeout')) {
          toast.error('Analysen tok for lang tid og ble avbrutt', {
            description: 'Prøv å kjøre analysen på nytt. Ved mange konkurrenter kan du prøve med færre.',
          });
          return;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const analysisId = data.analysisId ?? undefined;
      const competitorUrlsToFetch = state.competitorUrls.slice();
      willFetchPageSpeed = !!analysisId;
      willFetchCompetitors = !!analysisId && competitorUrlsToFetch.length > 0;
      updateState({
        result: data,
        currentAnalysisId: analysisId ?? state.currentAnalysisId,
        companyUrl: normalizedUrl,
        companyName: websiteName,
        remainingAnalyses: Math.max(0, state.remainingAnalyses - 1),
        dialogOpen: willFetchPageSpeed || willFetchCompetitors,
        subpageUrl: null,
        loadingPageSpeed: willFetchPageSpeed,
        loadingCompetitors: willFetchCompetitors,
        competitorProgress: willFetchCompetitors ? { current: 0, total: competitorUrlsToFetch.length } : null,
        ...(isSubpage ? { articleSuggestions: null, articleSuggestionsSavedAt: null } : {}),
      });
      if (!willFetchPageSpeed && !willFetchCompetitors) toast.success('Analyse fullført!');

      const tryCloseDialog = () => {
        setState((prev) => {
          if (prev.loadingPageSpeed || prev.loadingCompetitors) return prev;
          return { ...prev, dialogOpen: false, analyzing: false };
        });
      };

      if (analysisId) {
        if (willFetchPageSpeed) {
          fetch('/api/analyze/pagespeed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ analysisId }),
          })
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error('PageSpeed failed'))))
            .then(({ pageSpeedResults, overallScore }) => {
              setState((prev) => ({
                ...prev,
                loadingPageSpeed: false,
                result: prev.result
                  ? {
                      ...prev.result,
                      pageSpeedResults: pageSpeedResults ?? undefined,
                      overallScore: overallScore ?? prev.result.overallScore,
                    }
                  : null,
              }));
              tryCloseDialog();
              if (!willFetchCompetitors) {
                toast.success(pageSpeedResults ? 'Analyse fullført med hastighetsmåling!' : 'Analyse fullført!');
              }
            })
            .catch(() => {
              updateState({ loadingPageSpeed: false });
              tryCloseDialog();
              if (!willFetchCompetitors) toast.success('Analyse fullført (hastighet kunne ikke måles)');
            });
        }

        if (willFetchCompetitors) {
          (async () => {
            let competitors: Array<{ url: string; results: unknown }> = data.competitors ?? [];
            for (let i = 0; i < competitorUrlsToFetch.length; i++) {
              try {
                const res = await fetch('/api/analyze/competitor', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ analysisId, competitorUrl: competitorUrlsToFetch[i] }),
                });
                const body = res.ok ? await res.json() : null;
                if (body?.competitor) {
                  competitors = [...competitors, body.competitor];
                  setState((prev) => ({
                    ...prev,
                    result: prev.result ? { ...prev.result, competitors } : null,
                    competitorProgress: { current: i + 1, total: competitorUrlsToFetch.length },
                  }));
                }
              } catch {
                // skip failed competitor
              }
            }
            setState((prev) => ({
              ...prev,
              loadingCompetitors: false,
              competitorProgress: null,
            }));
            tryCloseDialog();
            const msg = competitors.length > 0
              ? `Analyse fullført med hastighet og ${competitors.length} konkurrent${competitors.length > 1 ? 'er' : ''}!`
              : willFetchPageSpeed
                ? 'Analyse fullført med hastighetsmåling!'
                : 'Analyse fullført!';
            toast.success(msg);
          })();
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      const isTimeoutOrNetwork =
        /timeout|timed out|network|failed to fetch|load failed/i.test(msg) || msg === '';
      if (isTimeoutOrNetwork) {
        toast.error('Analysen tok for lang tid eller ble avbrutt', {
          description: 'Prøv å kjøre analysen på nytt. Ved mange konkurrenter kan du prøve med færre.',
        });
      } else {
        toast.error(msg || 'En feil oppstod');
      }
    } finally {
      clearTimeout(stepTimeout);
      if (!willFetchPageSpeed && !willFetchCompetitors) updateState({ analyzing: false });
    }
  }, [state.url, state.subpageUrl, state.competitorUrls, state.keywords, state.remainingAnalyses, updateState]);

  const suggestKeywords = useCallback(async () => {
    // Use the URL from the dialog input (state.url) first, as that's what the user is currently editing
    // Fall back to companyUrl only if no URL is entered in the dialog
    const targetUrl = state.url || state.companyUrl;
    if (!targetUrl) {
      toast.error('Vennligst oppgi en URL først');
      return;
    }

    updateState({ suggestingKeywords: true });
    try {
      const response = await fetch('/api/suggest-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          count: Math.min(state.suggestedKeywordCount, FREE_KEYWORD_LIMIT),
        }),
      });

      if (!response.ok) throw new Error('Kunne ikke hente forslag');

      const data = await response.json();
      if (data.keywords && Array.isArray(data.keywords)) {
        const normalized = data.keywords.map((k: string) => k.toLowerCase().trim());
        const newKeywords = normalized
          .filter((k: string) => !state.keywords.includes(k))
          .slice(0, FREE_KEYWORD_LIMIT - state.keywords.length);
        updateState({ keywords: [...state.keywords, ...newKeywords] });
        toast.success(`${newKeywords.length} nøkkelord lagt til`);
      }
    } catch {
      toast.error('Kunne ikke hente forslag til nøkkelord');
    } finally {
      updateState({ suggestingKeywords: false });
    }
  }, [state.companyUrl, state.url, state.suggestedKeywordCount, state.keywords, FREE_KEYWORD_LIMIT, updateState]);

  const fetchArticleSuggestions = useCallback(async (withCompetitors: boolean) => {
    const targetUrl = state.companyUrl || state.url;
    if (!targetUrl) {
      toast.error('Ingen analyse lastet. Kjør en analyse først.');
      return;
    }
    updateState({ loadingArticleSuggestions: true, articleSuggestions: null, articleSuggestionsSavedAt: null });
    try {
      const competitorUrls =
        withCompetitors && state.result?.competitors
          ? state.result.competitors.map((c) => c.url)
          : [];
      const response = await fetch('/api/suggest-articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          companyName: state.companyName,
          keywords: state.keywords.length > 0 ? state.keywords : (state.result?.keywordResearch?.map((k) => k.keyword) ?? []),
          competitorUrls,
          withCompetitors: withCompetitors && competitorUrls.length > 0,
          analysisId: state.currentAnalysisId,
        }),
      });
      if (!response.ok) throw new Error('Kunne ikke hente artikkelforslag');
      const data = await response.json();
      if (data.suggestions && Array.isArray(data.suggestions)) {
        updateState({
          articleSuggestions: data.suggestions,
          articleSuggestionsSavedAt: data.savedAt || null,
        });
      } else {
        updateState({ articleSuggestions: [], articleSuggestionsSavedAt: null });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Kunne ikke hente artikkelforslag');
      updateState({ articleSuggestions: null, articleSuggestionsSavedAt: null });
    } finally {
      updateState({ loadingArticleSuggestions: false });
    }
  }, [state.companyUrl, state.url, state.companyName, state.keywords, state.result?.competitors, state.result?.keywordResearch, state.currentAnalysisId, updateState]);

  const fetchGenerateArticle = useCallback(async (suggestion: { title: string; rationale?: string }, index: number) => {
    if (state.remainingArticleGenerations <= 0) {
      toast.error('Du har brukt opp artikkelgenereringer denne måneden.');
      return;
    }
    updateState({ generatingArticleIndex: index, generatedArticleResult: null });
    try {
      const response = await fetch('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: suggestion.title,
          rationale: suggestion.rationale,
          companyName: state.companyName ?? undefined,
          websiteUrl: state.companyUrl ?? undefined,
          websiteName: state.companyName ?? undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 429) {
          toast.error(data.error || 'Du har brukt opp artikkelgenereringer denne måneden.');
          updateState({ remainingArticleGenerations: 0 });
        } else {
          toast.error(data.error || 'Kunne ikke generere artikkel');
        }
        return;
      }
      if (data.article) {
        updateState({
          generatedArticleResult: {
            title: data.title ?? suggestion.title.trim(),
            article: data.article,
            metaTitle: data.metaTitle,
            metaDescription: data.metaDescription,
            featuredImageSuggestion: data.featuredImageSuggestion,
            featuredImageUrl: data.featuredImageUrl,
            featuredImageDownloadUrl: data.featuredImageDownloadUrl,
            featuredImageAttribution: data.featuredImageAttribution,
            featuredImageProfileUrl: data.featuredImageProfileUrl,
          },
          remainingArticleGenerations: data.remaining ?? state.remainingArticleGenerations - 1,
        });
        toast.success('Artikkel generert!');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Kunne ikke generere artikkel');
    } finally {
      updateState({ generatingArticleIndex: null });
    }
  }, [state.remainingArticleGenerations, state.companyName, updateState]);

  const setGeneratedArticle = useCallback((result: GeneratedArticleResult | null) => {
    updateState({ generatedArticleResult: result });
  }, [updateState]);

  const fetchAISuggestion = useCallback(async (
    element: string,
    currentValue: string,
    status: 'good' | 'warning' | 'bad',
    issue?: string,
    relatedUrls?: string[]
  ) => {
    updateState({
      selectedElement: { name: element, value: currentValue, status, relatedUrls },
      suggestionSheetOpen: true,
      loadingSuggestion: true,
      aiSuggestion: null,
    });

    try {
      const response = await fetch('/api/ai-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          element,
          currentValue,
          status,
          issue,
          context: { url: state.companyUrl },
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        updateState({ aiSuggestion: data.data });
      } else {
        toast.error('Kunne ikke hente forslag');
      }
    } catch (error) {
      console.error('Error fetching suggestion:', error);
      toast.error('Noe gikk galt');
    } finally {
      updateState({ loadingSuggestion: false });
    }
  }, [state.companyUrl, updateState]);

  const startEditingCompetitors = useCallback(() => {
    const currentCompetitors = state.result?.competitors?.map((c) => c.url) || [];
    // Ved første gang (ingen konkurrenter ennå): bruk URL-er brukeren la inn i dialogen
    const editUrls = currentCompetitors.length > 0 ? currentCompetitors : state.competitorUrls;
    updateState({ editCompetitorUrls: editUrls, editingCompetitors: true });
  }, [state.result?.competitors, state.competitorUrls, updateState]);

  const addEditCompetitor = useCallback(() => {
    const trimmed = state.editCompetitorInput.trim().toLowerCase();
    if (!trimmed) return;
    if (state.editCompetitorUrls.length >= FREE_COMPETITOR_LIMIT) {
      toast.error(isPremium ? 'Maks antall konkurrenter nådd' : `Maks ${FREE_COMPETITOR_LIMIT} konkurrenter i gratis-versjonen`);
      return;
    }
    const normalized = normalizeUrl(trimmed);
    if (state.editCompetitorUrls.includes(normalized)) {
      toast.error('Denne konkurrenten er allerede lagt til');
      return;
    }
    updateState({
      editCompetitorUrls: [...state.editCompetitorUrls, normalized],
      editCompetitorInput: '',
    });
  }, [state.editCompetitorInput, state.editCompetitorUrls, FREE_COMPETITOR_LIMIT, isPremium, updateState]);

  const removeEditCompetitor = useCallback((url: string) => {
    updateState({ editCompetitorUrls: state.editCompetitorUrls.filter((c) => c !== url) });
  }, [state.editCompetitorUrls, updateState]);

  const cancelEditingCompetitors = useCallback(() => {
    updateState({ editingCompetitors: false, editCompetitorUrls: [], editCompetitorInput: '' });
  }, [updateState]);

  const updateCompetitorAnalysis = useCallback(async () => {
    if (!isPremium && state.remainingCompetitorUpdates <= 0) {
      toast.error('Du har brukt opp dine gratis oppdateringer for konkurrenter');
      return;
    }
    const currentCompetitors = state.result?.competitors?.map((c) => c.url) || [];
    const newCompetitors = state.editCompetitorUrls.filter((c) => !currentCompetitors.includes(c));
    const removedCompetitors = currentCompetitors.filter((c) => !state.editCompetitorUrls.includes(c));
    if (newCompetitors.length === 0 && removedCompetitors.length === 0) {
      toast.error('Ingen endringer å oppdatere');
      return;
    }
    updateState({ updatingCompetitors: true });
    try {
      const response = await fetch('/api/analyze/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mainUrl: state.companyUrl || state.url,
          competitorUrls: newCompetitors,
          existingCompetitors: state.editCompetitorUrls.filter((c) => currentCompetitors.includes(c)),
        }),
      });
      if (!response.ok) throw new Error('Kunne ikke oppdatere konkurrentanalyse');
      const data = await response.json();
      if (state.result && data.competitors) {
        const existingToKeep = state.result.competitors?.filter((c) => state.editCompetitorUrls.includes(c.url)) || [];
        const updatedCompetitors = [...existingToKeep, ...data.competitors];
        updateState({
          result: { ...state.result, competitors: updatedCompetitors },
          remainingCompetitorUpdates: state.remainingCompetitorUpdates - 1,
          editingCompetitors: false,
          editCompetitorUrls: [],
        });
        if (state.currentAnalysisId) {
          const supabase = createClient();
          await supabase
            .from('analyses')
            .update({
              competitor_results: updatedCompetitors,
              remaining_competitor_updates: state.remainingCompetitorUpdates - 1,
            })
            .eq('id', state.currentAnalysisId);
        }
        toast.success('Konkurrentanalyse oppdatert!');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'En feil oppstod');
    } finally {
      updateState({ updatingCompetitors: false });
    }
  }, [state.result, state.editCompetitorUrls, state.companyUrl, state.url, state.currentAnalysisId, state.remainingCompetitorUpdates, isPremium, updateState]);

  const startEditingKeywords = useCallback(() => {
    const currentKeywords = state.result?.keywordResearch?.map((k) => k.keyword) || [];
    updateState({ editKeywords: currentKeywords, editingKeywords: true });
  }, [state.result?.keywordResearch, updateState]);

  const addEditKeyword = useCallback(() => {
    const trimmed = state.editKeywordInput.trim().toLowerCase();
    if (!trimmed) return;
    if (state.editKeywords.length >= FREE_KEYWORD_LIMIT) {
      toast.error(`Maks ${FREE_KEYWORD_LIMIT} nøkkelord i gratis-versjonen`);
      return;
    }
    if (state.editKeywords.includes(trimmed)) {
      toast.error('Dette nøkkelordet er allerede lagt til');
      return;
    }
    updateState({ editKeywords: [...state.editKeywords, trimmed], editKeywordInput: '' });
  }, [state.editKeywordInput, state.editKeywords, FREE_KEYWORD_LIMIT, updateState]);

  const removeEditKeyword = useCallback((keyword: string) => {
    updateState({ editKeywords: state.editKeywords.filter((k) => k !== keyword) });
  }, [state.editKeywords, updateState]);

  const cancelEditingKeywords = useCallback(() => {
    updateState({ editingKeywords: false, editKeywords: [], editKeywordInput: '' });
  }, [updateState]);

  const updateKeywordAnalysis = useCallback(async () => {
    if (!isPremium && state.remainingKeywordUpdates <= 0) {
      toast.error('Du har brukt opp dine gratis oppdateringer for nøkkelord');
      return;
    }
    if (state.editKeywords.length === 0) {
      toast.error('Legg til minst ett nøkkelord');
      return;
    }
    updateState({ updatingKeywords: true });
    try {
      const response = await fetch('/api/analyze/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: state.editKeywords,
          url: state.companyUrl || state.url,
        }),
      });
      if (!response.ok) throw new Error('Kunne ikke oppdatere nøkkelordanalyse');
      const data = await response.json();
      if (state.result && data.keywordResearch) {
        updateState({
          result: { ...state.result, keywordResearch: data.keywordResearch },
          remainingKeywordUpdates: state.remainingKeywordUpdates - 1,
          editingKeywords: false,
          editKeywords: [],
        });
        if (state.currentAnalysisId) {
          const supabase = createClient();
          await supabase
            .from('analyses')
            .update({
              keyword_research: data.keywordResearch,
              remaining_keyword_updates: state.remainingKeywordUpdates - 1,
            })
            .eq('id', state.currentAnalysisId);
        }
        toast.success('Nøkkelordanalyse oppdatert!');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'En feil oppstod');
    } finally {
      updateState({ updatingKeywords: false });
    }
  }, [state.result, state.editKeywords, state.companyUrl, state.url, state.currentAnalysisId, state.remainingKeywordUpdates, isPremium, updateState]);

  return {
    // State
    ...state,
    
    // Premium info
    isPremium,
    premiumLoading,
    limits: {
      monthlyAnalyses: FREE_MONTHLY_LIMIT,
      keywords: FREE_KEYWORD_LIMIT,
      competitors: FREE_COMPETITOR_LIMIT,
      updates: FREE_UPDATE_LIMIT,
      articleGenerationsPerMonth: ARTICLE_GENERATIONS_LIMIT,
    },
    
    // Actions
    setUrl,
    setDialogOpen,
    openSubpageDialog,
    setActiveTab,
    setCompetitorInput,
    setKeywordInput,
    setSuggestedKeywordCount,
    setKeywordSort,
    setCompetitorSort,
    setSuggestionSheetOpen,
    setEditCompetitorInput,
    setEditKeywordInput,
    setAiVisibilityResult,
    checkAiVisibility,
    addKeyword,
    removeKeyword,
    clearKeywords,
    addCompetitor,
    removeCompetitor,
    runAnalysis,
    suggestKeywords,
    suggestingKeywords: state.suggestingKeywords,
    fetchAISuggestion,
    articleSuggestions: state.articleSuggestions,
    loadingArticleSuggestions: state.loadingArticleSuggestions,
    articleSuggestionsSavedAt: state.articleSuggestionsSavedAt,
    fetchArticleSuggestions,
    remainingArticleGenerations: state.remainingArticleGenerations,
    articleGenerationsLimit: state.articleGenerationsLimit,
    generatedArticleResult: state.generatedArticleResult,
    generatingArticleIndex: state.generatingArticleIndex,
    fetchGenerateArticle,
    setGeneratedArticle,
    analysisHistory: state.analysisHistory,
    startEditingCompetitors,
    addEditCompetitor,
    removeEditCompetitor,
    cancelEditingCompetitors,
    updateCompetitorAnalysis,
    startEditingKeywords,
    addEditKeyword,
    removeEditKeyword,
    cancelEditingKeywords,
    updateKeywordAnalysis,
    updateState,
  };
}
