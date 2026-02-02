'use client';

import { Button } from '@/components/ui/button';
import { ScoreRing, SummaryCard, MetricCard } from '@/components/features/dashboard';
import type { DashboardAnalysisResult } from '@/types/dashboard';
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
} from 'lucide-react';

// Feature flag: Set to true when AI visibility is ready
const AI_VISIBILITY_ENABLED = false;

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
}

export function OverviewTab({
  result,
  isPremium,
  url,
  setUrl,
  setDialogOpen,
  fetchAISuggestion,
  setActiveTab,
}: OverviewTabProps) {
  return (
    <>
      <SummaryCard score={result.overallScore} />

      {/* Score Grid + Priority Improvements - Side by side */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Score Grid Section - Takes 2 columns */}
        <div className="lg:col-span-2 rounded-2xl border border-neutral-200 bg-white overflow-hidden">
          <div className="p-5 border-b border-neutral-100">
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
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <ScoreRing score={result.overallScore} label="Totalt" size="md" showStatus />
                <p className="text-xs text-neutral-500 mt-1">Samlet</p>
              </div>
              <div className="text-center">
                <ScoreRing score={result.seoResults.score} label="SEO" size="md" showStatus />
                <p className="text-xs text-neutral-500 mt-1">Søkemotor</p>
              </div>
              <div className="text-center">
                <ScoreRing score={result.contentResults.score} label="Innhold" size="md" showStatus />
                <p className="text-xs text-neutral-500 mt-1">Tekst</p>
              </div>
              <div className="text-center">
                <ScoreRing score={result.securityResults.score} label="Sikkerhet" size="md" showStatus />
                <p className="text-xs text-neutral-500 mt-1">Trygghet</p>
              </div>
              <div className="text-center">
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
                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-violet-50 to-blue-50 border-4 border-violet-100 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-violet-400" />
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">AI-synlighet</p>
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-violet-50 text-[10px] font-medium text-violet-600">
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
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 flex flex-col h-full">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-neutral-900 flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                  Forbedringer
                </h3>
                <span className="text-xs text-neutral-400">{issues.length} funn</span>
              </div>
              <div className="space-y-1.5 overflow-y-auto max-h-[220px] pr-1 flex-1 custom-scrollbar">
                {issues.map((issue, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const element = document.querySelector('[data-section="detailed-metrics"]');
                      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer text-left group"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${issue.priority === 'high' ? 'bg-red-500' : issue.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-xs text-neutral-900">{issue.label}</span>
                      <span className="text-neutral-400 mx-1">·</span>
                      <span className="text-xs text-neutral-500">{issue.desc}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-neutral-400 group-hover:text-neutral-600 shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5 h-full">
              <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Alt ser bra ut!
              </h3>
              <p className="text-xs text-green-700">Ingen kritiske forbedringer funnet.</p>
            </div>
          );
        })()}
      </div>

      {/* Detailed Metrics */}
      <div data-section="detailed-metrics" className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
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
        <div className="p-6 space-y-4">
          {/* SEO */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              SEO
            </h4>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
            <div className="p-4 border-b border-neutral-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-neutral-900 flex items-center gap-2 text-sm">
                    <Link2 className="h-4 w-4 text-neutral-500" />
                    Analyser en annen side
                  </h3>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {/* Custom URL input */}
              <div className="flex gap-2">
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
                  className="h-9 px-3 rounded-lg"
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5">
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
  );
}
