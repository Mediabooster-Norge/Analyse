'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScoreRing, SummaryCard, MetricCard } from '@/components/features/dashboard';
import type { DashboardAnalysisResult, ArticleSuggestion } from '@/types/dashboard';
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
  setUrl: (url: string) => void;
  setDialogOpen: (open: boolean) => void;
  fetchAISuggestion: (
    element: string,
    currentValue: string,
    status: 'good' | 'warning' | 'bad',
    issue?: string
  ) => void;
  setActiveTab: (tab: 'overview' | 'competitors' | 'keywords' | 'ai' | 'ai-visibility') => void;
  articleSuggestions: ArticleSuggestion[] | null;
  loadingArticleSuggestions: boolean;
  articleSuggestionsSavedAt: string | null;
  fetchArticleSuggestions: (withCompetitors: boolean) => void;
  hasCompetitors: boolean;
  remainingArticleGenerations: number;
  articleGenerationsLimit: number;
  generatedArticle: string | null;
  generatingArticleIndex: number | null;
  fetchGenerateArticle: (suggestion: { title: string; rationale?: string }, index: number) => void;
  setGeneratedArticle: (article: string | null) => void;
}

export function OverviewTab({
  result,
  isPremium,
  url,
  setUrl,
  setDialogOpen,
  fetchAISuggestion,
  setActiveTab,
  articleSuggestions,
  loadingArticleSuggestions,
  articleSuggestionsSavedAt,
  fetchArticleSuggestions,
  hasCompetitors,
  remainingArticleGenerations,
  articleGenerationsLimit,
  generatedArticle,
  generatingArticleIndex,
  fetchGenerateArticle,
  setGeneratedArticle,
}: OverviewTabProps) {
  const copyTitle = (title: string) => {
    navigator.clipboard.writeText(title).then(
      () => toast.success('Tittel kopiert'),
      () => toast.error('Kunne ikke kopiere')
    );
  };
  const copyArticle = () => {
    if (!generatedArticle) return;
    navigator.clipboard.writeText(generatedArticle).then(
      () => toast.success('Artikkel kopiert'),
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
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 max-[400px]:gap-1 min-[401px]:gap-2 sm:gap-4 max-[400px]:scale-[0.85] max-[400px]:origin-center">
              <div className="text-center min-w-0">
                <ScoreRing score={result.overallScore} label="Totalt" size="md" showStatus />
                <p className="text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs text-neutral-500 mt-0.5 sm:mt-1">Samlet</p>
              </div>
              <div className="text-center min-w-0">
                <ScoreRing score={result.seoResults.score} label="SEO" size="md" showStatus />
                <p className="text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs text-neutral-500 mt-0.5 sm:mt-1">Søkemotor</p>
              </div>
              <div className="text-center min-w-0">
                <ScoreRing score={result.contentResults.score} label="Innhold" size="md" showStatus />
                <p className="text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs text-neutral-500 mt-0.5 sm:mt-1">Tekst</p>
              </div>
              <div className="text-center min-w-0">
                <ScoreRing score={result.securityResults.score} label="Sikkerhet" size="md" showStatus />
                <p className="text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs text-neutral-500 mt-0.5 sm:mt-1">Trygghet</p>
              </div>
              <div className="text-center min-w-0">
                {AI_VISIBILITY_ENABLED ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 max-[400px]:w-10 max-[400px]:h-10 min-[401px]:w-14 min-[401px]:h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-gradient-to-br from-violet-50 to-blue-50 border-2 max-[400px]:border-2 min-[401px]:border-4 border-violet-100 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 max-[400px]:w-4 max-[400px]:h-4 min-[401px]:w-5 sm:w-6 sm:h-6 text-violet-400" />
                    </div>
                    <p className="text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs text-neutral-500 mt-0.5 sm:mt-1">AI-synlighet</p>
                    <span className="inline-flex items-center gap-0.5 mt-0.5 max-[400px]:text-[9px] min-[401px]:text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 font-medium text-violet-600">
                      Kommer snart
                    </span>
                  </>
                )}
              </div>
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
          if (result.seoResults.headings.h2.count === 0) issues.push({ label: 'H2-overskrifter', desc: 'Mangler underoverskrifter', priority: 'low', category: 'content' });
          if (result.seoResults.images.withoutAlt > 0) issues.push({ label: 'Bilder', desc: `${result.seoResults.images.withoutAlt} mangler alt-tekst`, priority: 'low', category: 'seo' });
          if (result.securityResults.score < 60) issues.push({ label: 'Sikkerhet', desc: 'Lav sikkerhetsscore', priority: 'medium', category: 'security' });
          if (!result.securityResults.headers.strictTransportSecurity) issues.push({ label: 'HSTS', desc: 'Mangler HSTS-header', priority: 'medium', category: 'security' });
          if (!result.securityResults.headers.contentSecurityPolicy) issues.push({ label: 'CSP', desc: 'Mangler Content Security Policy', priority: 'low', category: 'security' });
          // Only show AI visibility issues if feature is enabled
          if (AI_VISIBILITY_ENABLED && result.aiVisibility && result.aiVisibility.score < 50) issues.push({ label: 'AI-synlighet', desc: 'Lav AI-synlighet', priority: 'medium', category: 'ai' });

          return issues.length > 0 ? (
            <div className="rounded-2xl max-[400px]:rounded-xl border border-neutral-200 bg-white p-2 max-[400px]:p-2 min-[401px]:p-3 sm:p-5 flex flex-col h-full min-w-0">
              <div className="flex items-center justify-between mb-2 max-[400px]:mb-2">
                <h3 className="font-semibold text-neutral-900 flex items-center gap-1.5 max-[400px]:gap-1.5 text-xs max-[400px]:text-xs min-[401px]:text-sm">
                  <TrendingUp className="h-3.5 w-3.5 max-[400px]:h-3 max-[400px]:w-3 text-amber-500" />
                  Forbedringer
                </h3>
                <span className="text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs text-neutral-400">{issues.length} funn</span>
              </div>
              <div className="space-y-1 overflow-y-auto max-h-[180px] max-[400px]:max-h-[140px] min-[401px]:max-h-[200px] sm:max-h-[220px] pr-1 flex-1 custom-scrollbar">
                {issues.map((issue, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const element = document.querySelector('[data-section="detailed-metrics"]');
                      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="w-full flex items-center gap-1.5 max-[400px]:gap-1 min-[401px]:gap-2 p-1.5 max-[400px]:p-1.5 min-[401px]:p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer text-left group"
                  >
                    <div className={`w-1.5 h-1.5 max-[400px]:w-1 max-[400px]:h-1 min-[401px]:w-1.5 min-[401px]:h-1.5 rounded-full shrink-0 ${issue.priority === 'high' ? 'bg-red-500' : issue.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs text-neutral-900">{issue.label}</span>
                      <span className="text-neutral-400 mx-0.5 max-[400px]:mx-0.5">·</span>
                      <span className="text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs text-neutral-500 truncate">{issue.desc}</span>
                    </div>
                    <ChevronRight className="w-2.5 h-2.5 max-[400px]:w-2 max-[400px]:h-2 min-[401px]:w-3 min-[401px]:h-3 text-neutral-400 group-hover:text-neutral-600 shrink-0 transition-colors" />
                  </button>
                ))}
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
          {/* SEO */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              SEO
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              <MetricCard
                icon={Type}
                title="Sidetittel"
                description={result.seoResults.meta.title.content ? `${result.seoResults.meta.title.length} tegn` : 'Mangler'}
                value={result.seoResults.meta.title.content ?? '—'}
                recommendation={!result.seoResults.meta.title.content ? 'Legg til titletag' : result.seoResults.meta.title.isOptimal ? 'Optimal lengde' : '50–60 tegn anbefales'}
                status={!result.seoResults.meta.title.content ? 'bad' : result.seoResults.meta.title.isOptimal ? 'good' : 'warning'}
                onClick={() => fetchAISuggestion('Sidetittel', result.seoResults.meta.title.content ?? 'Mangler', result.seoResults.meta.title.isOptimal ? 'good' : result.seoResults.meta.title.content ? 'warning' : 'bad', result.seoResults.meta.title.content ? `Nåværende lengde: ${result.seoResults.meta.title.length} tegn.` : 'Mangler titletag.')}
              />
              <MetricCard
                icon={FileText}
                title="Meta-beskrivelse"
                description={result.seoResults.meta.description.content ? `${result.seoResults.meta.description.length} tegn` : 'Mangler'}
                value={result.seoResults.meta.description.content ? (result.seoResults.meta.description.content.length > 50 ? result.seoResults.meta.description.content.slice(0, 50) + '…' : result.seoResults.meta.description.content) : '—'}
                recommendation={!result.seoResults.meta.description.content ? 'Legg til meta description' : result.seoResults.meta.description.isOptimal ? 'Optimal lengde' : '150–160 tegn anbefales'}
                status={!result.seoResults.meta.description.content ? 'bad' : result.seoResults.meta.description.isOptimal ? 'good' : 'warning'}
                onClick={() => fetchAISuggestion('Meta-beskrivelse', result.seoResults.meta.description.content ?? 'Mangler', result.seoResults.meta.description.isOptimal ? 'good' : result.seoResults.meta.description.content ? 'warning' : 'bad', result.seoResults.meta.description.content ? `Nåværende lengde: ${result.seoResults.meta.description.length} tegn.` : 'Mangler meta description.')}
              />
              <MetricCard
                icon={Type}
                title="H1-overskrift"
                description={result.seoResults.headings.h1.count === 1 ? 'Én H1' : result.seoResults.headings.h1.count === 0 ? 'Mangler' : 'Flere H1'}
                value={result.seoResults.headings.h1.contents[0] ?? (result.seoResults.headings.h1.count > 1 ? `${result.seoResults.headings.h1.count} H1-er` : '—')}
                recommendation={result.seoResults.headings.h1.count === 1 ? 'Bra' : result.seoResults.headings.h1.count === 0 ? 'Bruk én H1 på siden' : 'Bruk kun én H1'}
                status={result.seoResults.headings.h1.count === 1 ? 'good' : result.seoResults.headings.h1.count === 0 ? 'bad' : 'warning'}
                onClick={() => fetchAISuggestion('H1-overskrift', result.seoResults.headings.h1.contents[0] ?? 'Mangler', result.seoResults.headings.h1.count === 1 ? 'good' : 'bad', result.seoResults.headings.h1.count === 0 ? 'Mangler H1.' : result.seoResults.headings.h1.count > 1 ? 'Flere H1-er funnet.' : undefined)}
              />
              <MetricCard
                icon={Type}
                title="H2-overskrifter"
                description={`${result.seoResults.headings.h2.count} stk`}
                value={result.seoResults.headings.h2.count > 0 ? result.seoResults.headings.h2.contents.slice(0, 2).join(', ') + (result.seoResults.headings.h2.count > 2 ? '…' : '') : '—'}
                recommendation={result.seoResults.headings.h2.count > 0 ? 'Bra struktur' : 'Legg til underoverskrifter'}
                status={result.seoResults.headings.h2.count > 0 ? 'good' : 'warning'}
                onClick={() => fetchAISuggestion('H2-overskrifter', `${result.seoResults.headings.h2.count} underoverskrifter`, result.seoResults.headings.h2.count > 0 ? 'good' : 'warning', result.seoResults.headings.h2.count === 0 ? 'Mangler H2-overskrifter.' : undefined)}
              />
              <MetricCard
                icon={Image}
                title="Bilder og alt-tekst"
                description={`${result.seoResults.images.withAlt}/${result.seoResults.images.total} med alt`}
                value={result.seoResults.images.withoutAlt > 0 ? `${result.seoResults.images.withoutAlt} mangler alt` : 'Alle har alt-tekst'}
                recommendation={result.seoResults.images.withoutAlt === 0 ? 'Bra' : 'Legg til alt-tekst på bilder'}
                status={result.seoResults.images.withoutAlt === 0 ? 'good' : result.seoResults.images.withoutAlt > 3 ? 'bad' : 'warning'}
                onClick={() => fetchAISuggestion('Bilder og alt-tekst', `${result.seoResults.images.withAlt} av ${result.seoResults.images.total} bilder har alt-tekst`, result.seoResults.images.withoutAlt === 0 ? 'good' : 'warning', result.seoResults.images.withoutAlt > 0 ? `${result.seoResults.images.withoutAlt} bilder mangler alt-tekst.` : undefined)}
              />
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

          {/* Content */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              Innhold
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              <MetricCard
                icon={FileText}
                title="Ordtelling"
                description={`${result.contentResults.wordCount} ord`}
                value={result.contentResults.wordCount >= 300 ? 'Tilstrekkelig innhold for SEO' : result.contentResults.wordCount >= 150 ? 'Noe innhold, men kan utvides' : 'Svært lite innhold'}
                recommendation={result.contentResults.wordCount >= 300 ? 'Bra' : 'Mer tekst'}
                status={result.contentResults.wordCount >= 300 ? 'good' : result.contentResults.wordCount >= 150 ? 'warning' : 'bad'}
                onClick={() => fetchAISuggestion('Ordtelling', `${result.contentResults.wordCount} ord`, result.contentResults.wordCount >= 300 ? 'good' : 'warning', result.contentResults.wordCount < 300 ? 'Under 300 ord kan begrense SEO-potensialet.' : undefined)}
              />
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
          <div>
            <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              Sikkerhet
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              <MetricCard
                icon={Lock}
                title="SSL-sertifikat"
                description={`Karakter: ${result.securityResults.ssl.grade}`}
                value={result.securityResults.ssl.certificate.daysUntilExpiry != null ? `Utløper om ${result.securityResults.ssl.certificate.daysUntilExpiry} dager` : 'SSL-sertifikat er gyldig'}
                recommendation={result.securityResults.ssl.grade === 'A' || result.securityResults.ssl.grade === 'A+' ? 'Utmerket' : 'Kan forbedres'}
                status={result.securityResults.ssl.grade === 'A' || result.securityResults.ssl.grade === 'A+' ? 'good' : result.securityResults.ssl.grade === 'B' || result.securityResults.ssl.grade === 'C' ? 'warning' : 'bad'}
                onClick={() => fetchAISuggestion('SSL-sertifikat', result.securityResults.ssl.grade, result.securityResults.ssl.grade === 'A' || result.securityResults.ssl.grade === 'A+' ? 'good' : 'warning', `Karakter: ${result.securityResults.ssl.grade}.`)}
              />
              <MetricCard
                icon={Shield}
                title="HSTS"
                description="Strict-Transport-Security"
                value={result.securityResults.headers.strictTransportSecurity ? 'Header er satt og aktiv' : 'Header mangler - HTTPS ikke tvunget'}
                recommendation={result.securityResults.headers.strictTransportSecurity ? 'Aktivert' : 'Aktiver'}
                status={result.securityResults.headers.strictTransportSecurity ? 'good' : 'warning'}
                onClick={() => fetchAISuggestion('HSTS', result.securityResults.headers.strictTransportSecurity ? 'Aktivert' : 'Mangler', result.securityResults.headers.strictTransportSecurity ? 'good' : 'warning', !result.securityResults.headers.strictTransportSecurity ? 'Mangler HSTS-header for sikrere HTTPS.' : undefined)}
              />
              <MetricCard
                icon={Shield}
                title="Content Security Policy"
                description="CSP-header"
                value={result.securityResults.headers.contentSecurityPolicy ? 'CSP er konfigurert' : 'Mangler CSP - sårbar for XSS'}
                recommendation={result.securityResults.headers.contentSecurityPolicy ? 'Satt' : 'Anbefalt'}
                status={result.securityResults.headers.contentSecurityPolicy ? 'good' : 'warning'}
                onClick={() => fetchAISuggestion('Content Security Policy', result.securityResults.headers.contentSecurityPolicy ? 'Satt' : 'Mangler', result.securityResults.headers.contentSecurityPolicy ? 'good' : 'warning', !result.securityResults.headers.contentSecurityPolicy ? 'Mangler CSP-header for XSS-beskyttelse.' : undefined)}
              />
              <MetricCard
                icon={Shield}
                title="X-Frame-Options"
                description="Clickjacking-beskyttelse"
                value={result.securityResults.headers.xFrameOptions ? 'Beskyttet mot iframe-embedding' : 'Siden kan embeddes i iframe'}
                recommendation={result.securityResults.headers.xFrameOptions ? 'Satt' : 'Anbefalt'}
                status={result.securityResults.headers.xFrameOptions ? 'good' : 'warning'}
                onClick={() => fetchAISuggestion('X-Frame-Options', result.securityResults.headers.xFrameOptions ? 'Satt' : 'Mangler', result.securityResults.headers.xFrameOptions ? 'good' : 'warning', !result.securityResults.headers.xFrameOptions ? 'Mangler clickjacking-beskyttelse.' : undefined)}
              />
              <MetricCard
                icon={Shield}
                title="X-Content-Type-Options"
                description="MIME-sniffing"
                value={result.securityResults.headers.xContentTypeOptions ? 'Forhindrer MIME-sniffing' : 'Nettleseren kan gjette filtyper'}
                recommendation={result.securityResults.headers.xContentTypeOptions ? 'Satt' : 'Anbefalt'}
                status={result.securityResults.headers.xContentTypeOptions ? 'good' : 'warning'}
                onClick={() => fetchAISuggestion('X-Content-Type-Options', result.securityResults.headers.xContentTypeOptions ? 'nosniff' : 'Mangler', result.securityResults.headers.xContentTypeOptions ? 'good' : 'warning', !result.securityResults.headers.xContentTypeOptions ? 'Mangler nosniff-header.' : undefined)}
              />
              <MetricCard
                icon={Shield}
                title="Referrer-Policy"
                description="Sporingskontroll"
                value={result.securityResults.headers.referrerPolicy ? 'Kontrollerer referrer-informasjon' : 'Sender full referrer til alle'}
                recommendation={result.securityResults.headers.referrerPolicy ? 'Satt' : 'Anbefalt'}
                status={result.securityResults.headers.referrerPolicy ? 'good' : 'warning'}
                onClick={() => fetchAISuggestion('Referrer-Policy', result.securityResults.headers.referrerPolicy ? 'Satt' : 'Mangler', result.securityResults.headers.referrerPolicy ? 'good' : 'warning', !result.securityResults.headers.referrerPolicy ? 'Mangler Referrer-Policy header.' : undefined)}
              />
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

      {/* Analyser en annen side - Premium */}
      {isPremium && (() => {
        const internalUrls = result.seoResults.links.internal?.urls ?? [];
        let currentPath = '/';
        let baseUrl = url;
        try { 
          const parsed = new URL(url);
          currentPath = parsed.pathname || '/'; 
          baseUrl = parsed.origin;
        } catch { /* ignore */ }
        const suggested = internalUrls.filter((p): p is string => !!p && p !== currentPath);
        
        return (
          <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-neutral-100">
              <h3 className="font-medium text-neutral-900 flex items-center gap-2 text-sm">
                <Link2 className="h-4 w-4 text-neutral-500" />
                Analyser en annen side
              </h3>
            </div>
            <div className="p-3 sm:p-4 space-y-3">
              {/* Custom URL input */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder={`${baseUrl}/din-side`}
                    className="w-full h-9 pl-10 pr-4 rounded-lg border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.currentTarget.value.trim();
                        if (input) {
                          const fullUrl = input.startsWith('http') ? input : `${baseUrl}${input.startsWith('/') ? '' : '/'}${input}`;
                          setUrl(fullUrl);
                          setDialogOpen(true);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                </div>
                <Button 
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 rounded-lg w-full sm:w-auto"
                  onClick={(e) => {
                    const input = (e.currentTarget.previousElementSibling?.querySelector('input') as HTMLInputElement)?.value.trim();
                    if (input) {
                      const fullUrl = input.startsWith('http') ? input : `${baseUrl}${input.startsWith('/') ? '' : '/'}${input}`;
                      setUrl(fullUrl);
                      setDialogOpen(true);
                    }
                  }}
                >
                  Analyser
                </Button>
              </div>

              {/* Suggested pages */}
              {suggested.length > 0 && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-neutral-100" />
                    <span className="text-[10px] text-neutral-400">eller velg fra {suggested.length} funnet</span>
                    <div className="h-px flex-1 bg-neutral-100" />
                  </div>
                  <div className="grid grid-cols-1 min-[401px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5">
                    {suggested.slice(0, 10).map((pathname) => {
                      // Handle both relative paths and full URLs
                      let fullUrl = '';
                      let label = pathname;
                      try {
                        if (pathname.startsWith('http://') || pathname.startsWith('https://')) {
                          // Already a full URL
                          fullUrl = pathname;
                          const parsedUrl = new URL(pathname);
                          label = parsedUrl.pathname === '/' ? 'Forside' : parsedUrl.pathname.replace(/^\//, '').replace(/-/g, ' ') || parsedUrl.hostname;
                        } else {
                          // Relative path - construct full URL
                          fullUrl = `${baseUrl}${pathname.startsWith('/') ? '' : '/'}${pathname}`;
                          label = pathname === '/' ? 'Forside' : pathname.replace(/^\//, '').replace(/-/g, ' ') || pathname;
                        }
                      } catch {
                        // Fallback: just use baseUrl + pathname
                        fullUrl = `${baseUrl}${pathname.startsWith('/') ? '' : '/'}${pathname}`;
                        label = pathname.replace(/^\//, '').replace(/-/g, ' ') || pathname;
                      }
                      
                      return (
                        <button
                          key={pathname}
                          type="button"
                          onClick={() => { setUrl(fullUrl); setDialogOpen(true); }}
                          className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-neutral-50 hover:bg-neutral-100 border border-transparent hover:border-neutral-200 transition-all text-left group cursor-pointer"
                          title={fullUrl}
                        >
                          <span className="text-xs text-neutral-600 truncate flex-1 group-hover:text-neutral-900">{label}</span>
                          <ChevronRight className="w-3 h-3 text-neutral-400 group-hover:text-neutral-600 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                  {suggested.length > 10 && (
                    <p className="text-[10px] text-neutral-400 text-center">+{suggested.length - 10} flere</p>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* Forslag til artikler – under Analyser en annen side */}
      {result && (
        <div className="rounded-2xl max-[400px]:rounded-xl border border-neutral-200 bg-white overflow-hidden min-w-0 mt-4 max-[400px]:mt-4 min-[401px]:mt-6">
          <div className="p-2 max-[400px]:p-2 min-[401px]:p-3 sm:p-6 border-b border-neutral-100">
            <h3 className="inline-flex items-center gap-1.5 max-[400px]:gap-1.5 px-2 max-[400px]:px-2 min-[401px]:px-3 py-1 max-[400px]:py-1 min-[401px]:py-1.5 rounded-full bg-neutral-100 text-neutral-900 text-[11px] max-[400px]:text-[10px] min-[401px]:text-xs sm:text-sm font-medium mb-1 max-[400px]:mb-1 min-[401px]:mb-2 sm:mb-3">
              <FileText className="h-3.5 w-3.5 max-[400px]:h-3 max-[400px]:w-3 text-neutral-600" />
              Forslag til artikler
            </h3>
            <p className="text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs sm:text-sm text-neutral-600">
              Få AI-forslag til artikkelideer. Du kan generere full artikkel fra et forslag.{' '}
              {isPremium ? (
                <>Du har <strong>{articleGenerationsLimit}</strong> artikkelgenereringer per måned.</>
              ) : (
                <>Gratis: <strong>1/mnd</strong>. Premium: 30/mnd.</>
              )}{' '}
              Nå: {remainingArticleGenerations}/{articleGenerationsLimit} igjen denne måneden. Genererte artikler finner du under{' '}
              <a href="/dashboard/articles" className="text-neutral-900 font-medium underline hover:no-underline">
                Mine artikler
              </a>{' '}
              i menyen.
            </p>
          </div>
          <div className="p-2 max-[400px]:p-2 min-[401px]:p-3 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={() => fetchArticleSuggestions(false)}
                disabled={loadingArticleSuggestions}
                className="rounded-lg text-xs bg-neutral-900 hover:bg-neutral-800"
              >
                {loadingArticleSuggestions ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Genererer...
                  </>
                ) : (
                  <>
                    <Lightbulb className="h-3.5 w-3.5 mr-1.5" />
                    {articleSuggestions && articleSuggestions.length > 0 ? 'Generer nye forslag' : 'Generer generelle forslag'}
                  </>
                )}
              </Button>
              {hasCompetitors && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fetchArticleSuggestions(true)}
                  disabled={loadingArticleSuggestions}
                  className="rounded-lg text-xs"
                >
                  <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                  {articleSuggestions && articleSuggestions.length > 0 ? 'Generer nye (med konkurrenter)' : 'Generer forslag (sammenlignet med konkurrenter)'}
                </Button>
              )}
            </div>

            {loadingArticleSuggestions && (
              <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400 mb-3" />
                <p className="text-sm text-neutral-600 font-medium mb-1">Genererer artikkelforslag</p>
                <p className="text-xs text-neutral-500 min-h-[1rem] transition-opacity duration-300">
                  {SUGGESTION_MESSAGES[suggestionMessageIndex]}
                </p>
              </div>
            )}

            {!loadingArticleSuggestions && articleSuggestions && articleSuggestions.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    {articleSuggestions.length} artikkelideer – tittel og begrunnelse
                  </p>
                  {articleSuggestionsSavedAt && (
                    <p className="text-[10px] text-neutral-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Generert {new Date(articleSuggestionsSavedAt).toLocaleDateString('nb-NO', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {articleSuggestions.map((s, i) => (
                    <li
                      key={i}
                      className="rounded-xl border border-neutral-200 bg-white overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-xs font-semibold text-neutral-600">
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-neutral-900">{s.title}</p>
                            {s.priority && (
                              <span
                                className={`mt-1.5 inline-block text-[10px] px-2 py-0.5 rounded font-medium ${
                                  s.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                                  s.priority === 'medium' ? 'bg-neutral-200 text-neutral-700' :
                                  'bg-neutral-100 text-neutral-600'
                                }`}
                              >
                                {s.priority === 'high' ? 'høy' : s.priority === 'medium' ? 'medium' : 'lav'}
                              </span>
                            )}
                            <div className="mt-3 pt-3 border-t border-neutral-100">
                              <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide mb-1">
                                Begrunnelse
                              </p>
                              <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
                                {s.rationale}
                              </p>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => fetchGenerateArticle(s, i)}
                                disabled={remainingArticleGenerations <= 0 || generatingArticleIndex !== null}
                                className="rounded-lg text-xs"
                              >
                                {generatingArticleIndex === i ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                    Genererer...
                                  </>
                                ) : (
                                  <>
                                    <PenLine className="h-3.5 w-3.5 mr-1.5" />
                                    Generer artikkel
                                  </>
                                )}
                              </Button>
                              <button
                                type="button"
                                onClick={() => copyTitle(s.title)}
                                className="shrink-0 p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors"
                                title="Kopier tittel"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!loadingArticleSuggestions && articleSuggestions && articleSuggestions.length === 0 && (
              <p className="text-xs text-neutral-500 py-4">Ingen forslag ble generert. Prøv igjen.</p>
            )}
          </div>
        </div>
      )}

      {/* Popup: genererer artikkel */}
      <Dialog open={generatingArticleIndex !== null} onOpenChange={() => {}}>
        <DialogContent
          showCloseButton={false}
          className="max-w-sm"
        >
          <DialogTitle className="sr-only">Genererer artikkel</DialogTitle>
          <div className="flex flex-col items-center text-center py-2">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-600" />
            </div>
            <h3 className="font-semibold text-neutral-900 text-sm mb-1">Genererer artikkel</h3>
            {articleSuggestions && generatingArticleIndex !== null && articleSuggestions[generatingArticleIndex] && (
              <p className="text-xs text-neutral-600 mb-2 line-clamp-2">
                {articleSuggestions[generatingArticleIndex].title}
              </p>
            )}
            <p className="text-xs text-neutral-500 min-h-[1.25rem] transition-opacity duration-300">
              {GENERATING_ARTICLE_MESSAGES[generatingMessageIndex]}
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">
              Vanligvis 10–30 sekunder
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: generert artikkel */}
      <Dialog open={!!generatedArticle} onOpenChange={(open) => !open && setGeneratedArticle(null)}>
        <DialogContent
          showCloseButton
          className="sm:max-w-5xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden"
        >
          <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b border-neutral-100">
            <DialogTitle className="text-lg font-semibold">Generert artikkel</DialogTitle>
            <div className="flex gap-2 mt-3">
              <Button type="button" variant="outline" size="sm" onClick={copyArticle} className="rounded-lg text-xs">
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Kopier artikkel
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
            <article className="prose prose-neutral prose-sm sm:prose-base max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-0 mb-4">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 mt-6 mb-3">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base sm:text-lg font-semibold text-neutral-800 mt-4 mb-2">{children}</h3>,
                  p: ({ children }) => <p className="text-neutral-700 leading-relaxed mb-3">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-6 mb-3 space-y-1 text-neutral-700">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-6 mb-3 space-y-1 text-neutral-700">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-neutral-900">{children}</strong>,
                }}
              >
                {generatedArticle ?? ''}
              </ReactMarkdown>
            </article>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact CTA */}
      <div className="rounded-2xl bg-neutral-900 p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 text-center sm:text-left">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm sm:text-base">Trenger du hjelp med nettsiden?</h3>
            <p className="text-xs sm:text-sm text-neutral-400">Vi hjelper deg med alt fra strategi til implementering.</p>
          </div>
        </div>
        <Button className="bg-white text-neutral-900 hover:bg-neutral-100 w-full sm:w-auto" asChild>
          <a href="https://mediabooster.no/kontakt" target="_blank" rel="noopener noreferrer">
            Kontakt Mediabooster
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    </>
  );
}
