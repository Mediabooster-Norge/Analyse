'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  BarChart3,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  Share2,
  Link2Off,
} from 'lucide-react';

interface SharedLinkItem {
  analysisId: string;
  token: string;
  shareUrl: string;
  url: string;
  overallScore: number;
  analysisCreatedAt: string;
  sharedAt: string;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getScoreColor(score: number) {
  if (score >= 90) return 'text-green-600 bg-green-100';
  if (score >= 70) return 'text-green-700 bg-green-50';
  if (score >= 50) return 'text-amber-700 bg-amber-100';
  return 'text-red-600 bg-red-100';
}

function SharedAnalysesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const [items, setItems] = useState<SharedLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    if (tokenFromUrl) {
      router.replace(`/preview/${encodeURIComponent(tokenFromUrl)}`);
    }
  }, [tokenFromUrl, router]);

  const loadShares = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setItems([]);
        return;
      }

      const { data, error } = await supabase
        .from('analysis_shares')
        .select(`
          analysis_id,
          public_token,
          updated_at,
          analyses (
            website_url,
            website_name,
            overall_score,
            created_at
          )
        `)
        .is('revoked_at', null)
        .not('public_token', 'is', null)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Failed to load shares:', error);
        toast.error('Kunne ikke laste delingslenker');
        setItems([]);
        return;
      }

      const origin = window.location.origin;
      const mapped: SharedLinkItem[] = (data ?? [])
        .filter((row) => row.public_token && row.analyses)
        .map((row) => {
          const analysis = row.analyses as {
            website_url: string | null;
            website_name: string | null;
            overall_score: number | null;
            created_at: string;
          };
          const url = analysis.website_url || analysis.website_name || 'Ukjent nettside';
          return {
            analysisId: row.analysis_id,
            token: row.public_token as string,
            shareUrl: `${origin}/preview/${row.public_token}`,
            url,
            overallScore: analysis.overall_score ?? 0,
            analysisCreatedAt: analysis.created_at,
            sharedAt: row.updated_at,
          };
        });

      setItems(mapped);
    } catch {
      toast.error('Kunne ikke laste delingslenker');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tokenFromUrl) return;
    void loadShares();
  }, [tokenFromUrl, loadShares]);

  const handleCopy = async (shareUrl: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Lenke kopiert');
    } catch {
      toast.error('Kunne ikke kopiere lenke');
    }
  };

  const handleRevoke = async (analysisId: string) => {
    setRevokingId(analysisId);
    try {
      const res = await fetch(`/api/analysis/${analysisId}/share`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Kunne ikke deaktivere lenke');
        return;
      }
      setItems((prev) => prev.filter((item) => item.analysisId !== analysisId));
      toast.success('Delingslenke deaktivert');
    } catch {
      toast.error('Kunne ikke deaktivere lenke');
    } finally {
      setRevokingId(null);
    }
  };

  if (tokenFromUrl) {
    return <div className="p-6 text-sm text-neutral-500">Åpner delt analyse...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Delte analyser</h1>
          <p className="text-neutral-500">
            Oversikt over analyser du har aktivert delingslenke for.
          </p>
        </div>
        <Button variant="outline" className="rounded-xl border-neutral-200" asChild>
          <Link href="/analysis">
            <BarChart3 className="mr-2 h-4 w-4" />
            Gå til analysehistorikk
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-gradient-to-br from-white to-neutral-50">
          <div className="flex flex-col items-center justify-center py-16 px-8">
            <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mb-4">
              <Share2 className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-neutral-900">Ingen aktive delingslenker</h3>
            <p className="text-neutral-500 text-center max-w-md mb-6 text-sm">
              Når du deler en analyse fra analysehistorikken, vises den her med lenke du kan kopiere.
            </p>
            <Button asChild className="rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white">
              <Link href="/analysis">Del en analyse</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.analysisId}
              className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 hover:border-neutral-300 transition-all"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${getScoreColor(item.overallScore)}`}
                  >
                    <span className="text-lg sm:text-xl font-bold">{item.overallScore}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Globe className="h-4 w-4 text-neutral-400 shrink-0" />
                      <span className="font-medium text-neutral-900 truncate text-sm sm:text-base">
                        {item.url}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-neutral-500 mt-1">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0" />
                        Analyse: {formatDate(item.analysisCreatedAt)}
                      </span>
                      <span>Delt: {formatDate(item.sharedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs break-all text-neutral-600">
                  {item.shareUrl}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-neutral-200"
                    onClick={() => handleCopy(item.shareUrl)}
                  >
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    Kopier lenke
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl border-neutral-200" asChild>
                    <Link href={`/preview/${item.token}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-3.5 w-3.5" />
                      Forhåndsvis
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl border-neutral-200" asChild>
                    <Link href={`/dashboard?analysisId=${item.analysisId}`}>
                      Åpne analyse
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-neutral-200 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
                    disabled={revokingId === item.analysisId}
                    onClick={() => handleRevoke(item.analysisId)}
                  >
                    {revokingId === item.analysisId ? (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Link2Off className="mr-2 h-3.5 w-3.5" />
                    )}
                    Deaktiver
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SharedAnalysesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-neutral-500">Laster delte analyser...</div>}>
      <SharedAnalysesPageContent />
    </Suspense>
  );
}
