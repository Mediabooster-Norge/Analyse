import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchFeaturedImage } from '@/lib/services/unsplash';
import {
  canRegenerate,
  getRegenerateCountLastHour,
  recordRegenerate,
} from '@/lib/featured-image-limit';

const LIMIT_EXPLANATION =
  'Du kan generere maks 3 nye bilder per time. Prøv igjen senere.';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Du må være logget inn' }, { status: 401 });
    }

    const { allowed, used, limit } = await canRegenerate(supabase, user.id);
    if (!allowed) {
      return NextResponse.json(
        {
          error: LIMIT_EXPLANATION,
          limitReached: true,
          regenerateUsed: used,
          regenerateLimit: limit,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { searchQuery, articleId, postId } = body as {
      searchQuery?: string;
      articleId?: string;
      postId?: string;
    };

    if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.trim().length === 0) {
      return NextResponse.json(
        { error: 'Søkeord er påkrevd' },
        { status: 400 }
      );
    }

    const aid = articleId && typeof articleId === 'string' ? articleId.trim() || null : null;
    const pid = postId && typeof postId === 'string' ? postId.trim() || null : null;

    if (!aid && !pid) {
      return NextResponse.json(
        { error: 'Artikkel eller SoMe-post må oppgis (articleId eller postId)' },
        { status: 400 }
      );
    }

    if (aid) {
      const { data: article } = await supabase
        .from('generated_articles')
        .select('id')
        .eq('id', aid)
        .eq('user_id', user.id)
        .maybeSingle();
      if (!article) {
        return NextResponse.json(
          { error: 'Artikkelen finnes ikke eller tilhører ikke deg' },
          { status: 403 }
        );
      }
    }
    if (pid) {
      const { data: post } = await supabase
        .from('generated_social_posts')
        .select('id')
        .eq('id', pid)
        .eq('user_id', user.id)
        .maybeSingle();
      if (!post) {
        return NextResponse.json(
          { error: 'Innlegget finnes ikke eller tilhører ikke deg' },
          { status: 403 }
        );
      }
    }

    const unsplash = await fetchFeaturedImage(searchQuery.trim(), true);
    if (!unsplash) {
      return NextResponse.json(
        { error: 'Kunne ikke finne bilde' },
        { status: 404 }
      );
    }

    // Re-check quota immediately before recording to reduce concurrent bypass
    const usedNow = await getRegenerateCountLastHour(supabase, user.id);
    if (usedNow >= limit) {
      return NextResponse.json(
        {
          error: LIMIT_EXPLANATION,
          limitReached: true,
          regenerateUsed: usedNow,
          regenerateLimit: limit,
        },
        { status: 429 }
      );
    }

    await recordRegenerate(supabase, user.id, aid, pid);

    const usedAfter = await getRegenerateCountLastHour(supabase, user.id);

    return NextResponse.json({
      success: true,
      featuredImageUrl: unsplash.url,
      featuredImageDownloadUrl: unsplash.downloadUrl,
      featuredImageAttribution: unsplash.attribution,
      featuredImageProfileUrl: unsplash.profileUrl,
      regenerateUsed: usedAfter,
      regenerateLimit: limit,
    });
  } catch (err) {
    console.error('regenerate-image error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kunne ikke hente bilde' },
      { status: 500 }
    );
  }
}
