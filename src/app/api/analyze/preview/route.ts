import { NextRequest, NextResponse } from 'next/server';
import { runFullAnalysis, calculateOverallScore } from '@/lib/analyzers';
import { normalizeUrl } from '@/lib/utils/score-utils';
import { analyzePageSpeedWithLighthouse } from '@/lib/services/pagespeed';
import { parseAccessibilityAudits } from '@/lib/services/accessibility-audits';
import type { AccessibilityResults } from '@/types';
import {
  countRecentPreviewsForIp,
  generatePreviewToken,
  getClientIp,
  hashClientIp,
  isPreviewRateLimited,
  savePreviewAnalysis,
} from '@/lib/preview-analysis';

export const maxDuration = 180;

interface PreviewAnalyzeRequest {
  url?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PreviewAnalyzeRequest;
    const { url: bodyUrl } = body;

    if (!bodyUrl?.trim()) {
      return NextResponse.json({ error: 'URL er påkrevd' }, { status: 400 });
    }

    const normalizedUrl = normalizeUrl(bodyUrl);

    try {
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json({ error: 'Ugyldig URL-format' }, { status: 400 });
    }

    const clientIp = getClientIp(request);
    const ipHash = hashClientIp(clientIp);
    const recentCount = await countRecentPreviewsForIp(ipHash);

    if (isPreviewRateLimited(recentCount)) {
      return NextResponse.json(
        {
          error: 'Du har nådd grensen for gratis forhåndsanalyser i dag. Opprett konto for full tilgang.',
          limitReached: true,
        },
        { status: 429 }
      );
    }

    const websiteName = new URL(normalizedUrl).hostname.replace(/^www\./, '');

    const result = await runFullAnalysis(normalizedUrl, {
      includeAI: false,
      isPremium: false,
      skipPageSpeed: true,
      quickSecurityScan: true,
    });

    let pageSpeedResults = result.pageSpeedResults ?? null;
    let accessibilityResults: AccessibilityResults | null = null;

    try {
      const pageSpeedAnalysis = await analyzePageSpeedWithLighthouse(normalizedUrl, {
        timeout: 90_000,
      });
      pageSpeedResults = pageSpeedAnalysis.results;
      accessibilityResults = parseAccessibilityAudits(
        pageSpeedAnalysis.lighthouse as Parameters<typeof parseAccessibilityAudits>[0]
      );
    } catch (err) {
      console.warn('[Preview] PageSpeed/accessibility skipped:', err);
    }

    const performanceScore =
      pageSpeedResults && pageSpeedResults.performance > 0 ? pageSpeedResults.performance : undefined;
    const overallScore = calculateOverallScore(
      result.seoResults.score,
      result.contentResults.score,
      result.securityResults.score,
      performanceScore
    );

    const token = generatePreviewToken();

    const { expiresAt } = await savePreviewAnalysis({
      token,
      websiteUrl: normalizedUrl,
      websiteName,
      overallScore,
      seoResults: result.seoResults,
      contentResults: result.contentResults,
      securityResults: result.securityResults,
      pagespeedResults: pageSpeedResults,
      accessibilityResults,
      ipHash,
    });

    return NextResponse.json({
      success: true,
      token,
      websiteUrl: normalizedUrl,
      websiteName,
      overallScore,
      expiresAt,
    });
  } catch (error) {
    console.error('Preview analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysen feilet' },
      { status: 500 }
    );
  }
}
