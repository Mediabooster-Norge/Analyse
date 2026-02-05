'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScoreRing, SummaryCard, MetricCard, ScoreTrendChart, SocialPreview } from '@/components/features/dashboard';
import type { DashboardAnalysisResult, ArticleSuggestion, GeneratedArticleResult } from '@/types/dashboard';
import {
  Search,
  TrendingUp,
  FileText,
  Shield,
  Clock,
  CheckCircle2,
  ChevronRight,
  Globe,
  Link2,
  Lightbulb,
  Eye,
  Sparkles,
  Lock,
  ExternalLink,
  Type,
  Image,
  BarChart3,
  Copy,
  PenLine,
  Loader2,
  Zap,
  Gauge,
  Activity,
  Share2,
  Download,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

// Feature flag: Set to true when AI visibility is ready
const AI_VISIBILITY_ENABLED = false;

const GENERATING_ARTICLE_MESSAGES = [
  'Forsker på emnet…',
  'Skriver innledning…',
  'Utformer hoveddeler…',
  'Legger til eksempler…',
  'Gjør siste justeringer…',
];

const SUGGESTION_MESSAGES = [
  'Analyserer nettstedet ditt…',
  'Finner relevante emner…',
  'Vurderer søkepotensial…',
  'Identifiserer innholdsgap…',
  'Formulerer artikkelideer…',
];

export interface OverviewTabProps {
  result: DashboardAnalysisResult;
  isPremium: boolean;
  url: string;
  openSubpageDialog: (subpageUrl: string) => void;
  fetchAISuggestion: (
    element: string,
    currentValue: string,
    status: 'good' | 'warning' | 'bad',
    issue?: string,
    relatedUrls?: string[]
  ) => void;
  setActiveTab: (tab: 'overview' | 'competitors' | 'keywords' | 'ai' | 'ai-visibility' | 'articles') => void;
  articleSuggestions: ArticleSuggestion[] | null;
  loadingArticleSuggestions: boolean;
  articleSuggestionsSavedAt: string | null;
  fetchArticleSuggestions: (withCompetitors: boolean) => void;
  hasCompetitors: boolean;
  remainingArticleGenerations: number;
  articleGenerationsLimit: number;
  generatedArticleResult: GeneratedArticleResult | null;
  generatingArticleIndex: number | null;
  fetchGenerateArticle: (suggestion: { title: string; rationale?: string }, index: number) => void;
  setGeneratedArticle: (result: GeneratedArticleResult | null) => void;
  analysisHistory: Array<{
    id: string;
    createdAt: string;
    overallScore: number;
    seoScore: number;
    contentScore: number;
    securityScore: number;
    performanceScore: number | null;
  }>;
  /** True mens hastighet (PageSpeed) hentes i eget API-kall */
  loadingPageSpeed?: boolean;
}

export function OverviewTab({
  result,
  isPremium,
  url,
  openSubpageDialog,
  fetchAISuggestion,
  setActiveTab,
  articleSuggestions,
  loadingArticleSuggestions,
  articleSuggestionsSavedAt,
  fetchArticleSuggestions,
  hasCompetitors,
  remainingArticleGenerations,
  articleGenerationsLimit,
  generatedArticleResult,
  generatingArticleIndex,
  fetchGenerateArticle,
  setGeneratedArticle,
  analysisHistory,
  loadingPageSpeed = false,
}: OverviewTabProps) {
  const copyTitle = (title: string) => {
    navigator.clipboard.writeText(title).then(
      () => toast.success('Tittel kopiert'),
      () => toast.error('Kunne ikke kopiere')
    );
  };
  const copyArticle = () => {
    if (!generatedArticleResult?.article) return;
    navigator.clipboard.writeText(generatedArticleResult.article).then(
      () => toast.success('Artikkel kopiert'),
      () => toast.error('Kunne ikke kopiere')
    );
  };
  const copyMeta = (label: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} kopiert`),
      () => toast.error('Kunne ikke kopiere')
    );
  };

  const [generatingMessageIndex, setGeneratingMessageIndex] = useState(0);
  useEffect(() => {
    if (generatingArticleIndex === null) return;
    setGeneratingMessageIndex(0);
    const interval = setInterval(() => {
      setGeneratingMessageIndex((i) => (i + 1) % GENERATING_ARTICLE_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [generatingArticleIndex]);

  const [suggestionMessageIndex, setSuggestionMessageIndex] = useState(0);
  useEffect(() => {
    if (!loadingArticleSuggestions) return;
    setSuggestionMessageIndex(0);
    const interval = setInterval(() => {
      setSuggestionMessageIndex((i) => (i + 1) % SUGGESTION_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [loadingArticleSuggestions]);

  return (
    <>
      <SummaryCard score={result.overallScore} />

      {/* Score Grid + Priority Improvements - Side by side */}
      <div className="grid lg:grid-cols-3 gap-2 max-[400px]:gap-2 min-[401px]:gap-3 sm:gap-4">
        {/* Score Grid Section - Takes 2 columns */}
        <div className="lg:col-span-2 rounded-2xl max-[400px]:rounded-xl border border-neutral-200 bg-white overflow-hidden min-w-0">
          <div className="p-2 max-[400px]:p-2 min-[401px]:p-3 sm:p-5 border-b border-neutral-100">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 max-[400px]:gap-1">
              <div className="min-w-0">
                <h3 className="font-semibold text-neutral-900 mb-0.5 max-[400px]:text-sm min-[401px]:text-base">Poengoversikt</h3>
                <p className="text-[10px] max-[400px]:text-[10px] min-[401px]:text-xs sm:text-sm text-neutral-500">Høyere poeng = bedre synlighet</p>
              </div>
              <div className="text-left sm:text-right">
                <div className="flex items-center gap-1.5 text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs text-neutral-400">
                  <Clock className="w-3 h-3 max-[400px]:w-2.5 max-[400px]:h-2.5" />
                  <span>{new Date().toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-2 max-[400px]:p-2 min-[401px]:p-3 sm:p-5">
            <div className={`grid grid-cols-3 ${AI_VISIBILITY_ENABLED ? 'sm:grid-cols-6' : 'sm:grid-cols-5'} gap-1 max-[400px]:gap-1 min-[401px]:gap-2 sm:gap-3 max-[400px]:scale-[0.85] max-[400px]:origin-center`}>
              <div className="text-center min-w-0">
                <ScoreRing score={result.overallScore} label="Totalt" size="md" showStatus title={`Samlet score: ${result.overallScore} – vektet gjennomsnitt av alle kategorier`} />
                <p className="text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs text-neutral-500 mt-0.5 sm:mt-1">Samlet</p>
              </div>
              <div className="text-center min-w-0">
                <ScoreRing score={result.seoResults.score} label="SEO" size="md" showStatus title={`SEO: ${result.seoResults.score} – søkemotoroptimalisering (titler, beskrivelser, overskrifter)`} />
                <p className="text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs text-neutral-500 mt-0.5 sm:mt-1">Søkemotor</p>
              </div>
              <div className="text-center min-w-0">
                <ScoreRing score={result.contentResults.score} label="Innhold" size="md" showStatus title={`Innhold: ${result.contentResults.score} – tekstmengde og lesbarhet`} />
                <p className="text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs text-neutral-500 mt-0.5 sm:mt-1">Tekst</p>
              </div>
              <div className="text-center min-w-0">
                <ScoreRing score={result.securityResults.score} label="Sikkerhet" size="md" showStatus title={`Sikkerhet: ${result.securityResults.score} – HTTPS, sikkerhetsheadere`} />
                <p className="text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs text-neutral-500 mt-0.5 sm:mt-1">Trygghet</p>
              </div>
              <div className="text-center min-w-0">
                {result.pageSpeedResults && result.pageSpeedResults.performance > 0 ? (
                  <>
                    <ScoreRing score={result.pageSpeedResults.performance} label="Speed" size="md" showStatus title={`Hastighet: ${result.pageSpeedResults.performance} – PageSpeed (innlasting, ytelse)`} />
                    <p className="text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs text-neutral-500 mt-0.5 sm:mt-1">Hastighet</p>
                    {!result.pageSpeedResults.isEstimate && (
                      <span className="inline-flex items-center gap-0.5 mt-0.5 max-[400px]:text-[8px] min-[401px]:text-[9px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                        Full PageSpeed
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 max-[400px]:w-10 max-[400px]:h-10 min-[401px]:w-14 min-[401px]:h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-neutral-100 border-2 max-[400px]:border-2 min-[401px]:border-4 border-neutral-200 flex items-center justify-center">
                      <Zap className="w-5 h-5 max-[400px]:w-4 max-[400px]:h-4 min-[401px]:w-5 sm:w-6 sm:h-6 text-neutral-400" />
                    </div>
                    <p className="text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs text-neutral-500 mt-0.5 sm:mt-1">Hastighet</p>
                    <span className="inline-flex items-center gap-0.5 mt-0.5 max-[400px]:text-[9px] min-[401px]:text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium" title="Hastighet ble ikke målt denne gangen (tidsbegrensning eller feil). Resten av analysen er fullført.">
                      Ikke målt
                    </span>
                  </>
                )}
              </div>
              {/* AI-synlighet - only show when feature is enabled */}
              {AI_VISIBILITY_ENABLED && (
                <div className="text-center min-w-0">
                  <ScoreRing 
                    score={result.aiVisibility?.score ?? 0} 
                    label="AI" 
                    size="md" 
                    showStatus={isPremium} 
                  />
                  <p className="text-xs text-neutral-500 mt-1">AI-synlighet</p>
                  {!isPremium && (
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-neutral-100 text-[10px] font-medium text-neutral-500">
                      <Lock className="h-2.5 w-2.5" />
                      Premium
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Priority Improvements - Takes 1 column */}
        {(() => {
          const issues: { label: string; desc: string; priority: 'high' | 'medium' | 'low'; category: string }[] = [];
          if (result.seoResults.headings.h1.count !== 1) issues.push({ label: 'H1-overskrift', desc: result.seoResults.headings.h1.count === 0 ? 'Mangler hovedoverskrift' : 'Flere hovedoverskrifter', priority: 'high', category: 'seo' });
          if (!result.seoResults.meta.title.content) issues.push({ label: 'Sidetittel', desc: 'Mangler tittel', priority: 'high', category: 'seo' });
          if (result.seoResults.meta.title.content && !result.seoResults.meta.title.isOptimal) issues.push({ label: 'Sidetittel', desc: 'Ikke optimal lengde', priority: 'medium', category: 'seo' });
          if (!result.seoResults.meta.description.content) issues.push({ label: 'Meta-beskrivelse', desc: 'Mangler beskrivelse', priority: 'high', category: 'seo' });
          if (result.seoResults.meta.description.content && !result.seoResults.meta.description.isOptimal) issues.push({ label: 'Meta-beskrivelse', desc: 'Ikke optimal lengde', priority: 'medium', category: 'seo' });
          if (!result.seoResults.meta.ogTags.title) issues.push({ label: 'Open Graph', desc: 'Mangler OG-tittel', priority: 'low', category: 'seo' });
          if (!result.seoResults.meta.ogTags.description) issues.push({ label: 'Open Graph', desc: 'Mangler OG-beskrivelse', priority: 'low', category: 'seo' });
          if (!result.seoResults.meta.canonical) issues.push({ label: 'Canonical URL', desc: 'Mangler canonical tag', priority: 'medium', category: 'seo' });
          if (result.contentResults.wordCount < 300) issues.push({ label: 'Innhold', desc: 'For lite tekst', priority: 'medium', category: 'content' });
          if (result.contentResults.readability && result.contentResults.readability.lixScore > 44) {
            // LIX levels: <25 very easy, 25-34 easy, 35-44 moderate, 45-54 difficult (faglitteratur), >55 very difficult
            const lixScore = result.contentResults.readability.lixScore;
            if (lixScore > 55) {
              issues.push({ label: 'Lesbarhet', desc: 'Meget vanskelig tekst', priority: 'high', category: 'content' });
            } else {
              issues.push({ label: 'Lesbarhet', desc: 'Vanskelig tekst (faglitteratur)', priority: 'medium', category: 'content' });
            }
          }
          if (result.seoResults.headings.h2.count === 0) issues.push({ label: 'H2-overskrifter', desc: 'Mangler underoverskrifter', priority: 'low', category: 'content' });
          if (result.seoResults.images.withoutAlt > 0) issues.push({ label: 'Bilder', desc: `${result.seoResults.images.withoutAlt} mangler alt-tekst`, priority: 'low', category: 'seo' });
          if (result.securityResults.score < 60) issues.push({ label: 'Sikkerhet', desc: 'Lav sikkerhetsscore', priority: 'medium', category: 'security' });
          if (!result.securityResults.headers.strictTransportSecurity) issues.push({ label: 'HSTS', desc: 'Mangler HSTS-header', priority: 'medium', category: 'security' });
          if (!result.securityResults.headers.contentSecurityPolicy) issues.push({ label: 'CSP', desc: 'Mangler Content Security Policy', priority: 'low', category: 'security' });
          // Performance / PageSpeed issues (only LCP/CLS when full analysis, not estimate)
          if (result.pageSpeedResults) {
            if (result.pageSpeedResults.performance < 50) {
              issues.push({ label: 'Ytelse', desc: `Kritisk lav score (${result.pageSpeedResults.performance}/100)`, priority: 'high', category: 'performance' });
            } else if (result.pageSpeedResults.performance < 90) {
              issues.push({ label: 'Ytelse', desc: `Kan forbedres (${result.pageSpeedResults.performance}/100)`, priority: 'medium', category: 'performance' });
            }
            if (!result.pageSpeedResults.isEstimate) {
              if (result.pageSpeedResults.coreWebVitals.lcp > 4000) {
                issues.push({ label: 'LCP', desc: 'Treg innlasting av hovedinnhold', priority: 'high', category: 'performance' });
              } else if (result.pageSpeedResults.coreWebVitals.lcp > 2500) {
                issues.push({ label: 'LCP', desc: 'Moderat innlastingstid', priority: 'medium', category: 'performance' });
              }
              if (result.pageSpeedResults.coreWebVitals.cls > 0.25) {
                issues.push({ label: 'CLS', desc: 'Ustabilt layout', priority: 'high', category: 'performance' });
              } else if (result.pageSpeedResults.coreWebVitals.cls > 0.1) {
                issues.push({ label: 'CLS', desc: 'Noe layoutforskyvning', priority: 'medium', category: 'performance' });
              }
            }
          }
          // Only show AI visibility issues if feature is enabled
          if (AI_VISIBILITY_ENABLED && result.aiVisibility && result.aiVisibility.score < 50) issues.push({ label: 'AI-synlighet', desc: 'Lav AI-synlighet', priority: 'medium', category: 'ai' });

          const issueToMetricId: Record<string, string> = {
            'Sidetittel': 'sidetittel',
            'Meta-beskrivelse': 'meta-beskrivelse',
            'H1-overskrift': 'h1-overskrift',
            'H2-overskrifter': 'h2-overskrifter',
            'Bilder': 'bilder-alt',
            'Open Graph': 'open-graph',
            'Canonical URL': 'seo',
            'Lesbarhet': 'lesbarhet',
            'Innhold': 'ordtelling',
            'Sikkerhet': 'sikkerhet',
            'HSTS': 'hsts',
            'CSP': 'csp',
            'Ytelse': 'ytelse',
            'LCP': 'lcp',
            'CLS': 'cls',
            'AI-synlighet': 'ai-synlighet',
          };

          return issues.length > 0 ? (
            <div className="rounded-2xl max-[400px]:rounded-xl border border-neutral-200 bg-white p-2 max-[400px]:p-2 min-[401px]:p-3 sm:p-5 flex flex-col h-full min-w-0">
              <div className="flex items-center justify-between mb-2 max-[400px]:mb-2">
                <h3 className="font-semibold text-neutral-900 flex items-center gap-1.5 max-[400px]:gap-1.5 text-xs max-[400px]:text-xs min-[401px]:text-sm">
                  <TrendingUp className="h-3.5 w-3.5 max-[400px]:h-3 max-[400px]:w-3 text-amber-500" />
                  Forbedringer
                </h3>
                <span className="text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs text-neutral-400">{issues.length} funn</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-[400px]:gap-1 min-[401px]:gap-2 min-w-0 overflow-hidden">
                {issues.map((issue, i) => {
                  const metricId = issueToMetricId[issue.label] ?? 'detailed-metrics';
                  return (
                  <button
                    key={i}
                    onClick={() => {
                      const selector = metricId === 'detailed-metrics' ? '[data-section="detailed-metrics"]' : `[data-metric="${metricId}"]`;
                      const element = document.querySelector(selector);
                      const target = element ?? document.querySelector('[data-section="detailed-metrics"]');
                      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="inline-flex items-center gap-1 max-[400px]:gap-1 min-[401px]:gap-1.5 p-1.5 max-[400px]:p-1.5 min-[401px]:p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer text-left group min-w-0 max-w-full shrink"
                  >
                    <div className={`w-1.5 h-1.5 max-[400px]:w-1 max-[400px]:h-1 min-[401px]:w-1.5 min-[401px]:h-1.5 rounded-full shrink-0 ${issue.priority === 'high' ? 'bg-red-500' : issue.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                    <span className="font-medium text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs text-neutral-900 shrink-0">{issue.label}</span>
                    <span className="text-neutral-400 text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs shrink-0">·</span>
                    <span className="text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs text-neutral-500 min-w-0 truncate">{issue.desc}</span>
                    <ChevronRight className="w-2.5 h-2.5 max-[400px]:w-2 max-[400px]:h-2 min-[401px]:w-3 min-[401px]:h-3 text-neutral-400 group-hover:text-neutral-600 shrink-0 transition-colors" />
                  </button>
                );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl max-[400px]:rounded-xl border border-green-200 bg-green-50 p-2 max-[400px]:p-2 min-[401px]:p-3 sm:p-5 h-full min-w-0">
              <h3 className="font-semibold text-green-800 mb-1 max-[400px]:mb-1 flex items-center gap-1.5 text-xs max-[400px]:text-xs min-[401px]:text-sm">
                <CheckCircle2 className="h-3.5 w-3.5 max-[400px]:h-3 max-[400px]:w-3 text-green-600" />
                Alt ser bra ut!
              </h3>
              <p className="text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs text-green-700">Ingen kritiske forbedringer funnet.</p>
            </div>
          );
        })()}
      </div>

      {/* Score Trend Chart – skjult for nå (sett til analysisHistory.length > 0 for å vise) */}
      {false && analysisHistory.length > 0 && (
        <Accordion type="single" collapsible className="rounded-2xl max-[400px]:rounded-xl border border-neutral-200 bg-white overflow-hidden min-w-0">
          <AccordionItem value="trend" className="border-none">
            <AccordionTrigger className="px-3 max-[400px]:px-2 min-[401px]:px-4 sm:px-5 py-3 hover:no-underline hover:bg-neutral-50">
              <div className="flex items-center gap-2 text-left">
                <TrendingUp className="h-4 w-4 text-neutral-500 shrink-0" />
                <div>
                  <h3 className="font-semibold text-neutral-900 text-sm max-[400px]:text-xs min-[401px]:text-base">
                    Score-utvikling over tid
                  </h3>
                  <p className="text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs sm:text-sm text-neutral-500 font-normal">
                    {analysisHistory.length} analyse{analysisHistory.length !== 1 ? 'r' : ''} registrert
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 max-[400px]:px-2 min-[401px]:px-4 sm:px-6 pb-4">
              <ScoreTrendChart history={analysisHistory} currentScore={result.overallScore} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Detailed Metrics */}
      <div data-section="detailed-metrics" className="rounded-2xl max-[400px]:rounded-xl border border-neutral-200 bg-white overflow-hidden min-w-0">
        <div className="p-2 max-[400px]:p-2 min-[401px]:p-3 sm:p-6 border-b border-neutral-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 max-[400px]:gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-neutral-900 mb-0.5 text-sm max-[400px]:text-xs min-[401px]:text-base">Detaljert gjennomgang</h3>
              <p className="text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs sm:text-sm text-neutral-500">Klikk for AI-forslag</p>
            </div>
            <div className="inline-flex items-center gap-1 max-[400px]:gap-1 px-2 py-1 max-[400px]:px-1.5 max-[400px]:py-1 min-[401px]:px-2.5 min-[401px]:py-1.5 rounded-md bg-amber-50 border border-amber-100 text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs text-amber-700 w-fit">
              <Lightbulb className="w-2.5 h-2.5 max-[400px]:w-2 max-[400px]:h-2 text-amber-500" />
              AI-hjelp
            </div>
          </div>
        </div>
        <div className="p-2 max-[400px]:p-2 min-[401px]:p-3 sm:p-6 space-y-3 max-[400px]:space-y-3 sm:space-y-4">
          {/* Social preview – øverst */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5 flex items-center gap-2">
              <Share2 className="w-3.5 h-3.5" />
              Slik ser lenken ut når den deles
            </h4>
            <p className="text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs text-neutral-500 mb-3">Forhåndsvisning basert på sidetittel, meta og Open Graph</p>
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-4">
              <SocialPreview
                url={url}
                pageTitle={result.seoResults.meta.title.content}
                pageDescription={result.seoResults.meta.description.content}
                ogTags={result.seoResults.meta.ogTags}
                onGetTips={() => {
                  const missing = [
                    !result.seoResults.meta.ogTags.title && 'og:title',
                    !result.seoResults.meta.ogTags.description && 'og:description',
                    !result.seoResults.meta.ogTags.image && 'og:image'
                  ].filter(Boolean);
                  const allSet = missing.length === 0;
                  fetchAISuggestion(
                    'Open Graph / Social Media',
                    allSet ? 'Alle OG-tagger er satt' : `Mangler: ${missing.join(', ')}`,
                    allSet ? 'good' : 'warning',
                    `URL: ${url}. OG-title: ${result.seoResults.meta.ogTags.title || 'ikke satt'}. OG-description: ${result.seoResults.meta.ogTags.description || 'ikke satt'}. OG-image: ${result.seoResults.meta.ogTags.image ? 'satt' : 'ikke satt'}. Gi konkrete tips for å forbedre deling på sosiale medier.`
                  );
                }}
              />
            </div>
          </div>

          {/* SEO */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              SEO
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              <div data-metric="sidetittel">
              <MetricCard
                icon={Type}
                title="Sidetittel"
                description={result.seoResults.meta.title.content ? `${result.seoResults.meta.title.length} tegn` : 'Mangler'}
                value={result.seoResults.meta.title.content ?? '—'}
                recommendation={!result.seoResults.meta.title.content ? 'Legg til titletag' : result.seoResults.meta.title.isOptimal ? 'Optimal lengde' : '50–60 tegn anbefales'}
                status={!result.seoResults.meta.title.content ? 'bad' : result.seoResults.meta.title.isOptimal ? 'good' : 'warning'}
                onClick={() => fetchAISuggestion('Sidetittel', result.seoResults.meta.title.content ?? 'Mangler', result.seoResults.meta.title.isOptimal ? 'good' : result.seoResults.meta.title.content ? 'warning' : 'bad', result.seoResults.meta.title.content ? `Nåværende lengde: ${result.seoResults.meta.title.length} tegn.` : 'Mangler titletag.')}
              />
              </div>
              <div data-metric="meta-beskrivelse">
              <MetricCard
                icon={FileText}
                title="Meta-beskrivelse"
                description={result.seoResults.meta.description.content ? `${result.seoResults.meta.description.length} tegn` : 'Mangler'}
                value={result.seoResults.meta.description.content ? (result.seoResults.meta.description.content.length > 50 ? result.seoResults.meta.description.content.slice(0, 50) + '…' : result.seoResults.meta.description.content) : '—'}
                recommendation={!result.seoResults.meta.description.content ? 'Legg til meta description' : result.seoResults.meta.description.isOptimal ? 'Optimal lengde' : '150–160 tegn anbefales'}
                status={!result.seoResults.meta.description.content ? 'bad' : result.seoResults.meta.description.isOptimal ? 'good' : 'warning'}
                onClick={() => fetchAISuggestion('Meta-beskrivelse', result.seoResults.meta.description.content ?? 'Mangler', result.seoResults.meta.description.isOptimal ? 'good' : result.seoResults.meta.description.content ? 'warning' : 'bad', result.seoResults.meta.description.content ? `Nåværende lengde: ${result.seoResults.meta.description.length} tegn.` : 'Mangler meta description.')}
              />
              </div>
              <div data-metric="h1-overskrift">
              <MetricCard
                icon={Type}
                title="H1-overskrift"
                description={result.seoResults.headings.h1.count === 1 ? 'Én H1' : result.seoResults.headings.h1.count === 0 ? 'Mangler' : `${result.seoResults.headings.h1.count} H1-er funnet`}
                value={
                  result.seoResults.headings.h1.count === 0 
                    ? '—' 
                    : result.seoResults.headings.h1.count === 1
                      ? result.seoResults.headings.h1.contents[0]
                      : result.seoResults.headings.h1.contents.slice(0, 3).map((h1, i) => `${i + 1}. ${h1}`).join(' • ') + (result.seoResults.headings.h1.count > 3 ? ` (+${result.seoResults.headings.h1.count - 3} til)` : '')
                }
                recommendation={result.seoResults.headings.h1.count === 1 ? 'Bra' : result.seoResults.headings.h1.count === 0 ? 'Bruk én H1 på siden' : 'Bruk kun én H1'}
                status={result.seoResults.headings.h1.count === 1 ? 'good' : result.seoResults.headings.h1.count === 0 ? 'bad' : 'warning'}
                onClick={() => fetchAISuggestion(
                  'H1-overskrift',
                  result.seoResults.headings.h1.count > 1
                    ? result.seoResults.headings.h1.contents.map((h1, i) => `${i + 1}. "${h1}"`).join('\n')
                    : result.seoResults.headings.h1.contents[0] ?? 'Mangler',
                  result.seoResults.headings.h1.count === 1 ? 'good' : 'bad',
                  result.seoResults.headings.h1.count === 0 
                    ? 'Mangler H1-overskrift på siden.' 
                    : result.seoResults.headings.h1.count > 1 
                      ? `Siden har ${result.seoResults.headings.h1.count} H1-overskrifter. Det bør kun være én H1 per side for optimal SEO.`
                      : undefined
                )}
              />
              </div>
              <div data-metric="h2-overskrifter">
              <MetricCard
                icon={Type}
                title="H2-overskrifter"
                description={`${result.seoResults.headings.h2.count} stk`}
                value={result.seoResults.headings.h2.count > 0 ? result.seoResults.headings.h2.contents.slice(0, 2).join(', ') + (result.seoResults.headings.h2.count > 2 ? '…' : '') : '—'}
                recommendation={result.seoResults.headings.h2.count > 0 ? 'Bra struktur' : 'Legg til underoverskrifter'}
                status={result.seoResults.headings.h2.count > 0 ? 'good' : 'warning'}
                onClick={() => fetchAISuggestion('H2-overskrifter', `${result.seoResults.headings.h2.count} underoverskrifter`, result.seoResults.headings.h2.count > 0 ? 'good' : 'warning', result.seoResults.headings.h2.count === 0 ? 'Mangler H2-overskrifter.' : undefined)}
              />
              </div>
              <div data-metric="bilder-alt">
              <MetricCard
                icon={Image}
                title="Bilder og alt-tekst"
                description={`${result.seoResults.images.withAlt}/${result.seoResults.images.total} med alt`}
                value={result.seoResults.images.withoutAlt > 0 ? `${result.seoResults.images.withoutAlt} mangler alt` : 'Alle har alt-tekst'}
                recommendation={result.seoResults.images.withoutAlt === 0 ? 'Bra' : 'Legg til alt-tekst på bilder'}
                status={result.seoResults.images.withoutAlt === 0 ? 'good' : result.seoResults.images.withoutAlt > 3 ? 'bad' : 'warning'}
                onClick={() => fetchAISuggestion(
                  'Bilder og alt-tekst',
                  `${result.seoResults.images.withAlt} av ${result.seoResults.images.total} bilder har alt-tekst`,
                  result.seoResults.images.withoutAlt === 0 ? 'good' : 'warning',
                  result.seoResults.images.withoutAlt > 0 ? `${result.seoResults.images.withoutAlt} bilder mangler alt-tekst.` : undefined,
                  result.seoResults.images.missingAltImages
                )}
              />
              </div>
              <div data-metric="open-graph">
              <MetricCard
                icon={Globe}
                title="Open Graph"
                description={result.seoResults.meta.ogTags.title ? 'Satt' : 'Mangler'}
                value={result.seoResults.meta.ogTags.title ?? '—'}
                recommendation={result.seoResults.meta.ogTags.title && result.seoResults.meta.ogTags.description ? 'Bra for deling' : 'Legg til OG-tags for sosiale medier'}
                status={result.seoResults.meta.ogTags.title && result.seoResults.meta.ogTags.description ? 'good' : !result.seoResults.meta.ogTags.title ? 'bad' : 'warning'}
                onClick={() => fetchAISuggestion('Open Graph', result.seoResults.meta.ogTags.title ?? 'Mangler', result.seoResults.meta.ogTags.title ? 'good' : 'bad', !result.seoResults.meta.ogTags.title ? 'Mangler OG-tags for deling.' : undefined)}
              />
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              Innhold
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              <div data-metric="ordtelling">
              <MetricCard
                icon={FileText}
                title="Ordtelling"
                description={`${result.contentResults.wordCount} ord`}
                value={result.contentResults.wordCount >= 300 ? 'Tilstrekkelig innhold for SEO' : result.contentResults.wordCount >= 150 ? 'Noe innhold, men kan utvides' : 'Svært lite innhold'}
                recommendation={result.contentResults.wordCount >= 300 ? 'Bra' : 'Mer tekst'}
                status={result.contentResults.wordCount >= 300 ? 'good' : result.contentResults.wordCount >= 150 ? 'warning' : 'bad'}
                onClick={() => fetchAISuggestion('Ordtelling', `${result.contentResults.wordCount} ord`, result.contentResults.wordCount >= 300 ? 'good' : 'warning', result.contentResults.wordCount < 300 ? 'Under 300 ord kan begrense SEO-potensialet.' : undefined)}
              />
              </div>
              <div data-metric="lesbarhet">
              <MetricCard
                icon={BarChart3}
                title="Lesbarhet (LIX)"
                description={result.contentResults.readability ? `LIX ${result.contentResults.readability.lixScore}` : 'Ikke beregnet'}
                value={result.contentResults.readability?.lixLevel ?? 'Ikke nok tekst'}
                recommendation={
                  result.contentResults.readability
                    ? result.contentResults.readability.lixScore < 45
                      ? (result.contentResults.readability.lixScore < 30 ? 'Veldig enkel tekst' : 'God lesbarhet')
                      : result.contentResults.readability.lixScore < 55
                        ? 'Kan forenkles'
                        : 'Veldig vanskelig – forenkles'
                    : 'Mer tekst trengs'
                }
                status={
                  result.contentResults.readability
                    ? result.contentResults.readability.lixScore < 45
                      ? 'good'
                      : result.contentResults.readability.lixScore < 55
                        ? 'warning'
                        : 'bad'
                    : 'warning'
                }
                onClick={() => fetchAISuggestion(
                  'Lesbarhet (LIX)',
                  result.contentResults.readability
                    ? `LIX ${result.contentResults.readability.lixScore} – ${result.contentResults.readability.lixLevel}`
                    : 'Ikke beregnet',
                  result.contentResults.readability && result.contentResults.readability.lixScore < 45 ? 'good' : 'warning',
                  result.contentResults.readability 
                    ? `Gjennomsnittlig ${result.contentResults.readability.avgWordsPerSentence} ord per setning. Gjennomsnittlig ordlengde: ${result.contentResults.readability.avgWordLength} tegn.`
                    : 'Ikke nok tekst til å beregne lesbarhet.'
                )}
              />
              </div>
              <MetricCard
                icon={Link2}
                title="Interne lenker"
                description={`${result.seoResults.links.internal.count} lenker`}
                value={result.seoResults.links.internal.count > 0 ? `Lenker til ${result.seoResults.links.internal.count} andre sider` : 'Ingen interne lenker funnet'}
                recommendation={result.seoResults.links.internal.count >= 3 ? 'Bra' : 'Flere lenker'}
                status={result.seoResults.links.internal.count >= 3 ? 'good' : result.seoResults.links.internal.count > 0 ? 'warning' : 'bad'}
                onClick={() => fetchAISuggestion('Interne lenker', `${result.seoResults.links.internal.count} interne lenker`, result.seoResults.links.internal.count >= 3 ? 'good' : 'warning', result.seoResults.links.internal.count < 3 ? 'Flere interne lenker forbedrer navigasjon og SEO.' : undefined)}
              />
              <MetricCard
                icon={ExternalLink}
                title="Eksterne lenker"
                description={`${result.seoResults.links.external.count} lenker`}
                value={result.seoResults.links.external.count > 0 ? `Lenker til ${result.seoResults.links.external.count} eksterne kilder` : 'Ingen eksterne lenker'}
                recommendation={result.seoResults.links.external.count > 0 ? 'Bra' : 'Vurder kilder'}
                status={result.seoResults.links.external.count > 0 ? 'good' : 'warning'}
                onClick={() => fetchAISuggestion('Eksterne lenker', `${result.seoResults.links.external.count} eksterne lenker`, result.seoResults.links.external.count > 0 ? 'good' : 'warning', result.seoResults.links.external.count === 0 ? 'Eksterne lenker til troverdige kilder kan styrke innholdet.' : undefined)}
              />
            </div>
          </div>

          {/* Security */}
          <div data-metric="sikkerhet">
            <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              Sikkerhet
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              <MetricCard
                icon={Lock}
                title="SSL-sertifikat"
                description={`Karakter ${result.securityResults.ssl.grade} · Sikrer kryptert forbindelse`}
                value={result.securityResults.ssl.certificate.daysUntilExpiry != null ? `Utløper om ${result.securityResults.ssl.certificate.daysUntilExpiry} dager` : 'Kryptert forbindelse er aktiv'}
                recommendation={result.securityResults.ssl.grade === 'A' || result.securityResults.ssl.grade === 'A+' ? 'Utmerket' : 'Kan forbedres'}
                status={result.securityResults.ssl.grade === 'A' || result.securityResults.ssl.grade === 'A+' ? 'good' : result.securityResults.ssl.grade === 'B' || result.securityResults.ssl.grade === 'C' ? 'warning' : 'bad'}
                onClick={() => fetchAISuggestion('SSL-sertifikat', result.securityResults.ssl.grade, result.securityResults.ssl.grade === 'A' || result.securityResults.ssl.grade === 'A+' ? 'good' : 'warning', `Karakter: ${result.securityResults.ssl.grade}.`)}
              />
              <div data-metric="hsts">
              <MetricCard
                icon={Shield}
                title="HSTS"
                description="Sørger for at nettleseren alltid bruker sikker forbindelse"
                value={result.securityResults.headers.strictTransportSecurity ? 'Sikker forbindelse er påkrevd' : 'Anbefales for sikrere bruk'}
                recommendation={result.securityResults.headers.strictTransportSecurity ? 'Aktivert' : 'Aktiver'}
                status={result.securityResults.headers.strictTransportSecurity ? 'good' : 'warning'}
                onClick={() => fetchAISuggestion('HSTS', result.securityResults.headers.strictTransportSecurity ? 'Aktivert' : 'Mangler', result.securityResults.headers.strictTransportSecurity ? 'good' : 'warning', !result.securityResults.headers.strictTransportSecurity ? 'Mangler HSTS-header for sikrere HTTPS.' : undefined)}
              />
              </div>
              <div data-metric="csp">
              <MetricCard
                icon={Shield}
                title="Content Security Policy"
                description="Begrenser hva slags kode som kan kjøres på siden"
                value={result.securityResults.headers.contentSecurityPolicy ? 'Beskyttelse mot skadelig kode er aktiv' : 'Anbefales for å redusere risiko'}
                recommendation={result.securityResults.headers.contentSecurityPolicy ? 'Satt' : 'Anbefalt'}
                status={result.securityResults.headers.contentSecurityPolicy ? 'good' : 'warning'}
                onClick={() => fetchAISuggestion('Content Security Policy', result.securityResults.headers.contentSecurityPolicy ? 'Satt' : 'Mangler', result.securityResults.headers.contentSecurityPolicy ? 'good' : 'warning', !result.securityResults.headers.contentSecurityPolicy ? 'Mangler CSP-header for XSS-beskyttelse.' : undefined)}
              />
              </div>
              <MetricCard
                icon={Shield}
                title="X-Frame-Options"
                description="Forhindrer at andre sider viser din side i en ramme"
                value={result.securityResults.headers.xFrameOptions ? 'Andre sider kan ikke vise denne siden i ramme' : 'Anbefales for å unngå misbruk'}
                recommendation={result.securityResults.headers.xFrameOptions ? 'Satt' : 'Anbefalt'}
                status={result.securityResults.headers.xFrameOptions ? 'good' : 'warning'}
                onClick={() => fetchAISuggestion('X-Frame-Options', result.securityResults.headers.xFrameOptions ? 'Satt' : 'Mangler', result.securityResults.headers.xFrameOptions ? 'good' : 'warning', !result.securityResults.headers.xFrameOptions ? 'Mangler clickjacking-beskyttelse.' : undefined)}
              />
              <MetricCard
                icon={Shield}
                title="X-Content-Type-Options"
                description="Sørger for at filer tolkes som riktig type"
                value={result.securityResults.headers.xContentTypeOptions ? 'Filer behandles som angitt type' : 'Anbefales for sikrere oppførsel'}
                recommendation={result.securityResults.headers.xContentTypeOptions ? 'Satt' : 'Anbefalt'}
                status={result.securityResults.headers.xContentTypeOptions ? 'good' : 'warning'}
                onClick={() => fetchAISuggestion('X-Content-Type-Options', result.securityResults.headers.xContentTypeOptions ? 'nosniff' : 'Mangler', result.securityResults.headers.xContentTypeOptions ? 'good' : 'warning', !result.securityResults.headers.xContentTypeOptions ? 'Mangler nosniff-header.' : undefined)}
              />
              <MetricCard
                icon={Shield}
                title="Referrer-Policy"
                description="Styrer hva som sendes med når noen kommer fra din side"
                value={result.securityResults.headers.referrerPolicy ? 'Begrenser hva andre sider får vite' : 'Anbefales for mer kontroll'}
                recommendation={result.securityResults.headers.referrerPolicy ? 'Satt' : 'Anbefalt'}
                status={result.securityResults.headers.referrerPolicy ? 'good' : 'warning'}
                onClick={() => fetchAISuggestion('Referrer-Policy', result.securityResults.headers.referrerPolicy ? 'Satt' : 'Mangler', result.securityResults.headers.referrerPolicy ? 'good' : 'warning', !result.securityResults.headers.referrerPolicy ? 'Mangler Referrer-Policy header.' : undefined)}
              />
            </div>
          </div>

          {/* Performance / Core Web Vitals */}
          <div data-metric="ytelse">
            <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" />
              Ytelse (Core Web Vitals)
            </h4>
            <p className="text-[10px] sm:text-xs text-neutral-500 mb-3">
              Din nettside måles med full PageSpeed-analyse. Konkurrenter får et raskt ytelsesestimat (responstid + ressurser).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              <MetricCard
                icon={loadingPageSpeed ? Loader2 : Gauge}
                title={result.pageSpeedResults?.isEstimate ? 'Ytelsesestimat' : 'Performance (PageSpeed)'}
                description={
                  loadingPageSpeed ? 'Måler…' : result.pageSpeedResults ? `${result.pageSpeedResults.performance}/100` : 'Ikke målt'
                }
                value={
                  loadingPageSpeed
                    ? 'Måler hastighet…'
                    : result.pageSpeedResults
                    ? result.pageSpeedResults.performance >= 90
                      ? 'Utmerket ytelse'
                      : result.pageSpeedResults.performance >= 50
                        ? 'Trenger forbedring'
                        : 'Dårlig ytelse'
                    : 'Kjør ny analyse for å måle'
                }
                recommendation={
                  loadingPageSpeed ? 'Vent…' : result.pageSpeedResults
                    ? result.pageSpeedResults.performance >= 90 ? 'Utmerket' : result.pageSpeedResults.performance >= 50 ? 'Kan forbedres' : 'Kritisk'
                    : 'Ikke tilgjengelig'
                }
                status={
                  loadingPageSpeed ? 'warning' : result.pageSpeedResults
                    ? result.pageSpeedResults.performance >= 90 ? 'good' : result.pageSpeedResults.performance >= 50 ? 'warning' : 'bad'
                    : 'warning'
                }
                onClick={loadingPageSpeed ? undefined : () => fetchAISuggestion(
                  'Performance Score',
                  result.pageSpeedResults ? `${result.pageSpeedResults.performance}/100` : 'Ikke målt',
                  result.pageSpeedResults && result.pageSpeedResults.performance >= 90 ? 'good' : 'warning',
                  result.pageSpeedResults 
                    ? `Performance score på ${result.pageSpeedResults.performance}. Accessibility: ${result.pageSpeedResults.accessibility}, Best Practices: ${result.pageSpeedResults.bestPractices}.`
                    : 'PageSpeed-analyse ikke tilgjengelig.'
                )}
              />
              {!result.pageSpeedResults?.isEstimate && (
              <div data-metric="lcp">
              <MetricCard
                icon={Activity}
                title="LCP (Largest Contentful Paint)"
                description={result.pageSpeedResults?.coreWebVitals ? `${(result.pageSpeedResults.coreWebVitals.lcp / 1000).toFixed(1)}s` : 'Ikke målt'}
                value={
                  result.pageSpeedResults?.coreWebVitals
                    ? result.pageSpeedResults.coreWebVitals.lcp <= 2500
                      ? 'Bra – innhold lastes raskt'
                      : result.pageSpeedResults.coreWebVitals.lcp <= 4000
                        ? 'Moderat – kan forbedres'
                        : 'Tregt – innhold lastes sent'
                    : 'Ikke tilgjengelig'
                }
                recommendation={
                  result.pageSpeedResults?.coreWebVitals
                    ? result.pageSpeedResults.coreWebVitals.lcp <= 2500 ? 'Under 2.5s' : result.pageSpeedResults.coreWebVitals.lcp <= 4000 ? 'Under 4s anbefalt' : 'Må forbedres'
                    : 'Ikke tilgjengelig'
                }
                status={
                  result.pageSpeedResults?.coreWebVitals
                    ? result.pageSpeedResults.coreWebVitals.lcp <= 2500 ? 'good' : result.pageSpeedResults.coreWebVitals.lcp <= 4000 ? 'warning' : 'bad'
                    : 'warning'
                }
                onClick={() => fetchAISuggestion(
                  'LCP (Largest Contentful Paint)',
                  result.pageSpeedResults?.coreWebVitals ? `${(result.pageSpeedResults.coreWebVitals.lcp / 1000).toFixed(1)} sekunder` : 'Ikke målt',
                  result.pageSpeedResults?.coreWebVitals && result.pageSpeedResults.coreWebVitals.lcp <= 2500 ? 'good' : 'warning',
                  'LCP måler hvor lang tid det tar før det største synlige elementet lastes. Mål: under 2.5 sekunder.'
                )}
              />
              </div>
              )}
              {!result.pageSpeedResults?.isEstimate && (
              <div data-metric="cls">
              <MetricCard
                icon={Activity}
                title="CLS (Cumulative Layout Shift)"
                description={result.pageSpeedResults?.coreWebVitals ? result.pageSpeedResults.coreWebVitals.cls.toFixed(3) : 'Ikke målt'}
                value={
                  result.pageSpeedResults?.coreWebVitals
                    ? result.pageSpeedResults.coreWebVitals.cls <= 0.1
                      ? 'Stabilt layout – ingen hopping'
                      : result.pageSpeedResults.coreWebVitals.cls <= 0.25
                        ? 'Noe layoutforskyvning'
                        : 'Ustabilt – elementer hopper rundt'
                    : 'Ikke tilgjengelig'
                }
                recommendation={
                  result.pageSpeedResults?.coreWebVitals
                    ? result.pageSpeedResults.coreWebVitals.cls <= 0.1 ? 'Under 0.1' : result.pageSpeedResults.coreWebVitals.cls <= 0.25 ? 'Under 0.25 anbefalt' : 'Må forbedres'
                    : 'Ikke tilgjengelig'
                }
                status={
                  result.pageSpeedResults?.coreWebVitals
                    ? result.pageSpeedResults.coreWebVitals.cls <= 0.1 ? 'good' : result.pageSpeedResults.coreWebVitals.cls <= 0.25 ? 'warning' : 'bad'
                    : 'warning'
                }
                onClick={() => fetchAISuggestion(
                  'CLS (Cumulative Layout Shift)',
                  result.pageSpeedResults?.coreWebVitals ? result.pageSpeedResults.coreWebVitals.cls.toFixed(3) : 'Ikke målt',
                  result.pageSpeedResults?.coreWebVitals && result.pageSpeedResults.coreWebVitals.cls <= 0.1 ? 'good' : 'warning',
                  'CLS måler visuell stabilitet – hvor mye elementer flytter seg under lasting. Mål: under 0.1.'
                )}
              />
              </div>
              )}
            </div>
          </div>

          {/* AI visibility (Premium) - only show if feature is enabled */}
          {AI_VISIBILITY_ENABLED && isPremium && result.aiVisibility != null && (
            <div>
              <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Eye className="w-3.5 h-3.5" />
                AI-synlighet
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                <MetricCard
                  icon={Eye}
                  title="AI-synlighet"
                  description={result.aiVisibility.description}
                  value={`${result.aiVisibility.score}/100`}
                  recommendation={result.aiVisibility.level === 'high' ? 'God synlighet' : result.aiVisibility.level === 'medium' ? 'Moderat' : 'Kan forbedres'}
                  status={result.aiVisibility.level === 'high' ? 'good' : result.aiVisibility.level === 'medium' ? 'warning' : 'bad'}
                  onClick={() => fetchAISuggestion('AI-synlighet', `${result.aiVisibility!.score}/100`, result.aiVisibility!.level === 'high' ? 'good' : 'warning', result.aiVisibility!.description)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade CTA - only for non-premium users */}
      {!isPremium && (
        <div className="rounded-2xl bg-neutral-900 p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 text-center sm:text-left">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm sm:text-base">Få mer ut av analyseverktøyet</h3>
              <p className="text-xs sm:text-sm text-neutral-400">Ubegrenset analyser, 30 AI-artikler og mye mer med Premium.</p>
            </div>
          </div>
          <Button className="bg-white text-neutral-900 hover:bg-neutral-100 w-full sm:w-auto" asChild>
            <a href="/#priser">
              Oppgrader til Premium
              <ChevronRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      )}
    </>
  );
}
