import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import type { SocialPostSuggestion, SocialPlatform } from '@/types/dashboard';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_SUGGESTIONS = 8;
const PLATFORMS: SocialPlatform[] = ['linkedin', 'instagram', 'x'];

function isPlatform(s: string): s is SocialPlatform {
  return PLATFORMS.includes(s as SocialPlatform);
}

// GET: Hent lagrede forslag for en analyse og platform
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('analysisId');
    const platform = searchParams.get('platform') || 'linkedin';

    if (!analysisId) {
      return NextResponse.json({ error: 'Mangler analysisId' }, { status: 400 });
    }
    if (!isPlatform(platform)) {
      return NextResponse.json({ error: 'Ugyldig platform' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('social_post_suggestions')
      .select('suggestions, with_competitors, created_at')
      .eq('analysis_id', analysisId)
      .eq('user_id', user.id)
      .eq('platform', platform)
      .maybeSingle();

    if (error) {
      console.error('Get social post suggestions error:', error);
      return NextResponse.json({ error: 'Kunne ikke hente forslag' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ suggestions: null, savedAt: null });
    }

    return NextResponse.json({
      suggestions: data.suggestions as SocialPostSuggestion[],
      withCompetitors: data.with_competitors,
      savedAt: data.created_at,
    });
  } catch (error) {
    console.error('Get social post suggestions error:', error);
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
      platform = 'linkedin',
    } = body as {
      url?: string;
      companyName?: string;
      keywords?: string[];
      competitorUrls?: string[];
      withCompetitors?: boolean;
      analysisId?: string;
      platform?: string;
    };

    const platformNorm = isPlatform(platform) ? platform : 'linkedin';
    const hasCompetitors = withCompetitors && Array.isArray(competitorUrls) && competitorUrls.length > 0;
    const keywordList = Array.isArray(keywords) ? keywords.slice(0, 20) : [];
    const context = companyName || (url ? new URL(url.startsWith('http') ? url : `https://${url}`).hostname : 'nettsiden');
    const currentYear = new Date().getFullYear();

    const platformHints: Record<SocialPlatform, string> = {
      linkedin: 'LinkedIn (profesjonell tone, lengre innlegg, B2B-relevant)',
      instagram: 'Instagram (korte, visuelle tekster, hashtags, engasjerende)',
      x: 'X/Twitter (korte, punchy innlegg, max ~280 tegn per tweet)',
    };

    const systemPrompt = `Du er en SoMe- og innholdsekspert for norske bedrifter. Din oppgave er å foreslå konkrete ideer til sosiale medie-innlegg som kan øke synlighet og engasjement.

Plattform: ${platformHints[platformNorm]}

VIKTIG: Vi er i år ${currentYear}. Bruk ${currentYear} i titler når relevant.

Regler:
- Foreslå maksimalt ${MAX_SUGGESTIONS} postideer.
- Alle titler og begrunnelser skal være på norsk.
- Vær konkret: hver ide skal kunne bli ett faktisk innlegg.
- Svar ALLTID i gyldig JSON med nøklene "suggestions" og en array av objekter med "title", "rationale", "priority".`;

    const userPrompt = hasCompetitors
      ? `Kontekst: ${context}

Nøkkelord:
${keywordList.length > 0 ? keywordList.map((k) => `- ${k}`).join('\n') : '(ingen spesifikke nøkkelord)'}

Konkurrentenes nettsider:
${competitorUrls.slice(0, 5).map((u: string) => `- ${u}`).join('\n')}

Foreslå postideer for ${platformNorm} som kan hjelpe ${context} å stå ut mot konkurrentene. Fokuser på engasjement, nyheter og egen vinkel.

Returner JSON:
{
  "suggestions": [
    { "title": "Kort postide-tittel", "rationale": "Kort begrunnelse", "priority": "high" | "medium" | "low" },
    ...
  ]
}`
      : `Kontekst: ${context}

Nøkkelord:
${keywordList.length > 0 ? keywordList.map((k) => `- ${k}`).join('\n') : '(ingen spesifikke nøkkelord)'}

Foreslå generelle postideer for ${platformNorm} som passer for ${context}. Fokuser på engasjement og merkevare.

Returner JSON:
{
  "suggestions": [
    { "title": "Kort postide-tittel", "rationale": "Kort begrunnelse", "priority": "high" | "medium" | "low" },
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
          name: 'social_post_suggestions',
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
      max_completion_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'Ingen respons fra AI' }, { status: 500 });
    }

    const parsed = JSON.parse(content) as { suggestions?: SocialPostSuggestion[] };
    const suggestions: SocialPostSuggestion[] = Array.isArray(parsed.suggestions)
      ? parsed.suggestions
          .slice(0, MAX_SUGGESTIONS)
          .filter(
            (s): s is SocialPostSuggestion =>
              typeof s?.title === 'string' && typeof s?.rationale === 'string'
          )
      : [];

    let savedAt: string | null = null;
    if (analysisId && suggestions.length > 0) {
      const { data: savedData, error: saveError } = await supabase
        .from('social_post_suggestions')
        .upsert(
          {
            user_id: user.id,
            analysis_id: analysisId,
            suggestions,
            with_competitors: hasCompetitors,
            platform: platformNorm,
            created_at: new Date().toISOString(),
          },
          { onConflict: 'analysis_id,platform' }
        )
        .select('created_at')
        .single();

      if (saveError) {
        console.error('Save social post suggestions error:', saveError);
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
    console.error('Suggest social posts error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Kunne ikke generere postforslag' },
      { status: 500 }
    );
  }
}
