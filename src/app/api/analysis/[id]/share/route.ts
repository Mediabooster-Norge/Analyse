import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateShareToken, getShareExpiration, hashShareToken } from '@/lib/analysis-share';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: analysisId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let regenerate = false;
  try {
    const body = await request.json();
    regenerate = Boolean(body?.regenerate);
  } catch {
    // Empty body is fine
  }

  const { data: analysis, error: analysisError } = await supabase
    .from('analyses')
    .select('id')
    .eq('id', analysisId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (analysisError || !analysis) {
    return NextResponse.json({ error: 'Fant ikke analyse' }, { status: 404 });
  }

  const { data: existingShare } = await supabase
    .from('analysis_shares')
    .select('public_token, revoked_at')
    .eq('analysis_id', analysisId)
    .eq('created_by', user.id)
    .maybeSingle();

  if (
    existingShare?.public_token &&
    !existingShare.revoked_at &&
    !regenerate
  ) {
    return NextResponse.json({
      shareUrl: `${request.nextUrl.origin}/preview/${existingShare.public_token}`,
    });
  }

  const token = generateShareToken();
  const tokenHash = hashShareToken(token);

  const { error: upsertError } = await supabase
    .from('analysis_shares')
    .upsert({
      analysis_id: analysisId,
      created_by: user.id,
      public_token: token,
      token_hash: tokenHash,
      expires_at: getShareExpiration(),
      revoked_at: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'analysis_id' });

  if (upsertError) {
    console.error('share upsert error', upsertError);
    return NextResponse.json({ error: 'Kunne ikke opprette delingslenke' }, { status: 500 });
  }

  return NextResponse.json({
    shareUrl: `${request.nextUrl.origin}/preview/${token}`,
  });
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: analysisId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: analysis } = await supabase
    .from('analyses')
    .select('id')
    .eq('id', analysisId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!analysis) {
    return NextResponse.json({ error: 'Fant ikke analyse' }, { status: 404 });
  }

  const { data: share } = await supabase
    .from('analysis_shares')
    .select('public_token, revoked_at')
    .eq('analysis_id', analysisId)
    .eq('created_by', user.id)
    .maybeSingle();

  if (!share?.public_token || share.revoked_at) {
    return NextResponse.json({ hasShare: false });
  }

  return NextResponse.json({
    hasShare: true,
    shareUrl: `${request.nextUrl.origin}/preview/${share.public_token}`,
  });
}

export async function DELETE(_: NextRequest, { params }: RouteParams) {
  const { id: analysisId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: analysis } = await supabase
    .from('analyses')
    .select('id')
    .eq('id', analysisId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!analysis) {
    return NextResponse.json({ error: 'Fant ikke analyse' }, { status: 404 });
  }

  const { error } = await supabase
    .from('analysis_shares')
    .update({
      revoked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('analysis_id', analysisId)
    .eq('created_by', user.id);

  if (error) {
    return NextResponse.json({ error: 'Kunne ikke deaktivere delingslenke' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
