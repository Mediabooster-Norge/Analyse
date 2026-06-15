import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPremiumStatusServer } from '@/lib/premium-server';
import { getKeywordLimit } from '@/lib/constants/premium';
import { generateKeywordResearchForList } from '@/lib/utils/keyword-research';
import { verifyAnalysisOwnership } from '@/lib/analysis-ownership';
import {
  checkMonthlyAnalysisQuota,
  recordAnalysisQuotaEvent,
  buildAnalysisLimitError,
} from '@/lib/analysis-quota';

export const maxDuration = 60;

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

    const keywordLimit = getKeywordLimit(premiumStatus.isPremium);
    const limitedKeywords = keywords
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, keywordLimit);

    const keywordResult = await generateKeywordResearchForList(limitedKeywords, industry);

    if (!keywordResult || keywordResult.keywords.length === 0) {
      return NextResponse.json({ error: 'Failed to generate keyword research' }, { status: 500 });
    }

    if (analysisId) {
      const ownsAnalysis = await verifyAnalysisOwnership(supabase, user.id, analysisId);
      if (!ownsAnalysis) {
        return NextResponse.json({ error: 'Analysen finnes ikke eller du har ikke tilgang.' }, { status: 404 });
      }

      const { error: saveError } = await supabase
        .from('analyses')
        .update({ keyword_research: keywordResult.keywords })
        .eq('id', analysisId)
        .eq('user_id', user.id);

      if (saveError) {
        console.error('Keyword research save error:', saveError);
        return NextResponse.json(
          { error: 'Kunne ikke lagre nøkkelordanalyse. Prøv igjen.' },
          { status: 500 }
        );
      }
    }

    await recordAnalysisQuotaEvent(supabase, user.id, analysisId, 'keyword_update');

    const remainingAnalyses =
      quota.limit >= 999 ? quota.limit : Math.max(0, quota.limit - quota.usage - 1);

    const normalizedInput = keywords.map((k) => k.trim().toLowerCase()).filter(Boolean);

    return NextResponse.json({
      success: true,
      keywordResearch: keywordResult.keywords,
      tokensUsed: keywordResult.tokensUsed,
      costUsd: keywordResult.costUsd,
      remainingAnalyses,
      monthlyLimit: quota.limit,
      keywordLimit,
      truncated: normalizedInput.length > limitedKeywords.length,
    });
  } catch (error) {
    console.error('Keyword research error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Keyword research failed' },
      { status: 500 }
    );
  }
}
