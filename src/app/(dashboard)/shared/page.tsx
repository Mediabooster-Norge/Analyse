'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface SharedAnalysis {
  id: string;
  websiteUrl: string | null;
  websiteName: string | null;
  overallScore: number;
  seoResults: { score?: number } | null;
  contentResults: { score?: number; wordCount?: number } | null;
  securityResults: { score?: number } | null;
  pageSpeedResults: { performance?: number } | null;
  keywordResearch: Array<{ keyword: string }> | null;
  competitorResults: Array<{ url: string; results?: { overallScore?: number } }> | null;
  aiSummary: { overallAssessment?: string; keyFindings?: string[] } | null;
  aiVisibility: { score?: number } | null;
  createdAt: string;
}

export default function SharedAnalysesPage() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const [tokenInput, setTokenInput] = useState(tokenFromUrl);
  const [analysis, setAnalysis] = useState<SharedAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeToken = useMemo(() => tokenFromUrl || tokenInput.trim(), [tokenFromUrl, tokenInput]);

  const loadSharedAnalysis = async (token: string) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/shared/analysis/${token}`);
      const data = await res.json();
      if (!res.ok) {
        setAnalysis(null);
        setError(data.error || 'Kunne ikke laste delt analyse');
        return;
      }
      setAnalysis(data.analysis);
    } catch {
      setAnalysis(null);
      setError('Kunne ikke laste delt analyse');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokenFromUrl) {
      void loadSharedAnalysis(tokenFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenFromUrl]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Delte analyser</h1>
        <p className="text-neutral-500">Lim inn token fra delt lenke for å åpne full readonly analyse.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Åpne delt analyse</CardTitle>
          <CardDescription>Eksempel på lenke: /preview/abc123... bruk token-delen.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2">
          <Input
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Lim inn token"
          />
          <Button onClick={() => loadSharedAnalysis(tokenInput.trim())} disabled={loading || !tokenInput.trim()}>
            {loading ? 'Laster...' : 'Åpne'}
          </Button>
          {tokenFromUrl ? (
            <Button variant="outline" onClick={() => loadSharedAnalysis(activeToken)} disabled={loading}>
              Last fra URL
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Kunne ikke åpne delt analyse</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {analysis ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{analysis.websiteUrl || analysis.websiteName || 'Delt analyse'}</CardTitle>
              <CardDescription>Readonly visning av delt analyse</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Total: {analysis.overallScore}</Badge>
                <Badge variant="outline">SEO: {analysis.seoResults?.score ?? 0}</Badge>
                <Badge variant="outline">Innhold: {analysis.contentResults?.score ?? 0}</Badge>
                <Badge variant="outline">Sikkerhet: {analysis.securityResults?.score ?? 0}</Badge>
                <Badge variant="outline">Hastighet: {analysis.pageSpeedResults?.performance ?? '—'}</Badge>
              </div>
              <p className="text-xs text-neutral-500">
                Opprettet {new Date(analysis.createdAt).toLocaleString('nb-NO')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nøkkelord</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {(analysis.keywordResearch || []).length > 0 ? (
                analysis.keywordResearch?.map((k) => (
                  <Badge key={k.keyword} variant="outline">{k.keyword}</Badge>
                ))
              ) : (
                <p className="text-sm text-neutral-500">Ingen nøkkelord i analysen.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Konkurrenter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(analysis.competitorResults || []).length > 0 ? (
                analysis.competitorResults?.map((c) => (
                  <div key={c.url} className="flex items-center justify-between border rounded-lg p-2">
                    <span className="text-sm">{c.url}</span>
                    <Badge variant="outline">Score: {c.results?.overallScore ?? '—'}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-neutral-500">Ingen konkurrentdata i analysen.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">{analysis.aiSummary?.overallAssessment || 'Ingen AI-oppsummering tilgjengelig.'}</p>
              {analysis.aiSummary?.keyFindings?.length ? (
                <ul className="text-sm list-disc pl-5 space-y-1">
                  {analysis.aiSummary.keyFindings.map((f) => <li key={f}>{f}</li>)}
                </ul>
              ) : null}
              <p className="text-sm text-neutral-500">AI-synlighet: {analysis.aiVisibility?.score ?? '—'}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
