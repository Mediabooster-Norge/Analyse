import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Mangler artikkel-id' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Du må være logget inn' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('generated_articles')
    .select('id, title, content, website_url, website_name, meta_title, meta_description, featured_image_suggestion, featured_image_url, featured_image_attribution, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('generated-article get error:', error);
    return NextResponse.json(
      { error: 'Kunne ikke hente artikkel' },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ error: 'Artikkelen finnes ikke' }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Mangler artikkel-id' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Du må være logget inn' }, { status: 401 });
  }

  // Delete only the article content, not the article_generations record
  // This way the generation still counts toward the user's limit
  const { error } = await supabase
    .from('generated_articles')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('generated-article delete error:', error);
    return NextResponse.json(
      { error: 'Kunne ikke slette artikkel' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
