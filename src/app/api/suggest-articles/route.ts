import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import type { ArticleSuggestion } from '@/types/dashboard';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_SUGGESTIONS = 8;

// GET: Hent lagrede forslag for en analyse
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('analysisId');

    if (!analysisId) {
      return NextResponse.json({ error: 'Mangler analysisId' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('article_suggestions')
      .select('suggestions, with_competitors, created_at')
      .eq('analysis_id', analysisId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Get article suggestions error:', error);
      return NextResponse.json({ error: 'Kunne ikke hente forslag' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ suggestions: null, savedAt: null });
    }

    return NextResponse.json({
      suggestions: data.suggestions as ArticleSuggestion[],
      withCompetitors: data.with_competitors,
      savedAt: data.created_at,
    });
  } catch (error) {
    console.error('Get article suggestions error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Kunne ikke hente forslag' },
      { status: 500 }
    );
  }
}

// POST: Generer nye forslag og lagre dem
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 });
    }

    const body = await request.json();
    const {
      url,
      companyName,
      keywords = [],
      competitorUrls = [],
      withCompetitors = false,
      analysisId,
    } = body as {
      url?: string;
      companyName?: string;
      keywords?: string[];
      competitorUrls?: string[];
      withCompetitors?: boolean;
      analysisId?: string;
    };

    const hasCompetitors = withCompetitors && Array.isArray(competitorUrls) && competitorUrls.length > 0;
    const keywordList = Array.isArray(keywords) ? keywords.slice(0, 20) : [];
    const context = companyName || (url ? new URL(url.startsWith('http') ? url : `https://${url}`).hostname : 'nettsiden');
    const currentYear = new Date().getFullYear();

    const systemPrompt = `Du er en SEO- og innholdsekspert for norske nettsider. Din oppgave er å foreslå konkrete artikkel-/bloggideer som kan øke trafikk og synlighet.

VIKTIG: Vi er i år ${currentYear}. Bruk ${currentYear} (ikke tidligere år) i titler når du nevner år, trender eller strategier (f.eks. "Trender for ${currentYear}", ikke 2024).

Regler:
- Foreslå maksimalt ${MAX_SUGGESTIONS} artikler.
- Alle titler og begrunnelser skal være på norsk.
- Vær konkret: artikkeltitler skal kunne brukes som H1 eller tittel.
- Prioriter artikler som har tydelig søkeintensjon (informasjon, hvordan-til, liste, sammenligning).
- Svar ALLTID i gyldig JSON-format med nøklene "suggestions" og en array av objekter med "title", "rationale", "priority".`;

    const userPrompt = hasCompetitors
      ? `Kontekst: ${context}

Nøkkelord brukeren fokuserer på:
${keywordList.length > 0 ? keywordList.map((k) => `- ${k}`).join('\n') : '(ingen spesifikke nøkkelord oppgitt)'}

Konkurrentenes nettsider:
${competitorUrls.slice(0, 5).map((u: string) => `- ${u}`).join('\n')}

Foreslå artikkelideer som kan hjelpe ${context} å utkonkurrere (outranking) konkurrentene. Fokuser på:
- Temaer konkurrentene dekker som ${context} bør dekke bedre eller med egen vinkel
- Innholdshull (content gaps) der det finnes søketrafikk men lite godt innhold
- Long-tail-temaer som passer til nøkkelordene og kan rangere raskere

Returner JSON:
{
  "suggestions": [
    { "title": "Konkret artikkeltittel", "rationale": "Kort begrunnelse på norsk", "priority": "high" | "medium" | "low" },
    ...
  ]
}`
      : `Kontekst: ${context}

Nøkkelord brukeren fokuserer på:
${keywordList.length > 0 ? keywordList.map((k) => `- ${k}`).join('\n') : '(ingen spesifikke nøkkelord oppgitt)'}

Foreslå generelle artikkelideer som passer for ${context}. Fokuser på:
- Temaer som styrker autoritet og trafikk innen bransjen
- Søkeord og spørsmål potensielle kunder stiller
- Innhold som kan rangere godt på nøkkelordene

Returner JSON:
{
  "suggestions": [
    { "title": "Konkret artikkeltittel", "rationale": "Kort begrunnelse på norsk", "priority": "high" | "medium" | "low" },
    ...
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'article_suggestions',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              suggestions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    rationale: { type: 'string' },
                    priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                  },
                  required: ['title', 'rationale', 'priority'],
                  additionalProperties: false,
                },
              },
            },
            required: ['suggestions'],
            additionalProperties: false,
          },
        },
      },
      max_completion_tokens: 4000, // GPT-5 reasoning tokens (~500-1000) + output (~1200)
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'Ingen respons fra AI' }, { status: 500 });
    }

    const parsed = JSON.parse(content) as { suggestions?: ArticleSuggestion[] };
    const suggestions: ArticleSuggestion[] = Array.isArray(parsed.suggestions)
      ? parsed.suggestions
          .slice(0, MAX_SUGGESTIONS)
          .filter(
            (s): s is ArticleSuggestion =>
              typeof s?.title === 'string' && typeof s?.rationale === 'string'
          )
      : [];

    // Lagre forslag til database hvis analysisId er oppgitt
    let savedAt: string | null = null;
    if (analysisId && suggestions.length > 0) {
      const { data: savedData, error: saveError } = await supabase
        .from('article_suggestions')
        .upsert(
          {
            user_id: user.id,
            analysis_id: analysisId,
            suggestions: suggestions,
            with_competitors: hasCompetitors,
            created_at: new Date().toISOString(),
          },
          { onConflict: 'analysis_id' }
        )
        .select('created_at')
        .single();

      if (saveError) {
        console.error('Save article suggestions error:', saveError);
        // Fortsett uten å feile - forslag ble generert men ikke lagret
      } else {
        savedAt = savedData?.created_at ?? null;
      }
    }

    return NextResponse.json({
      success: true,
      suggestions,
      withCompetitors: hasCompetitors,
      savedAt,
    });
  } catch (error) {
    console.error('Suggest articles error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Kunne ikke generere artikkelforslag',
      },
      { status: 500 }
    );
  }
}
