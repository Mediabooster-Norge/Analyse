import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { claimPreviewAnalysis } from '@/lib/preview-analysis';

interface ClaimRequest {
  token?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as ClaimRequest;
    const token = body.token?.trim();

    if (!token) {
      return NextResponse.json({ error: 'Token mangler' }, { status: 400 });
    }

    const outcome = await claimPreviewAnalysis(token, user.id);

    if ('error' in outcome) {
      return NextResponse.json({ error: outcome.error }, { status: outcome.status });
    }

    return NextResponse.json({
      success: true,
      analysisId: outcome.analysisId,
    });
  } catch (error) {
    console.error('Preview claim error:', error);
    return NextResponse.json(
      { error: 'Kunne ikke knytte analysen til kontoen din' },
      { status: 500 }
    );
  }
}
