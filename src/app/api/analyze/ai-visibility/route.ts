import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { getPremiumStatusServer } from '@/lib/premium-server';

export const maxDuration = 60; // Kun eget domene (10 spørsmål)

interface AIVisibilityRequest {
  /** Domene-URL som skal sjekkes (påkrevd) */
  url: string;
  companyName?: string;
  keywords?: string[];
  /** Lagre resultat på denne analysen (krever at bruker eier den) */
  analysisId?: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Model & cost: Primary = Responses API (gpt-4o-mini + web_search) for live search at lower token cost. Fallback = Chat Completions (gpt-4o-mini, no web search).
// Calls per run: (queries × (1 + competitors)). 10 queries + 5 competitors = 60 calls.
// Estimated cost (gpt-4o-mini + web_search): web search ~$0.01/call + tokens → ca. $0.25–0.50 per run for 60 calls.

type AIVisibilityPayload = {
  score: number;
  level: 'high' | 'medium' | 'low' | 'none';
  description: string;
  details: {
    queriesTested: number;
    timesCited: number;
    timesMentioned: number;
    queries: Array<{ query: string; cited: boolean; mentioned: boolean; aiResponse?: string }>;
  };
  recommendations: string[];
  /** Når fallback brukes (f.eks. 429 fra web search), synlighet er estimert fra modellens kunnskap */
  source?: 'web_search' | 'model_knowledge';
};

async function runOneVisibilityCheck(
  url: string,
  companyName?: string,
  keywords: string[] = []
): Promise<AIVisibilityPayload> {
  let domain: string;
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    domain = urlObj.hostname.replace('www.', '');
  } catch {
    throw new Error('Invalid URL');
  }

  const name = companyName || domain;
  const topKeyword = keywords[0] ?? '';
  const secondKeyword = keywords[1] ?? '';

  const rawKeyword = topKeyword || secondKeyword || '';
  const hasKeyword = !!rawKeyword;
  const k = (() => {
    if (!rawKeyword) return 'bransjen';
    const withoutTrailingNorge = rawKeyword.replace(/\s+(i\s+)?(norge|norway)$/i, '').trim();
    return withoutTrailingNorge || rawKeyword;
  })();
  const kContext = hasKeyword ? ` innen ${k}` : '';

