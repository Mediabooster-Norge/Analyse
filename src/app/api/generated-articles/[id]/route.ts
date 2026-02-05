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
    .select('*')
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

export async function PATCH(
  request: NextRequest,
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

  const body = await request.json();
  const { featured_image_url, featured_image_attribution } = body as {
    featured_image_url?: string;
    featured_image_attribution?: string;
  };

  // Only allow updating image fields for now
  const updates: Record<string, string> = {};
  if (featured_image_url) updates.featured_image_url = featured_image_url;
  if (featured_image_attribution) updates.featured_image_attribution = featured_image_attribution;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Ingen felter å oppdatere' }, { status: 400 });
  }

  const { error } = await supabase
    .from('generated_articles')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('generated-article patch error:', error);
    return NextResponse.json(
      { error: 'Kunne ikke oppdatere artikkel' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
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
