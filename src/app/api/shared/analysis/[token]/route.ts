import { NextRequest, NextResponse } from 'next/server';
import { getSharedAnalysisByToken } from '@/lib/analysis-share';

interface RouteParams {
  params: Promise<{ token: string }>;
}

/** @deprecated Use /api/public/analysis/[token] — kept for backward compatibility. */
export async function GET(_: NextRequest, { params }: RouteParams) {
  const { token } = await params;
  const analysis = await getSharedAnalysisByToken(token);

  if (!analysis) {
    return NextResponse.json({ error: 'Lenken er ugyldig eller utløpt' }, { status: 404 });
  }

  return NextResponse.json({ analysis });
}
