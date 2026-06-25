import { NextRequest, NextResponse } from 'next/server';
import { getPreviewByToken } from '@/lib/preview-analysis';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Token mangler' }, { status: 400 });
    }

    const preview = await getPreviewByToken(token);

    if (!preview) {
      return NextResponse.json(
        { error: 'Forhåndsvisningen er utløpt eller ugyldig' },
        { status: 404 }
      );
    }

    return NextResponse.json({ preview });
  } catch (error) {
    console.error('Preview fetch error:', error);
    return NextResponse.json(
      { error: 'Kunne ikke hente forhåndsvisning' },
      { status: 500 }
    );
  }
}