  // 10 spørsmålstyper: k = normalisert søkeord (uten overflødig "norge" når vi allerede har "i Norge")
  const queriesWeb = [
    `Søk: Hvilke selskaper er ledende innen ${k} i Norge? Er ${name} (${domain}) blant dem?${PROMPT_INSTRUCTION_SUFFIX}`,
    hasKeyword
      ? `Søk: Hvem kan hjelpe med ${k} i Norge? Er ${name} (${domain}) nevnt som aktør som løser dette behovet?${PROMPT_INSTRUCTION_SUFFIX}`
      : `Søk: Hvem kan hjelpe med typiske kundebehov innen ${name}s felt? Er ${name} (${domain}) nevnt?${PROMPT_INSTRUCTION_SUFFIX}`,
    hasKeyword
      ? `Søk: Hva er forskjellen på ${name} (${domain}) og andre aktører innen ${k}? Eller: hvem anbefales oftest sammenlignet med ${name}?${PROMPT_INSTRUCTION_SUFFIX}`
      : `Søk: Hvem konkurrerer med ${name} (${domain}), og hvem anbefales oftest i samme bransje? Er ${name} nevnt i sammenligninger?${PROMPT_INSTRUCTION_SUFFIX}`,
    hasKeyword
      ? `Søk: Hvilket selskap bør jeg velge for ${k} i Norge? Er ${name} (${domain}) blant anbefalingene?${PROMPT_INSTRUCTION_SUFFIX}`
      : `Søk: Hvilket selskap bør jeg velge for tjenester som ${name} tilbyr? Er ${name} (${domain}) nevnt?${PROMPT_INSTRUCTION_SUFFIX}`,
    hasKeyword
      ? `Søk: Hvem er eksperter på ${k} i Norge? Er ${name} (${domain}) nevnt som ekspert eller autoritet?${PROMPT_INSTRUCTION_SUFFIX}`
      : `Søk: Hvem regnes som eksperter innen ${name}s felt i Norge? Er ${name} (${domain}) nevnt?${PROMPT_INSTRUCTION_SUFFIX}`,
    hasKeyword
      ? `Søk: Hvilke selskaper tilbyr ${k} i Norge? Er ${name} (${domain}) med i slike lister eller anbefalinger?${PROMPT_INSTRUCTION_SUFFIX}`
      : `Søk: Hvilke selskaper tilbyr tjenester som ${name} (${domain}) i Norge? Er de selv nevnt?${PROMPT_INSTRUCTION_SUFFIX}`,
    hasKeyword
      ? `Søk: Hvem er best på ${k} i Norge? Er ${name} (${domain}) nevnt på topplister eller som spesialist?${PROMPT_INSTRUCTION_SUFFIX}`
      : `Søk: Hvem er best innen ${name}s spesialisering? Er ${name} (${domain}) nevnt?${PROMPT_INSTRUCTION_SUFFIX}`,
    hasKeyword
      ? `Søk: Hvilke selskaper har dokumenterte resultater eller case innen ${k}? Er ${name} (${domain}) nevnt?${PROMPT_INSTRUCTION_SUFFIX}`
      : `Søk: Hvilke selskaper har dokumenterte resultater eller troverdighet innen ${name}s felt? Er ${name} (${domain}) nevnt?${PROMPT_INSTRUCTION_SUFFIX}`,
    hasKeyword
      ? `Søk: Hvem bruker anerkjente metoder eller er kjent for profesjonell tilnærming innen ${k}? Er ${name} (${domain}) nevnt?${PROMPT_INSTRUCTION_SUFFIX}`
      : `Søk: Hvem er kjent for moderne eller anerkjente metoder innen ${name}s felt? Er ${name} (${domain}) nevnt?${PROMPT_INSTRUCTION_SUFFIX}`,
    `Søk: Hva er ${name} (${domain}) kjent for? Beskriv brandets kjerneposisjon eller hovedtilbud i 1–2 setninger.`,
  ];
  const queriesModel = [
    `Hvilke selskaper er ledende innen ${k} i Norge? Er ${name} (${domain}) blant dem? Svar kort.`,
    `Hvem kan hjelpe med ${k}? Er ${name} (${domain}) nevnt? Svar kort.`,
    `Hvem anbefales oftest sammenlignet med ${name} (${domain})${kContext}? Svar kort.`,
    `Hvilket selskap bør jeg velge for ${k}? Er ${name} (${domain}) nevnt? Svar kort.`,
    `Hvem er eksperter på ${k} i Norge? Er ${name} (${domain}) nevnt? Svar kort.`,
    `Hvilke selskaper tilbyr ${k} i Norge? Er ${name} (${domain}) med? Svar kort.`,
    `Hvem er best på ${k}? Er ${name} (${domain}) nevnt? Svar kort.`,
    `Hvilke selskaper har dokumenterte resultater innen ${k}? Er ${name} (${domain}) nevnt? Svar kort.`,
    `Hvem er kjent for gode metoder innen ${k}? Er ${name} (${domain}) nevnt? Svar kort.`,
    `Hva er ${name} (${domain}) kjent for? Svar i 1–2 setninger.`,
  ];

  const domainLower = domain.toLowerCase();
  const nameLower = name.toLowerCase();
  const notFoundPhrases = [
    'finner ingen informasjon',
    'ingen kjent informasjon',
    'ingen konkrete resultater',
    'ikke kjent',
    'not found',
    'no results',
    'could not find',
    "couldn't find",
    'don\'t have information',
    'no information available',
    'ingen treff',
    'søket ga ingen',
    'unable to find',
    'vet ikke om',
    'kjenner ikke til',
    'don\'t know about',
    'har ikke informasjon',
    'ikke funnet',
  ];

  type QuerySource = 'web_search' | 'model_knowledge';
  const results: Array<{
    query: string;
    cited: boolean;
    mentioned: boolean;
    response: string;
    source: QuerySource;
    error?: boolean;
  }> = [];

