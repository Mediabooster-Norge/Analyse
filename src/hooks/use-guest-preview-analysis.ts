'use client';

import { useCallback, useEffect, useState } from 'react';
import type { DashboardAnalysisResult } from '@/types/dashboard';

export interface GuestPreviewPayload {
  token: string;
  websiteUrl: string;
  websiteName: string | null;
  result: DashboardAnalysisResult;
}

export function useGuestPreviewAnalysis() {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<GuestPreviewPayload | null>(null);

  useEffect(() => {
    if (!analyzing) return;
    const interval = setInterval(() => setElapsedTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [analyzing]);

  useEffect(() => {
    if (!analyzing) return;
    const timings = [4000, 12000, 22000, 45000, 70000];
    const timeouts = timings.map((ms, index) =>
      setTimeout(() => setAnalysisStep(index), ms)
    );
    return () => timeouts.forEach(clearTimeout);
  }, [analyzing]);

  const reset = useCallback(() => {
    setAnalyzing(false);
    setAnalysisStep(0);
    setElapsedTime(0);
    setError(null);
    setPreview(null);
  }, []);

  const runAnalysis = useCallback(async (rawUrl: string) => {
    const trimmed = rawUrl.trim();
    if (!trimmed) {
      setError('Skriv inn en nettadresse');
      return false;
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
        return false;
      }

      const previewRes = await fetch(`/api/analyze/preview/${data.token}`);
      const previewData = await previewRes.json();

      if (!previewRes.ok) {
        setError(previewData.error || 'Kunne ikke laste resultater');
        return false;
      }

      setPreview({
        token: previewData.preview.token,
        websiteUrl: previewData.preview.websiteUrl,
        websiteName: previewData.preview.websiteName,
        result: previewData.preview.result,
      });
      return true;
    } catch {
      setError('Analysen feilet. Prøv igjen.');
      return false;
    } finally {
      setAnalyzing(false);
    }
  }, []);

  return {
    analyzing,
    analysisStep,
    elapsedTime,
    error,
    preview,
    runAnalysis,
    reset,
    setError,
  };
}
