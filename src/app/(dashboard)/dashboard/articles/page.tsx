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
import { FileText, Globe, Loader2, Copy, Calendar } from 'lucide-react';
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
              <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
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
