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
import { FileText, Globe, Loader2, Copy, Calendar, Image, Download, Trash2, RefreshCw, Share2 } from 'lucide-react';
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
  article_length?: string | null;
  article_tone?: string | null;
  article_audience?: string | null;
}

const LENGTH_LABELS: Record<string, string> = {
  short: 'Kort',
  medium: 'Medium',
  long: 'Lang',
};

const TONE_LABELS: Record<string, string> = {
  professional: 'Profesjonell',
  casual: 'Uformell',
  educational: 'Pedagogisk',
};

const AUDIENCE_LABELS: Record<string, string> = {
  general: 'Alle',
  beginners: 'Nybegynnere',
  experts: 'Eksperter',
  business: 'Bedriftsledere',
};

type ContentView = 'articles' | 'social';

interface SocialPostListItem {
  id: string;
  platform: string;
  title: string;
  website_url: string | null;
  website_name: string | null;
  created_at: string;
}

interface SocialPostFull extends SocialPostListItem {
  content: string;
  hashtags: string[];
  cta?: string | null;
  featured_image_suggestion?: string | null;
  featured_image_url?: string | null;
  featured_image_attribution?: string | null;
}

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  x: 'X (Twitter)',
};

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
  const [view, setView] = useState<ContentView>('articles');
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<ArticleFull | null>(null);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<ArticleListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [regeneratingImage, setRegeneratingImage] = useState(false);

  const [socialPosts, setSocialPosts] = useState<SocialPostListItem[]>([]);
  const [loadingSocial, setLoadingSocial] = useState(false);
  const [loadErrorSocial, setLoadErrorSocial] = useState<string | null>(null);
  const [selectedSocialPost, setSelectedSocialPost] = useState<SocialPostFull | null>(null);
  const [loadingSocialPost, setLoadingSocialPost] = useState(false);
  const [socialPostToDelete, setSocialPostToDelete] = useState<SocialPostListItem | null>(null);
  const [deletingSocial, setDeletingSocial] = useState(false);
  const [regeneratingSocialImage, setRegeneratingSocialImage] = useState(false);

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

  const fetchSocialList = useCallback(async () => {
    setLoadingSocial(true);
    setLoadErrorSocial(null);
    try {
      const res = await fetch(`/api/generated-social-posts?_=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      const contentType = res.headers.get('content-type');
      const isJson = contentType?.includes('application/json');
      const body = isJson ? await res.json().catch(() => ({})) : { error: 'Ugyldig svar' };

      if (!res.ok) {
        const message =
          res.status === 401
            ? 'Logg inn for å se lagrede poster'
            : res.status === 503 && body.code === 'migration_missing'
              ? body.error ?? 'Database-migrasjon mangler'
              : body.error ?? 'Kunne ikke laste SoMe-poster';
        setLoadErrorSocial(message);
        setSocialPosts([]);
        return;
      }
      setSocialPosts(Array.isArray(body.posts) ? body.posts : []);
    } catch {
      setLoadErrorSocial('Kunne ikke laste SoMe-poster.');
      setSocialPosts([]);
    } finally {
      setLoadingSocial(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (view === 'social') fetchSocialList();
  }, [view, fetchSocialList]);

  // Refetch SoMe list when tab/window becomes visible (e.g. after navigating back) so deleted/updated posts are correct
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && view === 'social') fetchSocialList();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [view, fetchSocialList]);

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

  const deleteArticle = async () => {
    if (!articleToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/generated-articles/${articleToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Kunne ikke slette artikkel');
      setArticles((prev) => prev.filter((a) => a.id !== articleToDelete.id));
      toast.success('Artikkel slettet');
      setArticleToDelete(null);
    } catch {
      toast.error('Kunne ikke slette artikkel');
    } finally {
      setDeleting(false);
    }
  };

  const openSocialPost = async (id: string) => {
    setLoadingSocialPost(true);
    setSelectedSocialPost(null);
    try {
      const res = await fetch(`/api/generated-social-posts/${id}?_=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Kunne ikke hente innlegg');
      const data = await res.json();
      setSelectedSocialPost(data);
    } catch {
      toast.error('Kunne ikke hente innlegg');
    } finally {
      setLoadingSocialPost(false);
    }
  };

  const copySocialPost = () => {
    if (!selectedSocialPost?.content) return;
    const ctaStr = selectedSocialPost.cta?.trim() ? '\n\n' + selectedSocialPost.cta.trim() : '';
    const hashtagStr = selectedSocialPost.hashtags?.length
      ? '\n\n' + selectedSocialPost.hashtags.map((h) => `#${h}`).join(' ')
      : '';
    const text = selectedSocialPost.content + ctaStr + hashtagStr;
    navigator.clipboard.writeText(text).then(
      () => toast.success('Innlegg kopiert'),
      () => toast.error('Kunne ikke kopiere')
    );
  };

  const deleteSocialPost = async () => {
    if (!socialPostToDelete) return;
    setDeletingSocial(true);
    try {
      const res = await fetch(`/api/generated-social-posts/${socialPostToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Kunne ikke slette innlegg');
      setSocialPosts((prev) => prev.filter((p) => p.id !== socialPostToDelete.id));
      toast.success('Innlegg slettet');
      setSocialPostToDelete(null);
    } catch {
      toast.error('Kunne ikke slette innlegg');
    } finally {
      setDeletingSocial(false);
    }
  };

  const regenerateSocialPostImage = async () => {
    const post = selectedSocialPost;
    if (!post?.featured_image_suggestion) {
      toast.error('Ingen bildesøk tilgjengelig');
      return;
    }
    const postId = post.id;
    const searchQuery = post.featured_image_suggestion;
    setRegeneratingSocialImage(true);
    try {
      const res = await fetch('/api/regenerate-image', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchQuery, postId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Kunne ikke hente nytt bilde');
        return;
      }
      const patchRes = await fetch(`/api/generated-social-posts/${postId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featured_image_url: data.featuredImageUrl,
          featured_image_attribution: data.featuredImageAttribution,
        }),
      });
      if (!patchRes.ok) {
        const patchBody = await patchRes.json().catch(() => ({}));
        toast.error(patchBody.error || 'Bilde ble ikke lagret. Prøv igjen.');
        return;
      }
      setSelectedSocialPost((prev) =>
        prev?.id === postId
          ? { ...prev, featured_image_url: data.featuredImageUrl, featured_image_attribution: data.featuredImageAttribution }
          : prev
      );
      toast.success('Nytt bilde lagret');
    } catch {
      toast.error('Kunne ikke hente nytt bilde');
    } finally {
      setRegeneratingSocialImage(false);
    }
  };

  const regenerateImage = async () => {
    const article = selectedArticle;
    if (!article?.featured_image_suggestion) {
      toast.error('Ingen bildesøk tilgjengelig');
      return;
    }
    const articleId = article.id;
    const searchQuery = article.featured_image_suggestion;
    setRegeneratingImage(true);
    try {
      const response = await fetch('/api/regenerate-image', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchQuery, articleId }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'Kunne ikke hente nytt bilde');
        return;
      }
      const saveResponse = await fetch(`/api/generated-articles/${articleId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featured_image_url: data.featuredImageUrl,
          featured_image_attribution: data.featuredImageAttribution,
        }),
      });
      if (!saveResponse.ok) {
        const patchBody = await saveResponse.json().catch(() => ({}));
        toast.error(patchBody.error || 'Bilde ble ikke lagret. Prøv igjen.');
        return;
      }
      setSelectedArticle((prev) =>
        prev?.id === articleId
          ? { ...prev, featured_image_url: data.featuredImageUrl, featured_image_attribution: data.featuredImageAttribution }
          : prev
      );
      toast.success('Nytt bilde lagret');
    } catch {
      toast.error('Kunne ikke hente nytt bilde');
    } finally {
      setRegeneratingImage(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 flex items-center gap-2">
          {view === 'articles' ? (
            <>
              <FileText className="h-6 w-6 text-neutral-600" />
              Mine artikler
            </>
          ) : (
            <>
              <Share2 className="h-6 w-6 text-neutral-600" />
              Mine SoMe-poster
            </>
          )}
        </h1>
        <p className="text-sm text-neutral-600 mt-1">
          {view === 'articles'
            ? 'Artikler du har generert fra Artikkel generator-fanen, koblet til domene per artikkel.'
            : 'SoMe-innlegg du har generert fra SoMe-post generator-fanen.'}
        </p>
        <div className="flex items-center gap-1 mt-3 p-1 rounded-xl bg-neutral-100 w-fit">
          <button
            type="button"
            onClick={() => setView('articles')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
              view === 'articles' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Mine artikler
          </button>
          <button
            type="button"
            onClick={() => setView('social')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
              view === 'social' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Mine SoMe-poster
          </button>
        </div>
      </div>

      {view === 'articles' && loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : view === 'articles' && loadError ? (
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
      ) : view === 'articles' && articles.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-neutral-400" />
          </div>
          <h2 className="font-semibold text-neutral-900 mb-2">Ingen artikler ennå</h2>
          <p className="text-sm text-neutral-500 max-w-md mx-auto mb-4">
            Generer din første artikkel fra Artikkel generator-fanen på dashboard.
          </p>
          <Button asChild variant="outline" className="rounded-xl">
            <a href="/dashboard">Gå til dashboard</a>
          </Button>
        </div>
      ) : view === 'articles' ? (
        <ul className="space-y-3">
          {articles.map((a) => (
            <li key={a.id}>
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => openArticle(a.id)}
                  className="w-full text-left p-4 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                      <FileText className="h-5 w-5 text-neutral-600" />
                    </span>
                    <div className="min-w-0 flex-1 pr-8">
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setArticleToDelete(a);
                  }}
                  className="absolute top-4 right-4 p-2 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Slett artikkel"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : view === 'social' ? (
        <>
          {loadingSocial ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : loadErrorSocial ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="font-semibold text-neutral-900 mb-2">Kunne ikke laste SoMe-poster</h2>
              <p className="text-sm text-neutral-600 max-w-md mx-auto mb-4">{loadErrorSocial}</p>
              <Button type="button" variant="outline" className="rounded-xl" onClick={fetchSocialList}>
                Prøv igjen
              </Button>
            </div>
          ) : socialPosts.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
              <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-8 h-8 text-neutral-400" />
              </div>
              <h2 className="font-semibold text-neutral-900 mb-2">Ingen SoMe-poster ennå</h2>
              <p className="text-sm text-neutral-500 max-w-md mx-auto mb-4">
                Generer din første post fra SoMe-post generator-fanen på dashboard.
              </p>
              <Button asChild variant="outline" className="rounded-xl">
                <a href="/dashboard">Gå til dashboard</a>
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {socialPosts.map((p) => (
                <li key={p.id}>
                  <div className="relative group">
                    <button
                      type="button"
                      onClick={() => openSocialPost(p.id)}
                      className="w-full text-left p-4 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                          <Share2 className="h-5 w-5 text-neutral-600" />
                        </span>
                        <div className="min-w-0 flex-1 pr-8">
                          <p className="font-medium text-neutral-900 truncate">{p.title}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-neutral-500">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 font-medium">
                              {PLATFORM_LABELS[p.platform] || p.platform}
                            </span>
                            <span className="flex items-center gap-1">
                              <Globe className="h-3.5 w-3.5" />
                              {domainLabel(p)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(p.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSocialPostToDelete(p);
                      }}
                      className="absolute top-4 right-4 p-2 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Slett innlegg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}

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
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {selectedArticle.content.split(/\s+/).filter(w => w.length > 0).length} ord
                  </span>
                </div>
                {(selectedArticle.article_length || selectedArticle.article_tone || selectedArticle.article_audience) && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {selectedArticle.article_length && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 text-xs">
                        {LENGTH_LABELS[selectedArticle.article_length] || selectedArticle.article_length}
                      </span>
                    )}
                    {selectedArticle.article_tone && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 text-xs">
                        {TONE_LABELS[selectedArticle.article_tone] || selectedArticle.article_tone}
                      </span>
                    )}
                    {selectedArticle.article_audience && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 text-xs">
                        For: {AUDIENCE_LABELS[selectedArticle.article_audience] || selectedArticle.article_audience}
                      </span>
                    )}
                  </div>
                )}
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
                  <section className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 sm:p-5">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-4">Artikkel og bilde</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      {/* Venstre: forslått featured image */}
                      {(selectedArticle.featured_image_url || selectedArticle.featured_image_suggestion) && (
                        <div className="space-y-2 min-w-0">
                          {selectedArticle.featured_image_suggestion && (
                            <p className="text-[11px] text-neutral-600">
                              <span className="font-medium text-neutral-700">Forslag til fremhevet bilde:</span>{' '}
                              {selectedArticle.featured_image_suggestion}
                            </p>
                          )}
                          {selectedArticle.featured_image_url ? (
                            <div className="rounded-lg overflow-hidden border border-neutral-200 bg-white">
                              <div className="max-h-[200px] flex items-center justify-center bg-neutral-100">
                                <img
                                  src={selectedArticle.featured_image_url}
                                  alt="Forslag til fremhevet bilde"
                                  className="w-full h-auto max-h-[200px] object-contain"
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
                                <div className="flex flex-col gap-1">
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
                                      href={selectedArticle.featured_image_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      download
                                      className="inline-flex items-center gap-1 text-[11px] text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
                                    >
                                      <Download className="h-3 w-3" />
                                      Last ned
                                    </a>
                                  </div>
                                  <p className="text-[11px] text-neutral-400">Maks 3 nye bilder per time.</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-white border border-neutral-100">
                              <Image className="h-4 w-4 text-neutral-500 shrink-0 mt-0.5" aria-hidden />
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-neutral-600 mb-0.5">Ingen bilde lastet inn</p>
                                <p className="text-sm text-neutral-800">{selectedArticle.featured_image_suggestion}</p>
                                <p className="text-[11px] text-neutral-500 mt-1">Bruk søkeforslaget på stock-bilder (f.eks. Unsplash) eller til illustratør.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Høyre: SEO og deling */}
                      {(selectedArticle.meta_title || selectedArticle.meta_description) && (
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">SEO og deling</p>
                          <div className="space-y-3">
                            {selectedArticle.meta_title && (
                              <div className="flex flex-col gap-1.5">
                                <span className="text-xs font-medium text-neutral-600">Meta-tittel</span>
                                <div className="flex items-center gap-2 min-w-0">
                                  <p className="text-sm text-neutral-800 truncate flex-1" title={selectedArticle.meta_title}>{selectedArticle.meta_title}</p>
                                  <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0 rounded-lg" onClick={() => copyMeta('Meta-tittel', selectedArticle.meta_title!)} title="Kopier meta-tittel">
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            )}
                            {selectedArticle.meta_description && (
                              <div className="flex flex-col gap-1.5">
                                <span className="text-xs font-medium text-neutral-600">Meta-beskrivelse</span>
                                <div className="flex items-start gap-2 min-w-0">
                                  <p className="text-sm text-neutral-700 flex-1 line-clamp-3" title={selectedArticle.meta_description}>{selectedArticle.meta_description}</p>
                                  <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0 rounded-lg" onClick={() => copyMeta('Meta-beskrivelse', selectedArticle.meta_description!)} title="Kopier meta-beskrivelse">
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
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

      {/* Modal: SoMe-post detalj */}
      <Dialog
        open={!!selectedSocialPost || loadingSocialPost}
        onOpenChange={(open) => !open && setSelectedSocialPost(null)}
      >
        <DialogContent
          showCloseButton
          className="sm:max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden"
        >
          {loadingSocialPost ? (
            <>
              <DialogTitle className="sr-only">Laster innlegg</DialogTitle>
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
              </div>
            </>
          ) : selectedSocialPost ? (
            <>
              <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b border-neutral-100">
                <DialogTitle className="text-lg font-semibold pr-8">{selectedSocialPost.title}</DialogTitle>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-neutral-500">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 font-medium">
                    {PLATFORM_LABELS[selectedSocialPost.platform] || selectedSocialPost.platform}
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    {domainLabel(selectedSocialPost)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(selectedSocialPost.created_at)}
                  </span>
                </div>
                <div className="mt-3">
                  <Button type="button" variant="outline" size="sm" onClick={copySocialPost} className="rounded-lg text-xs">
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Kopier innlegg
                  </Button>
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0 space-y-4">
                {(selectedSocialPost.featured_image_url || selectedSocialPost.featured_image_suggestion) && (
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 overflow-hidden">
                    {selectedSocialPost.featured_image_suggestion && (
                      <p className="text-[11px] text-neutral-600 px-3 py-2 border-b border-neutral-100">
                        Forslag til bilde: {selectedSocialPost.featured_image_suggestion}
                      </p>
                    )}
                    {selectedSocialPost.featured_image_url ? (
                      <>
                        <div className="max-h-[220px] flex items-center justify-center bg-neutral-100">
                          <img
                            src={selectedSocialPost.featured_image_url}
                            alt="Forslag til innleggsbilde"
                            className="w-full h-auto max-h-[220px] object-contain"
                          />
                        </div>
                        <div className="px-3 py-2 flex flex-wrap items-center justify-between gap-2 bg-neutral-50 border-t border-neutral-100">
                          {selectedSocialPost.featured_image_attribution && (
                            <a
                              href="https://unsplash.com/?utm_source=analyseverktyy&utm_medium=referral"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-neutral-600 hover:underline"
                            >
                              {selectedSocialPost.featured_image_attribution}
                            </a>
                          )}
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={regenerateSocialPostImage}
                                disabled={regeneratingSocialImage}
                                className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <RefreshCw className={`h-3 w-3 ${regeneratingSocialImage ? 'animate-spin' : ''}`} />
                                {regeneratingSocialImage ? 'Henter nytt bilde...' : 'Generer nytt bilde'}
                              </button>
                              <a
                                href={selectedSocialPost.featured_image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="inline-flex items-center gap-1 text-[11px] text-neutral-600 hover:text-neutral-900"
                              >
                                <Download className="h-3 w-3" />
                                Last ned
                              </a>
                            </div>
                            <p className="text-[11px] text-neutral-400">Maks 3 nye bilder per time.</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="px-3 py-2 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Image className="h-4 w-4 text-neutral-500 shrink-0" aria-hidden />
                          <p className="text-xs text-neutral-600 flex-1">{selectedSocialPost.featured_image_suggestion}</p>
                          <button
                            type="button"
                            onClick={regenerateSocialPostImage}
                            disabled={regeneratingSocialImage}
                            className="text-[11px] text-neutral-500 hover:text-neutral-900 cursor-pointer disabled:opacity-50"
                          >
                            {regeneratingSocialImage ? 'Henter...' : 'Hent bilde'}
                          </button>
                        </div>
                        <p className="text-[11px] text-neutral-400">Maks 3 nye bilder per time.</p>
                      </div>
                    )}
                  </div>
                )}
                <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
                  <p className="text-sm text-neutral-800 whitespace-pre-wrap leading-relaxed">
                    {selectedSocialPost.content}
                  </p>
                  {selectedSocialPost.cta?.trim() && (
                    <p className="mt-3 text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">
                      {selectedSocialPost.cta.trim()}
                    </p>
                  )}
                  {selectedSocialPost.hashtags?.length > 0 && (
                    <p className="mt-3 pt-3 border-t border-neutral-200 text-xs text-neutral-500">
                      {selectedSocialPost.hashtags.map((h) => `#${h}`).join(' ')}
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation: artikkel */}
      <Dialog open={!!articleToDelete} onOpenChange={(open) => !open && setArticleToDelete(null)}>
        <DialogContent showCloseButton className="sm:max-w-md overflow-hidden">
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>Slett artikkel?</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <p className="text-sm text-neutral-600">
                Er du sikker på at du vil slette denne artikkelen?
              </p>
              {articleToDelete && (
                <p className="text-sm font-medium text-neutral-900 break-words">
                  {articleToDelete.title}
                </p>
              )}
              <p className="text-xs text-neutral-500">
                Artikkelen teller fortsatt som generert mot månedlig grense.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setArticleToDelete(null)}
                disabled={deleting}
                className="rounded-lg cursor-pointer"
              >
                Avbryt
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={deleteArticle}
                disabled={deleting}
                className="rounded-lg cursor-pointer"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sletter...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Slett
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation: SoMe-post */}
      <Dialog open={!!socialPostToDelete} onOpenChange={(open) => !open && setSocialPostToDelete(null)}>
        <DialogContent showCloseButton className="sm:max-w-md overflow-hidden">
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>Slett SoMe-innlegg?</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <p className="text-sm text-neutral-600">
                Er du sikker på at du vil slette dette innlegget?
              </p>
              {socialPostToDelete && (
                <p className="text-sm font-medium text-neutral-900 break-words">
                  {socialPostToDelete.title}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSocialPostToDelete(null)}
                disabled={deletingSocial}
                className="rounded-lg cursor-pointer"
              >
                Avbryt
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={deleteSocialPost}
                disabled={deletingSocial}
                className="rounded-lg cursor-pointer"
              >
                {deletingSocial ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sletter...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Slett
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
