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
  Search,
  Shield,
  Eye,
  Sparkles,
  CheckCircle2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { usePremium } from '@/hooks/usePremium';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface AnalysisRaw {
  id: string;
  overall_score: number;
  seo_results: { score: number } | null;
  content_results: { score: number } | null;
  security_results: { score: number } | null;
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
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; url: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const RERUN_STEPS = [
    { label: 'Henter nettside', description: 'Laster inn innhold fra nettsiden', duration: '~5s', icon: Globe },
    { label: 'Analyserer SEO', description: 'Sjekker meta-tags, overskrifter og lenker', duration: '~10s', icon: Search },
    { label: 'Sjekker sikkerhet', description: 'Analyserer SSL-sertifikat og headers', duration: '~15s', icon: Shield },
    { label: 'AI-synlighet', description: 'Sjekker om AI kjenner til bedriften din', duration: '~10s', icon: Eye },
    { label: 'Genererer rapport', description: 'AI analyserer funnene og lager anbefalinger', duration: '~20s', icon: Sparkles },
  ];

  // Timer og steg-fremdrift mens «Kjør på nytt» kjører
  useEffect(() => {
    if (!rerunningAnalysis) return;
    setRerunStep(0);
    setRerunElapsedTime(0);
    const timeInterval = setInterval(() => setRerunElapsedTime((t) => t + 1), 1000);
    const stepInterval = setInterval(() => {
      setRerunStep((s) => Math.min(s + 1, RERUN_STEPS.length - 1));
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
        .select('id, overall_score, seo_results, content_results, security_results, created_at, status, website_url, website_name')
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
      const data = await res.json();

      if (!res.ok) {
        const message = data?.error || 'Kunne ikke kjøre analysen på nytt';
        if (data?.limitReached) {
          toast.error(message, { description: 'Oppgrader til Premium for flere analyser.' });
        } else {
          toast.error(message);
        }
        return;
      }

      toast.success('Analysen er ferdig.');
      router.push(`/dashboard?analysisId=${data.analysisId}`);
    } catch {
      toast.error('Noe gikk galt. Prøv igjen.');
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
      {/* Modal mens «Kjør på nytt» kjører */}
      <Dialog open={!!rerunningAnalysis} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0" showCloseButton={false}>
          {rerunningAnalysis && (
            <>
              <div className="p-6 pb-0">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-700 flex items-center justify-center">
                    {(() => {
                      const StepIcon = RERUN_STEPS[rerunStep]?.icon || Loader2;
                      return <StepIcon className="h-5 w-5 text-white animate-pulse" />;
                    })()}
                  </div>
                  <div>
                    <DialogHeader className="p-0 space-y-0">
                      <DialogTitle className="text-lg">Kjører analyse på nytt</DialogTitle>
                      <DialogDescription className="text-sm">
                        {RERUN_STEPS[rerunStep]?.label} · SEO, sikkerhet, innhold og AI-synlighet
                      </DialogDescription>
                    </DialogHeader>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 text-sm font-medium tabular-nums">
                      {Math.floor(rerunElapsedTime / 60)}:{(rerunElapsedTime % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-5 p-6 pt-4">
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-neutral-400" />
                    <span className="font-medium text-neutral-900 truncate">{rerunningAnalysis.url}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                  <div className="relative w-14 h-14 shrink-0">
                    <div className="absolute inset-0 rounded-full border-2 border-neutral-200" />
                    <svg className="absolute inset-0 w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                      <circle
                        cx="28"
                        cy="28"
                        r="25"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="text-neutral-900 transition-all duration-500"
                        strokeDasharray={`${((rerunStep + 1) / RERUN_STEPS.length) * 157} 157`}
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900">{RERUN_STEPS[rerunStep]?.label}</p>
                    <p className="text-sm text-neutral-500 mt-0.5">{RERUN_STEPS[rerunStep]?.description}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-200 overflow-hidden">
                  <div className="relative">
                    <div className="absolute left-5 top-0 bottom-0 w-px bg-neutral-200" />
                    <div
                      className="absolute left-5 top-0 w-px bg-neutral-900 transition-all duration-500"
                      style={{ height: `${(rerunStep / Math.max(1, RERUN_STEPS.length - 1)) * 100}%` }}
                    />
                    <div className="divide-y divide-neutral-100">
                      {RERUN_STEPS.map((step, index) => {
                        const StepIcon = step.icon;
                        const isComplete = index < rerunStep;
                        const isCurrent = index === rerunStep;
                        const isPending = index > rerunStep;
                        return (
                          <div
                            key={index}
                            className={`relative flex items-center gap-4 px-4 py-3 transition-colors ${isCurrent ? 'bg-neutral-50' : ''}`}
                          >
                            <div
                              className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                isComplete ? 'bg-neutral-900' : isCurrent ? 'bg-neutral-900' : 'bg-neutral-100'
                              }`}
                            >
                              {isComplete ? (
                                <CheckCircle2 className="h-5 w-5 text-white" />
                              ) : isCurrent ? (
                                <StepIcon className="h-5 w-5 text-white animate-pulse" />
                              ) : (
                                <StepIcon className={`h-5 w-5 ${isPending ? 'text-neutral-400' : 'text-neutral-600'}`} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium text-sm ${isComplete ? 'text-neutral-700' : isCurrent ? 'text-neutral-900' : 'text-neutral-400'}`}>
                                {step.label}
                              </p>
                              <p className="text-xs text-neutral-500">{step.description}</p>
                            </div>
                            <span className="text-xs font-medium text-neutral-400 tabular-nums shrink-0">
                              {isComplete ? '✓' : step.duration}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-neutral-200 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-neutral-600" />
                    </div>
                    <p className="text-sm text-neutral-600">
                      <span className="font-medium text-neutral-900">Analysen kjører.</span> Vanligvis ferdig under ett minutt.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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
        <div className="space-y-3">
          {analyses.map((analysis) => (
            <div key={analysis.id} className="rounded-2xl border border-neutral-200 bg-white p-5 hover:border-neutral-300 transition-all">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Score Circle */}
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    analysis.overall_score >= 90 ? 'bg-green-50' :
                    analysis.overall_score >= 70 ? 'bg-emerald-50' :
                    analysis.overall_score >= 50 ? 'bg-amber-50' : 'bg-red-50'
                  }`}>
                    <span className={`text-xl font-bold ${
                      analysis.overall_score >= 90 ? 'text-green-600' :
                      analysis.overall_score >= 70 ? 'text-emerald-600' :
                      analysis.overall_score >= 50 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {analysis.overall_score}
                    </span>
                  </div>
                  
                  {/* URL and Date */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-neutral-400 shrink-0" />
                      <span className="font-medium text-neutral-900 truncate">{analysis.url}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-500 mt-0.5">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(analysis.created_at)}
                    </div>
                  </div>
                </div>

                {/* Individual Scores */}
                <div className="flex items-center gap-2 md:ml-auto flex-wrap">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getScoreBadge(analysis.seo_score)}`}>
                    SEO {analysis.seo_score}
                  </span>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getScoreBadge(analysis.content_score)}`}>
                    Innhold {analysis.content_score}
                  </span>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getScoreBadge(analysis.security_score)}`}>
                    Sikkerhet {analysis.security_score}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 rounded-xl border-neutral-200 hover:bg-neutral-50 text-neutral-700"
                    disabled={rerunningAnalysis?.id === analysis.id}
                    onClick={() => handleRerunAnalysis(analysis)}
                  >
                    {rerunningAnalysis?.id === analysis.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Kjør på nytt
                  </Button>
                  <Button variant="outline" className="h-10 rounded-xl border-neutral-200 hover:bg-neutral-50" asChild>
                    <Link href={`/dashboard?analysisId=${analysis.id}`}>
                      Se detaljer
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 w-10 p-0 rounded-xl border-neutral-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-neutral-400"
                    onClick={() => setDeleteConfirm({ id: analysis.id, url: analysis.url })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
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
