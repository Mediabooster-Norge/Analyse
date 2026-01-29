'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  FileText,
  Shield,
  BarChart3,
  Clock,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Globe,
  Sparkles,
  Tag,
  X,
  Zap,
  ExternalLink,
  Link2,
  Lightbulb,
  ChevronRight,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

// AI Suggestion types
interface AISuggestion {
  title: string;
  description: string;
  priority: 'høy' | 'medium' | 'lav';
  example?: string;
}

interface AISuggestionData {
  problem?: string;
  summary: string;
  suggestions: AISuggestion[];
  quickWin: string;
}

// Score Ring Component (matching the landing page style)
function ScoreRing({ 
  score, 
  label, 
  size = 'md',
  showStatus = false,
  neutral = false
}: { 
  score: number; 
  label: string; 
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  neutral?: boolean;
}) {
  const sizes = {
    sm: { ring: 56, stroke: 4, text: 'text-lg', label: 'text-xs' },
    md: { ring: 72, stroke: 5, text: 'text-xl', label: 'text-xs' },
    lg: { ring: 96, stroke: 6, text: 'text-2xl', label: 'text-sm' },
    xl: { ring: 120, stroke: 7, text: 'text-3xl', label: 'text-sm' },
  };
  const s = sizes[size];
  const radius = (s.ring - s.stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const getScoreColor = (score: number) => {
    if (neutral) return 'text-neutral-400';
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: s.ring, height: s.ring }}>
        <svg className="-rotate-90" style={{ width: s.ring, height: s.ring }} viewBox={`0 0 ${s.ring} ${s.ring}`}>
          <circle
            cx={s.ring / 2}
            cy={s.ring / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={s.stroke}
            className="text-neutral-100"
          />
          <circle
            cx={s.ring / 2}
            cy={s.ring / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={s.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`${getScoreColor(score)} transition-all duration-1000`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${s.text} font-semibold text-neutral-900`}>{score}</span>
        </div>
      </div>
      <span className={`${s.label} text-neutral-500 font-medium`}>{label}</span>
      {showStatus && (
        <span className={`text-xs font-medium ${neutral ? 'text-neutral-500' : getScoreColor(score)}`}>
          {score >= 90 ? 'Veldig bra' : score >= 70 ? 'Bra' : score >= 50 ? 'Ok' : 'Trenger forbedring'}
        </span>
      )}
    </div>
  );
}

interface LimitError {
  error: string;
  limitReached: boolean;
  contactUrl: string;
}

interface KeywordResearchData {
  keyword: string;
  searchVolume: number;
  cpc: number;
  competition: 'lav' | 'medium' | 'høy';
  competitionScore: number;
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  difficulty: number;
  trend: 'stigende' | 'stabil' | 'synkende';
}

interface AnalysisResult {
  seoResults: {
    score: number;
    meta: { 
      title: { content: string | null; length: number; isOptimal: boolean };
      description: { content: string | null; length: number; isOptimal: boolean };
      ogTags: { title: string | null; description: string | null; image: string | null };
      canonical: string | null;
    };
    headings: {
      h1: { count: number; contents: string[] };
      h2: { count: number; contents: string[] };
      hasProperHierarchy: boolean;
    };
    images: {
      total: number;
      withAlt: number;
      withoutAlt: number;
    };
    links: {
      internal: { count: number };
      external: { count: number };
    };
  };
  contentResults: {
    score: number;
    wordCount: number;
    keywords?: Array<{ word: string; count: number; density: number }>;
  };
  securityResults: {
    score: number;
    ssl: { 
      grade: string;
      certificate: {
        daysUntilExpiry: number | null;
      };
    };
    headers: {
      contentSecurityPolicy: boolean;
      strictTransportSecurity: boolean;
      xFrameOptions: boolean;
      xContentTypeOptions: boolean;
      referrerPolicy: boolean;
      permissionsPolicy: boolean;
      score: number;
    };
    observatory: {
      grade: string;
      score: number;
    };
  };
  overallScore: number;
  keywordResearch?: KeywordResearchData[];
  competitors?: Array<{
    url: string;
    results: {
      seoResults: { score: number };
      contentResults: { score: number; wordCount: number };
      securityResults: { score: number };
      overallScore: number;
    };
  }>;
  aiSummary?: {
    overallAssessment: string;
    keyFindings: string[];
    keywordAnalysis?: {
      summary: string;
      primaryKeywords: string[];
      missingKeywords: string[];
      keywordDensityAssessment?: string;
      titleKeywordMatch?: string;
      targetKeywordMatches?: string;
      recommendations: string;
    };
    competitorComparison?: {
      summary: string;
      scoreAnalysis?: string;
      yourStrengths: string[];
      competitorStrengths: string[];
      opportunities: string[];
      quickWins?: string[];
    };
    recommendations: Array<{
      priority: string;
      title: string;
      description: string;
      expectedImpact?: string;
    }>;
    actionPlan?: {
      immediate: string[];
      shortTerm: string[];
      longTerm: string[];
    };
  };
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const showNewDialog = searchParams.get('new') === 'true';
  const analysisIdFromUrl = searchParams.get('analysisId');

  const [url, setUrl] = useState('');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyUrl, setCompanyUrl] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [competitorUrls, setCompetitorUrls] = useState<string[]>([]);
  const [competitorInput, setCompetitorInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [suggestingKeywords, setSuggestingKeywords] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [dialogOpen, setDialogOpen] = useState(showNewDialog);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [remainingAnalyses, setRemainingAnalyses] = useState(2);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'competitors' | 'keywords' | 'ai'>('overview');
  
  // AI Suggestion states
  const [suggestionSheetOpen, setSuggestionSheetOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState<{ name: string; value: string; status: 'good' | 'warning' | 'bad' } | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestionData | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  // Edit mode states for post-analysis updates
  const [editingCompetitors, setEditingCompetitors] = useState(false);
  const [editingKeywords, setEditingKeywords] = useState(false);
  const [editCompetitorUrls, setEditCompetitorUrls] = useState<string[]>([]);
  const [editCompetitorInput, setEditCompetitorInput] = useState('');
  const [editKeywords, setEditKeywords] = useState<string[]>([]);
  const [editKeywordInput, setEditKeywordInput] = useState('');
  const [remainingCompetitorUpdates, setRemainingCompetitorUpdates] = useState(2);
  const [remainingKeywordUpdates, setRemainingKeywordUpdates] = useState(2);
  const [updatingCompetitors, setUpdatingCompetitors] = useState(false);
  const [updatingKeywords, setUpdatingKeywords] = useState(false);

  // Keyword sorting
  const [keywordSort, setKeywordSort] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null);

  const FREE_MONTHLY_LIMIT = 2;
  const FREE_KEYWORD_LIMIT = 10;
  const FREE_COMPETITOR_LIMIT = 3;
  const PREMIUM_COMPETITOR_LIMIT = 10;
  const FREE_UPDATE_LIMIT = 2; // Updates per tab after full analysis

  // Cache key for sessionStorage
  const CACHE_KEY = 'dashboard_cache';

  // Load cached data on mount (before fetch)
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        // Only use cache if no specific analysisId or it matches
        if (!analysisIdFromUrl || data.currentAnalysisId === analysisIdFromUrl) {
          if (data.result) setResult(data.result);
          if (data.companyName) setCompanyName(data.companyName);
          if (data.companyUrl) setCompanyUrl(data.companyUrl);
          if (data.url) setUrl(data.url);
          if (data.userName) setUserName(data.userName);
          if (data.remainingAnalyses !== undefined) setRemainingAnalyses(data.remainingAnalyses);
          if (data.remainingCompetitorUpdates !== undefined) setRemainingCompetitorUpdates(data.remainingCompetitorUpdates);
          if (data.remainingKeywordUpdates !== undefined) setRemainingKeywordUpdates(data.remainingKeywordUpdates);
          if (data.currentAnalysisId) setCurrentAnalysisId(data.currentAnalysisId);
          if (data.companyId) setCompanyId(data.companyId);
          // If we have cached data, don't show skeleton
          if (data.result) {
            setLoading(false);
          }
        }
      }
    } catch {
      // Ignore cache errors
    }
  }, []);

  // Fetch company data and existing analysis on mount
  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Get user name from metadata or email
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
        const firstName = fullName ? fullName.split(' ')[0] : user.email?.split('@')[0];
        setUserName(firstName || null);

        // Fetch company
        const { data: company } = await supabase
          .from('companies')
          .select('id, website_url, name')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (company) {
          setCompanyId(company.id);
          setCompanyUrl(company.website_url);
          setCompanyName(company.name);
          setUrl(company.website_url);

          // Get monthly analysis count
          const now = new Date();
          const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
          
          const { data: monthlyAnalyses } = await supabase
            .from('analyses')
            .select('id, created_at')
            .eq('company_id', company.id)
            .gte('created_at', firstDayOfMonth);

          const analysisCount = monthlyAnalyses?.length || 0;
          setRemainingAnalyses(Math.max(0, FREE_MONTHLY_LIMIT - analysisCount));

          // Fetch specific analysis if ID provided, otherwise latest
          let analysisQuery = supabase
            .from('analyses')
            .select('*, remaining_competitor_updates, remaining_keyword_updates')
            .eq('company_id', company.id);
          
          if (analysisIdFromUrl) {
            analysisQuery = analysisQuery.eq('id', analysisIdFromUrl);
          } else {
            analysisQuery = analysisQuery.order('created_at', { ascending: false }).limit(1);
          }
          
          const { data: analysis } = await analysisQuery.maybeSingle();

          if (analysis) {
            // Store analysis ID for updates
            setCurrentAnalysisId(analysis.id);
            
            // Load remaining updates from database
            setRemainingCompetitorUpdates(analysis.remaining_competitor_updates ?? 2);
            setRemainingKeywordUpdates(analysis.remaining_keyword_updates ?? 2);
            // Map database format to component format
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
              links: { internal: { count: 0 }, external: { count: 0 } },
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
            // Deep merge security results to ensure nested objects are preserved
            const mergedSecurityResults = analysis.security_results ? {
              score: analysis.security_results.score ?? defaultSecurityResults.score,
              ssl: { ...defaultSecurityResults.ssl, ...(analysis.security_results.ssl || {}) },
              headers: { ...defaultSecurityResults.headers, ...(analysis.security_results.headers || {}) },
              observatory: { ...defaultSecurityResults.observatory, ...(analysis.security_results.observatory || {}) },
            } : defaultSecurityResults;

            // Deep merge SEO results
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

            setResult({
              seoResults: mergedSeoResults,
              contentResults: analysis.content_results || { score: 0, wordCount: 0 },
              securityResults: mergedSecurityResults,
              overallScore: analysis.overall_score || 0,
              competitors: analysis.competitor_results || undefined,
              aiSummary: analysis.ai_summary || null,
              keywordResearch: analysis.keyword_research || undefined,
            });
          }
        }
      }
      setLoading(false);
    }
    
    fetchData();
  }, [analysisIdFromUrl]);

  // Save to cache when data changes
  useEffect(() => {
    if (result && !loading) {
      try {
        const cacheData = {
          result,
          companyName,
          companyUrl,
          url,
          userName,
          remainingAnalyses,
          remainingCompetitorUpdates,
          remainingKeywordUpdates,
          currentAnalysisId,
          companyId,
          timestamp: Date.now(),
        };
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      } catch {
        // Ignore cache errors (e.g., quota exceeded)
      }
    }
  }, [result, companyName, companyUrl, url, userName, remainingAnalyses, remainingCompetitorUpdates, remainingKeywordUpdates, currentAnalysisId, companyId, loading]);

  const [elapsedTime, setElapsedTime] = useState(0);
  
  const analysisSteps = [
    { label: 'Henter nettside...', description: 'Laster inn innhold fra nettsiden', duration: '~5 sek' },
    { label: 'Analyserer SEO...', description: 'Sjekker meta-tags, overskrifter og lenker', duration: '~10 sek' },
    { label: 'Sjekker sikkerhet...', description: 'Analyserer SSL-sertifikat og headers', duration: '~30 sek' },
    { label: 'Genererer AI-anbefalinger...', description: 'AI analyserer funnene og lager rapport', duration: '~15 sek' },
  ];

  // Timer for elapsed time during analysis
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (analyzing) {
      setElapsedTime(0);
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [analyzing]);

  // Helper function to normalize URLs
  const normalizeUrl = (inputUrl: string): string => {
    let normalized = inputUrl.trim();
    if (normalized && !normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }
    return normalized;
  };

  // Fetch AI suggestion for a specific element
  const fetchAISuggestion = async (element: string, currentValue: string, status: 'good' | 'warning' | 'bad', issue?: string) => {
    setSelectedElement({ name: element, value: currentValue, status });
    setSuggestionSheetOpen(true);
    setLoadingSuggestion(true);
    setAiSuggestion(null);

    try {
      const response = await fetch('/api/ai-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          element,
          currentValue,
          status,
          issue,
          context: { url: companyUrl },
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setAiSuggestion(data.data);
      } else {
        toast.error('Kunne ikke hente forslag');
      }
    } catch (error) {
      console.error('Error fetching suggestion:', error);
      toast.error('Noe gikk galt');
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const runAnalysis = async () => {
    if (!url) {
      toast.error('Vennligst oppgi en URL');
      return;
    }

    setAnalyzing(true);
    setAnalysisStep(0);
    setResult(null);

    // Progress through steps with realistic timing
    // Step 0: Fetching (5s) -> Step 1: SEO (10s) -> Step 2: Security (30s) -> Step 3: AI (15s)
    const stepTimings = [5000, 10000, 30000, 15000];
    let currentStep = 0;
    
    const advanceStep = () => {
      if (currentStep < analysisSteps.length - 1) {
        currentStep++;
        setAnalysisStep(currentStep);
        if (currentStep < analysisSteps.length - 1) {
          setTimeout(advanceStep, stepTimings[currentStep]);
        }
      }
    };
    
    const stepTimeout = setTimeout(advanceStep, stepTimings[0]);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          companyId,
          competitorUrls: competitorUrls,
          keywords: keywords.length > 0 ? keywords : undefined,
          includeAI: true,
        }),
      });

      clearTimeout(stepTimeout);

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.limitReached) {
          setRemainingAnalyses(0);
          setDialogOpen(false);
          toast.error(errorData.error || 'Du har brukt opp dine gratis analyser denne måneden');
          return;
        }
        throw new Error(errorData.error || 'Analyse feilet');
      }

      const data = await response.json();
      setResult(data);
      setRemainingAnalyses((prev) => Math.max(0, prev - 1)); // Decrease remaining analyses
      setDialogOpen(false);
      toast.success('Analyse fullført!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'En feil oppstod');
    } finally {
      clearTimeout(stepTimeout);
      setAnalyzing(false);
    }
  };

  // Add keyword
  const addKeyword = () => {
    const trimmed = keywordInput.trim().toLowerCase();
    if (!trimmed) return;
    if (keywords.length >= FREE_KEYWORD_LIMIT) {
      toast.error(`Maks ${FREE_KEYWORD_LIMIT} nøkkelord i gratis-versjonen`);
      return;
    }
    if (keywords.includes(trimmed)) {
      toast.error('Dette nøkkelordet er allerede lagt til');
      return;
    }
    setKeywords([...keywords, trimmed]);
    setKeywordInput('');
  };

  // Remove keyword
  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  // Add competitor
  const addCompetitor = () => {
    const trimmed = competitorInput.trim().toLowerCase();
    if (!trimmed) return;
    if (competitorUrls.length >= FREE_COMPETITOR_LIMIT) {
      toast.error(`Maks ${FREE_COMPETITOR_LIMIT} konkurrenter i gratis-versjonen`);
      return;
    }
    // Normalize URL
    const normalized = normalizeUrl(trimmed);
    if (competitorUrls.includes(normalized)) {
      toast.error('Denne konkurrenten er allerede lagt til');
      return;
    }
    setCompetitorUrls([...competitorUrls, normalized]);
    setCompetitorInput('');
  };

  // Remove competitor
  const removeCompetitor = (competitorUrl: string) => {
    setCompetitorUrls(competitorUrls.filter((c) => c !== competitorUrl));
  };

  // Suggest keywords based on URL
  const suggestKeywords = async () => {
    const targetUrl = companyUrl || url;
    if (!targetUrl) {
      toast.error('Vennligst oppgi en URL først');
      return;
    }

    setSuggestingKeywords(true);
    try {
      const response = await fetch('/api/suggest-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });

      if (!response.ok) {
        throw new Error('Kunne ikke hente forslag');
      }

      const data = await response.json();
      if (data.keywords && Array.isArray(data.keywords)) {
        // Only add keywords up to the limit
        const newKeywords = data.keywords
          .slice(0, FREE_KEYWORD_LIMIT - keywords.length)
          .map((k: string) => k.toLowerCase())
          .filter((k: string) => !keywords.includes(k));
        setKeywords([...keywords, ...newKeywords]);
        toast.success(`${newKeywords.length} nøkkelord foreslått`);
      }
    } catch (error) {
      toast.error('Kunne ikke hente forslag til nøkkelord');
    } finally {
      setSuggestingKeywords(false);
    }
  };

  // Edit competitor functions (for post-analysis updates)
  const startEditingCompetitors = () => {
    // Initialize edit state with current competitors
    const currentCompetitors = result?.competitors?.map(c => c.url) || [];
    setEditCompetitorUrls(currentCompetitors);
    setEditingCompetitors(true);
  };

  const addEditCompetitor = () => {
    const trimmed = editCompetitorInput.trim().toLowerCase();
    if (!trimmed) return;
    if (editCompetitorUrls.length >= FREE_COMPETITOR_LIMIT) {
      toast.error(`Maks ${FREE_COMPETITOR_LIMIT} konkurrenter i gratis-versjonen`);
      return;
    }
    const normalized = normalizeUrl(trimmed);
    if (editCompetitorUrls.includes(normalized)) {
      toast.error('Denne konkurrenten er allerede lagt til');
      return;
    }
    setEditCompetitorUrls([...editCompetitorUrls, normalized]);
    setEditCompetitorInput('');
  };

  const removeEditCompetitor = (competitorUrl: string) => {
    setEditCompetitorUrls(editCompetitorUrls.filter((c) => c !== competitorUrl));
  };

  const cancelEditingCompetitors = () => {
    setEditingCompetitors(false);
    setEditCompetitorUrls([]);
    setEditCompetitorInput('');
  };

  const updateCompetitorAnalysis = async () => {
    if (remainingCompetitorUpdates <= 0) {
      toast.error('Du har brukt opp dine gratis oppdateringer for konkurrenter');
      return;
    }

    // Find which competitors are new (not in current results)
    const currentCompetitors = result?.competitors?.map(c => c.url) || [];
    const newCompetitors = editCompetitorUrls.filter(c => !currentCompetitors.includes(c));
    const removedCompetitors = currentCompetitors.filter(c => !editCompetitorUrls.includes(c));

    if (newCompetitors.length === 0 && removedCompetitors.length === 0) {
      toast.error('Ingen endringer å oppdatere');
      return;
    }

    setUpdatingCompetitors(true);
    try {
      const response = await fetch('/api/analyze/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mainUrl: companyUrl || url,
          competitorUrls: newCompetitors,
          existingCompetitors: editCompetitorUrls.filter(c => currentCompetitors.includes(c)),
        }),
      });

      if (!response.ok) {
        throw new Error('Kunne ikke oppdatere konkurrentanalyse');
      }

      const data = await response.json();
      
      // Update result with new competitors
      if (result && data.competitors) {
        // Keep existing competitors that are still selected, add new ones
        const existingToKeep = result.competitors?.filter(c => editCompetitorUrls.includes(c.url)) || [];
        const updatedCompetitors = [...existingToKeep, ...data.competitors];
        
        setResult({
          ...result,
          competitors: updatedCompetitors,
        });
        
        // Save to database
        if (currentAnalysisId) {
          const supabase = createClient();
          const newRemainingUpdates = remainingCompetitorUpdates - 1;
          await supabase
            .from('analyses')
            .update({
              competitor_results: updatedCompetitors,
              remaining_competitor_updates: newRemainingUpdates,
            })
            .eq('id', currentAnalysisId);
        }
      }

      setRemainingCompetitorUpdates(prev => prev - 1);
      setEditingCompetitors(false);
      setEditCompetitorUrls([]);
      toast.success('Konkurrentanalyse oppdatert!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'En feil oppstod');
    } finally {
      setUpdatingCompetitors(false);
    }
  };

  // Edit keyword functions (for post-analysis updates)
  const startEditingKeywords = () => {
    // Initialize edit state with current keywords from result
    const currentKeywords = result?.keywordResearch?.map(k => k.keyword) || [];
    setEditKeywords(currentKeywords);
    setEditingKeywords(true);
  };

  const addEditKeyword = () => {
    const trimmed = editKeywordInput.trim().toLowerCase();
    if (!trimmed) return;
    if (editKeywords.length >= FREE_KEYWORD_LIMIT) {
      toast.error(`Maks ${FREE_KEYWORD_LIMIT} nøkkelord i gratis-versjonen`);
      return;
    }
    if (editKeywords.includes(trimmed)) {
      toast.error('Dette nøkkelordet er allerede lagt til');
      return;
    }
    setEditKeywords([...editKeywords, trimmed]);
    setEditKeywordInput('');
  };

  const removeEditKeyword = (keyword: string) => {
    setEditKeywords(editKeywords.filter((k) => k !== keyword));
  };

  const cancelEditingKeywords = () => {
    setEditingKeywords(false);
    setEditKeywords([]);
    setEditKeywordInput('');
  };

  const updateKeywordAnalysis = async () => {
    if (remainingKeywordUpdates <= 0) {
      toast.error('Du har brukt opp dine gratis oppdateringer for nøkkelord');
      return;
    }

    if (editKeywords.length === 0) {
      toast.error('Legg til minst ett nøkkelord');
      return;
    }

    setUpdatingKeywords(true);
    try {
      const response = await fetch('/api/analyze/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: editKeywords,
          url: companyUrl || url,
        }),
      });

      if (!response.ok) {
        throw new Error('Kunne ikke oppdatere nøkkelordanalyse');
      }

      const data = await response.json();
      
      // Update result with new keyword research
      if (result && data.keywordResearch) {
        setResult({
          ...result,
          keywordResearch: data.keywordResearch,
        });
        
        // Save to database
        if (currentAnalysisId) {
          const supabase = createClient();
          const newRemainingUpdates = remainingKeywordUpdates - 1;
          await supabase
            .from('analyses')
            .update({
              keyword_research: data.keywordResearch,
              remaining_keyword_updates: newRemainingUpdates,
            })
            .eq('id', currentAnalysisId);
        }
      }

      setRemainingKeywordUpdates(prev => prev - 1);
      setEditingKeywords(false);
      setEditKeywords([]);
      toast.success('Nøkkelordanalyse oppdatert!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'En feil oppstod');
    } finally {
      setUpdatingKeywords(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-neutral-900';
    if (score >= 70) return 'text-neutral-800';
    if (score >= 50) return 'text-neutral-700';
    return 'text-neutral-500';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'bg-green-50 text-green-700 border-green-200';
    if (score >= 70) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const getTrendIcon = (score: number) => {
    if (score >= 90) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (score >= 70) return <TrendingUp className="w-4 h-4 text-emerald-600" />;
    if (score >= 50) return <Minus className="w-4 h-4 text-amber-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };
  
  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Veldig bra';
    if (score >= 70) return 'Bra';
    if (score >= 50) return 'Ok';
    return 'Trenger forbedring';
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-neutral-200">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            {userName ? `Hei, ${userName}` : 'Dashboard'}
          </h1>
          <p className="text-neutral-500">
            {result ? 'Se din analyse og anbefalinger' : 'Start en analyse for å komme i gang'}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-neutral-900 hover:bg-neutral-800 text-white"
              disabled={remainingAnalyses === 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              Ny analyse
              {remainingAnalyses < FREE_MONTHLY_LIMIT && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                  {remainingAnalyses} igjen
                </span>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Start nettside-analyse</DialogTitle>
              <DialogDescription>
                Få en komplett rapport med SEO, sikkerhet og AI-anbefalinger.
              </DialogDescription>
            </DialogHeader>

            {analyzing ? (
              <div className="py-6 space-y-6">
                {/* Progress header */}
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-neutral-900">Analyserer nettside</p>
                    <p className="text-sm text-neutral-500 mt-1">
                      {companyUrl || url}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 text-sm text-neutral-600">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="font-medium tabular-nums">{Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-amber-100 text-sm text-amber-700 font-medium">
                      Steg {analysisStep + 1} av {analysisSteps.length}
                    </div>
                  </div>
                  <Progress value={(analysisStep + 1) * 25} className="w-full h-2 bg-neutral-100" />
                </div>
                
                {/* Steps list */}
                <div className="space-y-2">
                  {analysisSteps.map((step, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        index === analysisStep
                          ? 'bg-amber-50 border border-amber-200'
                          : index < analysisStep
                          ? 'bg-green-50 border border-green-100'
                          : 'bg-neutral-50 border border-transparent'
                      }`}
                    >
                      <div className="shrink-0">
                        {index < analysisStep ? (
                          <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                        ) : index === analysisStep ? (
                          <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center">
                            <Loader2 className="h-4 w-4 text-white animate-spin" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center">
                            <span className="text-xs font-medium text-neutral-400">{index + 1}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm ${
                          index === analysisStep ? 'text-amber-900' : index < analysisStep ? 'text-green-700' : 'text-neutral-400'
                        }`}>
                          {step.label}
                        </p>
                        <p className={`text-xs ${
                          index === analysisStep ? 'text-amber-700' : index < analysisStep ? 'text-green-600' : 'text-neutral-400'
                        }`}>
                          {step.description}
                        </p>
                      </div>
                      <span className={`text-xs font-medium shrink-0 ${
                        index === analysisStep ? 'text-amber-600' : index < analysisStep ? 'text-green-500' : 'text-neutral-300'
                      }`}>
                        {step.duration}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Info message */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <AlertCircle className="h-4 w-4 text-blue-500 shrink-0" />
                  <p className="text-xs text-blue-700">
                    Ikke lukk vinduet. Analysen tar vanligvis 30-60 sekunder.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5 py-4">
                {/* URL Input */}
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-sm font-medium text-neutral-700">Nettside URL</Label>
                  {companyUrl ? (
                    <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                      <Globe className="h-5 w-5 text-neutral-400" />
                      <span className="font-medium text-neutral-900">{companyUrl}</span>
                      <span className="ml-auto px-2.5 py-1 rounded-full bg-green-100 text-neutral-900 text-xs font-medium">
                        {companyName}
                      </span>
                    </div>
                  ) : (
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <Input
                        id="url"
                        placeholder="https://dinbedrift.no"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="pl-11 h-12 rounded-xl border-neutral-200"
                      />
                    </div>
                  )}
                </div>

                {/* Competitor Analysis */}
                <div className="p-4 rounded-xl bg-neutral-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="competitor" className="text-sm font-medium text-neutral-700">
                      Sammenlign med konkurrenter
                    </Label>
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-neutral-900 text-xs font-medium">
                      {competitorUrls.length}/{FREE_COMPETITOR_LIMIT}
                    </span>
                  </div>
                  
                  {/* Competitor input */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <BarChart3 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <Input
                        id="competitor"
                        placeholder="konkurrent.no"
                        value={competitorInput}
                        onChange={(e) => setCompetitorInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCompetitor();
                          }
                        }}
                        className="pl-11 h-11 rounded-xl border-neutral-200 bg-white"
                        disabled={competitorUrls.length >= FREE_COMPETITOR_LIMIT}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addCompetitor}
                      disabled={competitorUrls.length >= FREE_COMPETITOR_LIMIT || !competitorInput.trim()}
                      className="h-11 px-4 rounded-xl border-neutral-200 bg-white"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Competitors list */}
                  {competitorUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {competitorUrls.map((competitor) => (
                        <span
                          key={competitor}
                          className="px-3 py-1.5 rounded-full bg-white text-neutral-700 text-sm font-medium border border-neutral-200 cursor-pointer hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors group flex items-center gap-1.5"
                          onClick={() => removeCompetitor(competitor)}
                        >
                          {new URL(competitor).hostname}
                          <X className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100" />
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Keyword Analysis */}
                <div className="p-4 rounded-xl bg-neutral-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-neutral-700">Nøkkelord for analyse</Label>
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-neutral-900 text-xs font-medium">
                      {keywords.length}/{FREE_KEYWORD_LIMIT}
                    </span>
                  </div>
                  
                  {/* Keyword input */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <Input
                        placeholder="Skriv nøkkelord og trykk Enter..."
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addKeyword();
                          }
                        }}
                        className="pl-11 h-11 rounded-xl border-neutral-200 bg-white"
                        disabled={keywords.length >= FREE_KEYWORD_LIMIT}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addKeyword}
                      disabled={keywords.length >= FREE_KEYWORD_LIMIT || !keywordInput.trim()}
                      className="h-11 px-4 rounded-xl border-neutral-200 bg-white"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Suggest keywords button */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={suggestKeywords}
                    disabled={suggestingKeywords || keywords.length >= FREE_KEYWORD_LIMIT}
                    className="w-full h-10 rounded-xl border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100"
                  >
                    {suggestingKeywords ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Henter forslag...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Foreslå nøkkelord basert på nettside
                      </>
                    )}
                  </Button>

                  {/* Keywords list */}
                  {keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {keywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="px-3 py-1.5 rounded-full bg-white text-neutral-700 text-sm font-medium border border-neutral-200 cursor-pointer hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors group flex items-center gap-1.5"
                          onClick={() => removeKeyword(keyword)}
                        >
                          {keyword}
                          <X className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100" />
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <Button 
                  onClick={runAnalysis} 
                  className="w-full h-12 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-medium" 
                  disabled={!url}
                >
                  <Search className="mr-2 h-5 w-5" />
                  Start analyse
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Monthly Usage & Premium Banner - Combined */}
      {remainingAnalyses === 0 ? (
        <div className="rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 p-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Analyser brukt opp</h3>
                <p className="text-sm text-neutral-500">
                  Du har brukt {FREE_MONTHLY_LIMIT}/{FREE_MONTHLY_LIMIT} analyser denne måneden.
                </p>
                <div className="flex flex-wrap gap-3 mt-2">
                  <span className="text-xs text-neutral-500">Premium gir deg:</span>
                  <span className="inline-flex items-center gap-1 text-xs text-neutral-600">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />Ubegrenset
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-neutral-600">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />Flere sider
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-neutral-600">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />Flere konkurrenter
                  </span>
                </div>
              </div>
            </div>
            <Button asChild className="bg-neutral-900 hover:bg-neutral-800 text-white">
              <a href="https://mediabooster.no/kontakt" target="_blank" rel="noopener noreferrer">
                Oppgrader til Premium
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      ) : result ? (
        <div className="rounded-2xl bg-white border border-neutral-200 p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </span>
              <div>
                <p className="text-sm text-neutral-700">
                  <span className="font-semibold text-neutral-900">{remainingAnalyses}/{FREE_MONTHLY_LIMIT}</span> analyser igjen denne måneden
                </p>
                <div className="flex flex-wrap gap-3 mt-1">
                  <span className="text-xs text-neutral-500">Premium:</span>
                  <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />Ubegrenset
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />Flere sider
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />Flere konkurrenter
                  </span>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild className="border-neutral-200 text-neutral-700 hover:bg-neutral-50">
              <a href="https://mediabooster.no/kontakt" target="_blank" rel="noopener noreferrer">
                Få ubegrenset
              </a>
            </Button>
          </div>
        </div>
      ) : null}

      {/* Results or Empty State */}
      {result ? (
        <>
          {/* Tab Navigation - Clean pill style */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Oversikt
              </span>
            </button>
            <button
              onClick={() => setActiveTab('competitors')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'competitors'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Konkurrenter
                {result.competitors && result.competitors.length > 0 && (
                  <span className="w-5 h-5 bg-neutral-200 rounded-full text-xs flex items-center justify-center">
                    {result.competitors.length}
                  </span>
                )}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('keywords')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'keywords'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Nøkkelord
              </span>
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'ai'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI-analyse
              </span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <>
              {/* Summary Card - Easy to understand status */}
              <div className={`rounded-2xl p-6 ${
                result.overallScore >= 80 ? 'bg-green-50 border border-green-200' :
                result.overallScore >= 60 ? 'bg-amber-50 border border-amber-200' :
                'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    result.overallScore >= 80 ? 'bg-green-100' :
                    result.overallScore >= 60 ? 'bg-amber-100' :
                    'bg-red-100'
                  }`}>
                    {result.overallScore >= 80 ? (
                      <CheckCircle2 className="h-7 w-7 text-green-600" />
                    ) : result.overallScore >= 60 ? (
                      <AlertCircle className="h-7 w-7 text-amber-600" />
                    ) : (
                      <AlertCircle className="h-7 w-7 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold ${
                      result.overallScore >= 80 ? 'text-green-900' :
                      result.overallScore >= 60 ? 'text-amber-900' :
                      'text-red-900'
                    }`}>
                      {result.overallScore >= 80 ? 'Nettsiden din ser bra ut!' :
                       result.overallScore >= 60 ? 'Nettsiden din har forbedringspotensial' :
                       'Nettsiden din trenger oppmerksomhet'}
                    </h3>
                    <p className={`text-sm mt-1 ${
                      result.overallScore >= 80 ? 'text-green-700' :
                      result.overallScore >= 60 ? 'text-amber-700' :
                      'text-red-700'
                    }`}>
                      {result.overallScore >= 80 
                        ? 'De viktigste elementene er på plass. Se gjennom detaljene under for ytterligere optimalisering.'
                        : result.overallScore >= 60 
                        ? 'Vi har funnet noen områder som kan forbedres for bedre synlighet i Google.'
                        : 'Det er flere viktige ting som bør fikses for at nettsiden skal fungere optimalt.'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-4xl font-bold ${
                      result.overallScore >= 80 ? 'text-green-600' :
                      result.overallScore >= 60 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {result.overallScore}
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">av 100 poeng</p>
                  </div>
                </div>
              </div>

              {/* Priority Improvements */}
              {(() => {
                const issues = [];
                if (result.seoResults.headings.h1.count !== 1) issues.push({ label: 'H1-overskrift', desc: result.seoResults.headings.h1.count === 0 ? 'Mangler hovedoverskrift' : 'Flere hovedoverskrifter', priority: 'high' });
                if (!result.seoResults.meta.title.content) issues.push({ label: 'Sidetittel', desc: 'Mangler tittel i søkeresultater', priority: 'high' });
                if (!result.seoResults.meta.description.content) issues.push({ label: 'Sidebeskrivelse', desc: 'Mangler beskrivelse i søkeresultater', priority: 'high' });
                if (result.contentResults.wordCount < 300) issues.push({ label: 'Innhold', desc: 'For lite tekst på siden', priority: 'medium' });
                if (result.securityResults.score < 60) issues.push({ label: 'Sikkerhet', desc: 'Sikkerhetsinnstillinger kan forbedres', priority: 'medium' });
                if (result.seoResults.images.withoutAlt > 0) issues.push({ label: 'Bilder', desc: `${result.seoResults.images.withoutAlt} bilder mangler beskrivelse`, priority: 'low' });
                
                return issues.length > 0 ? (
                  <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                    <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-amber-500" />
                      Viktigste forbedringer
                    </h3>
                    <div className="space-y-2">
                      {issues.slice(0, 4).map((issue, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${
                            issue.priority === 'high' ? 'bg-red-500' :
                            issue.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-sm text-neutral-900">{issue.label}</span>
                            <span className="text-neutral-400 mx-2">·</span>
                            <span className="text-sm text-neutral-600">{issue.desc}</span>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            issue.priority === 'high' ? 'bg-red-100 text-red-700' :
                            issue.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {issue.priority === 'high' ? 'Viktig' : issue.priority === 'medium' ? 'Anbefalt' : 'Valgfritt'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Score Grid Section */}
              <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                <div className="p-6 border-b border-neutral-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-neutral-900 mb-1">Poengoversikt</h3>
                      <p className="text-sm text-neutral-500">Høyere poeng = bedre synlighet i Google</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-xs text-neutral-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date().toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <ScoreRing score={result.overallScore} label="Totalt" size="lg" showStatus />
                      <p className="text-xs text-neutral-500 mt-2">Samlet vurdering</p>
                    </div>
                    <div className="text-center">
                      <ScoreRing score={result.seoResults.score} label="Søkemotor" size="lg" showStatus />
                      <p className="text-xs text-neutral-500 mt-2">Synlighet i Google</p>
                    </div>
                    <div className="text-center">
                      <ScoreRing score={result.contentResults.score} label="Innhold" size="lg" showStatus />
                      <p className="text-xs text-neutral-500 mt-2">Tekst og struktur</p>
                    </div>
                    <div className="text-center">
                      <ScoreRing score={result.securityResults.score} label="Sikkerhet" size="lg" showStatus />
                      <p className="text-xs text-neutral-500 mt-2">Trygghet for besøkende</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                <div className="p-6 border-b border-neutral-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-neutral-900 mb-1">Detaljert gjennomgang</h3>
                      <p className="text-sm text-neutral-500">Klikk på et punkt for å få AI-forslag til forbedring</p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-amber-50 border border-amber-100 text-xs text-amber-700">
                      <Lightbulb className="w-3 h-3 text-amber-500" />
                      AI-hjelp tilgjengelig
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                    {/* SEO Group */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                          <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Search className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                          Synlighet i søkemotorer
                        </h4>
                        <span className="text-xs text-neutral-500">Slik ser Google nettsiden din</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Title Tag */}
                        <div 
                          onClick={() => {
                            const titleLength = result.seoResults.meta.title.length;
                            const hasTitle = result.seoResults.meta.title.content;
                            let issue = '';
                            const isOptimalTitle = hasTitle && titleLength >= 50 && titleLength <= 60;
                            if (!hasTitle) {
                              issue = 'Siden mangler title tag. Dette er kritisk for SEO da det vises i søkeresultater.';
                            } else if (titleLength < 50) {
                              issue = `Title tag er for kort (${titleLength} tegn). Anbefalt lengde er 50-60 tegn for å utnytte plassen i søkeresultater.`;
                            } else if (titleLength > 60) {
                              issue = `Title tag er for lang (${titleLength} tegn) og kan bli kuttet i søkeresultater. Anbefalt lengde er 50-60 tegn.`;
                            }
                            // If optimal, don't pass issue - let AI give positive feedback
                            fetchAISuggestion(
                              'Title Tag',
                              hasTitle 
                                ? `${titleLength} tegn: "${result.seoResults.meta.title.content}"` 
                                : 'Mangler title tag',
                              isOptimalTitle ? 'good' : hasTitle ? 'warning' : 'bad',
                              isOptimalTitle ? undefined : issue
                            );
                          }}
                          className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 cursor-pointer hover:bg-neutral-100 hover:border-neutral-200 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${result.seoResults.meta.title.isOptimal ? 'bg-green-100' : result.seoResults.meta.title.content ? 'bg-yellow-100' : 'bg-red-100'}`}>
                                <Search className={`w-4 h-4 ${result.seoResults.meta.title.isOptimal ? 'text-green-600' : result.seoResults.meta.title.content ? 'text-yellow-600' : 'text-red-600'}`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="font-medium text-sm text-neutral-900">Sidetittel</span>
                                <p className="text-xs text-neutral-500 mt-0.5 truncate" title={result.seoResults.meta.title.content || ''}>
                                  {result.seoResults.meta.title.content 
                                    ? `Vises i Google: "${result.seoResults.meta.title.content.substring(0, 35)}..."` 
                                    : 'Nettsiden har ingen tittel'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right shrink-0">
                                <span className={`font-semibold text-sm ${result.seoResults.meta.title.isOptimal ? 'text-green-600' : result.seoResults.meta.title.content ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {result.seoResults.meta.title.content ? `${result.seoResults.meta.title.length} tegn` : 'Mangler'}
                                </span>
                                <p className="text-xs text-neutral-400">Anbefalt: 50-60</p>
                              </div>
                              <div className="flex items-center gap-1 text-neutral-300 group-hover:text-amber-500 transition-colors">
                                <Lightbulb className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Meta Description */}
                        <div 
                          onClick={() => {
                            const descLength = result.seoResults.meta.description.length;
                            const hasDesc = result.seoResults.meta.description.content;
                            const isOptimalDesc = hasDesc && descLength >= 150 && descLength <= 160;
                            let issue = '';
                            if (!hasDesc) {
                              issue = 'Siden mangler meta description. Google kan da velge tilfeldig tekst fra siden som snippet i søkeresultater.';
                            } else if (descLength < 150) {
                              issue = `Meta description er for kort (${descLength} tegn). Anbefalt lengde er 150-160 tegn for å utnytte plassen i søkeresultater.`;
                            } else if (descLength > 160) {
                              issue = `Meta description er for lang (${descLength} tegn) og kan bli kuttet. Anbefalt lengde er 150-160 tegn.`;
                            }
                            fetchAISuggestion(
                              'Meta Description',
                              hasDesc 
                                ? `${descLength} tegn: "${result.seoResults.meta.description.content}"` 
                                : 'Mangler meta description',
                              isOptimalDesc ? 'good' : hasDesc ? 'warning' : 'bad',
                              isOptimalDesc ? undefined : issue
                            );
                          }}
                          className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 cursor-pointer hover:bg-neutral-100 hover:border-neutral-200 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                result.seoResults.meta.description.content && result.seoResults.meta.description.length >= 150 && result.seoResults.meta.description.length <= 160 
                                  ? 'bg-green-100' 
                                  : result.seoResults.meta.description.content 
                                    ? 'bg-yellow-100' 
                                    : 'bg-red-100'
                              }`}>
                                <FileText className={`w-4 h-4 ${
                                  result.seoResults.meta.description.content && result.seoResults.meta.description.length >= 150 && result.seoResults.meta.description.length <= 160 
                                    ? 'text-green-600' 
                                    : result.seoResults.meta.description.content 
                                      ? 'text-yellow-600' 
                                      : 'text-red-600'
                                }`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="font-medium text-sm text-neutral-900">Sidebeskrivelse</span>
                                <p className="text-xs text-neutral-500 mt-0.5 truncate">
                                  {result.seoResults.meta.description.content 
                                    ? `Teksten under tittelen i Google` 
                                    : 'Google velger selv tekst fra siden'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right shrink-0">
                                <span className={`font-semibold text-sm ${
                                  result.seoResults.meta.description.content && result.seoResults.meta.description.length >= 150 && result.seoResults.meta.description.length <= 160 
                                    ? 'text-green-600' 
                                    : result.seoResults.meta.description.content 
                                      ? 'text-yellow-600' 
                                      : 'text-red-600'
                                }`}>
                                  {result.seoResults.meta.description.content ? `${result.seoResults.meta.description.length} tegn` : 'Mangler'}
                                </span>
                                <p className="text-xs text-neutral-400">Anbefalt: 150-160</p>
                              </div>
                              <div className="flex items-center gap-1 text-neutral-300 group-hover:text-amber-500 transition-colors">
                                <Lightbulb className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* H1 Heading */}
                        <div 
                          onClick={() => {
                            const h1Count = result.seoResults.headings.h1.count;
                            const h1Contents = result.seoResults.headings.h1.contents;
                            const isOptimalH1 = h1Count === 1;
                            let issue = '';
                            if (h1Count === 0) {
                              issue = 'Siden mangler H1-overskrift. Hver side bør ha nøyaktig én H1.';
                            } else if (h1Count > 1) {
                              issue = `Siden har ${h1Count} H1-overskrifter, men bør kun ha 1. Flere H1-er forvirrer søkemotorer om hva siden handler om. De ekstra H1-ene bør endres til H2 eller lavere.`;
                            }
                            fetchAISuggestion(
                              'H1 Overskrift',
                              h1Contents.length > 0 
                                ? `${h1Count} stk funnet: ${h1Contents.map((h: string) => `"${h}"`).join(', ')}` 
                                : 'Ingen H1 funnet',
                              isOptimalH1 ? 'good' : h1Count === 0 ? 'bad' : 'warning',
                              isOptimalH1 ? undefined : issue
                            );
                          }}
                          className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 cursor-pointer hover:bg-neutral-100 hover:border-neutral-200 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${result.seoResults.headings.h1.count === 1 ? 'bg-green-100' : result.seoResults.headings.h1.count === 0 ? 'bg-red-100' : 'bg-yellow-100'}`}>
                                <TrendingUp className={`w-4 h-4 ${result.seoResults.headings.h1.count === 1 ? 'text-green-600' : result.seoResults.headings.h1.count === 0 ? 'text-red-600' : 'text-yellow-600'}`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="font-medium text-sm text-neutral-900">Hovedoverskrift</span>
                                <p className="text-xs text-neutral-500 mt-0.5 truncate">
                                  {result.seoResults.headings.h1.contents[0] 
                                    ? `Den store tittelen på siden` 
                                    : 'Siden mangler hovedoverskrift'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right shrink-0">
                                <span className={`font-semibold text-sm ${result.seoResults.headings.h1.count === 1 ? 'text-green-600' : result.seoResults.headings.h1.count === 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                                  {result.seoResults.headings.h1.count} stk
                                </span>
                                <p className="text-xs text-neutral-400">Anbefalt: 1 per side</p>
                              </div>
                              <div className="flex items-center gap-1 text-neutral-300 group-hover:text-amber-500 transition-colors">
                                <Lightbulb className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Open Graph */}
                        <div 
                          onClick={() => {
                            const ogTags = result.seoResults.meta.ogTags;
                            const hasAll = ogTags.title && ogTags.description && ogTags.image;
                            const count = [ogTags.title, ogTags.description, ogTags.image].filter(Boolean).length;
                            const missing = [
                              !ogTags.title && 'og:title',
                              !ogTags.description && 'og:description',
                              !ogTags.image && 'og:image',
                            ].filter(Boolean);
                            let issue = '';
                            if (count === 0) {
                              issue = 'Siden mangler alle Open Graph-tags. Dette påvirker hvordan siden vises når den deles på sosiale medier som Facebook og LinkedIn.';
                            } else if (!hasAll) {
                              issue = `Siden mangler følgende Open Graph-tags: ${missing.join(', ')}. Komplett OG-tags gir bedre visning på sosiale medier.`;
                            }
                            fetchAISuggestion(
                              'Open Graph Tags',
                              `${count}/3 tags: ${[ogTags.title && 'title ✓', ogTags.description && 'description ✓', ogTags.image && 'image ✓'].filter(Boolean).join(', ') || 'Ingen'}`,
                              hasAll ? 'good' : count > 0 ? 'warning' : 'bad',
                              hasAll ? undefined : issue
                            );
                          }}
                          className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 cursor-pointer hover:bg-neutral-100 hover:border-neutral-200 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${result.seoResults.meta.ogTags.title && result.seoResults.meta.ogTags.description && result.seoResults.meta.ogTags.image ? 'bg-green-100' : result.seoResults.meta.ogTags.title ? 'bg-yellow-100' : 'bg-red-100'}`}>
                                <Globe className={`w-4 h-4 ${result.seoResults.meta.ogTags.title && result.seoResults.meta.ogTags.description && result.seoResults.meta.ogTags.image ? 'text-green-600' : result.seoResults.meta.ogTags.title ? 'text-yellow-600' : 'text-red-600'}`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="font-medium text-sm text-neutral-900">Deling i sosiale medier</span>
                                <p className="text-xs text-neutral-500 mt-0.5">
                                  Hvordan siden ser ut på Facebook/LinkedIn
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right shrink-0">
                                <span className={`font-semibold text-sm ${result.seoResults.meta.ogTags.title && result.seoResults.meta.ogTags.description && result.seoResults.meta.ogTags.image ? 'text-green-600' : result.seoResults.meta.ogTags.title ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {[result.seoResults.meta.ogTags.title, result.seoResults.meta.ogTags.description, result.seoResults.meta.ogTags.image].filter(Boolean).length}/3 tags
                                </span>
                                <p className="text-xs text-neutral-400">title, desc, image</p>
                              </div>
                              <div className="flex items-center gap-1 text-neutral-300 group-hover:text-amber-500 transition-colors">
                                <Lightbulb className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Links */}
                        <div 
                          onClick={() => {
                            const internal = result.seoResults.links.internal.count;
                            const external = result.seoResults.links.external.count;
                            let issue = '';
                            if (internal === 0) {
                              issue = 'Siden har ingen interne lenker. Interne lenker hjelper søkemotorer å forstå nettstedets struktur og fordeler link-juice.';
                            } else if (internal < 3) {
                              issue = `Siden har kun ${internal} interne lenker. Anbefalt er minst 3 for god intern navigasjon og SEO.`;
                            }
                            fetchAISuggestion(
                              'Lenker (intern/ekstern)',
                              `${internal} interne lenker, ${external} eksterne lenker`,
                              internal >= 3 ? 'good' : internal >= 1 ? 'warning' : 'bad',
                              issue
                            );
                          }}
                          className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 cursor-pointer hover:bg-neutral-100 hover:border-neutral-200 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${result.seoResults.links.internal.count >= 3 ? 'bg-green-100' : result.seoResults.links.internal.count >= 1 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                                <Link2 className={`w-4 h-4 ${result.seoResults.links.internal.count >= 3 ? 'text-green-600' : result.seoResults.links.internal.count >= 1 ? 'text-yellow-600' : 'text-red-600'}`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="font-medium text-sm text-neutral-900">Lenker</span>
                                <p className="text-xs text-neutral-500 mt-0.5">
                                  {result.seoResults.links.internal.count} interne · {result.seoResults.links.external.count} eksterne
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right shrink-0">
                                <span className={`font-semibold text-sm ${result.seoResults.links.internal.count >= 3 ? 'text-green-600' : result.seoResults.links.internal.count >= 1 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {result.seoResults.links.internal.count + result.seoResults.links.external.count} totalt
                                </span>
                                <p className="text-xs text-neutral-400">Min. 3 interne anbefalt</p>
                              </div>
                              <div className="flex items-center gap-1 text-neutral-300 group-hover:text-amber-500 transition-colors">
                                <Lightbulb className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Images */}
                        <div 
                          onClick={() => {
                            const total = result.seoResults.images.total;
                            const withoutAlt = result.seoResults.images.withoutAlt;
                            let issue = '';
                            if (total === 0) {
                              issue = 'Siden har ingen bilder. Bilder kan forbedre brukerengasjement og gi mulighet for bilde-søk-trafikk.';
                            } else if (withoutAlt > 0) {
                              issue = `${withoutAlt} av ${total} bilder mangler alt-tekst. Alt-tekst er viktig for tilgjengelighet og SEO.`;
                            }
                            fetchAISuggestion(
                              'Bilder og alt-tekst',
                              total === 0 ? 'Ingen bilder funnet' : `${total} bilder, ${withoutAlt} mangler alt-tekst`,
                              total === 0 || withoutAlt === 0 ? 'good' : withoutAlt <= 2 ? 'warning' : 'bad',
                              issue
                            );
                          }}
                          className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 cursor-pointer hover:bg-neutral-100 hover:border-neutral-200 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${result.seoResults.images.total === 0 || result.seoResults.images.withoutAlt === 0 ? 'bg-green-100' : result.seoResults.images.withoutAlt <= 2 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                                <Zap className={`w-4 h-4 ${result.seoResults.images.total === 0 || result.seoResults.images.withoutAlt === 0 ? 'text-green-600' : result.seoResults.images.withoutAlt <= 2 ? 'text-yellow-600' : 'text-red-600'}`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="font-medium text-sm text-neutral-900">Bilder</span>
                                <p className="text-xs text-neutral-500 mt-0.5">
                                  {result.seoResults.images.total === 0 
                                    ? 'Ingen bilder funnet' 
                                    : result.seoResults.images.withoutAlt === 0 
                                    ? 'Alle har alt-tekst ✓' 
                                    : `${result.seoResults.images.withoutAlt} mangler alt-tekst`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right shrink-0">
                                <span className={`font-semibold text-sm ${result.seoResults.images.total === 0 || result.seoResults.images.withoutAlt === 0 ? 'text-green-600' : result.seoResults.images.withoutAlt <= 2 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {result.seoResults.images.total} bilder
                                </span>
                                <p className="text-xs text-neutral-400">{result.seoResults.images.withAlt} med alt</p>
                              </div>
                              <div className="flex items-center gap-1 text-neutral-300 group-hover:text-amber-500 transition-colors">
                                <Lightbulb className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content Group */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                          <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center">
                            <FileText className="w-3.5 h-3.5 text-purple-600" />
                          </div>
                          Innhold og tekst
                        </h4>
                        <span className="text-xs text-neutral-500">Kvaliteten på innholdet ditt</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Word Count */}
                        <div 
                          onClick={() => {
                            const wordCount = result.contentResults.wordCount;
                            let issue = '';
                            if (wordCount < 100) {
                              issue = `Siden har kun ${wordCount} ord, som er altfor kort for god SEO. Google foretrekker innholdsrike sider med minst 300+ ord.`;
                            } else if (wordCount < 300) {
                              issue = `Siden har ${wordCount} ord, som er under anbefalt minimum på 300 ord. Mer innhold gir bedre grunnlag for søkemotorer.`;
                            }
                            fetchAISuggestion(
                              'Ordtelling / Innholdslengde',
                              `${wordCount} ord på siden`,
                              wordCount >= 300 ? 'good' : wordCount >= 100 ? 'warning' : 'bad',
                              issue
                            );
                          }}
                          className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 cursor-pointer hover:bg-neutral-100 hover:border-neutral-200 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${result.contentResults.wordCount >= 300 ? 'bg-green-100' : result.contentResults.wordCount >= 100 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                                <FileText className={`w-4 h-4 ${result.contentResults.wordCount >= 300 ? 'text-green-600' : result.contentResults.wordCount >= 100 ? 'text-yellow-600' : 'text-red-600'}`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="font-medium text-sm text-neutral-900">Tekstmengde</span>
                                <p className="text-xs text-neutral-500 mt-0.5">
                                  {result.contentResults.wordCount >= 300 
                                    ? 'Nok tekst for Google å forstå siden' 
                                    : result.contentResults.wordCount >= 100 
                                    ? 'Siden kunne hatt mer innhold' 
                                    : 'Veldig lite tekst på siden'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right shrink-0">
                                <span className={`font-semibold text-sm ${result.contentResults.wordCount >= 300 ? 'text-green-600' : result.contentResults.wordCount >= 100 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {result.contentResults.wordCount} ord
                                </span>
                                <p className="text-xs text-neutral-400">Min. 300 anbefalt</p>
                              </div>
                              <div className="flex items-center gap-1 text-neutral-300 group-hover:text-amber-500 transition-colors">
                                <Lightbulb className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* H2 Headings */}
                        <div 
                          onClick={() => {
                            const h2Count = result.seoResults.headings.h2.count;
                            let issue = '';
                            if (h2Count === 0) {
                              issue = 'Siden mangler H2-overskrifter. H2-er strukturerer innholdet og hjelper både brukere og søkemotorer å forstå sidens innhold.';
                            } else if (h2Count === 1) {
                              issue = 'Siden har kun 1 H2-overskrift. For bedre innholdsstruktur anbefales 2-6 H2-overskrifter.';
                            } else if (h2Count > 6) {
                              issue = `Siden har ${h2Count} H2-overskrifter, som kan være for mange. Vurder å gruppere innhold eller bruke H3-overskrifter for underavsnitt.`;
                            }
                            fetchAISuggestion(
                              'H2 Overskrifter',
                              `${h2Count} H2-overskrifter på siden`,
                              h2Count >= 2 && h2Count <= 6 ? 'good' : h2Count >= 1 ? 'warning' : 'bad',
                              issue
                            );
                          }}
                          className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 cursor-pointer hover:bg-neutral-100 hover:border-neutral-200 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${result.seoResults.headings.h2.count >= 2 ? 'bg-green-100' : result.seoResults.headings.h2.count >= 1 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                                <TrendingUp className={`w-4 h-4 ${result.seoResults.headings.h2.count >= 2 ? 'text-green-600' : result.seoResults.headings.h2.count >= 1 ? 'text-yellow-600' : 'text-red-600'}`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="font-medium text-sm text-neutral-900">Underoverskrifter</span>
                                <p className="text-xs text-neutral-500 mt-0.5">
                                  {result.seoResults.headings.h2.count >= 2 
                                    ? 'Innholdet er godt strukturert' 
                                    : 'Del opp teksten med flere overskrifter'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right shrink-0">
                                <span className={`font-semibold text-sm ${result.seoResults.headings.h2.count >= 2 ? 'text-green-600' : result.seoResults.headings.h2.count >= 1 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {result.seoResults.headings.h2.count} stk
                                </span>
                                <p className="text-xs text-neutral-400">2-6 anbefalt</p>
                              </div>
                              <div className="flex items-center gap-1 text-neutral-300 group-hover:text-amber-500 transition-colors">
                                <Lightbulb className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Security Group */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                          <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center">
                            <Shield className="w-3.5 h-3.5 text-green-600" />
                          </div>
                          Sikkerhet og trygghet
                        </h4>
                        <span className="text-xs text-neutral-500">Beskyttelse for deg og besøkende</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* SSL Certificate */}
                        <div 
                          onClick={() => {
                            const grade = result.securityResults.ssl.grade;
                            const daysUntilExpiry = result.securityResults.ssl.certificate.daysUntilExpiry;
                            let issue = '';
                            if (!['A+', 'A', 'A-'].includes(grade)) {
                              issue = `SSL-sertifikatet har grad ${grade}. For best sikkerhet og SEO bør du oppnå grad A eller A+.`;
                            }
                            if (daysUntilExpiry && daysUntilExpiry < 30) {
                              issue += ` Sertifikatet utløper om ${daysUntilExpiry} dager og bør fornyes snart.`;
                            }
                            fetchAISuggestion(
                              'SSL-sertifikat',
                              `Grad: ${grade}${daysUntilExpiry ? `, utløper om ${daysUntilExpiry} dager` : ''}`,
                              ['A+', 'A'].includes(grade) ? 'good' : ['A-', 'B+', 'B'].includes(grade) ? 'warning' : 'bad',
                              issue
                            );
                          }}
                          className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 cursor-pointer hover:bg-neutral-100 hover:border-neutral-200 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${['A+', 'A'].includes(result.securityResults.ssl.grade) ? 'bg-green-100' : ['A-', 'B+', 'B'].includes(result.securityResults.ssl.grade) ? 'bg-yellow-100' : 'bg-red-100'}`}>
                                <Shield className={`w-4 h-4 ${['A+', 'A'].includes(result.securityResults.ssl.grade) ? 'text-green-600' : ['A-', 'B+', 'B'].includes(result.securityResults.ssl.grade) ? 'text-yellow-600' : 'text-red-600'}`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="font-medium text-sm text-neutral-900">Hengelås i nettleser</span>
                                <p className="text-xs text-neutral-500 mt-0.5 truncate">
                                  {['A+', 'A'].includes(result.securityResults.ssl.grade) 
                                    ? 'Sikker tilkobling ✓'
                                    : 'Tilkoblingen kan forbedres'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right shrink-0">
                                <span className={`font-semibold text-sm ${['A+', 'A'].includes(result.securityResults.ssl.grade) ? 'text-green-600' : ['A-', 'B+', 'B'].includes(result.securityResults.ssl.grade) ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {result.securityResults.ssl.grade}
                                </span>
                                <p className="text-xs text-neutral-400">A+ best</p>
                              </div>
                              <div className="flex items-center gap-1 text-neutral-300 group-hover:text-amber-500 transition-colors">
                                <Lightbulb className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Security Headers */}
                        <div 
                          onClick={() => {
                            const headerCount = [
                              result.securityResults.headers.contentSecurityPolicy,
                              result.securityResults.headers.strictTransportSecurity,
                              result.securityResults.headers.xFrameOptions,
                              result.securityResults.headers.xContentTypeOptions,
                              result.securityResults.headers.referrerPolicy,
                              result.securityResults.headers.permissionsPolicy,
                            ].filter(Boolean).length;
                            const missingHeaders = [
                              !result.securityResults.headers.contentSecurityPolicy && 'CSP',
                              !result.securityResults.headers.strictTransportSecurity && 'HSTS',
                              !result.securityResults.headers.xFrameOptions && 'X-Frame-Options',
                              !result.securityResults.headers.xContentTypeOptions && 'X-Content-Type-Options',
                              !result.securityResults.headers.referrerPolicy && 'Referrer-Policy',
                              !result.securityResults.headers.permissionsPolicy && 'Permissions-Policy',
                            ].filter(Boolean);
                            fetchAISuggestion(
                              'Security Headers',
                              `${headerCount}/6 headers implementert. Mangler: ${missingHeaders.join(', ') || 'Ingen'}`,
                              headerCount >= 5 ? 'good' : headerCount >= 3 ? 'warning' : 'bad'
                            );
                          }}
                          className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 cursor-pointer hover:bg-neutral-100 hover:border-neutral-200 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${result.securityResults.headers.score >= 80 ? 'bg-green-100' : result.securityResults.headers.score >= 50 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                                <Shield className={`w-4 h-4 ${result.securityResults.headers.score >= 80 ? 'text-green-600' : result.securityResults.headers.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="font-medium text-sm text-neutral-900">Teknisk sikkerhet</span>
                                <p className="text-xs text-neutral-500 mt-0.5 truncate">
                                  {(() => {
                                    const count = [
                                      result.securityResults.headers.contentSecurityPolicy,
                                      result.securityResults.headers.strictTransportSecurity,
                                      result.securityResults.headers.xFrameOptions,
                                      result.securityResults.headers.xContentTypeOptions,
                                      result.securityResults.headers.referrerPolicy,
                                      result.securityResults.headers.permissionsPolicy,
                                    ].filter(Boolean).length;
                                    return count >= 4 ? 'God beskyttelse mot angrep' : count >= 2 ? 'Noe beskyttelse på plass' : 'Mangler viktige beskyttelser';
                                  })()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right shrink-0">
                                <span className={`font-semibold text-sm ${result.securityResults.headers.score >= 80 ? 'text-green-600' : result.securityResults.headers.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {[
                                    result.securityResults.headers.contentSecurityPolicy,
                                    result.securityResults.headers.strictTransportSecurity,
                                    result.securityResults.headers.xFrameOptions,
                                    result.securityResults.headers.xContentTypeOptions,
                                    result.securityResults.headers.referrerPolicy,
                                    result.securityResults.headers.permissionsPolicy,
                                  ].filter(Boolean).length}/6
                                </span>
                                <p className="text-xs text-neutral-400">6/6 best</p>
                              </div>
                              <div className="flex items-center gap-1 text-neutral-300 group-hover:text-amber-500 transition-colors">
                                <Lightbulb className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Overall Security Score */}
                        <div 
                          onClick={() => {
                            const score = result.securityResults.score;
                            const sslGrade = result.securityResults.ssl.grade;
                            const headerCount = [
                              result.securityResults.headers.contentSecurityPolicy,
                              result.securityResults.headers.strictTransportSecurity,
                              result.securityResults.headers.xFrameOptions,
                              result.securityResults.headers.xContentTypeOptions,
                              result.securityResults.headers.referrerPolicy,
                              result.securityResults.headers.permissionsPolicy,
                            ].filter(Boolean).length;
                            let issue = '';
                            if (score < 80) {
                              issue = `Total sikkerhetsscore er ${score}/100. Scoren beregnes: SSL (55%) + Security Headers (45%). `;
                              if (!['A+', 'A'].includes(sslGrade)) {
                                issue += `SSL-grad (${sslGrade}) trekker ned. `;
                              }
                              if (headerCount < 5) {
                                issue += `Kun ${headerCount}/6 security headers implementert.`;
                              }
                            }
                            fetchAISuggestion(
                              'Total sikkerhetsscore',
                              `${score}/100 (SSL ${sslGrade}, Headers ${headerCount}/6)`,
                              score >= 80 ? 'good' : score >= 60 ? 'warning' : 'bad',
                              issue
                            );
                          }}
                          className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 cursor-pointer hover:bg-neutral-100 hover:border-neutral-200 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${result.securityResults.score >= 80 ? 'bg-green-100' : result.securityResults.score >= 60 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                                <CheckCircle2 className={`w-4 h-4 ${result.securityResults.score >= 80 ? 'text-green-600' : result.securityResults.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="font-medium text-sm text-neutral-900">Total sikkerhet</span>
                                <p className="text-xs text-neutral-500 mt-0.5 truncate">
                                  SSL 55% + Headers 45%
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right shrink-0">
                                <span className={`font-semibold text-sm ${result.securityResults.score >= 80 ? 'text-green-600' : result.securityResults.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {result.securityResults.score}/100
                                </span>
                                <p className="text-xs text-neutral-400">80+ anbefalt</p>
                              </div>
                              <div className="flex items-center gap-1 text-neutral-300 group-hover:text-amber-500 transition-colors">
                                <Lightbulb className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
               

              {/* Contact CTA */}
              <div className="rounded-2xl bg-neutral-900 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Trenger du hjelp med nettsiden?</h3>
                    <p className="text-sm text-neutral-400">Vi hjelper deg med alt fra strategi til implementering.</p>
                  </div>
                </div>
                <Button className="bg-white text-neutral-900 hover:bg-neutral-100" asChild>
                  <a href="https://mediabooster.no/kontakt" target="_blank" rel="noopener noreferrer">
                    Kontakt Mediabooster
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>

            </>
          )}

          {activeTab === 'competitors' && (
            <>
              {/* Edit Competitors Panel */}
              {editingCompetitors && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50/30 overflow-hidden mb-6">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-blue-200 bg-blue-50/50">
                    <div className="flex items-center gap-3">
                      <h3 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-neutral-900 text-sm font-medium">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                        Rediger konkurrenter
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-neutral-900 text-xs font-medium">
                        {remainingCompetitorUpdates} oppdatering{remainingCompetitorUpdates !== 1 ? 'er' : ''} igjen
                      </span>
                    </div>
                    <button
                      onClick={cancelEditingCompetitors}
                      disabled={updatingCompetitors}
                      className="p-1.5 rounded-lg hover:bg-blue-100 text-neutral-500 hover:text-neutral-700 transition-colors disabled:opacity-50"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-4">
                    {/* Instructions */}
                    <p className="text-sm text-neutral-600">
                      Legg til konkurrenter du vil sammenligne med. Trykk Enter eller &quot;Legg til&quot; etter hver URL.
                    </p>

                    {/* Competitor input */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <Input
                          placeholder="https://konkurrent.no"
                          value={editCompetitorInput}
                          onChange={(e) => setEditCompetitorInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addEditCompetitor();
                            }
                          }}
                          className="pl-11 h-11 rounded-xl border-neutral-200 bg-white"
                          disabled={editCompetitorUrls.length >= FREE_COMPETITOR_LIMIT}
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={addEditCompetitor}
                        disabled={editCompetitorUrls.length >= FREE_COMPETITOR_LIMIT || !editCompetitorInput.trim()}
                        className="h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-1.5" />
                        Legg til
                      </Button>
                    </div>

                    {/* Competitors list */}
                    {editCompetitorUrls.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                          Lagt til ({editCompetitorUrls.length}/{FREE_COMPETITOR_LIMIT})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {editCompetitorUrls.map((competitor) => (
                            <span
                              key={competitor}
                              className="px-3 py-1.5 rounded-full bg-white text-neutral-700 text-sm font-medium border border-neutral-200 cursor-pointer hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors group flex items-center gap-1.5"
                              onClick={() => removeEditCompetitor(competitor)}
                            >
                              {new URL(competitor).hostname}
                              <X className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100" />
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 text-center text-sm text-neutral-400 border border-dashed border-neutral-200 rounded-xl">
                        Ingen konkurrenter lagt til ennå
                      </div>
                    )}

                    {/* Action button */}
                    <Button
                      onClick={updateCompetitorAnalysis}
                      disabled={updatingCompetitors || remainingCompetitorUpdates <= 0}
                      className="w-full rounded-xl bg-neutral-900 hover:bg-neutral-800"
                    >
                      {updatingCompetitors ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Oppdaterer...
                        </>
                      ) : (
                        <>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Oppdater analyse
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {result.competitors && result.competitors.length > 0 ? (
                <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                  <div className="p-6 border-b border-neutral-100">
                    <div className="flex items-center justify-between">
                      <h3 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-900 text-sm font-medium">
                        <BarChart3 className="h-4 w-4 text-neutral-600" />
                        Konkurrentsammenligning ({result.competitors.length} {result.competitors.length === 1 ? 'konkurrent' : 'konkurrenter'})
                      </h3>
                      {!editingCompetitors && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={startEditingCompetitors}
                          disabled={remainingCompetitorUpdates <= 0}
                          className="rounded-lg text-xs"
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" />
                          Endre konkurrenter
                          <span className="ml-1.5 px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 text-xs">
                            {remainingCompetitorUpdates}/{FREE_UPDATE_LIMIT}
                          </span>
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {/* Visual Score Comparison - Horizontal scrollable on mobile */}
                    <div className="overflow-x-auto -mx-6 px-6">
                      <div className="flex gap-4 min-w-max pb-2">
                        {/* Your scores */}
                        <div className="w-48 flex-shrink-0 p-4 rounded-xl border-2 border-green-200 bg-green-50/30">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-neutral-900 text-xs font-medium">
                              <Globe className="h-3.5 w-3.5 text-green-600" />
                              Du
                            </span>
                          </div>
                          <p className="text-xs text-neutral-600 mb-3 truncate" title={companyName || new URL(companyUrl || url).hostname}>
                            {companyName || new URL(companyUrl || url).hostname}
                          </p>
                          
                          {/* Overall score */}
                          <div className="flex justify-center mb-4">
                            <ScoreRing score={result.overallScore} label="" size="md" />
                          </div>
                          
                          {/* Category scores - vertical list */}
                          {(() => {
                            const avgSeo = result.competitors.reduce((sum, c) => sum + c.results.seoResults.score, 0) / result.competitors.length;
                            const avgContent = result.competitors.reduce((sum, c) => sum + c.results.contentResults.score, 0) / result.competitors.length;
                            const avgSecurity = result.competitors.reduce((sum, c) => sum + c.results.securityResults.score, 0) / result.competitors.length;
                            return (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 rounded-lg bg-white/60">
                                  <span className="text-xs text-neutral-600">SEO</span>
                                  <span className={`font-bold text-sm ${result.seoResults.score >= avgSeo ? 'text-green-600' : 'text-red-600'}`}>
                                    {result.seoResults.score}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-lg bg-white/60">
                                  <span className="text-xs text-neutral-600">Innhold</span>
                                  <span className={`font-bold text-sm ${result.contentResults.score >= avgContent ? 'text-green-600' : 'text-red-600'}`}>
                                    {result.contentResults.score}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-lg bg-white/60">
                                  <span className="text-xs text-neutral-600">Sikkerhet</span>
                                  <span className={`font-bold text-sm ${result.securityResults.score >= avgSecurity ? 'text-green-600' : 'text-red-600'}`}>
                                    {result.securityResults.score}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        
                        {/* Competitor scores */}
                        {result.competitors.map((competitor, index) => (
                          <div key={competitor.url} className="w-48 flex-shrink-0 p-4 rounded-xl border border-neutral-200 bg-white">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-900 text-xs font-medium">
                                <Globe className="h-3.5 w-3.5 text-neutral-600" />
                                #{index + 1}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-600 mb-3 truncate" title={new URL(competitor.url).hostname}>
                              {new URL(competitor.url).hostname}
                            </p>
                            
                            {/* Overall score */}
                            <div className="flex justify-center mb-4">
                              <ScoreRing score={competitor.results.overallScore} label="" size="md" neutral={true} />
                            </div>
                            
                            {/* Category scores - vertical list */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-50">
                                <span className="text-xs text-neutral-600">SEO</span>
                                <span className="font-bold text-sm text-neutral-700">
                                  {competitor.results.seoResults.score}
                                </span>
                              </div>
                              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-50">
                                <span className="text-xs text-neutral-600">Innhold</span>
                                <span className="font-bold text-sm text-neutral-700">
                                  {competitor.results.contentResults.score}
                                </span>
                              </div>
                              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-50">
                                <span className="text-xs text-neutral-600">Sikkerhet</span>
                                <span className="font-bold text-sm text-neutral-700">
                                  {competitor.results.securityResults.score}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Competitor Analysis */}
                    {result.aiSummary?.competitorComparison && (
                      <>
                        {/* Summary */}
                        <div className="p-5 rounded-xl bg-white border border-neutral-200">
                          <h5 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-neutral-900 text-sm font-medium mb-4">
                            <Sparkles className="h-4 w-4 text-blue-600" />
                            AI-vurdering
                          </h5>
                          <p className="text-sm text-neutral-700">{result.aiSummary.competitorComparison.summary}</p>
                          {result.aiSummary.competitorComparison.scoreAnalysis && (
                            <p className="text-sm text-neutral-500 mt-2">{result.aiSummary.competitorComparison.scoreAnalysis}</p>
                          )}
                        </div>

                        {/* Strengths Grid */}
                        <div className="grid md:grid-cols-2 gap-4">
                          {result.aiSummary.competitorComparison.yourStrengths.length > 0 && (
                            <div className="p-5 rounded-xl bg-white border border-neutral-200">
                              <h5 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-neutral-900 text-sm font-medium mb-4">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                Dine styrker
                              </h5>
                              <ul className="space-y-2">
                                {result.aiSummary.competitorComparison.yourStrengths.map((s, i) => (
                                  <li key={i} className="text-sm text-neutral-700">{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {result.aiSummary.competitorComparison.competitorStrengths.length > 0 && (
                            <div className="p-5 rounded-xl bg-white border border-neutral-200">
                              <h5 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 text-neutral-900 text-sm font-medium mb-4">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                Konkurrentens styrker
                              </h5>
                              <ul className="space-y-2">
                                {result.aiSummary.competitorComparison.competitorStrengths.map((s, i) => (
                                  <li key={i} className="text-sm text-neutral-700">{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Opportunities */}
                        <div className="grid md:grid-cols-2 gap-4">
                          {result.aiSummary.competitorComparison.opportunities.length > 0 && (
                            <div className="p-5 rounded-xl bg-white border border-neutral-200">
                              <h5 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-neutral-900 text-sm font-medium mb-4">
                                <TrendingUp className="h-4 w-4 text-amber-600" />
                                Muligheter
                              </h5>
                              <ul className="space-y-2">
                                {result.aiSummary.competitorComparison.opportunities.map((o, i) => (
                                  <li key={i} className="text-sm text-neutral-700">{o}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {result.aiSummary.competitorComparison.quickWins && result.aiSummary.competitorComparison.quickWins.length > 0 && (
                            <div className="p-5 rounded-xl bg-white border border-neutral-200">
                              <h5 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 text-neutral-900 text-sm font-medium mb-4">
                                <Zap className="h-4 w-4 text-purple-600" />
                                Raske forbedringer
                              </h5>
                              <ul className="space-y-2">
                                {result.aiSummary.competitorComparison.quickWins.map((q, i) => (
                                  <li key={i} className="text-sm text-neutral-700">{q}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
                  <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-neutral-400" />
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-2">Ingen konkurrentanalyse</h3>
                  <p className="text-sm text-neutral-500 max-w-md mx-auto mb-4">
                    Du valgte ingen konkurrenter i den opprinnelige analysen.
                  </p>
                  {remainingCompetitorUpdates > 0 && !editingCompetitors && (
                    <Button
                      variant="outline"
                      onClick={startEditingCompetitors}
                      className="rounded-xl"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Legg til konkurrenter
                      <span className="ml-1.5 px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 text-xs">
                        {remainingCompetitorUpdates}/{FREE_UPDATE_LIMIT}
                      </span>
                    </Button>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'keywords' && (
            <>
              {/* Edit Keywords Panel */}
              {editingKeywords && (
                <div className="rounded-2xl border border-purple-200 bg-purple-50/30 overflow-hidden mb-6">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-purple-200 bg-purple-50/50">
                    <div className="flex items-center gap-3">
                      <h3 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 text-neutral-900 text-sm font-medium">
                        <Tag className="h-4 w-4 text-purple-600" />
                        Rediger nøkkelord
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-neutral-900 text-xs font-medium">
                        {remainingKeywordUpdates} oppdatering{remainingKeywordUpdates !== 1 ? 'er' : ''} igjen
                      </span>
                    </div>
                    <button
                      onClick={cancelEditingKeywords}
                      disabled={updatingKeywords}
                      className="p-1.5 rounded-lg hover:bg-purple-100 text-neutral-500 hover:text-neutral-700 transition-colors disabled:opacity-50"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-4">
                    {/* Instructions */}
                    <p className="text-sm text-neutral-600">
                      Legg til nøkkelord du vil analysere. Trykk Enter eller &quot;Legg til&quot; etter hvert nøkkelord.
                    </p>

                    {/* Keyword input */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <Input
                          placeholder="F.eks. digital markedsføring"
                          value={editKeywordInput}
                          onChange={(e) => setEditKeywordInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addEditKeyword();
                            }
                          }}
                          className="pl-11 h-11 rounded-xl border-neutral-200 bg-white"
                          disabled={editKeywords.length >= FREE_KEYWORD_LIMIT}
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={addEditKeyword}
                        disabled={editKeywords.length >= FREE_KEYWORD_LIMIT || !editKeywordInput.trim()}
                        className="h-11 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-1.5" />
                        Legg til
                      </Button>
                    </div>

                    {/* Keywords list */}
                    {editKeywords.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                          Lagt til ({editKeywords.length}/{FREE_KEYWORD_LIMIT})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {editKeywords.map((keyword) => (
                            <span
                              key={keyword}
                              className="px-3 py-1.5 rounded-full bg-white text-neutral-700 text-sm font-medium border border-neutral-200 cursor-pointer hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors group flex items-center gap-1.5"
                              onClick={() => removeEditKeyword(keyword)}
                            >
                              {keyword}
                              <X className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100" />
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 text-center text-sm text-neutral-400 border border-dashed border-neutral-200 rounded-xl">
                        Ingen nøkkelord lagt til ennå
                      </div>
                    )}

                    {/* Action button */}
                    <Button
                      onClick={updateKeywordAnalysis}
                      disabled={updatingKeywords || remainingKeywordUpdates <= 0 || editKeywords.length === 0}
                      className="w-full rounded-xl bg-neutral-900 hover:bg-neutral-800"
                    >
                      {updatingKeywords ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Oppdaterer...
                        </>
                      ) : (
                        <>
                          <Tag className="mr-2 h-4 w-4" />
                          Oppdater analyse
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {result.keywordResearch && result.keywordResearch.length > 0 ? (
                <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                  <div className="p-6 border-b border-neutral-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-900 text-sm font-medium mb-3">
                          <Tag className="h-4 w-4 text-neutral-600" />
                          Nøkkelordanalyse
                        </h3>
                        <p className="text-sm text-neutral-600">Estimert søkedata for det norske markedet</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!editingKeywords && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={startEditingKeywords}
                            disabled={remainingKeywordUpdates <= 0}
                            className="rounded-lg text-xs"
                          >
                            <Plus className="mr-1 h-3.5 w-3.5" />
                            Endre nøkkelord
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 text-xs">
                              {remainingKeywordUpdates}/{FREE_UPDATE_LIMIT}
                            </span>
                          </Button>
                        )}
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-neutral-900 text-xs font-medium">
                          AI-estimater
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {/* Info boxes - at top */}
                    <div className="mb-6 space-y-3">
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                        <p className="text-sm text-neutral-700">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 text-xs font-medium mr-2">Om dataene</span>
                          Verdiene er AI-baserte estimater for det norske markedet. De gir en god indikasjon på relative forskjeller mellom nøkkelord.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                        <p className="text-sm text-neutral-700">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-200 text-blue-800 text-xs font-medium mr-2">Tips</span>
                          Fokuser på nøkkelord med høyt søkevolum, lav konkurranse og kommersiell/transaksjonell intensjon for best ROI.
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-neutral-100">
                            <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                              <button 
                                onClick={() => setKeywordSort(prev => 
                                  prev?.column === 'keyword' 
                                    ? { column: 'keyword', direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                                    : { column: 'keyword', direction: 'asc' }
                                )}
                                className="flex items-center gap-1 hover:text-neutral-700 transition-colors"
                              >
                                Nøkkelord
                                {keywordSort?.column === 'keyword' ? (
                                  keywordSort.direction === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                  <ArrowUpDown className="h-3.5 w-3.5 text-neutral-300" />
                                )}
                              </button>
                            </th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                              <button 
                                onClick={() => setKeywordSort(prev => 
                                  prev?.column === 'searchVolume' 
                                    ? { column: 'searchVolume', direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                                    : { column: 'searchVolume', direction: 'desc' }
                                )}
                                className="flex items-center justify-end gap-1 w-full hover:text-neutral-700 transition-colors"
                              >
                                Søkevolum <span className="text-neutral-300">~</span>
                                {keywordSort?.column === 'searchVolume' ? (
                                  keywordSort.direction === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                  <ArrowUpDown className="h-3.5 w-3.5 text-neutral-300" />
                                )}
                              </button>
                            </th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                              <button 
                                onClick={() => setKeywordSort(prev => 
                                  prev?.column === 'cpc' 
                                    ? { column: 'cpc', direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                                    : { column: 'cpc', direction: 'desc' }
                                )}
                                className="flex items-center justify-end gap-1 w-full hover:text-neutral-700 transition-colors"
                              >
                                CPC <span className="text-neutral-300">~</span>
                                {keywordSort?.column === 'cpc' ? (
                                  keywordSort.direction === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                  <ArrowUpDown className="h-3.5 w-3.5 text-neutral-300" />
                                )}
                              </button>
                            </th>
                            <th className="text-center py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                              <button 
                                onClick={() => setKeywordSort(prev => 
                                  prev?.column === 'competition' 
                                    ? { column: 'competition', direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                                    : { column: 'competition', direction: 'asc' }
                                )}
                                className="flex items-center justify-center gap-1 w-full hover:text-neutral-700 transition-colors"
                              >
                                Konkurranse
                                {keywordSort?.column === 'competition' ? (
                                  keywordSort.direction === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                  <ArrowUpDown className="h-3.5 w-3.5 text-neutral-300" />
                                )}
                              </button>
                            </th>
                            <th className="text-center py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                              <button 
                                onClick={() => setKeywordSort(prev => 
                                  prev?.column === 'difficulty' 
                                    ? { column: 'difficulty', direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                                    : { column: 'difficulty', direction: 'asc' }
                                )}
                                className="flex items-center justify-center gap-1 w-full hover:text-neutral-700 transition-colors"
                              >
                                Vanskelighet
                                {keywordSort?.column === 'difficulty' ? (
                                  keywordSort.direction === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                  <ArrowUpDown className="h-3.5 w-3.5 text-neutral-300" />
                                )}
                              </button>
                            </th>
                            <th className="text-center py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                              <button 
                                onClick={() => setKeywordSort(prev => 
                                  prev?.column === 'intent' 
                                    ? { column: 'intent', direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                                    : { column: 'intent', direction: 'asc' }
                                )}
                                className="flex items-center justify-center gap-1 w-full hover:text-neutral-700 transition-colors"
                              >
                                Intensjon
                                {keywordSort?.column === 'intent' ? (
                                  keywordSort.direction === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                  <ArrowUpDown className="h-3.5 w-3.5 text-neutral-300" />
                                )}
                              </button>
                            </th>
                            <th className="text-center py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                              <button 
                                onClick={() => setKeywordSort(prev => 
                                  prev?.column === 'trend' 
                                    ? { column: 'trend', direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                                    : { column: 'trend', direction: 'desc' }
                                )}
                                className="flex items-center justify-center gap-1 w-full hover:text-neutral-700 transition-colors"
                              >
                                Trend
                                {keywordSort?.column === 'trend' ? (
                                  keywordSort.direction === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                  <ArrowUpDown className="h-3.5 w-3.5 text-neutral-300" />
                                )}
                              </button>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...result.keywordResearch].sort((a, b) => {
                            if (!keywordSort) return 0;
                            const { column, direction } = keywordSort;
                            let comparison = 0;
                            
                            switch (column) {
                              case 'keyword':
                                comparison = a.keyword.localeCompare(b.keyword, 'nb');
                                break;
                              case 'searchVolume':
                                comparison = a.searchVolume - b.searchVolume;
                                break;
                              case 'cpc':
                                comparison = a.cpc - b.cpc;
                                break;
                              case 'competition':
                                const compOrder = { 'lav': 1, 'medium': 2, 'høy': 3 };
                                comparison = compOrder[a.competition] - compOrder[b.competition];
                                break;
                              case 'difficulty':
                                comparison = a.difficulty - b.difficulty;
                                break;
                              case 'intent':
                                comparison = a.intent.localeCompare(b.intent);
                                break;
                              case 'trend':
                                const trendOrder = { 'synkende': 1, 'stabil': 2, 'stigende': 3 };
                                comparison = trendOrder[a.trend] - trendOrder[b.trend];
                                break;
                            }
                            
                            return direction === 'asc' ? comparison : -comparison;
                          }).map((kw, i) => (
                            <tr key={i} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                              <td className="py-4 px-4">
                                <span className="font-medium text-neutral-900">{kw.keyword}</span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <span className="font-semibold text-neutral-900">
                                  {kw.searchVolume.toLocaleString('nb-NO')}
                                </span>
                                <span className="text-xs text-neutral-400 ml-1">/mnd</span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <span className="font-semibold text-green-600">
                                  {kw.cpc.toFixed(2)} kr
                                </span>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium text-neutral-900 ${
                                  kw.competition === 'lav' ? 'bg-green-100' :
                                  kw.competition === 'medium' ? 'bg-amber-100' :
                                  'bg-red-100'
                                }`}>
                                  {kw.competition}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-16 h-2 bg-neutral-100 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${
                                        kw.difficulty <= 30 ? 'bg-green-500' :
                                        kw.difficulty <= 60 ? 'bg-amber-500' :
                                        'bg-red-500'
                                      }`}
                                      style={{ width: `${kw.difficulty}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-neutral-500 w-6">{kw.difficulty}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium text-neutral-900 ${
                                  kw.intent === 'transactional' ? 'bg-purple-100' :
                                  kw.intent === 'commercial' ? 'bg-blue-100' :
                                  kw.intent === 'informational' ? 'bg-cyan-100' :
                                  'bg-neutral-100'
                                }`}>
                                  {kw.intent === 'transactional' ? 'Kjøp' :
                                   kw.intent === 'commercial' ? 'Kommersiell' :
                                   kw.intent === 'informational' ? 'Info' : 'Navigasjon'}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className={`flex items-center justify-center gap-1 text-xs font-medium ${
                                  kw.trend === 'stigende' ? 'text-green-600' :
                                  kw.trend === 'synkende' ? 'text-red-600' :
                                  'text-neutral-500'
                                }`}>
                                  {kw.trend === 'stigende' && <TrendingUp className="h-3.5 w-3.5" />}
                                  {kw.trend === 'synkende' && <TrendingDown className="h-3.5 w-3.5" />}
                                  {kw.trend === 'stabil' && <Minus className="h-3.5 w-3.5" />}
                                  {kw.trend}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-neutral-100">
                      <div className="p-4 rounded-xl bg-neutral-50">
                        <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Est. total søkevolum</p>
                        <p className="text-xl font-bold text-neutral-900 mt-1">
                          ~{result.keywordResearch.reduce((sum, kw) => sum + kw.searchVolume, 0).toLocaleString('nb-NO')}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-neutral-50">
                        <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Est. gj.snitt CPC</p>
                        <p className="text-xl font-bold text-green-600 mt-1">
                          ~{(result.keywordResearch.reduce((sum, kw) => sum + kw.cpc, 0) / result.keywordResearch.length).toFixed(2)} kr
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-neutral-50">
                        <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Gj.snitt vanskelighet</p>
                        <p className="text-xl font-bold text-neutral-900 mt-1">
                          {Math.round(result.keywordResearch.reduce((sum, kw) => sum + kw.difficulty, 0) / result.keywordResearch.length)}/100
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-neutral-50">
                        <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Beste mulighet</p>
                        <p className="text-sm font-semibold text-purple-600 mt-1 truncate">
                          {result.keywordResearch.reduce((best, kw) => 
                            (kw.searchVolume / (kw.difficulty + 1)) > (best.searchVolume / (best.difficulty + 1)) ? kw : best
                          ).keyword}
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              ) : result.aiSummary?.keywordAnalysis ? (
                /* Keyword Analysis from AI - Show if no keyword research data */
                <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                  <div className="p-6 border-b border-neutral-100">
                    <h3 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-900 text-sm font-medium mb-3">
                      <Tag className="h-4 w-4 text-neutral-600" />
                      Søkeordsanalyse
                    </h3>
                    <p className="text-sm text-neutral-600">{result.aiSummary.keywordAnalysis.summary}</p>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {/* Keywords Grid */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-neutral-900 text-sm font-medium mb-3">
                          Hovedsøkeord funnet
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {result.aiSummary.keywordAnalysis.primaryKeywords.map((kw, i) => (
                            <span key={i} className="px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-700 text-sm font-medium border border-neutral-200">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                      {result.aiSummary.keywordAnalysis.missingKeywords.length > 0 && (
                        <div>
                          <h4 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-neutral-900 text-sm font-medium mb-3">
                            Anbefalte å legge til
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {result.aiSummary.keywordAnalysis.missingKeywords.map((kw, i) => (
                              <span key={i} className="px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-700 text-sm font-medium border border-neutral-200">
                                + {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Recommendations */}
                    <div className="p-5 rounded-xl bg-white border border-neutral-200">
                      <h5 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-neutral-900 text-sm font-medium mb-3">
                        <Sparkles className="h-4 w-4 text-blue-600" />
                        Anbefalinger
                      </h5>
                      <p className="text-sm text-neutral-700">{result.aiSummary.keywordAnalysis.recommendations}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
                  <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Tag className="w-8 h-8 text-neutral-400" />
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-2">Ingen nøkkelordanalyse</h3>
                  <p className="text-sm text-neutral-500 max-w-md mx-auto mb-4">
                    Du la ikke til nøkkelord i den opprinnelige analysen.
                  </p>
                  {remainingKeywordUpdates > 0 && !editingKeywords && (
                    <Button
                      variant="outline"
                      onClick={startEditingKeywords}
                      className="rounded-xl"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Legg til nøkkelord
                      <span className="ml-1.5 px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 text-xs">
                        {remainingKeywordUpdates}/{FREE_UPDATE_LIMIT}
                      </span>
                    </Button>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'ai' && (
            <>
              {result.aiSummary ? (
                <div className="space-y-6">
                  {/* Overall Assessment Card */}
                  <div className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center shrink-0">
                          <Sparkles className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-neutral-900 mb-2">AI-vurdering</h3>
                          <p className="text-neutral-600 leading-relaxed">{result.aiSummary.overallAssessment}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Key Findings - with colors */}
                  <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                    <div className="p-6 border-b border-neutral-100">
                      <h4 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-900 text-sm font-medium">
                        <Lightbulb className="h-4 w-4 text-neutral-600" />
                        Viktige funn
                      </h4>
                    </div>
                    <div className="p-6">
                      <div className="grid gap-3">
                        {result.aiSummary.keyFindings.map((finding, i) => {
                          // Handle both old string format and new object format
                          const isObject = typeof finding === 'object' && finding !== null;
                          const text = isObject ? (finding as { text: string }).text : finding as string;
                          
                          // For old string format, use heuristics to detect type
                          let type = isObject ? (finding as { type: string }).type : 'neutral';
                          if (!isObject && typeof text === 'string') {
                            const lowerText = text.toLowerCase();
                            // Positive indicators
                            const positiveWords = ['god', 'bra', 'utmerket', 'optimal', 'sterk', 'riktig', 'komplett', 'sikker', 'rask', 'fungerer', 'har', 'inneholder', 'oppfyller', 'tilfredsstillende', 'effektiv'];
                            // Negative indicators  
                            const negativeWords = ['mangler', 'ikke', 'feil', 'svak', 'dårlig', 'treg', 'lang', 'kort', 'for', 'bør', 'burde', 'anbefales', 'forbedres', 'problem', 'utfordring', 'kritisk', 'lav', 'ingen', 'uten'];
                            
                            const hasPositive = positiveWords.some(word => lowerText.includes(word));
                            const hasNegative = negativeWords.some(word => lowerText.includes(word));
                            
                            if (hasNegative && !hasPositive) {
                              type = 'negative';
                            } else if (hasPositive && !hasNegative) {
                              type = 'positive';
                            } else if (hasPositive && hasNegative) {
                              // If both, check context - "ikke" or "mangler" usually indicates negative
                              type = (lowerText.includes('ikke') || lowerText.includes('mangler') || lowerText.includes('bør')) ? 'negative' : 'positive';
                            }
                          }
                          
                          const colorClasses = {
                            positive: {
                              bg: 'bg-green-50 border-green-200',
                              icon: 'bg-green-500',
                              iconColor: 'text-white',
                              text: 'text-green-900'
                            },
                            negative: {
                              bg: 'bg-red-50 border-red-200',
                              icon: 'bg-red-500',
                              iconColor: 'text-white',
                              text: 'text-red-900'
                            },
                            neutral: {
                              bg: 'bg-blue-50 border-blue-200',
                              icon: 'bg-blue-500',
                              iconColor: 'text-white',
                              text: 'text-blue-900'
                            }
                          };
                          
                          const colors = colorClasses[type as keyof typeof colorClasses] || colorClasses.neutral;
                          
                          return (
                            <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border ${colors.bg}`}>
                              <div className={`w-7 h-7 rounded-lg ${colors.icon} flex items-center justify-center shrink-0`}>
                                {type === 'positive' ? (
                                  <CheckCircle2 className={`w-4 h-4 ${colors.iconColor}`} />
                                ) : type === 'negative' ? (
                                  <AlertCircle className={`w-4 h-4 ${colors.iconColor}`} />
                                ) : (
                                  <Lightbulb className={`w-4 h-4 ${colors.iconColor}`} />
                                )}
                              </div>
                              <p className={`text-sm ${colors.text} leading-relaxed font-medium`}>{text}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                    <div className="p-6 border-b border-neutral-100">
                      <div className="flex items-center justify-between">
                        <h4 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-900 text-sm font-medium">
                          <Zap className="h-4 w-4 text-neutral-600" />
                          Anbefalinger
                        </h4>
                        <p className="text-xs text-neutral-400">Klikk for AI-eksempler</p>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="space-y-3">
                        {result.aiSummary.recommendations.slice(0, 5).map((rec, i) => (
                          <div 
                            key={i} 
                            onClick={() => {
                              fetchAISuggestion(
                                rec.title,
                                rec.description,
                                rec.priority === 'high' ? 'bad' : rec.priority === 'medium' ? 'warning' : 'good',
                                `Anbefaling: ${rec.description}${rec.expectedImpact ? `. Forventet effekt: ${rec.expectedImpact}` : ''}`
                              );
                            }}
                            className="p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:shadow-md transition-all bg-white cursor-pointer group"
                          >
                            <div className="flex items-start gap-3">
                              <div className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${
                                rec.priority === 'high'
                                  ? 'bg-red-100 text-red-700'
                                  : rec.priority === 'medium'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {rec.priority === 'high' ? 'Høy prioritet' : rec.priority === 'medium' ? 'Medium' : 'Lav prioritet'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-medium text-sm text-neutral-900">{rec.title}</p>
                                  <Sparkles className="w-4 h-4 text-neutral-300 group-hover:text-amber-500 transition-colors shrink-0" />
                                </div>
                                <p className="text-sm text-neutral-500 mt-1 leading-relaxed">{rec.description}</p>
                                {rec.expectedImpact && (
                                  <p className="text-xs text-neutral-400 mt-2 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    {rec.expectedImpact}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Plan */}
                  {result.aiSummary.actionPlan && (
                    <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                      <div className="p-6 border-b border-neutral-100">
                        <h4 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-900 text-sm font-medium">
                          <ArrowRight className="h-4 w-4 text-neutral-600" />
                          Handlingsplan
                        </h4>
                      </div>
                      <div className="p-6">
                        <div className="grid md:grid-cols-3 gap-4">
                          {result.aiSummary.actionPlan.immediate?.length > 0 && (
                            <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200">
                              <h5 className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-yellow-200 text-yellow-800 text-xs font-semibold mb-4">
                                <Zap className="h-3.5 w-3.5" />
                                Gjør nå
                              </h5>
                              <ul className="space-y-3">
                                {result.aiSummary.actionPlan.immediate.map((item, i) => (
                                  <li key={i} className="text-sm text-yellow-900 flex items-start gap-2">
                                    <span className="w-5 h-5 rounded-full bg-yellow-200 flex items-center justify-center shrink-0 mt-0.5">
                                      <span className="text-xs font-bold text-yellow-800">{i + 1}</span>
                                    </span>
                                    <span className="leading-relaxed">{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {result.aiSummary.actionPlan.shortTerm?.length > 0 && (
                            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                              <h5 className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-200 text-blue-800 text-xs font-semibold mb-4">
                                <Clock className="h-3.5 w-3.5" />
                                Innen 1-2 uker
                              </h5>
                              <ul className="space-y-3">
                                {result.aiSummary.actionPlan.shortTerm.map((item, i) => (
                                  <li key={i} className="text-sm text-blue-900 flex items-start gap-2">
                                    <span className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                                      <span className="text-xs font-bold text-blue-800">{i + 1}</span>
                                    </span>
                                    <span className="leading-relaxed">{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {result.aiSummary.actionPlan.longTerm?.length > 0 && (
                            <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                              <h5 className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-green-200 text-green-800 text-xs font-semibold mb-4">
                                <TrendingUp className="h-3.5 w-3.5" />
                                Langsiktig
                              </h5>
                              <ul className="space-y-3">
                                {result.aiSummary.actionPlan.longTerm.map((item, i) => (
                                  <li key={i} className="text-sm text-green-900 flex items-start gap-2">
                                    <span className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center shrink-0 mt-0.5">
                                      <span className="text-xs font-bold text-green-800">{i + 1}</span>
                                    </span>
                                    <span className="leading-relaxed">{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
                  <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-neutral-400" />
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-2">Ingen AI-analyse</h3>
                  <p className="text-sm text-neutral-500 max-w-md mx-auto">
                    AI-analysen genereres automatisk ved neste kjøring.
                  </p>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        /* Empty State - Modern style */
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-gradient-to-br from-white to-neutral-50">
          <div className="flex flex-col items-center justify-center py-20 px-8">
            <div className="w-20 h-20 bg-neutral-100 rounded-2xl flex items-center justify-center mb-6">
              <BarChart3 className="w-10 h-10 text-neutral-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-neutral-900">Klar for din gratis analyse</h3>
            <p className="text-neutral-500 text-center max-w-md mb-8">
              Start analysen for å få en komplett rapport om nettsiden din med SEO, sikkerhet og AI-drevne anbefalinger.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => setDialogOpen(true)} size="lg" className="bg-neutral-900 hover:bg-neutral-800 text-white">
                <Plus className="mr-2 h-5 w-5" />
                Start din første analyse
              </Button>
            </div>
            <div className="flex items-center gap-6 mt-8 text-sm text-neutral-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>{FREE_MONTHLY_LIMIT} gratis/mnd</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>AI-analyse</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Konkurrentsjekk</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Suggestion Modal */}
      <Dialog open={suggestionSheetOpen} onOpenChange={setSuggestionSheetOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-hidden flex flex-col p-0">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Lightbulb className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-neutral-900">
                  AI-forslag
                </DialogTitle>
                <DialogDescription className="text-sm text-neutral-500">
                  {selectedElement && `Forbedringsforslag for ${selectedElement.name}`}
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {loadingSuggestion ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3 py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                  <span className="text-sm text-neutral-600">Genererer AI-forslag...</span>
                </div>
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ) : aiSuggestion ? (
              <div className="space-y-5">
                {/* Current status badge */}
                {selectedElement && (
                  <div className={`p-4 rounded-xl ${
                    selectedElement.status === 'good' ? 'bg-green-50 border border-green-200' :
                    selectedElement.status === 'warning' ? 'bg-amber-50 border border-amber-200' :
                    'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        selectedElement.status === 'good' ? 'bg-green-100' :
                        selectedElement.status === 'warning' ? 'bg-amber-100' :
                        'bg-red-100'
                      }`}>
                        {selectedElement.status === 'good' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : selectedElement.status === 'warning' ? (
                          <AlertCircle className="h-5 w-5 text-amber-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-neutral-900">{selectedElement.name}</p>
                        <p className="text-sm text-neutral-600 truncate">{selectedElement.value}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Problem identification */}
                {aiSuggestion.problem && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-red-900 mb-1">Identifisert problem</p>
                        <p className="text-sm text-red-700 leading-relaxed">{aiSuggestion.problem}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                  <p className="text-sm text-neutral-700 leading-relaxed">{aiSuggestion.summary}</p>
                </div>

                {/* Quick win */}
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <Zap className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-amber-900 mb-1">Rask forbedring</p>
                      <p className="text-sm text-amber-800 leading-relaxed">{aiSuggestion.quickWin}</p>
                    </div>
                  </div>
                </div>

                {/* Suggestions */}
                <div className="space-y-3">
                  <h4 className="font-medium text-neutral-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-neutral-400" />
                    Anbefalinger
                  </h4>
                  <div className="space-y-3">
                    {aiSuggestion.suggestions.map((suggestion, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white border border-neutral-200 hover:border-neutral-300 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 text-xs font-medium text-neutral-600">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-neutral-900">{suggestion.title}</span>
                              <Badge variant="outline" className={`text-xs ${
                                suggestion.priority === 'høy' ? 'border-red-200 text-red-700 bg-red-50' :
                                suggestion.priority === 'medium' ? 'border-amber-200 text-amber-700 bg-amber-50' :
                                'border-green-200 text-green-700 bg-green-50'
                              }`}>
                                {suggestion.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-neutral-600 leading-relaxed">{suggestion.description}</p>
                            {suggestion.example && (
                              <div className="mt-3 p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                                <p className="text-xs text-neutral-500 mb-1">Eksempel:</p>
                                <p className="text-sm text-neutral-800 font-mono break-all">{suggestion.example}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50">
            <div className="flex items-center justify-between">
              <p className="text-xs text-neutral-500">
                Generert av AI · Verifiser før implementering
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSuggestionSheetOpen(false)}
              >
                Lukk
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
