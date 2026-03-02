import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('generated-social-posts auth error:', authError);
      return NextResponse.json(
        { error: 'Du må være logget inn', code: 'auth_error' },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Du må være logget inn', code: 'not_authenticated' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('generated_social_posts')
      .select('id, platform, title, website_url, website_name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('generated-social-posts list error:', error);
      const isMissingTable =
        error.code === '42P01' ||
        (error.message && /relation ["']?generated_social_posts["']? does not exist/i.test(error.message));
      if (isMissingTable) {
        return NextResponse.json(
          {
            error: 'Tabellen for SoMe-poster finnes ikke. Kjør migrasjoner.',
            code: 'migration_missing',
          },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: 'Kunne ikke hente SoMe-poster', code: 'db_error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ posts: data ?? [] }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (err) {
    console.error('generated-social-posts GET error:', err);
    return NextResponse.json(
      { error: 'Kunne ikke hente SoMe-poster', code: 'server_error' },
      { status: 500 }
    );
  }
}
