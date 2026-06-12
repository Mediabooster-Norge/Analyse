import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateKeywordResearch } from '@/lib/services/openai';
import { getPremiumStatusServer } from '@/lib/premium-server';
import {
  checkMonthlyAnalysisQuota,
  recordAnalysisQuotaEvent,
  buildAnalysisLimitError,
} from '@/lib/analysis-quota';

export const maxDuration = 30; // Allow up to 30 seconds for keyword research

interface KeywordAnalyzeRequest {
  keywords: string[];
  url?: string;
  industry?: string;
  analysisId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as KeywordAnalyzeRequest;
    const { keywords = [], industry, analysisId } = body;

    if (keywords.length === 0) {
      return NextResponse.json({ error: 'No keywords provided' }, { status: 400 });
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

    // Limit to 10 keywords max
    const limitedKeywords = keywords.slice(0, 10);

    // Run keyword research
    const keywordResult = await generateKeywordResearch(limitedKeywords, industry);

    if (!keywordResult || keywordResult.keywords.length === 0) {
      return NextResponse.json({ error: 'Failed to generate keyword research' }, { status: 500 });
    }

    await recordAnalysisQuotaEvent(supabase, user.id, analysisId, 'keyword_update');

    const remainingAnalyses =
      quota.limit >= 999 ? quota.limit : Math.max(0, quota.limit - quota.usage - 1);

    return NextResponse.json({
      success: true,
      keywordResearch: keywordResult.keywords,
      tokensUsed: keywordResult.tokensUsed,
      costUsd: keywordResult.costUsd,
      remainingAnalyses,
      monthlyLimit: quota.limit,
    });
  } catch (error) {
    console.error('Keyword research error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Keyword research failed' },
      { status: 500 }
    );
  }
}
