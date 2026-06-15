import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPremiumStatusServer } from '@/lib/premium-server';
import {
  getAiVisibilityModelMode,
  resolveModelProfile,
  resolveQueryModel,
  resolveInsightModel,
  optionalTemperature,
  chatCompletionTokenLimit,
  AI_VISIBILITY_WEB_SEARCH_TOOL,
} from '@/lib/ai-visibility-models';
import { normalizeVisibilityKeyword } from '@/lib/utils/visibility-keywords';

export const maxDuration = 60; // 10 spørsmål parallelt (hybrid: gpt-5-mini + gpt-4o-mini)

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

// Modell: AI_VISIBILITY_QUERY_MODEL=hybrid|premium|mini|auto (standard hybrid).
// hybrid = gpt-5-mini på nøytrale spørsmål, gpt-4o-mini på navngitte. Websøk med user_location NO.
// Fallback = Chat Completions uten websøk ved feil/429. Estimert kostnad: ca. $0.15–0.35 per kjøring (hybrid).

/** Hvor mange spørringer som kjøres samtidig (holder oss trygt under maxDuration). */
const QUERY_CONCURRENCY = 4;
/** Lav temperatur for mer reproduserbar score mellom kjøringer. */
const QUERY_TEMPERATURE = 0.2;

type QueryType = 'unprompted' | 'named';

type AIVisibilityPayload = {
  score: number;
  level: 'high' | 'medium' | 'low' | 'none';
  description: string;
  details: {
    queriesTested: number;
    timesCited: number;
    timesMentioned: number;
    competitorsMentioned?: string[];
    insight?: string;
    queries: Array<{ query: string; cited: boolean; mentioned: boolean; aiResponse?: string; type?: QueryType }>;
  };
  recommendations: string[];
  /** 'web_search' når flertallet av spørringene brukte live søk, ellers 'model_knowledge'. */
  source?: 'web_search' | 'model_knowledge';
  /** Bransjenøkkelord spørsmålene ble stilt om */
  focusKeyword?: string;
  /** hybrid | premium | mini */
  modelProfile?: 'hybrid' | 'premium' | 'mini';
};

/** Kjører async-funksjon over en liste med en maks samtidighet, bevarer rekkefølge. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) break;
      results[index] = await fn(items[index], index);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

/** Bygger en case-insensitiv ordgrense-regex for et navn (unngår delstreng-falske-positive). */
function buildNameRegex(name: string): RegExp | null {
  const trimmed = name.trim();
  // Korte merkenavn (TRY, M51) må støttes – ordgrenser hindrer treff i f.eks. «country».
  if (trimmed.length < 2) return null;
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, 'iu');
}

/** Hoveddel av domenet uten TLD, f.eks. «iteo» fra iteo.com eller «try» fra try.no. */
function getDomainBrand(domain: string): string | null {
  const host = domain.toLowerCase().replace(/^www\./, '');
  const parts = host.split('.').filter(Boolean);
  if (parts.length < 2) return null;
  // try.no → try; iteo.com → iteo (ikke «co» fra example.co.uk)
  const sld = parts.length === 2 ? parts[0] : parts[parts.length - 2];
  if (!sld || sld.length < 2) return null;
  if (parts.length > 2 && sld.length <= 2) {
    const fallback = parts[0];
    return fallback && fallback.length >= 2 ? fallback : null;
  }
  return sld;
}

/** Navn/alias vi skal lete etter i AI-svar (domene, merke fra domene, firmanavn). */
function buildVisibilityMatchTerms(domain: string, companyName?: string): string[] {
  const terms = new Set<string>();
  const domainLower = domain.toLowerCase().replace(/^www\./, '');
  terms.add(domainLower);

  const brand = getDomainBrand(domainLower);
  if (brand) terms.add(brand);

  const rawName = companyName?.trim();
  if (rawName) {
    terms.add(rawName.toLowerCase());
    const firstToken = rawName.split(/[\s|–—-]+/)[0]?.trim().toLowerCase();
    if (firstToken && firstToken.length >= 2) terms.add(firstToken);
  }

  return [...terms];
}

