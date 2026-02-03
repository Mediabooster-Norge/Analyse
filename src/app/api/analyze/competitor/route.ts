import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeCompetitorsOnly } from '@/lib/analyzers';

export const maxDuration = 30; // Én konkurrent – scrape + analyse, god margin

interface CompetitorRequest {
  analysisId: string;
  competitorUrl: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as CompetitorRequest;
    const { analysisId, competitorUrl } = body;
    if (!analysisId || !competitorUrl) {
      return NextResponse.json({ error: 'analysisId and competitorUrl are required' }, { status: 400 });
    }

    const normalizedUrl = competitorUrl.startsWith('http') ? competitorUrl : `https://${competitorUrl}`;
    try {
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid competitor URL' }, { status: 400 });
    }

    const { data: analysis, error: fetchError } = await supabase
      .from('analyses')
      .select('id, competitor_results')
      .eq('id', analysisId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError || !analysis) {
      return NextResponse.json(
        { error: 'Analysen finnes ikke eller du har ikke tilgang.' },
        { status: 404 }
      );
    }

    const competitors = await analyzeCompetitorsOnly([normalizedUrl]);
    if (competitors.length === 0) {
      return NextResponse.json(
        { error: 'Kunne ikke analysere konkurrent-URL' },
        { status: 500 }
      );
    }

    const newCompetitor = competitors[0];
    const existing = Array.isArray(analysis.competitor_results) ? analysis.competitor_results : [];
    const updated = [...existing, newCompetitor];

    await supabase
      .from('analyses')
      .update({ competitor_results: updated })
      .eq('id', analysisId)
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      competitor: newCompetitor,
    });
  } catch (error) {
    console.error('Competitor analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Competitor analysis failed' },
      { status: 500 }
    );
  }
}
