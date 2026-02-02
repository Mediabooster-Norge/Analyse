import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('generated-articles auth error:', authError);
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
      .from('generated_articles')
      .select('id, title, website_url, website_name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('generated-articles list error:', error);
      const isMissingTable =
        error.code === '42P01' ||
        (error.message && /relation ["']?generated_articles["']? does not exist/i.test(error.message));
      if (isMissingTable) {
        return NextResponse.json(
          {
            error: 'Tabellen for artikler finnes ikke. Kjør migrasjoner: npx supabase db push',
            code: 'migration_missing',
          },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: 'Kunne ikke hente artikler', code: 'db_error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ articles: data ?? [] });
  } catch (err) {
    console.error('generated-articles GET error:', err);
    return NextResponse.json(
      { error: 'Kunne ikke hente artikler', code: 'server_error' },
      { status: 500 }
    );
  }
}