  for (let i = 0; i < queriesWeb.length; i++) {
    const queryWeb = queriesWeb[i];
    const queryModel = queriesModel[i];
    let resultContent = '';
    let queryError = false;
    let querySource: QuerySource = 'web_search';

    try {
      const response = await openai.responses.create({
        model: 'gpt-4o-mini',
        tools: [{ type: 'web_search' as const }],
        input: queryWeb,
      });
      resultContent = (response.output_text || '').trim().replace(/\n{3,}/g, '\n\n');
      querySource = 'web_search';
    } catch (err) {
      const isQuotaOrAccess =
        err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 429;
      if (isQuotaOrAccess && i === 0) {
        console.warn('AI visibility: Responses API web_search 429/forbudt, bruker Chat Completions som fallback');
      } else if (!isQuotaOrAccess) {
        console.error('OpenAI visibility query error:', err);
      }
      queryError = true;

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'Du svarer kort og ærlig på norsk eller engelsk. Ikke inkluder nettsideadresser i parentes (f.eks. (domene.no)) i svaret. Svar kun på det som spørres—unngå å gjenta samme firmabeskrivelse i hvert svar. Hvis du kjenner til bedriften, beskriv kort. Hvis ikke, si at du ikke har informasjon.',
            },
            { role: 'user', content: queryModel },
          ],
          max_tokens: 300,
        });
        const raw = completion.choices[0]?.message?.content ?? '';
        if (raw.trim()) {
          resultContent = raw.trim().replace(/\n{3,}/g, '\n\n');
          querySource = 'model_knowledge';
          queryError = false;
        }
      } catch (fallbackErr) {
        console.error('OpenAI visibility fallback error:', fallbackErr);
      }
    }

    if (!resultContent) {
      queryError = true;
    } else {
      resultContent = cleanAiResponseForDisplay(resultContent);
    }

    const contentLower = resultContent.toLowerCase();
    const isMentioned =
      !queryError &&
      (contentLower.includes(domainLower) || (nameLower.length > 3 && contentLower.includes(nameLower)));
    const notFound = notFoundPhrases.some((phrase) => contentLower.includes(phrase));
    const isCited = isMentioned && !notFound;

    results.push({
      query: queryWeb,
      cited: isCited,
      mentioned: isMentioned,
      response: resultContent,
      source: querySource,
      ...(queryError ? { error: true } : {}),
    });
  }

  const validResults = results.filter((r) => !('error' in r && r.error));
  const citedCount = validResults.filter((r) => r.cited).length;
  const mentionedCount = validResults.filter((r) => r.mentioned).length;
  const usedWebSearch = validResults.some((r) => r.source === 'web_search');
  const source: 'web_search' | 'model_knowledge' = usedWebSearch ? 'web_search' : 'model_knowledge';

  let score = 0;
  if (validResults.length > 0) {
    // Poeng per spørsmål: "cited" = 2, "mentioned" = 1. Maks = antall * 3 (alle cited).
    // Med 10 spørsmål gir det robust gjennomsnitt og finere nivåer.
    score = Math.round(((citedCount * 2 + mentionedCount) / (validResults.length * 3)) * 100);
  }

  let level: 'high' | 'medium' | 'low' | 'none';
  let description: string;
  if (score >= 70) {
    level = 'high';
    description = 'AI-modeller finner bedriften i live-søk og kan anbefale den til brukere.';
  } else if (score >= 40) {
    level = 'medium';
    description = 'AI-modeller finner bedriften i noen søk, men synligheten kan styrkes.';
  } else if (score > 0) {
    level = 'low';
    description = 'AI-modeller finner sjelden bedriften i live web-søk.';
  } else {
    level = 'none';
    description = 'AI-modeller finner ikke bedriften i live web-søk ennå.';
  }

  return {
    score,
    level,
    description,
    details: {
      queriesTested: validResults.length,
      timesCited: citedCount,
      timesMentioned: mentionedCount,
      queries: results.map((r) => ({
        query: r.query,
        cited: r.cited,
        mentioned: r.mentioned,
        aiResponse: 'response' in r ? r.response : undefined,
      })),
    },
    recommendations: [
      score < 70 && 'Publiser mer innhold som svarer på vanlige spørsmål i din bransje',
      score < 50 && 'Øk online tilstedeværelse gjennom PR, artikler og bransjekataloge',
      citedCount === 0 && 'Skap autorativt innhold som etablerer bedriften som en kjent ekspert',
      mentionedCount === 0 && 'Bygg merkevarebevissthet gjennom sosiale medier og bransjeomtaler',
    ].filter(Boolean) as string[],
    source: validResults.length > 0 ? source : undefined,
  };
}

