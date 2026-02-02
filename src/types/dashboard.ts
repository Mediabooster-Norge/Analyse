// ============================================================================
// Dashboard-specific Types
// ============================================================================

/**
 * AI Suggestion for individual SEO elements
 */
export interface AISuggestion {
  title: string;
  description: string;
  priority: 'høy' | 'medium' | 'lav';
  example?: string;
}

export interface AISuggestionData {
  problem?: string;
  summary: string;
  suggestions: AISuggestion[];
  quickWin: string;
}

/**
 * Limit error response from API
 */
export interface LimitError {
  error: string;
  limitReached: boolean;
  contactUrl: string;
}

/**
 * Keyword research data for SEO analysis
 */
export interface KeywordResearchData {
  keyword: string;
  searchVolume: number;
  cpc: number;
  competition: 'lav' | 'medium' | 'høy';
  competitionScore: number;
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  difficulty: number;
  trend: 'stigende' | 'stabil' | 'synkende';
}

/**
 * AI Visibility result data
 */
export interface AIVisibilityData {
  score: number;
  level: 'high' | 'medium' | 'low' | 'none';
  description: string;
  details: {
    queriesTested: number;
    timesCited: number;
    timesMentioned: number;
    queries: Array<{
      query: string;
      cited: boolean;
      mentioned: boolean;
      aiResponse?: string;
    }>;
  };
  recommendations: string[];
}

/**
 * Competitor analysis result
 */
export interface CompetitorAnalysis {
  url: string;
  results: {
    seoResults: { score: number };
    contentResults: { score: number; wordCount: number };
    securityResults: { score: number };
    overallScore: number;
    aiVisibility?: { score: number };
  };
}

/**
 * Dashboard analysis result - combines all analysis data
 */
export interface DashboardAnalysisResult {
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
      missingAltImages?: string[];
      relevance?: {
        analyzed: {
          url: string;
          isRelevant: boolean;
          relevanceScore: number;
          description: string;
          feedback: string;
        }[];
        averageScore: number;
        summary: string;
      };
    };
    links: {
      internal: { count: number; urls?: string[] };
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
  competitors?: CompetitorAnalysis[];
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
  aiVisibility?: AIVisibilityData;
}

/**
 * Dashboard tab types
 */
export type DashboardTab = 'overview' | 'competitors' | 'keywords' | 'ai' | 'ai-visibility';

/**
 * Analysis step for progress indicator
 */
export interface AnalysisStep {
  label: string;
  description: string;
  duration: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Selected element for AI suggestion
 */
export interface SelectedElement {
  name: string;
  value: string;
  status: 'good' | 'warning' | 'bad';
  relatedUrls?: string[];
}

/**
 * Keyword sort configuration
 */
export interface KeywordSort {
  column: string;
  direction: 'asc' | 'desc';
}

/**
 * Competitor sort configuration
 */
export interface CompetitorSort {
  column: 'total' | 'seo' | 'content' | 'security' | 'aiVisibility';
  direction: 'asc' | 'desc';
}

/**
 * Article suggestion for content/outranking
 */
export interface ArticleSuggestion {
  title: string;
  rationale: string;
  priority?: 'high' | 'medium' | 'low';
}
