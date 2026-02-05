import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchFeaturedImage } from '@/lib/services/unsplash';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Du må være logget inn' }, { status: 401 });
    }

    const body = await request.json();
    const { searchQuery } = body as { searchQuery?: string };

    if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.trim().length === 0) {
      return NextResponse.json(
        { error: 'Søkeord er påkrevd' },
        { status: 400 }
      );
    }

    // Pass randomize=true to get a different image each time
    const unsplash = await fetchFeaturedImage(searchQuery.trim(), true);
    
    if (!unsplash) {
      return NextResponse.json(
        { error: 'Kunne ikke finne bilde' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      featuredImageUrl: unsplash.url,
      featuredImageDownloadUrl: unsplash.downloadUrl,
      featuredImageAttribution: unsplash.attribution,
      featuredImageProfileUrl: unsplash.profileUrl,
    });
  } catch (err) {
    console.error('regenerate-image error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kunne ikke hente bilde' },
      { status: 500 }
    );
  }
}
