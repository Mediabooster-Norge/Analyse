import { NextRequest, NextResponse } from 'next/server';
import { analyzeCompetitorsOnly } from '@/lib/analyzers';

export const maxDuration = 60; // Allow up to 60 seconds for analysis

interface CompetitorAnalyzeRequest {
  mainUrl: string;
  competitorUrls: string[];
  existingCompetitors?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CompetitorAnalyzeRequest;
    const { competitorUrls = [] } = body;

    if (competitorUrls.length === 0) {
      return NextResponse.json({ error: 'No new competitors to analyze' }, { status: 400 });
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

    return NextResponse.json({
      success: true,
      competitors,
    });
  } catch (error) {
    console.error('Competitor analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Competitor analysis failed' },
      { status: 500 }
    );
  }
}
