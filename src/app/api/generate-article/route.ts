import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { getPremiumStatusServer } from '@/lib/premium-server';

export const maxDuration = 45;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Du må være logget inn' }, { status: 401 });
    }

    const premiumStatus = await getPremiumStatusServer(user);
    const limit = premiumStatus.articleGenerationsPerMonth;

    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    const firstDayIso = firstDayOfMonth.toISOString();

    const { count, error: countError } = await supabase
      .from('article_generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', firstDayIso);

    if (countError) {
      console.error('article_generations count error:', countError);
      return NextResponse.json(
        { error: 'Kunne ikke sjekke grense' },
        { status: 500 }
      );
    }

    const used = count ?? 0;
    if (used >= limit) {
      return NextResponse.json(
        {
          error: 'Du har brukt opp artikkelgenereringer denne måneden.',
          limitReached: true,
          limit,
          remaining: 0,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { title, rationale, companyName, websiteUrl, websiteName } = body as {
      title?: string;
      rationale?: string;
      companyName?: string;
      websiteUrl?: string;
      websiteName?: string;
    };

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Tittel er påkrevd' },
        { status: 400 }
      );
    }

    const context = companyName ? `Kontekst/bransje: ${companyName}.` : '';

    const currentYear = new Date().getFullYear();

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Du er en erfaren innholdsforfatter og SEO-ekspert for norske nettsider. Skriv en fullstendig, publiseringsklar artikkel på norsk basert på tittel og begrunnelse.

VIKTIG: Vi er i år ${currentYear}. Bruk alltid ${currentYear} (ikke tidligere år) når du nevner år, trender, strategier eller «år X». Ikke skriv «2024» eller andre gamle år med mindre det er historisk kontekst.

Krav:
- Artikkelen skal være 600–1200 ord.
- Bruk markdown: overskrifter (##, ###), avsnitt, lister der det passer.
- Tone: profesjonell og leservennlig.
- Inkluder et kort innledningsavsnitt og en avslutning med oppsummering eller call-to-action.
- Ingen plassholdere eller [XXX] – skriv ferdig innhold.`,
        },
        {
          role: 'user',
          content: `${context}

Tittel på artikkelen: ${title.trim()}

Begrunnelse/mål med artikkelen: ${(rationale ?? '').trim() || 'Ingen begrunnelse oppgitt.'}

Skriv hele artikkelen i markdown. Bruk ${currentYear} for år og trender.`,
        },
      ],
      temperature: 0.6,
      max_tokens: 2500,
    });

    const article = response.choices[0]?.message?.content?.trim();
    if (!article) {
      return NextResponse.json(
        { error: 'Kunne ikke generere artikkel' },
        { status: 500 }
      );
    }

    const { error: insertError } = await supabase
      .from('article_generations')
      .insert({ user_id: user.id });

    if (insertError) {
      console.error('article_generations insert error:', insertError);
      return NextResponse.json(
        { error: 'Kunne ikke registrere bruk' },
        { status: 500 }
      );
    }

    const { error: articleInsertError } = await supabase
      .from('generated_articles')
      .insert({
        user_id: user.id,
        title: title.trim(),
        content: article,
        website_url: websiteUrl?.trim() || null,
        website_name: websiteName?.trim() || companyName?.trim() || null,
      });

    if (articleInsertError) {
      console.error('generated_articles insert error:', articleInsertError);
      // Don't fail the request – article was generated and limit was consumed
    }

    const remaining = Math.max(0, limit - used - 1);

    return NextResponse.json({
      success: true,
      article,
      remaining,
      limit,
    });
  } catch (err) {
    console.error('generate-article error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kunne ikke generere artikkel' },
      { status: 500 }
    );
  }
}