function termAppearsInResponse(responseLower: string, term: string): boolean {
  if (term.includes('.')) {
    return responseLower.includes(term);
  }
  const regex = buildNameRegex(term);
  return regex ? regex.test(responseLower) : responseLower.includes(term);
}

/**
 * Avgjør om svaret nevner bedriften, og om det skjer i en negativ/usikker kontekst.
 * Returnerer { appears, negated } slik at en "kjenner ikke til X"-respons ikke gir poeng.
 */
function classifyResponse(
  responseLower: string,
  matchTerms: string[],
  notFoundPhrases: string[]
): { appears: boolean; negated: boolean } {
  const appears = matchTerms.some((term) => termAppearsInResponse(responseLower, term));
  const negated = notFoundPhrases.some((phrase) => responseLower.includes(phrase));
  return { appears, negated };
}

async function runOneVisibilityCheck(
  url: string,
  companyName?: string,
  keywords: string[] = []
): Promise<AIVisibilityPayload> {
  keywords = keywords.map(normalizeVisibilityKeyword).filter(Boolean);
  let domain: string;
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    domain = urlObj.hostname.replace(/^www\./, '');
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
  type QuerySpec = { web: string; model: string; type: QueryType; weight: number };

  // Suffiks som ber AI om å navngi aktørene i nøytrale spørsmål (gjør konkurrent-uttrekk mulig).
  const unpromptedSuffix = ' List opp de mest aktuelle selskapene ved navn.' + PROMPT_INSTRUCTION_SUFFIX;

  let specs: QuerySpec[];
  if (hasKeyword) {
    // Nøytrale spørsmål (uoppfordret): nevner IKKE bedriften. Måler om AI anbefaler den selv.
    // Vektes tyngst (2) fordi dette er det egentlig verdifulle: blir vi anbefalt uten å nevne oss selv?
    const unprompted: QuerySpec[] = [
      {
        type: 'unprompted', weight: 2,
        web: `Søk: Hvilke selskaper er ledende innen ${k} i Norge?${unpromptedSuffix}`,
        model: `Hvilke selskaper er ledende innen ${k} i Norge? Nevn navn. Svar kort.`,
      },
      {
        type: 'unprompted', weight: 2,
        web: `Søk: Hvem bør jeg velge for ${k} i Norge? Gi konkrete anbefalinger.${unpromptedSuffix}`,
        model: `Hvem bør jeg velge for ${k} i Norge? Nevn navn. Svar kort.`,
      },
      {
        type: 'unprompted', weight: 2,
        web: `Søk: Hvem er de beste ekspertene på ${k} i Norge?${unpromptedSuffix}`,
        model: `Hvem er de beste ekspertene på ${k} i Norge? Nevn navn. Svar kort.`,
      },
      {
        type: 'unprompted', weight: 2,
        web: `Søk: Hvilke selskaper tilbyr ${k} i Norge?${unpromptedSuffix}`,
        model: `Hvilke selskaper tilbyr ${k} i Norge? Nevn navn. Svar kort.`,
      },
      {
        type: 'unprompted', weight: 2,
        web: `Søk: Hvilke aktører har best omtale og resultater innen ${k} i Norge?${unpromptedSuffix}`,
        model: `Hvilke aktører har best omtale og resultater innen ${k} i Norge? Nevn navn. Svar kort.`,
      },
    ];
    // Navngitte spørsmål (kjennskap): nevner bedriften. Måler om AI faktisk vet hvem den er.
    const named: QuerySpec[] = [
      {
        type: 'named', weight: 1,
        web: `Søk: Er ${name} (${domain}) blant de ledende innen ${k} i Norge?${PROMPT_INSTRUCTION_SUFFIX}`,
        model: `Er ${name} (${domain}) blant de ledende innen ${k} i Norge? Svar kort.`,
      },
      {
        type: 'named', weight: 1,
        web: `Søk: Kan du anbefale ${name} (${domain}) for ${k}? Hva er styrkene?${PROMPT_INSTRUCTION_SUFFIX}`,
        model: `Kan du anbefale ${name} (${domain}) for ${k}? Svar kort.`,
      },
      {
        type: 'named', weight: 1,
        web: `Søk: Hvordan skiller ${name} (${domain}) seg fra andre innen ${k}?${PROMPT_INSTRUCTION_SUFFIX}`,
        model: `Hvordan skiller ${name} (${domain}) seg fra andre innen ${k}? Svar kort.`,
      },
      {
        type: 'named', weight: 1,
        web: `Søk: Hvilke resultater eller omtale har ${name} (${domain}) innen ${k}?${PROMPT_INSTRUCTION_SUFFIX}`,
        model: `Hvilke resultater eller omtale har ${name} (${domain}) innen ${k}? Svar kort.`,
      },
      {
        type: 'named', weight: 1,
        web: `Søk: Hva er ${name} (${domain}) kjent for? Beskriv kjerneposisjonen i 1–2 setninger.`,
        model: `Hva er ${name} (${domain}) kjent for? Svar i 1–2 setninger.`,
      },
    ];
    specs = [...unprompted, ...named];
  } else {
    // Uten nøkkelord kan vi ikke stille gode nøytrale spørsmål → fall tilbake til ren kjennskap.
    specs = [
      {
        type: 'named', weight: 1,
        web: `Søk: Hva er ${name} (${domain}) kjent for? Beskriv i 1–2 setninger.`,
        model: `Hva er ${name} (${domain}) kjent for? Svar i 1–2 setninger.`,
      },
      {
        type: 'named', weight: 1,
        web: `Søk: Hvem konkurrerer med ${name} (${domain}), og er ${name} nevnt i sammenligninger?${PROMPT_INSTRUCTION_SUFFIX}`,
        model: `Hvem konkurrerer med ${name} (${domain})? Er ${name} nevnt? Svar kort.`,
      },
      {
        type: 'named', weight: 1,
        web: `Søk: Hvilke tjenester eller produkter tilbyr ${name} (${domain})?${PROMPT_INSTRUCTION_SUFFIX}`,
        model: `Hvilke tjenester tilbyr ${name} (${domain})? Svar kort.`,
      },
      {
        type: 'named', weight: 1,
        web: `Søk: Har ${name} (${domain}) god omtale på nett?${PROMPT_INSTRUCTION_SUFFIX}`,
        model: `Har ${name} (${domain}) god omtale på nett? Svar kort.`,
      },
      {
        type: 'named', weight: 1,
        web: `Søk: Regnes ${name} (${domain}) som en seriøs aktør i sin bransje?${PROMPT_INSTRUCTION_SUFFIX}`,
        model: `Regnes ${name} (${domain}) som en seriøs aktør i sin bransje? Svar kort.`,
      },
    ];
  }

  const matchTerms = buildVisibilityMatchTerms(domain, companyName);
  const notFoundPhrases = [
    'finner ingen informasjon',
    'ingen kjent informasjon',
    'ingen konkrete resultater',
    'ikke kjent',
    'ikke kjent med',
    'kjenner ikke til',
    'ingen kjennskap',
    'not found',
    'no results',
    'could not find',
    "couldn't find",
    "don't have information",
    'no information available',
    'ingen treff',
    'søket ga ingen',
    'unable to find',
    'vet ikke om',
    "don't know about",
    'har ikke informasjon',
    'ikke funnet',
    'finner ingen',
    'ingen informasjon om',
  ];

  type QueryResult = {
    query: string;
    type: QueryType;
    weight: number;
    known: boolean;
    uncertain: boolean;
    response: string;
    usedWebSearch: boolean;
    error: boolean;
  };

  const modelMode = getAiVisibilityModelMode();
  const modelProfile = resolveModelProfile(modelMode);

  const queryResults = await mapWithConcurrency<QuerySpec, QueryResult>(
    specs,
    QUERY_CONCURRENCY,
    async (spec) => {
      let resultContent = '';
      let queryError = false;
      let usedWebSearch = false;
      const queryModel = resolveQueryModel(spec.type, modelMode);

      try {
        const response = await openai.responses.create({
          model: queryModel,
          tools: [AI_VISIBILITY_WEB_SEARCH_TOOL],
          input: spec.web,
          ...optionalTemperature(queryModel, QUERY_TEMPERATURE),
        });
        resultContent = (response.output_text || '').trim().replace(/\n{3,}/g, '\n\n');
        usedWebSearch = true;
      } catch (err) {
        const isQuotaOrAccess =
          err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 429;
        if (!isQuotaOrAccess) {
          console.error('OpenAI visibility query error:', err);
        }
        queryError = true;

        try {
          const completion = await openai.chat.completions.create({
            model: queryModel,
            ...optionalTemperature(queryModel, QUERY_TEMPERATURE),
            messages: [
              {
                role: 'system',
                content:
                  'Du svarer kort og ærlig på norsk eller engelsk. Ikke inkluder nettsideadresser i parentes (f.eks. (domene.no)) i svaret. Svar kun på det som spørres—unngå å gjenta samme firmabeskrivelse i hvert svar. Hvis du kjenner til bedriften, beskriv kort. Hvis ikke, si tydelig at du ikke har informasjon.',
              },
              { role: 'user', content: spec.model },
            ],
            ...chatCompletionTokenLimit(queryModel, 300),
          });
          const raw = completion.choices[0]?.message?.content ?? '';
          if (raw.trim()) {
            resultContent = raw.trim().replace(/\n{3,}/g, '\n\n');
            usedWebSearch = false;
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
      const { appears, negated } = queryError
        ? { appears: false, negated: false }
        : classifyResponse(contentLower, matchTerms, notFoundPhrases);
      // "known" = bedriften dukker opp positivt. En "kjenner ikke til X"-respons gir IKKE poeng.
      const known = appears && !negated;
      const uncertain = appears && negated;

      return {
        query: spec.web,
        type: spec.type,
        weight: spec.weight,
        known,
        uncertain,
        response: resultContent,
        usedWebSearch,
        error: queryError,
      };
    }
  );

  const valid = queryResults.filter((r) => !r.error);
  const totalWeight = valid.reduce((sum, r) => sum + r.weight, 0);
  const earnedWeight = valid.reduce((sum, r) => sum + (r.known ? r.weight : 0), 0);
  const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  const citedCount = valid.filter((r) => r.known).length;
  const uncertainCount = valid.filter((r) => r.uncertain).length;
  const webSearchCount = valid.filter((r) => r.usedWebSearch).length;
  // source = web_search kun når flertallet av gyldige spørringer faktisk brukte live søk.
  const source: 'web_search' | 'model_knowledge' =
    valid.length > 0 && webSearchCount >= valid.length / 2 ? 'web_search' : 'model_knowledge';

  // Konkurrent-innsikt: hva anbefalte AI i de nøytrale spørsmålene der bedriften IKKE dukket opp?
  let competitorsMentioned: string[] | undefined;
  let insight: string | undefined;
  const unpromptedMisses = valid
    .filter((r) => r.type === 'unprompted' && !r.known && r.response)
    .map((r) => r.response);
  if (unpromptedMisses.length > 0) {
    const extracted = await extractCompetitorInsight(unpromptedMisses, name, k);
    if (extracted) {
      competitorsMentioned = extracted.competitors.length > 0 ? extracted.competitors : undefined;
      insight = extracted.insight || undefined;
    }
  }

  let level: 'high' | 'medium' | 'low' | 'none';
  let description: string;
  if (score >= 70) {
    level = 'high';
    description = 'AI anbefaler bedriften på nøytrale spørsmål og kjenner den godt.';
  } else if (score >= 40) {
    level = 'medium';
    description = 'AI kjenner bedriften, men anbefaler den sjelden uoppfordret.';
  } else if (score > 0) {
    level = 'low';
    description = 'AI kjenner bedriften såvidt, og anbefaler den nesten aldri uoppfordret.';
  } else {
    level = 'none';
    description = 'AI finner ikke bedriften – verken navngitt eller på nøytrale spørsmål.';
  }

  return {
    score,
    level,
    description,
    details: {
      queriesTested: valid.length,
      timesCited: citedCount,
      timesMentioned: uncertainCount,
      ...(competitorsMentioned ? { competitorsMentioned } : {}),
      ...(insight ? { insight } : {}),
      queries: queryResults.map((r) => ({
        query: r.query,
        cited: r.known,
        mentioned: r.uncertain,
        aiResponse: r.response || undefined,
        type: r.type,
      })),
    },
    recommendations: [
      score < 70 && 'Publiser mer innhold som svarer på vanlige spørsmål i din bransje',
      score < 50 && 'Øk online tilstedeværelse gjennom PR, artikler og bransjekataloger',
      citedCount === 0 && 'Skap autoritativt innhold som etablerer bedriften som en kjent ekspert',
      competitorsMentioned &&
        competitorsMentioned.length > 0 &&
        `AI anbefaler i dag andre aktører (f.eks. ${competitorsMentioned.slice(0, 3).join(', ')}) på nøytrale spørsmål – jobb med omtale og innhold for å bli nevnt`,
    ].filter(Boolean) as string[],
    source: valid.length > 0 ? source : undefined,
    modelProfile,
    ...(hasKeyword ? { focusKeyword: rawKeyword } : {}),
  };
}

/** Trekker ut konkurrentnavn + kort innsikt fra nøytrale AI-svar der bedriften ikke ble anbefalt. */
async function extractCompetitorInsight(
  responses: string[],
  name: string,
  k: string
): Promise<{ competitors: string[]; insight: string } | null> {
  try {
    const joined = responses
      .slice(0, 5)
      .map((r, i) => `Svar ${i + 1}: ${r}`)
      .join('\n\n');
    const insightModel = resolveInsightModel();
    const completion = await openai.chat.completions.create({
      model: insightModel,
      ...optionalTemperature(insightModel, 0),
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Du trekker ut firmanavn fra tekst og svarer kun med gyldig JSON.',
        },
        {
          role: 'user',
          content: `Følgende er AI-svar på nøytrale spørsmål om "${k}" i Norge, der bedriften "${name}" IKKE ble anbefalt.\n\n${joined}\n\nReturner JSON på formen {"competitors": string[], "insight": string}. "competitors" = inntil 6 unike, faktiske firmanavn som ble anbefalt (ekskluder "${name}", ekskluder generiske ord). "insight" = én kort norsk setning om hva dette betyr for ${name}s AI-synlighet.`,
        },
      ],
      ...chatCompletionTokenLimit(insightModel, 250),
    });
    const raw = completion.choices[0]?.message?.content ?? '';
    if (!raw.trim()) return null;
    const parsed = JSON.parse(raw) as { competitors?: unknown; insight?: unknown };
    const competitors = Array.isArray(parsed.competitors)
      ? Array.from(
          new Set(
            parsed.competitors
              .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
              .map((c) => c.trim())
          )
        ).slice(0, 6)
      : [];
    const insight = typeof parsed.insight === 'string' ? parsed.insight.trim() : '';
    if (competitors.length === 0 && !insight) return null;
    return { competitors, insight };
  } catch (err) {
    console.error('AI visibility competitor extraction error:', err);
    return null;
  }
}

function buildPayloadWithDescription(mainPayload: AIVisibilityPayload): AIVisibilityPayload {
  return {
    ...mainPayload,
    description:
      mainPayload.level === 'high'
        ? 'AI kjenner bedriften godt og anbefaler den også på nøytrale spørsmål.'
        : mainPayload.level === 'medium'
          ? 'AI kjenner bedriften, men anbefaler den sjelden uoppfordret. Synligheten kan styrkes.'
          : mainPayload.level === 'low'
            ? 'AI har begrenset kjennskap til bedriften, og anbefaler den nesten aldri uoppfordret.'
            : 'AI ser ikke ut til å kjenne til bedriften din ennå.',
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

/**
 * Cache-nøkkel = domene + normalisert øverste nøkkelord. Spørsmålene avhenger av nøkkelordet,
 * så to analyser på samme domene med ulike nøkkelord må ikke dele cache.
 * Lagres i `domain`-kolonnen (som er conflict target) for å unngå migrasjon.
 */
function buildCacheKey(domain: string, keywords: string[]): string {
  const top = normalizeVisibilityKeyword(keywords[0] ?? keywords[1] ?? '').replace(/\s+/g, '-');
  return top ? `${domain}|kw:${top}` : domain;
}

async function getCachedPayload(
  supabase: Awaited<ReturnType<typeof createClient>>,
  cacheKey: string
): Promise<AIVisibilityPayload | null> {
  const minCheckedAt = new Date(Date.now() - CACHE_TTL_MS).toISOString();
  const { data } = await supabase
    .from('ai_visibility_cache')
    .select('payload')
    .eq('domain', cacheKey)
    .gte('checked_at', minCheckedAt)
    .maybeSingle();
  return (data?.payload as AIVisibilityPayload) ?? null;
}

async function setCachedPayload(
  cacheKey: string,
  payload: AIVisibilityPayload
): Promise<void> {
  // Uses service-role client so writes succeed even though RLS blocks authenticated users.
  const adminClient = createAdminClient();
  await adminClient.from('ai_visibility_cache').upsert(
    { domain: cacheKey, payload, checked_at: new Date().toISOString() },
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

    const focusKeyword = normalizeVisibilityKeyword(keywords[0] ?? '');
    const normalizedKeywords = focusKeyword ? [focusKeyword] : [];
    if (!focusKeyword) {
      return NextResponse.json(
        {
          error:
            'Legg til nøkkelord under SEO / Nøkkelord og oppdater analysen før du kjører AI-synlighetssjekk.',
          keywordsRequired: true,
        },
        { status: 400 }
      );
    }

    const mainDomain = getDomainFromUrl(url);
    const cacheKey = buildCacheKey(mainDomain, normalizedKeywords);

    /** Renser, beskriver og lagrer payload på analysen, og returnerer responsen. */
    const respondWithPayload = async (raw: AIVisibilityPayload, remaining: number) => {
      const cleaned = cleanPayloadQueriesForDisplay(raw, mainDomain);
      const payload = buildPayloadWithDescription(cleaned);
      const checkedAt = new Date().toISOString();
      if (analysisId && typeof analysisId === 'string') {
        const { error: updateError } = await supabase
          .from('analyses')
          .update({ ai_visibility: { ...payload, checked_at: checkedAt } })
          .eq('id', analysisId)
          .eq('user_id', user.id);
        if (updateError) console.error('AI visibility save to analysis:', updateError);
      }
      return NextResponse.json({
        ai_visibility: { ...payload, checked_at: checkedAt },
        remaining,
        limit,
      });
    };

    // Cache-treff: server umiddelbart uten å belaste månedskvote (ingen ny kostnad).
    const cached = await getCachedPayload(supabase, cacheKey);
    if (cached && cached.details.queriesTested > 0) {
      return respondWithPayload(cached, Math.max(0, limit - used));
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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        score: null,
        message: 'OpenAI API-nøkkel mangler.',
        estimatedOnly: true,
      });
    }

    const mainPayload = await runOneVisibilityCheck(url, companyName, normalizedKeywords);

    if (mainPayload.details.queriesTested === 0) {
      return NextResponse.json(
        {
          error:
            'AI-synlighet kunne ikke sjekkes akkurat nå (API-begrensning hos leverandør). Legg til kreditt på platform.openai.com eller prøv igjen senere.',
        },
        { status: 503 }
      );
    }

    await setCachedPayload(cacheKey, mainPayload);

    // Belast kvote kun når vi faktisk har regnet ut et nytt resultat.
    const { error: insertError } = await supabase
      .from('ai_visibility_checks')
      .insert({
        user_id: user.id,
        ...(analysisId && typeof analysisId === 'string' ? { analysis_id: analysisId } : {}),
      });

    if (insertError) {
      console.error('ai_visibility_checks insert error:', insertError);
    }

    return respondWithPayload(mainPayload, Math.max(0, limit - used - 1));
  } catch (error) {
    console.error('AI visibility check error:', error);
    return NextResponse.json(
      { error: 'En feil oppstod under sjekk av AI-synlighet' },
      { status: 500 }
    );
  }
}
