'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { AlertCircle } from 'lucide-react';
import { LandingNav } from '@/components/landing/landing-nav';
import { AnalyzeUrlModalProvider } from '@/components/landing/analyze-url-dialog';
import { TeaserOverview } from '@/components/landing/teaser-overview';
import { AnalysisProgressView } from '@/components/features/dashboard/analysis-progress-view';
import { GUEST_ANALYSIS_STEPS } from '@/components/features/dashboard/analysis-steps';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { DashboardAnalysisResult } from '@/types/dashboard';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { normalizeUrl } from '@/lib/utils/score-utils';

interface PreviewPayload {
  token: string;
  websiteUrl: string;
  websiteName: string | null;
  result: DashboardAnalysisResult;
}

const GUEST_STEP_TIMINGS_MS = [5000, 8000, 12000, 18000, 35000, 55000];

function AnalysePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlParam = searchParams.get('url')?.trim() || '';
  const tokenParam = searchParams.get('token')?.trim() || '';

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [urlInput, setUrlInput] = useState(urlParam);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(Boolean(tokenParam));
  const startedRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      setUser(authUser);
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!analyzing) return;
    const interval = setInterval(() => setElapsedTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [analyzing]);

  useEffect(() => {
    if (!analyzing) return;
    const timeouts = GUEST_STEP_TIMINGS_MS.map((ms, index) =>
      setTimeout(
        () => setAnalysisStep(Math.min(index, GUEST_ANALYSIS_STEPS.length - 1)),
        ms
      )
    );
    return () => timeouts.forEach(clearTimeout);
  }, [analyzing]);

  const loadPreview = useCallback(async (token: string) => {
    setLoadingPreview(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyze/preview/${token}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Kunne ikke laste forhåndsvisning');
        setPreview(null);
        return;
      }
      setPreview({
        token: data.preview.token,
        websiteUrl: data.preview.websiteUrl,
        websiteName: data.preview.websiteName,
        result: data.preview.result,
      });
    } catch {
      setError('Kunne ikke laste forhåndsvisning');
    } finally {
      setLoadingPreview(false);
    }
  }, []);

  const runPreviewAnalysis = useCallback(
    async (rawUrl: string) => {
      const trimmed = rawUrl.trim();
      if (!trimmed) {
        setError('Skriv inn en nettadresse');
        return;
      }

      setError(null);
      setAnalyzing(true);
      setAnalysisStep(0);
      setElapsedTime(0);
      setPreview(null);

      try {
        const res = await fetch('/api/analyze/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmed }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Analysen feilet');
          return;
        }

        router.replace(`/analyse?token=${data.token}`);
        await loadPreview(data.token);
      } catch {
        setError('Analysen feilet. Prøv igjen.');
      } finally {
        setAnalyzing(false);
      }
    },
    [loadPreview, router]
  );

  useEffect(() => {
    if (tokenParam) {
      void loadPreview(tokenParam);
      return;
    }
    if (urlParam && !startedRef.current && !authLoading) {
      startedRef.current = true;
      if (user) {
        router.replace('/dashboard');
        return;
      }
      void runPreviewAnalysis(urlParam);
    }
  }, [tokenParam, urlParam, loadPreview, runPreviewAnalysis, user, authLoading, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      router.push('/dashboard');
      return;
    }
    router.push(`/analyse?url=${encodeURIComponent(urlInput.trim())}`);
    void runPreviewAnalysis(urlInput);
  };

  const displayUrl = preview
    ? preview.websiteUrl
    : urlParam
      ? normalizeUrl(urlParam)
      : '';

  const effectiveStep = Math.min(analysisStep, GUEST_ANALYSIS_STEPS.length - 1);
  const currentStep = GUEST_ANALYSIS_STEPS[effectiveStep];
  const asyncPhase = analyzing && analysisStep >= 4;

  return (
    <AnalyzeUrlModalProvider user={user}>
      <TooltipProvider delayDuration={300} skipDelayDuration={0}>
      <div className="min-h-screen bg-background">
        <LandingNav user={user} loading={authLoading} />

        <Dialog open={analyzing} onOpenChange={() => {}}>
          <DialogContent
            className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-xl"
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
            showCloseButton={false}
          >
            <VisuallyHidden.Root asChild>
              <DialogTitle>Analyserer nettside</DialogTitle>
            </VisuallyHidden.Root>
            <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6">
              <AnalysisProgressView
                analysisSteps={GUEST_ANALYSIS_STEPS}
                effectiveStep={effectiveStep}
                elapsedTime={elapsedTime}
                showStepLabel={currentStep.label}
                showStepDesc={currentStep.description}
                asyncCurrentStep={asyncPhase}
                websiteUrl={displayUrl.replace(/^https?:\/\//, '')}
              />
            </div>
          </DialogContent>
        </Dialog>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-8 sm:pb-12">
          {!tokenParam && !urlParam && !analyzing && !preview && (
            <div className="text-center mb-8">
              <h1 className="font-serif text-2xl sm:text-3xl tracking-tight">Analyser nettsiden din</h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                Gratis smakebit – opprett konto for full rapport og AI-forslag.
              </p>
            </div>
          )}

          {!tokenParam && !urlParam && !analyzing && !preview && (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-xl mx-auto mb-10">
              <Input
                type="text"
                placeholder="dinbedrift.no"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1"
                autoFocus
              />
              <Button type="submit" className="shrink-0">
                Analyser gratis
              </Button>
            </form>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loadingPreview && !analyzing && (
            <p className="text-center text-muted-foreground">Laster resultater…</p>
          )}

          {preview && !analyzing && (
            <TeaserOverview
              result={preview.result}
              websiteUrl={preview.websiteUrl}
              websiteName={preview.websiteName}
              previewToken={preview.token}
            />
          )}

          {!analyzing && !loadingPreview && (error || (!preview && (tokenParam || urlParam))) && (
            <div className="text-center mt-6">
              <Button variant="outline" asChild>
                <Link href="/">Tilbake til forsiden</Link>
              </Button>
            </div>
          )}
        </main>
      </div>
      </TooltipProvider>
    </AnalyzeUrlModalProvider>
  );
}

export default function AnalysePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <AnalysePageContent />
    </Suspense>
  );
}
