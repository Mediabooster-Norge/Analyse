'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import {
  BarChart3,
  Clock,
  Globe,
  ArrowRight,
  Plus,
  RefreshCw,
  Loader2,
  Eye,
  Sparkles,
  Trash2,
  AlertTriangle,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { usePremium } from '@/hooks/usePremium';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AnalysisDialog } from '@/components/features/dashboard';
import { ANALYSIS_STEPS } from '@/components/features/dashboard/analysis-steps';

interface AnalysisRaw {
  id: string;
  overall_score: number;
  seo_results: { score: number } | null;
  content_results: { score: number } | null;
  security_results: { score: number } | null;
  pagespeed_results: { performance: number } | null;
  created_at: string;
  status: string;
  website_url: string | null;
  website_name: string | null;
}

interface Analysis {
  id: string;
  url: string;
  overall_score: number;
  seo_score: number;
  content_score: number;
  security_score: number;
  performance_score: number | null;
  created_at: string;
  status: string;
}

export default function AnalysisPage() {
  const router = useRouter();
  const { isPremium } = usePremium();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [cacheKey, setCacheKey] = useState<string | null>(null);
  const [rerunningAnalysis, setRerunningAnalysis] = useState<{ id: string; url: string } | null>(null);
  const [rerunStep, setRerunStep] = useState(0);
  const [rerunElapsedTime, setRerunElapsedTime] = useState(0);
  const [rerunLoadingPageSpeed, setRerunLoadingPageSpeed] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; url: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);

  const ANALYSES_PER_PAGE = 15;
  const totalPages = Math.max(1, Math.ceil(analyses.length / ANALYSES_PER_PAGE));
  const paginatedAnalyses = analyses.slice((page - 1) * ANALYSES_PER_PAGE, page * ANALYSES_PER_PAGE);
  const from = analyses.length === 0 ? 0 : (page - 1) * ANALYSES_PER_PAGE + 1;
  const to = Math.min(page * ANALYSES_PER_PAGE, analyses.length);

  // Reset to page 1 if current page is beyond last page (e.g. after deleting items)
  useEffect(() => {
    if (totalPages > 0 && page > totalPages) setPage(1);
  }, [analyses.length, totalPages, page]);

  // Timer og steg 0–4 mens «Kjør på nytt» kjører; steg 5 settes når PageSpeed starter
  useEffect(() => {
    if (!rerunningAnalysis) return;
    setRerunStep(0);
    setRerunElapsedTime(0);
    setRerunLoadingPageSpeed(false);
    const timeInterval = setInterval(() => setRerunElapsedTime((t) => t + 1), 1000);
    const stepInterval = setInterval(() => {
      setRerunStep((s) => Math.min(s + 1, 4));
    }, 12000);
    return () => {
      clearInterval(timeInterval);
      clearInterval(stepInterval);
    };
  }, [rerunningAnalysis]);

  // Load cached data only after we have user-specific cache key
  useEffect(() => {
    if (!cacheKey) return;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        if (data.analyses && Array.isArray(data.analyses)) {
          setAnalyses(data.analyses);
          setLoading(false);
        }
      }
    } catch {
      // Ignore cache errors
    }
  }, [cacheKey]);

  useEffect(() => {
    async function fetchAnalyses() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setCacheKey(`analyses_cache_${user.id}`);

      // Hent analyser på user_id (ikke company_id)
      const { data: analysesData, error } = await supabase
        .from('analyses')
        .select('id, overall_score, seo_results, content_results, security_results, pagespeed_results, created_at, status, website_url, website_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching analyses:', error);
      }

      if (analysesData) {
        const mappedAnalyses: Analysis[] = analysesData.map((a: AnalysisRaw) => ({
          id: a.id,
          url: a.website_url || a.website_name || '—',
          overall_score: a.overall_score || 0,
          seo_score: a.seo_results?.score || 0,
          content_score: a.content_results?.score || 0,
          security_score: a.security_results?.score || 0,
          performance_score: a.pagespeed_results?.performance ?? null,
          created_at: a.created_at,
          status: a.status,
        }));
        setAnalyses(mappedAnalyses);
        try {
          sessionStorage.setItem(`analyses_cache_${user.id}`, JSON.stringify({ analyses: mappedAnalyses, timestamp: Date.now() }));
        } catch {
          // Ignore cache errors
        }
      }

      setLoading(false);
    }

    fetchAnalyses();
  }, []);

  const handleRerunAnalysis = async (analysis: Analysis) => {
    setRerunningAnalysis({ id: analysis.id, url: analysis.url });
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rerunFromAnalysisId: analysis.id }),
      });
      let data: { error?: string; limitReached?: boolean; analysisId?: string } = {};
      try {
        data = await res.json();
      } catch {
        if (res.status === 504 || res.status === 503) {
          toast.error('Analysen tok for lang tid og ble avbrutt', {
            description: 'Prøv å kjøre analysen på nytt.',
          });
          return;
        }
        data = { error: 'Kunne ikke kjøre analysen på nytt' };
      }

      if (!res.ok) {
        const isTimeout = res.status === 504 || res.status === 503;
        if (data?.limitReached) {
          toast.error(data.error || 'Kunne ikke kjøre analysen på nytt', {
            description: 'Oppgrader til Premium for flere analyser.',
          });
        } else if (isTimeout) {
          toast.error('Analysen tok for lang tid og ble avbrutt', {
            description: 'Prøv å kjøre analysen på nytt.',
          });
        } else {
          toast.error(data?.error || 'Kunne ikke kjøre analysen på nytt');
        }
        return;
      }

      const analysisId = data.analysisId as string | undefined;
      setRerunStep(5);
      setRerunLoadingPageSpeed(true);
      if (analysisId) {
        try {
          const speedRes = await fetch('/api/analyze/pagespeed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ analysisId }),
          });
          if (!speedRes.ok) {
            console.warn('PageSpeed-måling feilet ved rerun, analysen er lagret uten hastighet');
          }
        } catch {
          console.warn('PageSpeed-måling feilet ved rerun, analysen er lagret uten hastighet');
        }
      }
      setRerunLoadingPageSpeed(false);
      toast.success('Analysen er ferdig.');
      router.push(`/dashboard?analysisId=${analysisId ?? data.analysisId}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      const isTimeoutOrNetwork = /timeout|timed out|network|failed to fetch|load failed/i.test(msg);
      if (isTimeoutOrNetwork) {
        toast.error('Analysen tok for lang tid eller ble avbrutt', {
          description: 'Prøv å kjøre analysen på nytt.',
        });
      } else {
        toast.error('Noe gikk galt. Prøv igjen.');
      }
    } finally {
      setRerunningAnalysis(null);
    }
  };

  const handleDeleteAnalysis = async (analysisId: string) => {
    setDeleting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Du må være logget inn for å slette analyser');
        return;
      }
      
      // Delete the analysis - verify user owns it via user_id
      // This does NOT refund the analysis count for free users
      const { error, count } = await supabase
        .from('analyses')
        .delete({ count: 'exact' })
        .eq('id', analysisId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Delete error:', error);
        if (error.code === '42501') {
          toast.error('Du har ikke tilgang til å slette denne analysen. Kjør SQL-migrasjonen for å aktivere sletting.');
        } else {
          toast.error('Kunne ikke slette analysen: ' + error.message);
        }
        return;
      }

      if (count === 0) {
        toast.error('Analysen ble ikke funnet eller du har ikke tilgang til å slette den');
        return;
      }

      // Calculate new analyses list BEFORE updating state
      const newAnalyses = analyses.filter(a => a.id !== analysisId);
      
      // Update local state
      setAnalyses(newAnalyses);
      
      // Clear ALL related caches to ensure consistency across pages
      try {
        // Update analyses cache with the new list
        sessionStorage.setItem(`analyses_cache_${user.id}`, JSON.stringify({ analyses: newAnalyses, timestamp: Date.now() }));
        
        // Clear dashboard cache so it refetches fresh data
        sessionStorage.removeItem(`dashboard_cache_${user.id}`);
      } catch {
        // Ignore cache errors
      }

      toast.success('Analysen ble slettet');
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Noe gikk galt. Prøv igjen.');
    } finally {
      setDeleting(false);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Analysehistorikk</h1>
          <p className="text-neutral-500">Oversikt over alle dine tidligere analyser</p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-10 w-24 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Modal «Kjør på nytt» – samme AnalysisDialog som dashboard, steg 6/6 inkludert */}
      <AnalysisDialog
        open={!!rerunningAnalysis}
        onOpenChange={() => {}}
        trigger={<span className="hidden" aria-hidden />}
        analyzing={!!rerunningAnalysis}
        analysisStep={rerunLoadingPageSpeed ? 5 : rerunStep}
        analysisSteps={ANALYSIS_STEPS}
        elapsedTime={rerunElapsedTime}
        url={rerunningAnalysis?.url ?? ''}
        setUrl={() => {}}
        companyUrl={null}
        companyName={null}
        competitorUrls={[]}
        competitorInput=""
        setCompetitorInput={() => {}}
        addCompetitor={() => {}}
        removeCompetitor={() => {}}
        keywords={[]}
        keywordInput=""
        setKeywordInput={() => {}}
        addKeyword={() => {}}
        removeKeyword={() => {}}
        clearKeywords={() => {}}
        suggestedKeywordCount={0}
        setSuggestedKeywordCount={() => {}}
        suggestingKeywords={false}
        suggestKeywords={() => {}}
        FREE_COMPETITOR_LIMIT={5}
        FREE_KEYWORD_LIMIT={5}
        onRunAnalysis={() => {}}
        loadingPageSpeed={rerunLoadingPageSpeed}
        loadingCompetitors={false}
        competitorProgress={null}
        isSubpageMode={false}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <DialogTitle>Slett analyse</DialogTitle>
            </div>
            <DialogDescription className="text-left">
              Er du sikker på at du vil slette analysen for <strong>{deleteConfirm?.url}</strong>?
              {!isPremium && (
                <span className="block mt-2 text-amber-600 font-medium">
                  Merk: Du får ikke tilbake analysen din selv om du sletter.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setDeleteConfirm(null)}
              disabled={deleting}
            >
              Avbryt
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl bg-red-600 hover:bg-red-700"
              onClick={() => deleteConfirm && handleDeleteAnalysis(deleteConfirm.id)}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sletter...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Slett
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Analysehistorikk</h1>
          <p className="text-neutral-500">Oversikt over alle dine tidligere analyser</p>
        </div>
        <Button asChild className="h-11 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white">
          <Link href="/dashboard?new=true">
            <Plus className="mr-2 h-4 w-4" />
            Ny analyse
          </Link>
        </Button>
      </div>

      {/* Analyses List */}
      {analyses.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-gradient-to-br from-white to-neutral-50">
          <div className="flex flex-col items-center justify-center py-20 px-8">
            <div className="w-20 h-20 bg-neutral-100 rounded-2xl flex items-center justify-center mb-6">
              <BarChart3 className="w-10 h-10 text-neutral-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-neutral-900">Ingen analyser ennå</h3>
            <p className="text-neutral-500 text-center max-w-md mb-8">
              Start din første analyse for å se historikken din her.
            </p>
            <Button asChild size="lg" className="rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white">
              <Link href="/dashboard?new=true">
                <Plus className="mr-2 h-5 w-5" />
                Start din første analyse
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
        <div className="space-y-3">
          {paginatedAnalyses.map((analysis) => (
            <div key={analysis.id} className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 hover:border-neutral-300 transition-all overflow-hidden">
              <div className="flex flex-col gap-4">
                {/* Top row: Score + URL */}
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                  {/* Score Circle */}
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${
                    analysis.overall_score >= 90 ? 'bg-green-50' :
                    analysis.overall_score >= 70 ? 'bg-emerald-50' :
                    analysis.overall_score >= 50 ? 'bg-amber-50' : 'bg-red-50'
                  }`}>
                    <span className={`text-lg sm:text-xl font-bold ${
                      analysis.overall_score >= 90 ? 'text-green-600' :
                      analysis.overall_score >= 70 ? 'text-emerald-600' :
                      analysis.overall_score >= 50 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {analysis.overall_score}
                    </span>
                  </div>
                  
                  {/* URL and Date */}
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2 min-w-0">
                      <Globe className="h-4 w-4 text-neutral-400 shrink-0" />
                      <span className="font-medium text-neutral-900 truncate text-sm sm:text-base">{analysis.url}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-500 mt-0.5">
                      <Clock className="h-3 sm:h-3.5 w-3 sm:w-3.5 shrink-0" />
                      <span className="truncate">{formatDate(analysis.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom row: Scores + Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  {/* Individual Scores */}
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium ${getScoreBadge(analysis.seo_score)}`}>
                      SEO {analysis.seo_score}
                    </span>
                    <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium ${getScoreBadge(analysis.content_score)}`}>
                      Innhold {analysis.content_score}
                    </span>
                    <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium ${getScoreBadge(analysis.security_score)}`}>
                      Sikkerhet {analysis.security_score}
                    </span>
                    {typeof analysis.performance_score === 'number' ? (
                      <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium ${getScoreBadge(analysis.performance_score)}`}>
                        Hastighet {analysis.performance_score}
                      </span>
                    ) : (
                      <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium bg-neutral-100 text-neutral-500">
                        Hastighet —
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:ml-auto shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 sm:h-10 rounded-xl border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs sm:text-sm"
                      disabled={rerunningAnalysis?.id === analysis.id}
                      onClick={() => handleRerunAnalysis(analysis)}
                    >
                      {rerunningAnalysis?.id === analysis.id ? (
                        <Loader2 className="h-3.5 sm:h-4 w-3.5 sm:w-4 animate-spin mr-1.5 sm:mr-2" />
                      ) : (
                        <RefreshCw className="h-3.5 sm:h-4 w-3.5 sm:w-4 mr-1.5 sm:mr-2" />
                      )}
                      <span className="hidden min-[400px]:inline">Kjør på nytt</span>
                      <span className="min-[400px]:hidden">Kjør</span>
                    </Button>
                    <Button variant="outline" className="h-9 sm:h-10 rounded-xl border-neutral-200 hover:bg-neutral-50 text-xs sm:text-sm" asChild>
                      <Link href={`/dashboard?analysisId=${analysis.id}`}>
                        <span className="hidden min-[400px]:inline">Se detaljer</span>
                        <span className="min-[400px]:hidden">Detaljer</span>
                        <ArrowRight className="ml-1.5 sm:ml-2 h-3.5 sm:h-4 w-3.5 sm:w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 sm:h-10 w-9 sm:w-10 p-0 rounded-xl border-neutral-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-neutral-400"
                      onClick={() => setDeleteConfirm({ id: analysis.id, url: analysis.url })}
                    >
                      <Trash2 className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {analyses.length > ANALYSES_PER_PAGE && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-neutral-200">
            <p className="text-sm text-neutral-500">
              Viser {from}–{to} av {analyses.length} analyser
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-lg border-neutral-200"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4 mr-0.5" />
                Forrige
              </Button>
              <span className="text-sm text-neutral-600 px-2 tabular-nums">
                Side {page} av {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-lg border-neutral-200"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Neste
                <ChevronRight className="h-4 w-4 ml-0.5" />
              </Button>
            </div>
          </div>
        )}
        </>
      )}

      {/* CTA: Premium-oppgradering for gratis, Kontakt Mediabooster for premium */}
      {analyses.length > 0 && (
        <div className="rounded-2xl bg-neutral-900 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              {isPremium ? (
                <>
                  <h3 className="font-semibold text-white">Spørsmål eller trenger du hjelp?</h3>
                  <p className="text-sm text-neutral-400">Ta kontakt med Mediabooster – vi er her for deg.</p>
                </>
              ) : (
                <>
                  <h3 className="font-semibold text-white">Trenger du flere analyser?</h3>
                  <p className="text-sm text-neutral-400">Oppgrader til Premium for ubegrenset tilgang.</p>
                </>
              )}
            </div>
          </div>
          <Button className="bg-white text-neutral-900 hover:bg-neutral-100 rounded-xl" asChild>
            <a href="https://mediabooster.no/kontakt" target="_blank" rel="noopener noreferrer">
              Kontakt Mediabooster
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