function buildPayloadWithDescription(mainPayload: AIVisibilityPayload): AIVisibilityPayload {
  return {
    ...mainPayload,
    description:
      mainPayload.level === 'high'
        ? 'AI-modeller kjenner godt til bedriften din og kan anbefale den til brukere.'
        : mainPayload.level === 'medium'
          ? 'AI-modeller har noe kjennskap til bedriften, men synligheten kan forbedres.'
          : mainPayload.level === 'low'
            ? 'AI-modeller har begrenset kjennskap til bedriften din.'
            : 'AI-modeller ser ikke ut til å kjenne til bedriften din ennå.',
  };
}

const CACHE_TTL_DAYS = 30;
const CACHE_TTL_MS = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;

/** Instruksjon som kun skal til AI; strippes fra spørsmålstekst som vises til bruker */
const PROMPT_INSTRUCTION_SUFFIX =
  ' Svar i 1–2 setninger. Fokuser kun på spørsmålet. Ikke inkluder nettsideadresser i parentes (f.eks. (domene.no)) i svaret. Unngå å gjenta samme firmabeskrivelse i hvert svar—svar kun på det som spørres.';

function cleanQueryForDisplay(rawQuery: string, domain: string): string {
  return rawQuery
    .replace(PROMPT_INSTRUCTION_SUFFIX, '')
    .replace(/^Søk:\s*/i, '')
    .replaceAll(` (${domain})`, '')
    .trim();
}

