// ============================================================================
// Database Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  daily_analyses_count: number;
  last_analysis_at: string | null;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  is_premium: boolean;
  premium_since: string | null;
  premium_expires_at: string | null;
  monthly_analysis_limit: number;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  user_id: string;
  name: string;
  website_url: string;
  org_number: string | null;
  phone: string | null;
  industry: string | null;
  employee_count: string | null;
  contact_person: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  created_at: string;
}

export interface Analysis {
  id: string;
  company_id: string;
  status: AnalysisStatus;
  seo_results: SEOResults | null;
  content_results: ContentResults | null;
  security_results: SecurityResults | null;
  competitor_results: CompetitorResults | null;
  ai_summary: AISummary | null;
  overall_score: number | null;
  ai_model: string;
  tokens_used: number;
  cost_usd: number;
  created_at: string;
}

export interface Competitor {
  id: string;
  analysis_id: string;
  url: string;
  results: SEOResults | null;
}

export interface Recommendation {
  id: string;
  analysis_id: string;
  category: RecommendationCategory;
  priority: Priority;
  title: string;
  description: string;
  completed: boolean;
}

export interface ApiUsage {
  id: string;
  user_id: string;
  usage_date: string;
  analyses_count: number;
  total_tokens: number;
  total_cost_usd: number;
}

// ============================================================================
// Enums
// ============================================================================

export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type Priority = 'high' | 'medium' | 'low';
export type RecommendationCategory = 'seo' | 'content' | 'security' | 'performance' | 'accessibility';

// ============================================================================
// Analysis Result Types
// ============================================================================

export interface SEOResults {
  meta: MetaTagsAnalysis;
  headings: HeadingsAnalysis;
  images: ImagesAnalysis;
  links: LinksAnalysis;
  mobile: MobileAnalysis;
  technical: TechnicalSEOAnalysis;
  score: number;
}

export interface MetaTagsAnalysis {
  title: {
    content: string | null;
    length: number;
    isOptimal: boolean;
  };
  description: {
    content: string | null;
    length: number;
    isOptimal: boolean;
  };
  ogTags: {
    title: string | null;
    description: string | null;
    image: string | null;
    url: string | null;
  };
  twitterTags: {
    card: string | null;
    title: string | null;
    description: string | null;
    image: string | null;
  };
  canonical: string | null;
  robots: string | null;
}

export interface HeadingsAnalysis {
  h1: { count: number; contents: string[] };
  h2: { count: number; contents: string[] };
  h3: { count: number; contents: string[] };
  h4: { count: number; contents: string[] };
  h5: { count: number; contents: string[] };
  h6: { count: number; contents: string[] };
  hasProperHierarchy: boolean;
  issues: string[];
}

export interface ImagesAnalysis {
  total: number;
  withAlt: number;
  withoutAlt: number;
  withLazyLoading: number;
  largeImages: string[];
  missingAltImages: string[];
  score: number;
}

export interface LinksAnalysis {
  internal: { count: number; urls: string[] };
  external: { count: number; urls: string[] };
  broken: { count: number; urls: string[] };
  nofollow: { count: number; urls: string[] };
}

export interface MobileAnalysis {
  hasViewportMeta: boolean;
  viewportContent: string | null;
  isResponsive: boolean;
  issues: string[];
}

export interface TechnicalSEOAnalysis {
  hasRobotsTxt: boolean;
  hasSitemap: boolean;
  sitemapUrl: string | null;
  hasHttps: boolean;
  hasHreflang: boolean;
  hreflangTags: { lang: string; url: string }[];
}

export interface ContentResults {
  wordCount: number;
  characterCount: number;
  paragraphCount: number;
  sentenceCount: number;
  readability: {
    lixScore: number;
    lixLevel: string;
    avgWordsPerSentence: number;
    avgWordLength: number;
  };
  keywords: {
    word: string;
    count: number;
    density: number;
  }[];
  hasCTA: boolean;
  ctaElements: string[];
  score: number;
}

export interface SecurityResults {
  ssl: SSLAnalysis;
  headers: SecurityHeadersAnalysis;
  observatory: ObservatoryAnalysis;
  score: number;
}

export interface SSLAnalysis {
  grade: string;
  certificate: {
    issuer: string | null;
    validFrom: string | null;
    validTo: string | null;
    daysUntilExpiry: number | null;
  };
  protocols: string[];
  vulnerabilities: string[];
}

export interface SecurityHeadersAnalysis {
  contentSecurityPolicy: boolean;
  strictTransportSecurity: boolean;
  xFrameOptions: boolean;
  xContentTypeOptions: boolean;
  referrerPolicy: boolean;
  permissionsPolicy: boolean;
  score: number;
}

export interface ObservatoryAnalysis {
  grade: string;
  score: number;
  tests: {
    name: string;
    pass: boolean;
    description: string;
  }[];
}

export interface PageSpeedResults {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  coreWebVitals: {
    lcp: number;
    fid: number;
    cls: number;
  };
}

export interface CompetitorResults {
  competitors: {
    url: string;
    overallScore: number;
    results: {
      seoResults: { score: number };
      contentResults: { score: number; wordCount: number };
      securityResults: { score: number };
      overallScore: number;
    };
  }[];
  strengths: string[];
  weaknesses: string[];
}

export interface KeyFinding {
  text: string;
  type: 'positive' | 'negative' | 'neutral';
}

export interface AISummary {
  overallAssessment: string;
  keyFindings: KeyFinding[] | string[]; // Support both old and new format
  keywordAnalysis?: {
    summary: string;
    primaryKeywords: string[];
    missingKeywords: string[];
    keywordDensityAssessment?: string;
    titleKeywordMatch?: string;
    targetKeywordMatches?: string;
    recommendations: string;
  };
  recommendations: {
    priority: Priority;
    category: RecommendationCategory;
    title: string;
    description: string;
    expectedImpact: string;
  }[];
  competitorComparison?: {
    summary: string;
    scoreAnalysis?: string;
    yourStrengths: string[];
    competitorStrengths: string[];
    opportunities: string[];
    quickWins?: string[];
  };
  actionPlan: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

export interface AIVisibilityResult {
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

// ============================================================================
// Form Types
// ============================================================================

export interface RegisterFormData {
  email: string;
  password: string;
  companyName: string;
  websiteUrl: string;
  phone?: string;
  industry?: string;
  employeeCount?: string;
  contactPerson?: string;
}

export interface AnalysisFormData {
  websiteUrl: string;
  competitorUrls: string[];
}

// ============================================================================
// API Response Types
// ============================================================================

export interface AnalysisResponse {
  success: boolean;
  data?: Analysis;
  error?: string;
}

export interface ScrapedData {
  url: string;
  html: string;
  statusCode: number;
  headers: Record<string, string>;
  loadTime: number;
}
