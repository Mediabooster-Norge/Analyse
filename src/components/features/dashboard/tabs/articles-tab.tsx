'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ArticleSuggestion, GeneratedArticleResult } from '@/types/dashboard';
import {
  FileText,
  Clock,
  Lightbulb,
  BarChart3,
  Copy,
  PenLine,
  Loader2,
  Download,
  RefreshCw,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

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

type ArticleLength = 'short' | 'medium' | 'long';
type ArticleTone = 'professional' | 'casual' | 'educational';
type ArticleAudience = 'general' | 'beginners' | 'experts' | 'business';

export interface ArticlesTabProps {
  articleSuggestions: ArticleSuggestion[] | null;
  loadingArticleSuggestions: boolean;
  articleSuggestionsSavedAt: string | null;
  fetchArticleSuggestions: (withCompetitors: boolean) => void;
  hasCompetitors: boolean;
  remainingArticleGenerations: number;
  articleGenerationsLimit: number;
  generatedArticleResult: GeneratedArticleResult | null;
  generatingArticleIndex: number | null;
  fetchGenerateArticle: (
    suggestion: { title: string; rationale?: string },
    index: number,
    options?: { length?: ArticleLength; tone?: ArticleTone; audience?: ArticleAudience }
  ) => void;
  setGeneratedArticle: (result: GeneratedArticleResult | null) => void;
}

const LENGTH_OPTIONS: { value: ArticleLength; label: string; desc: string }[] = [
  { value: 'short', label: 'Kort', desc: '300-500 ord' },
  { value: 'medium', label: 'Medium', desc: '800-1200 ord' },
  { value: 'long', label: 'Lang', desc: '1200-1500 ord' },
];

const TONE_OPTIONS: { value: ArticleTone; label: string }[] = [
  { value: 'professional', label: 'Profesjonell' },
  { value: 'casual', label: 'Uformell' },
  { value: 'educational', label: 'Pedagogisk' },
];

const AUDIENCE_OPTIONS: { value: ArticleAudience; label: string }[] = [
  { value: 'general', label: 'Alle' },
  { value: 'beginners', label: 'Nybegynnere' },
  { value: 'experts', label: 'Eksperter' },
  { value: 'business', label: 'Bedriftsledere' },
];

export function ArticlesTab({
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
}: ArticlesTabProps) {
  const [suggestionMessageIndex, setSuggestionMessageIndex] = useState(0);
  const [generatingMessageIndex, setGeneratingMessageIndex] = useState(0);
  const [selectedLength, setSelectedLength] = useState<ArticleLength>('medium');
  const [selectedTone, setSelectedTone] = useState<ArticleTone>('professional');
  const [selectedAudience, setSelectedAudience] = useState<ArticleAudience>('general');
  const [usedSettings, setUsedSettings] = useState<{ length: ArticleLength; tone: ArticleTone; audience: ArticleAudience } | null>(null);
  const [regeneratingImage, setRegeneratingImage] = useState(false);
  const [articleGenElapsed, setArticleGenElapsed] = useState(0);

  // Timer for article generation
  useEffect(() => {
    if (generatingArticleIndex === null) {
      setArticleGenElapsed(0);
      return;
    }
    setArticleGenElapsed(0);
    const interval = setInterval(() => {
      setArticleGenElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [generatingArticleIndex]);

  // Rotate suggestion messages
  useEffect(() => {
    if (!loadingArticleSuggestions) return;
    setSuggestionMessageIndex(0);
    const interval = setInterval(() => {
      setSuggestionMessageIndex((prev) => (prev + 1) % SUGGESTION_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [loadingArticleSuggestions]);

  // Rotate generating article messages
  useEffect(() => {
    if (generatingArticleIndex === null) return;
    setGeneratingMessageIndex(0);
    const interval = setInterval(() => {
      setGeneratingMessageIndex((prev) => (prev + 1) % GENERATING_ARTICLE_MESSAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [generatingArticleIndex]);

  const copyTitle = (title: string) => {
    navigator.clipboard.writeText(title);
    toast.success('Tittel kopiert');
  };

  const copyArticle = () => {
    if (!generatedArticleResult?.article) return;
    const text = `# ${generatedArticleResult.title}\n\n${generatedArticleResult.article}`;
    navigator.clipboard.writeText(text);
    toast.success('Artikkel kopiert');
  };

  const handleGenerateArticle = (
    suggestion: { title: string; rationale?: string },
    index: number
  ) => {
    setUsedSettings({ length: selectedLength, tone: selectedTone, audience: selectedAudience });
    fetchGenerateArticle(suggestion, index, { length: selectedLength, tone: selectedTone, audience: selectedAudience });
  };

  const regenerateImage = async () => {
    if (!generatedArticleResult) return;
    
    // Use the search query from the article result, or fall back to the suggestion text
    const searchQuery = generatedArticleResult.featuredImageSuggestion;
    if (!searchQuery) {
      toast.error('Ingen bildesøk tilgjengelig');
      return;
    }

    setRegeneratingImage(true);
    try {
      const response = await fetch('/api/regenerate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchQuery }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || 'Kunne ikke hente nytt bilde');
        return;
      }

      // Save the new image to the database if we have an article ID
      if (generatedArticleResult.articleId) {
        const saveResponse = await fetch(`/api/generated-articles/${generatedArticleResult.articleId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            featured_image_url: data.featuredImageUrl,
            featured_image_attribution: data.featuredImageAttribution,
          }),
        });

        if (!saveResponse.ok) {
          console.error('Failed to save image to database');
        }
      }

      // Update the generated article result with the new image
      setGeneratedArticle({
        ...generatedArticleResult,
        featuredImageUrl: data.featuredImageUrl,
        featuredImageAttribution: data.featuredImageAttribution,
        featuredImageProfileUrl: data.featuredImageProfileUrl,
      });
      
      toast.success('Nytt bilde lagret');
    } catch {
      toast.error('Kunne ikke hente nytt bilde');
    } finally {
      setRegeneratingImage(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl max-[400px]:rounded-xl border border-neutral-200 bg-white overflow-hidden min-w-0">
        <div className="p-3 max-[400px]:p-2 min-[401px]:p-4 sm:p-6 border-b border-neutral-100">
          <h3 className="inline-flex items-center gap-1.5 max-[400px]:gap-1.5 px-2 max-[400px]:px-2 min-[401px]:px-3 py-1 max-[400px]:py-1 min-[401px]:py-1.5 rounded-full bg-neutral-100 text-neutral-900 text-[11px] max-[400px]:text-[10px] min-[401px]:text-xs sm:text-sm font-medium mb-2 max-[400px]:mb-1 min-[401px]:mb-2 sm:mb-3">
            <FileText className="h-3.5 w-3.5 max-[400px]:h-3 max-[400px]:w-3 text-neutral-600" />
            AI-genererte artikler
          </h3>
          <p className="text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs sm:text-sm text-neutral-600 mb-3">
            Få AI-forslag til artikkelideer basert på analysen. Du kan generere full artikkel fra hvert forslag.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs sm:text-sm">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
              <strong className="text-neutral-900">{remainingArticleGenerations}/{articleGenerationsLimit}</strong> artikler igjen denne måneden
            </span>
            <a href="/dashboard/articles" className="text-neutral-500 hover:text-neutral-900 underline">
              Se mine artikler →
            </a>
          </div>
        </div>
        <div className="p-3 max-[400px]:p-2 min-[401px]:p-4 sm:p-6 space-y-4">
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
                  {articleSuggestions && articleSuggestions.length > 0 ? 'Generer nye forslag' : 'Generer artikkelforslag'}
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
                {articleSuggestions && articleSuggestions.length > 0 ? 'Nye (med konkurrenter)' : 'Med konkurrentanalyse'}
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
            <div className="space-y-4">
              {/* Article settings - compact inline */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-100 text-xs">
                <span className="text-neutral-500 font-medium">Innstillinger</span>
                
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400">Lengde:</span>
                  <select
                    value={selectedLength}
                    onChange={(e) => setSelectedLength(e.target.value as ArticleLength)}
                    className="px-2 py-1 rounded-md border border-neutral-200 bg-white text-neutral-700 font-medium cursor-pointer hover:border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-300"
                  >
                    {LENGTH_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label} ({opt.desc})</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-neutral-400">Tone:</span>
                  <select
                    value={selectedTone}
                    onChange={(e) => setSelectedTone(e.target.value as ArticleTone)}
                    className="px-2 py-1 rounded-md border border-neutral-200 bg-white text-neutral-700 font-medium cursor-pointer hover:border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-300"
                  >
                    {TONE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-neutral-400">For:</span>
                  <select
                    value={selectedAudience}
                    onChange={(e) => setSelectedAudience(e.target.value as ArticleAudience)}
                    className="px-2 py-1 rounded-md border border-neutral-200 bg-white text-neutral-700 font-medium cursor-pointer hover:border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-300"
                  >
                    {AUDIENCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  {articleSuggestions.length} artikkelideer
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
                              onClick={() => handleGenerateArticle(s, i)}
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

          {!loadingArticleSuggestions && (!articleSuggestions || articleSuggestions.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50">
              <FileText className="h-10 w-10 text-neutral-300 mb-3" />
              <p className="text-sm text-neutral-600 font-medium mb-1">Ingen artikkelforslag ennå</p>
              <p className="text-xs text-neutral-500">Klikk knappen over for å generere forslag basert på analysen.</p>
            </div>
          )}
        </div>
      </div>

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
            {usedSettings && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 text-[10px]">
                  {LENGTH_OPTIONS.find(o => o.value === usedSettings.length)?.label}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 text-[10px]">
                  {TONE_OPTIONS.find(o => o.value === usedSettings.tone)?.label}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 text-[10px]">
                  {AUDIENCE_OPTIONS.find(o => o.value === usedSettings.audience)?.label}
                </span>
              </div>
            )}
            <p className="text-xs text-neutral-500 min-h-[1.25rem] transition-opacity duration-300">
              {GENERATING_ARTICLE_MESSAGES[generatingMessageIndex]}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-100">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-medium text-neutral-700 tabular-nums">
                  {Math.floor(articleGenElapsed / 60)}:{(articleGenElapsed % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                {usedSettings?.length === 'long' 
                  ? 'ca. 30–60 sek' 
                  : usedSettings?.length === 'short'
                  ? 'ca. 15–30 sek'
                  : 'ca. 20–40 sek'}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: generert artikkel */}
      <Dialog open={!!generatedArticleResult} onOpenChange={(open) => !open && setGeneratedArticle(null)}>
        <DialogContent
          showCloseButton
          className="sm:max-w-5xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden"
        >
          <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b border-neutral-100">
            <DialogTitle className="text-lg font-semibold">Generert artikkel</DialogTitle>
            {usedSettings && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-[11px] text-neutral-500">
                <span>Generert med:</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700">
                  {LENGTH_OPTIONS.find(o => o.value === usedSettings.length)?.label} ({LENGTH_OPTIONS.find(o => o.value === usedSettings.length)?.desc})
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700">
                  {TONE_OPTIONS.find(o => o.value === usedSettings.tone)?.label}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700">
                  {AUDIENCE_OPTIONS.find(o => o.value === usedSettings.audience)?.label}
                </span>
                {generatedArticleResult?.article && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700">
                    {generatedArticleResult.article.split(/\s+/).filter(w => w.length > 0).length} ord
                  </span>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              <Button type="button" variant="outline" size="sm" onClick={copyArticle} className="rounded-lg text-xs">
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Kopier artikkel
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0 space-y-6">
            {generatedArticleResult && (
              <>
                <section className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 sm:p-5">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">Artikkel og bilde</h2>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">{generatedArticleResult.title}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    {/* Venstre: forslått featured image */}
                    {(generatedArticleResult.featuredImageUrl || generatedArticleResult.featuredImageSuggestion) && (
                      <div className="space-y-2 min-w-0">
                        {generatedArticleResult.featuredImageSuggestion && (
                          <p className="text-[11px] text-neutral-600">
                            <span className="font-medium text-neutral-700">Forslag til fremhevet bilde:</span>{' '}
                            {generatedArticleResult.featuredImageSuggestion}
                          </p>
                        )}
                        {generatedArticleResult.featuredImageUrl && (
                          <div className="rounded-lg overflow-hidden border border-neutral-200 bg-white">
                            <div className="max-h-[200px] flex items-center justify-center bg-neutral-100">
                              <img
                                src={generatedArticleResult.featuredImageUrl}
                                alt="Forslag til fremhevet bilde"
                                className="w-full h-auto max-h-[200px] object-contain"
                              />
                            </div>
                            <div className="px-3 py-2 flex flex-wrap items-center justify-between gap-2 bg-neutral-50 border-t border-neutral-100">
                              {generatedArticleResult.featuredImageAttribution && (
                                <a
                                  href={generatedArticleResult.featuredImageProfileUrl ?? 'https://unsplash.com/?utm_source=analyseverktyy&utm_medium=referral'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-neutral-600 hover:underline"
                                >
                                  {generatedArticleResult.featuredImageAttribution}
                                </a>
                              )}
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={regenerateImage}
                                  disabled={regeneratingImage}
                                  className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  <RefreshCw className={`h-3 w-3 ${regeneratingImage ? 'animate-spin' : ''}`} />
                                  {regeneratingImage ? 'Henter nytt bilde...' : 'Ikke fornøyd? Generer et nytt bilde'}
                                </button>
                                <a
                                  href={generatedArticleResult.featuredImageUrl}
                                  download={`featured-image-${generatedArticleResult.title?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() || 'article'}.jpg`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
                                >
                                  <Download className="h-3 w-3" />
                                  Last ned
                                </a>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Høyre: SEO og deling */}
                    {(generatedArticleResult.metaTitle || generatedArticleResult.metaDescription) && (
                      <div className="min-w-0">
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">SEO og deling</h2>
                        <div className="space-y-3">
                          {generatedArticleResult.metaTitle && (
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-medium text-neutral-600">Meta-tittel</label>
                              <p className="text-sm text-neutral-800 truncate" title={generatedArticleResult.metaTitle}>
                                {generatedArticleResult.metaTitle}
                              </p>
                            </div>
                          )}
                          {generatedArticleResult.metaDescription && (
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-medium text-neutral-600">Meta-beskrivelse</label>
                              <p className="text-sm text-neutral-700 line-clamp-3" title={generatedArticleResult.metaDescription}>
                                {generatedArticleResult.metaDescription}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Artikkeltekst */}
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
                    {generatedArticleResult.article}
                  </ReactMarkdown>
                </article>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
