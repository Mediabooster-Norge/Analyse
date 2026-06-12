import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeCompetitorsOnly } from '@/lib/analyzers';
import { getPremiumStatusServer } from '@/lib/premium-server';
import {
  checkMonthlyAnalysisQuota,
  recordAnalysisQuotaEvent,
  buildAnalysisLimitError,
} from '@/lib/analysis-quota';

export const maxDuration = 60; // Allow up to 60 seconds for analysis

interface CompetitorAnalyzeRequest {
  mainUrl: string;
  competitorUrls: string[];
  existingCompetitors?: string[];
  analysisId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as CompetitorAnalyzeRequest;
    const { competitorUrls = [], analysisId } = body;

    if (competitorUrls.length === 0) {
      return NextResponse.json({ error: 'No new competitors to analyze' }, { status: 400 });
    }

    const premiumStatus = await getPremiumStatusServer(user);
    const quota = await checkMonthlyAnalysisQuota(supabase, user);

    if (quota.limitReached) {
      return NextResponse.json(
        {
          error: buildAnalysisLimitError(quota.limit, premiumStatus.isPremium),
          limitReached: true,
          remainingAnalyses: 0,
          monthlyLimit: quota.limit,
          analysisCount: quota.usage,
        },
        { status: 429 }
      );
    }

    // Validate URLs
    const validUrls: string[] = [];
    for (const url of competitorUrls) {
      const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
      try {
        new URL(normalizedUrl);
        validUrls.push(normalizedUrl);
      } catch {
        console.warn(`Skipping invalid URL: ${url}`);
      }
    }

    if (validUrls.length === 0) {
      return NextResponse.json({ error: 'No valid competitor URLs provided' }, { status: 400 });
    }

    // Run competitor analysis only
    const competitors = await analyzeCompetitorsOnly(validUrls);

    await recordAnalysisQuotaEvent(supabase, user.id, analysisId, 'competitor_update');

    const remainingAnalyses =
      quota.limit >= 999 ? quota.limit : Math.max(0, quota.limit - quota.usage - 1);

    return NextResponse.json({
      success: true,
      competitors,
      remainingAnalyses,
      monthlyLimit: quota.limit,
    });
  } catch (error) {
    console.error('Competitor analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Competitor analysis failed' },
      { status: 500 }
    );
  }
}