/** Fjerner (domene.no)-lignende parenteser fra AI-svar for mindre repetitiv og ryddigere tekst. */
function cleanAiResponseForDisplay(text: string): string {
  return text
    .replace(/\s*\([a-z0-9][a-z0-9.-]*\.[a-z]{2,}\)(\.)?\s*/gi, (_, period) => (period ? '. ' : ' '))
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Renser spørsmålstekster og AI-svar i payload slik at bruker ikke ser prompt-instruksjoner, "Søk:", (domene) eller repetitiv parentes-citering. */
function cleanPayloadQueriesForDisplay(
  payload: AIVisibilityPayload,
  domain: string
): AIVisibilityPayload {
  return {
    ...payload,
    details: {
      ...payload.details,
      queries: payload.details.queries.map((q) => ({
        ...q,
        query: cleanQueryForDisplay(q.query, domain),
        aiResponse: q.aiResponse ? cleanAiResponseForDisplay(q.aiResponse) : undefined,
      })),
    },
  };
}

function getDomainFromUrl(url: string): string {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

async function getCachedPayload(
  supabase: Awaited<ReturnType<typeof createClient>>,
  domain: string
): Promise<AIVisibilityPayload | null> {
  const minCheckedAt = new Date(Date.now() - CACHE_TTL_MS).toISOString();
  const { data } = await supabase
    .from('ai_visibility_cache')
    .select('payload')
    .eq('domain', domain)
    .gte('checked_at', minCheckedAt)
    .maybeSingle();
  return (data?.payload as AIVisibilityPayload) ?? null;
}

async function setCachedPayload(
  supabase: Awaited<ReturnType<typeof createClient>>,
  domain: string,
  payload: AIVisibilityPayload
): Promise<void> {
  await supabase.from('ai_visibility_cache').upsert(
    { domain, payload, checked_at: new Date().toISOString() },
    { onConflict: 'domain' }
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Du må være logget inn' }, { status: 401 });
    }

    const premiumStatus = await getPremiumStatusServer(user);
    if (!premiumStatus.isPremium) {
      return NextResponse.json(
        { error: 'AI-synlighet er en Premium-funksjon' },
        { status: 403 }
      );
    }

    const limit = premiumStatus.aiVisibilityChecksPerMonth ?? 5;
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    const firstDayIso = firstDayOfMonth.toISOString();

    const { count, error: countError } = await supabase
      .from('ai_visibility_checks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', firstDayIso);

    if (countError) {
      console.error('ai_visibility_checks count error:', countError);
      return NextResponse.json(
        { error: 'Kunne ikke sjekke grense' },
        { status: 500 }
      );
    }

    const used = count ?? 0;
    const body = (await request.json()) as AIVisibilityRequest;
    const { url, companyName, keywords = [], analysisId } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    if (used >= limit) {
      return NextResponse.json(
        {
          error: `Du har brukt opp AI-synlighetssjekker denne måneden (${limit} stk). Prøv igjen neste måned.`,
          limitReached: true,
          limit,
          remaining: 0,
        },
        { status: 429 }
      );
    }

    const skip24hThrottle =
      process.env.AI_VISIBILITY_SKIP_24H_THROTTLE === 'true' ||
      process.env.AI_VISIBILITY_SKIP_24H_THROTTLE === '1';

    if (!skip24hThrottle && analysisId && typeof analysisId === 'string') {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recentForAnalysis, error: recentError } = await supabase
        .from('ai_visibility_checks')
        .select('id, created_at')
        .eq('user_id', user.id)
        .eq('analysis_id', analysisId)
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentError) {
        console.error('ai_visibility_checks recent check error:', recentError);
      } else if (recentForAnalysis?.created_at) {
        const lastCheckTime = new Date(recentForAnalysis.created_at).getTime();
        const throttleUntilIso = new Date(lastCheckTime + 24 * 60 * 60 * 1000).toISOString();
        return NextResponse.json(
          {
            error:
              'Du har allerede kjørt AI-synlighetssjekk for denne analysen i løpet av siste 24 timer. Prøv igjen senere.',
            throttleUntil: throttleUntilIso,
          },
          { status: 429 }
        );
      }
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        score: null,
        message: 'OpenAI API-nøkkel mangler.',
        estimatedOnly: true,
      });
    }

    const mainDomain = getDomainFromUrl(url);
    let mainPayload = await getCachedPayload(supabase, mainDomain);
    if (!mainPayload) {
      mainPayload = await runOneVisibilityCheck(url, companyName, keywords);
      await setCachedPayload(supabase, mainDomain, mainPayload);
    }

    if (mainPayload.details.queriesTested === 0) {
      return NextResponse.json(
        {
          error:
            'AI-synlighet kunne ikke sjekkes akkurat nå (API-begrensning hos leverandør). Legg til kreditt på platform.openai.com eller prøv igjen senere.',
        },
        { status: 503 }
      );
    }

    mainPayload = cleanPayloadQueriesForDisplay(mainPayload, mainDomain);
    const payload = buildPayloadWithDescription(mainPayload);

    const { error: insertError } = await supabase
      .from('ai_visibility_checks')
      .insert({
        user_id: user.id,
        ...(analysisId && typeof analysisId === 'string' ? { analysis_id: analysisId } : {}),
      });

    if (insertError) {
      console.error('ai_visibility_checks insert error:', insertError);
    }

    if (analysisId && typeof analysisId === 'string') {
      const payloadWithTime = { ...payload, checked_at: new Date().toISOString() };
      const { error: updateError } = await supabase
        .from('analyses')
        .update({ ai_visibility: payloadWithTime })
        .eq('id', analysisId)
        .eq('user_id', user.id);
      if (updateError) console.error('AI visibility save to analysis:', updateError);
    }

    const remaining = Math.max(0, limit - used - 1);
    const checkedAt = new Date().toISOString();
    const aiVisibility = { ...payload, checked_at: checkedAt };
    return NextResponse.json({
      ai_visibility: aiVisibility,
      remaining,
      limit,
    });
  } catch (error) {
    console.error('AI visibility check error:', error);
    return NextResponse.json(
      { error: 'En feil oppstod under sjekk av AI-synlighet' },
      { status: 500 }
    );
  }
}
