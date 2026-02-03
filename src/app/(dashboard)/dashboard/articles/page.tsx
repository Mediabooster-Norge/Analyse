'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Globe, Loader2, Copy, Calendar, Image, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

interface ArticleListItem {
  id: string;
  title: string;
  website_url: string | null;
  website_name: string | null;
  created_at: string;
}

interface ArticleFull extends ArticleListItem {
  content: string;
  meta_title?: string | null;
  meta_description?: string | null;
  featured_image_suggestion?: string | null;
  featured_image_url?: string | null;
  featured_image_attribution?: string | null;
}

const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-0 mb-4">{children}</h1>,
  h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 mt-6 mb-3">{children}</h2>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-base sm:text-lg font-semibold text-neutral-800 mt-4 mb-2">{children}</h3>,
  p: ({ children }: { children?: React.ReactNode }) => <p className="text-neutral-700 leading-relaxed mb-3">{children}</p>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc pl-6 mb-3 space-y-1 text-neutral-700">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal pl-6 mb-3 space-y-1 text-neutral-700">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-semibold text-neutral-900">{children}</strong>,
};

function domainLabel(article: ArticleListItem): string {
  if (article.website_name) return article.website_name;
  if (article.website_url) {
    try {
      return new URL(article.website_url.startsWith('http') ? article.website_url : `https://${article.website_url}`).hostname.replace(/^www\./, '');
    } catch {
      return article.website_url;
    }
  }
  return 'Ukjent domene';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '–';
  }
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<ArticleFull | null>(null);
  const [loadingArticle, setLoadingArticle] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/generated-articles', {
        credentials: 'include',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      const contentType = res.headers.get('content-type');
      const isJson = contentType?.includes('application/json');
      const body = isJson ? await res.json().catch(() => ({})) : { error: 'Ugyldig svar fra server' };

      if (!res.ok) {
        const message =
          res.status === 401
            ? 'Logg inn for å se lagrede artikler'
            : res.status === 503 && body.code === 'migration_missing'
              ? body.error ?? 'Database-migrasjon mangler'
              : body.error ?? 'Kunne ikke laste artikler';
        setLoadError(message);
        setArticles([]);
        if (res.status === 401) toast.error(message);
        else if (res.status !== 503) toast.error('Kunne ikke laste artikler');
        return;
      }
      setArticles(Array.isArray(body.articles) ? body.articles : []);
    } catch {
      setLoadError('Kunne ikke laste artikler. Sjekk nettverk og prøv igjen.');
      setArticles([]);
      toast.error('Kunne ikke laste artikler');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openArticle = async (id: string) => {
    setLoadingArticle(true);
    setSelectedArticle(null);
    try {
      const res = await fetch(`/api/generated-articles/${id}`, {
        credentials: 'include',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Kunne ikke hente artikkel');
      const data = await res.json();
      setSelectedArticle(data);
    } catch {
      toast.error('Kunne ikke hente artikkel');
    } finally {
      setLoadingArticle(false);
    }
  };

  const copyArticle = () => {
    if (!selectedArticle?.content) return;
    navigator.clipboard.writeText(selectedArticle.content).then(
      () => toast.success('Artikkel kopiert'),
      () => toast.error('Kunne ikke kopiere')
    );
  };
  const copyMeta = (label: string, text: string) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} kopiert`),
      () => toast.error('Kunne ikke kopiere')
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 flex items-center gap-2">
          <FileText className="h-6 w-6 text-neutral-600" />
          Mine artikler
        </h1>
        <p className="text-sm text-neutral-600 mt-1">
          Artikler du har generert fra AI-fanen, koblet til domene per artikkel.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : loadError ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="font-semibold text-neutral-900 mb-2">Kunne ikke laste artikler</h2>
          <p className="text-sm text-neutral-600 max-w-md mx-auto mb-4">{loadError}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button type="button" variant="outline" className="rounded-xl" onClick={fetchList}>
              Prøv igjen
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <a href="/dashboard">Gå til dashboard</a>
            </Button>
          </div>
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-neutral-400" />
          </div>
          <h2 className="font-semibold text-neutral-900 mb-2">Ingen artikler ennå</h2>
          <p className="text-sm text-neutral-500 max-w-md mx-auto mb-4">
            Generer din første artikkel fra AI-fanen på dashboard: velg en artikkelide og trykk «Generer artikkel».
          </p>
          <Button asChild variant="outline" className="rounded-xl">
            <a href="/dashboard">Gå til dashboard</a>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {articles.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => openArticle(a.id)}
                className="w-full text-left p-4 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 transition-all"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                    <FileText className="h-5 w-5 text-neutral-600" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-neutral-900 truncate">{a.title}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5" />
                        {domainLabel(a)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(a.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Modal: full artikkel */}
      <Dialog
        open={!!selectedArticle || loadingArticle}
        onOpenChange={(open) => !open && setSelectedArticle(null)}
      >
        <DialogContent
          showCloseButton
          className="sm:max-w-5xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden"
        >
          {loadingArticle ? (
            <>
              <DialogTitle className="sr-only">Laster artikkel</DialogTitle>
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
              </div>
            </>
          ) : selectedArticle ? (
            <>
              <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b border-neutral-100">
                <DialogTitle className="text-lg font-semibold pr-8">{selectedArticle.title}</DialogTitle>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    {domainLabel(selectedArticle)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(selectedArticle.created_at)}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button type="button" variant="outline" size="sm" onClick={copyArticle} className="rounded-lg text-xs">
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Kopier artikkel
                  </Button>
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0 space-y-6">
                {(selectedArticle.featured_image_url ||
                  selectedArticle.featured_image_suggestion ||
                  selectedArticle.meta_title ||
                  selectedArticle.meta_description) && (
                  <>
                    {(selectedArticle.featured_image_url || selectedArticle.featured_image_suggestion) && (
                      <section className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">Featured image</p>
                        {selectedArticle.featured_image_url ? (
                          <div className="rounded-lg overflow-hidden border border-neutral-200 bg-white">
                            <div className="max-h-[420px] flex items-center justify-center bg-neutral-100">
                              <img
                                src={selectedArticle.featured_image_url}
                                alt="Featured"
                                className="w-full h-auto max-h-[420px] object-contain"
                              />
                            </div>
                            <div className="px-3 py-2 flex flex-wrap items-center justify-between gap-2 bg-neutral-50 border-t border-neutral-100">
                              {selectedArticle.featured_image_attribution && (
                                <a
                                  href="https://unsplash.com/?utm_source=analyseverktyy&utm_medium=referral"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-neutral-600 hover:underline"
                                >
                                  {selectedArticle.featured_image_attribution}
                                </a>
                              )}
                              <Button type="button" variant="outline" size="sm" className="rounded-lg text-xs h-8" asChild>
                                <a href={selectedArticle.featured_image_url} target="_blank" rel="noopener noreferrer" download>
                                  <Download className="h-3.5 w-3.5 mr-1.5" />
                                  Last ned
                                </a>
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-white border border-neutral-100">
                            <Image className="h-4 w-4 text-neutral-500 shrink-0 mt-0.5" aria-hidden />
                            <p className="text-sm text-neutral-800">{selectedArticle.featured_image_suggestion}</p>
                          </div>
                        )}
                      </section>
                    )}
                    {(selectedArticle.meta_title || selectedArticle.meta_description) && (
                      <section className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">SEO og deling</p>
                        <div className="space-y-3">
                          {selectedArticle.meta_title && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-neutral-600 w-28 shrink-0">Meta-tittel</span>
                              <p className="text-sm text-neutral-800 flex-1 truncate" title={selectedArticle.meta_title}>{selectedArticle.meta_title}</p>
                              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={() => copyMeta('Meta-tittel', selectedArticle.meta_title!)} title="Kopier">
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                          {selectedArticle.meta_description && (
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-medium text-neutral-600 w-28 shrink-0">Meta-beskrivelse</span>
                              <p className="text-sm text-neutral-700 flex-1 line-clamp-2" title={selectedArticle.meta_description}>{selectedArticle.meta_description}</p>
                              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={() => copyMeta('Meta-beskrivelse', selectedArticle.meta_description!)} title="Kopier">
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </section>
                    )}
                  </>
                )}
                <article className="prose prose-neutral prose-sm sm:prose-base max-w-none">
                  <ReactMarkdown components={markdownComponents}>
                    {selectedArticle.content}
                  </ReactMarkdown>
                </article>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
