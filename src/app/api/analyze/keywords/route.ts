import { NextRequest, NextResponse } from 'next/server';
import { generateKeywordResearch } from '@/lib/services/openai';

export const maxDuration = 30; // Allow up to 30 seconds for keyword research

interface KeywordAnalyzeRequest {
  keywords: string[];
  url?: string;
  industry?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as KeywordAnalyzeRequest;
    const { keywords = [], industry } = body;

    if (keywords.length === 0) {
      return NextResponse.json({ error: 'No keywords provided' }, { status: 400 });
    }

    // Limit to 10 keywords max
    const limitedKeywords = keywords.slice(0, 10);

    // Run keyword research
    const keywordResult = await generateKeywordResearch(limitedKeywords, industry);

    if (!keywordResult || keywordResult.keywords.length === 0) {
      return NextResponse.json({ error: 'Failed to generate keyword research' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      keywordResearch: keywordResult.keywords,
      tokensUsed: keywordResult.tokensUsed,
      costUsd: keywordResult.costUsd,
    });
  } catch (error) {
    console.error('Keyword research error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Keyword research failed' },
      { status: 500 }
    );
  }
}
