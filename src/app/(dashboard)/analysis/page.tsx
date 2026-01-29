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
} from 'lucide-react';
import Link from 'next/link';

interface AnalysisRaw {
  id: string;
  overall_score: number;
  seo_results: { score: number } | null;
  content_results: { score: number } | null;
  security_results: { score: number } | null;
  created_at: string;
  status: string;
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
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  const CACHE_KEY = 'analyses_cache';

  // Load cached data on mount
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        if (data.analyses && data.analyses.length > 0) {
          setAnalyses(data.analyses);
          setLoading(false);
        }
      }
    } catch {
      // Ignore cache errors
    }
  }, []);

  useEffect(() => {
    async function fetchAnalyses() {
      const supabase = createClient();
      
      // Get user's company
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: company } = await supabase
        .from('companies')
        .select('id, website_url')
        .eq('user_id', user.id)
        .single();

      if (!company) {
        setLoading(false);
        return;
      }

      // Get analyses for this company
      const { data: analysesData, error } = await supabase
        .from('analyses')
        .select('id, overall_score, seo_results, content_results, security_results, created_at, status')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching analyses:', error);
      } else if (analysesData) {
        // Map raw data to Analysis interface
        const mappedAnalyses: Analysis[] = analysesData.map((a: AnalysisRaw) => ({
          id: a.id,
          url: company.website_url,
          overall_score: a.overall_score || 0,
          seo_score: a.seo_results?.score || 0,
          content_score: a.content_results?.score || 0,
          security_score: a.security_results?.score || 0,
          created_at: a.created_at,
          status: a.status,
        }));
        setAnalyses(mappedAnalyses);
        // Save to cache
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ analyses: mappedAnalyses, timestamp: Date.now() }));
        } catch {
          // Ignore cache errors
        }
      }
      
      setLoading(false);
    }

    fetchAnalyses();
  }, []);

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

                {/* View Button */}
                <Button variant="outline" className="h-10 rounded-xl border-neutral-200 hover:bg-neutral-50" asChild>
                  <Link href={`/dashboard?analysisId=${analysis.id}`}>
                    Se detaljer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contact CTA */}
      {analyses.length > 0 && (
        <div className="rounded-2xl bg-neutral-900 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Trenger du flere analyser?</h3>
              <p className="text-sm text-neutral-400">Oppgrader til Premium for ubegrenset tilgang.</p>
            </div>
          </div>
          <Button className="bg-white text-neutral-900 hover:bg-neutral-100 rounded-xl" asChild>
            <a href="https://mediabooster.no/kontakt" target="_blank" rel="noopener noreferrer">
              Kontakt oss
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
