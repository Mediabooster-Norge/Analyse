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
import { cleanAiVisibilityResponse, compactAiVisibilityResponse } from '@/lib/utils/ai-visibility-response';
import {
  resolveVisibilityJudgment,
  judgmentToFlags,
  buildVisibilityMatchTerms,
  getVisibilityDisplayName,
  calcWeightedScorePercent,
  type VisibilityQueryType,
} from '@/lib/ai-visibility-judge';

export const maxDuration = 300; // Samme som hovedanalysen – 10 websøk-spørsmål kan ta lang tid

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
// hybrid = gpt-4o på alle spørsmål. Websøk med user_location Oslo, NO.
// Fallback = Chat Completions uten websøk ved feil/429. Estimert kostnad: ca. $0.20–0.50 per kjøring (hybrid).

/** Hvor mange spørringer som kjøres samtidig (holder oss trygt under maxDuration). */
const QUERY_CONCURRENCY = 4;
/** Lav temperatur for mer reproduserbar score mellom kjøringer. */
const QUERY_TEMPERATURE = 0.2;

/**
 * Vi ønsker en mer stabil score uten å måtte gjenta alle websøk-spørringene flere ganger.
 * Derfor kjører vi dommer-/klassifiseringssteg 3 ganger og velger median basert på total score.
 */
const AI_VISIBILITY_JUDGE_RUNS = 3;

/** Instruksjon til modellen ved websøk – ikke vist til bruker. */
const VISIBILITY_DEVELOPER_INSTRUCTION =
  'Du tester AI-synlighet for norske bedrifter. Svar kort og presist på norsk. Ingen innledning («Her er noen forslag»), ingen oppfølgingsspørsmål til brukeren, ingen URL-er eller kildelister.';

const WEB_BRIEF_BASE =
  ' Svar på norsk. Ingen innledning, ingen URL-er, ingen oppfølgingsspørsmål.';
const UNPROMPTED_WEB_BRIEF =
  `${WEB_BRIEF_BASE} List opp maks 5–6 firmanavn som punktliste (navn + én kort setning per punkt).`;
const NAMED_WEB_BRIEF = `${WEB_BRIEF_BASE} Maks 3–4 setninger.`;
const DISCOVERY_WEB_BRIEF =
  `${WEB_BRIEF_BASE} Maks 4–5 setninger. Fokus: tilbyr de tjenesten og kort omtale.`;

function maxOutputTokensForQueryType(type: QueryType): number {
  switch (type) {
    case 'unprompted':
      return 380;
    case 'named':
      return 220;
    case 'discovery':
      return 280;
    default:
      return 280;
  }
}

type QueryType = 'unprompted' | 'named' | 'discovery';

type AIVisibilityPayload = {
  score: number;
  level: 'high' | 'medium' | 'low' | 'none';
  description: string;
  details: {
    queriesTested: number;
    timesCited: number;
    timesMentioned: number;
    webSearchCount?: number;
    estimatedCount?: number;
    /** Stabilitet (min/max/median) basert på flere dommerkjøringer (uten å gjenta alle websøk). */
    scoreStability?: {
      runs: number;
      minScore: number;
      maxScore: number;
      medianScore: number;
    };
    competitorsMentioned?: string[];
    insight?: string;
    queries: Array<{
      query: string;
      cited: boolean;
      mentioned: boolean;
      aiResponse?: string;
      type?: 'unprompted' | 'named' | 'discovery';
      usedWebSearch?: boolean;
      estimated?: boolean;
      scored?: boolean;
    }>;
  };
  recommendations: string[];
  /** 'web_search' når flertallet av spørringene brukte live søk, ellers 'model_knowledge'. */
  source?: 'web_search' | 'model_knowledge';
  /** Bransjenøkkelord spørsmålene ble stilt om */
  focusKeyword?: string;
  /** hybrid | premium | mini */
  modelProfile?: 'hybrid' | 'premium' | 'mini';
  /** 0–100: anbefaling på nøytrale spørsmål (kun live websøk) */
  recommendationScore?: number;
  /** 0–100: kjennskap når bedriften navngis (kun live websøk) */
  knowledgeScore?: number;
  /** 0–100: finnbar og relevant ved direkte søk etter domene + nøkkelord */
  discoveryScore?: number;
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
  const displayName = getVisibilityDisplayName(domain, companyName);
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

  let specs: QuerySpec[];
  if (hasKeyword) {
    // Nøytrale spørsmål: nevner IKKE bedriften. Måler om AI anbefaler den uoppfordret.
    const unprompted: QuerySpec[] = [
      {
        type: 'unprompted', weight: 2,
        web: `Kan du anbefale en bedrift i Oslo som leverer ${k}?${UNPROMPTED_WEB_BRIEF}`,
        model: `Kan du anbefale en bedrift i Oslo som leverer ${k}?`,
      },
      {
        type: 'unprompted', weight: 1,
        web: `Kan du anbefale en bedrift i Norge som tilbyr ${k}? Nevn konkrete firmanavn.${UNPROMPTED_WEB_BRIEF}`,
        model: `Kan du anbefale en bedrift i Norge som tilbyr ${k}? Nevn konkrete firmanavn.`,
      },
      {
        type: 'unprompted', weight: 1,
        web: `Hvem bør jeg velge for ${k} i Oslo-området? Gi anbefalinger med navn.${UNPROMPTED_WEB_BRIEF}`,
        model: `Hvem bør jeg velge for ${k} i Oslo-området? Gi anbefalinger med navn.`,
      },
      {
        type: 'unprompted', weight: 1,
        web: `Hvilke selskaper er ledende innen ${k} i Norge?${UNPROMPTED_WEB_BRIEF}`,
        model: `Hvilke selskaper er ledende innen ${k} i Norge? Nevn navn.`,
      },
      {
        type: 'unprompted', weight: 1,
        web: `Hvilke byråer eller leverandører er best på ${k} i Norge?${UNPROMPTED_WEB_BRIEF}`,
        model: `Hvilke byråer eller leverandører er best på ${k} i Norge? Nevn navn.`,
      },
    ];
    // Navngitte spørsmål: nevner bedriften. Måler om AI faktisk kjenner den.
    const named: QuerySpec[] = [
      {
        type: 'named', weight: 2,
        web: `Er ${displayName} blant de ledende innen ${k} i Norge?${NAMED_WEB_BRIEF}`,
        model: `Er ${displayName} blant de ledende innen ${k} i Norge?`,
      },
      {
        type: 'named', weight: 2,
        web: `Kan du anbefale ${displayName} for ${k}? Hva er styrkene?${NAMED_WEB_BRIEF}`,
        model: `Kan du anbefale ${displayName} for ${k}?`,
      },
      {
        type: 'named', weight: 2,
        web: `Hvordan skiller ${displayName} seg fra andre innen ${k}?${NAMED_WEB_BRIEF}`,
        model: `Hvordan skiller ${displayName} seg fra andre innen ${k}?`,
      },
    ];
    // Oppdagelsesspørsmål: søker etter bedriftens nettside + nøkkelord.
    // Tester om bedriften er FINNBAR og RELEVANT for bransjen – uavhengig av om den
    // dukker opp i generelle anbefalinger. Viktig fordi ChatGPT-appen bruker Google
    // Maps/lokale bedriftslister som API-et ikke har.
    const discovery: QuerySpec[] = [
      {
        type: 'discovery', weight: 2,
        web: `Søk etter ${domain} og vurder: tilbyr de ${k}?${DISCOVERY_WEB_BRIEF}`,
        model: `Tilbyr ${displayName} (${domain}) ${k}? Beskriv kort.`,
      },
      {
        type: 'discovery', weight: 2,
        web: `Hva sier anmeldelser og omtale om ${displayName} (${domain}) når det gjelder ${k}?${DISCOVERY_WEB_BRIEF}`,
        model: `Hva sier omtale om ${displayName} innen ${k}?`,
      },
    ];
    specs = [...unprompted, ...named, ...discovery];
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
    modelQuestion: string;
    type: QueryType;
    weight: number;
    known: boolean;
    uncertain: boolean;
    /** Kompakt tekst for visning/lagring */
    response: string;
    /** Full renset tekst brukt til scoring og konkurrent-uttrekk */
    judgmentResponse: string;
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
          // Tving websøk på alle spørsmålstyper (for å være mer ChatGPT-lignende).
          tool_choice: 'required',
          max_output_tokens: maxOutputTokensForQueryType(spec.type),
          input: [
            { role: 'developer', content: VISIBILITY_DEVELOPER_INSTRUCTION },
            { role: 'user', content: spec.web },
          ],
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
                  'Du svarer kort og ærlig på norsk. Maks 4–6 setninger. Ingen innledning, ingen URL-er, ingen oppfølgingsspørsmål. Hvis du ikke kjenner bedriften, si det tydelig.',
              },
              { role: 'user', content: spec.model },
            ],
            ...chatCompletionTokenLimit(queryModel, maxOutputTokensForQueryType(spec.type)),
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
      }

      const judgmentResponse = resultContent
        ? cleanAiVisibilityResponse(resultContent)
        : '';
      const displayResponse = judgmentResponse
        ? compactAiVisibilityResponse(judgmentResponse, spec.type)
        : '';

      return {
        query: spec.model,
        modelQuestion: spec.model,
        type: spec.type,
        weight: spec.weight,
        known: false,
        uncertain: false,
        response: displayResponse,
        judgmentResponse,
        usedWebSearch,
        error: queryError,
      };
    }
  );

  const judgeCandidates = queryResults.filter((r) => !r.error && r.judgmentResponse.trim());

  type JudgeRun = {
    score: number;
    recommendationScore: number | undefined;
    knowledgeScore: number | undefined;
    discoveryScore: number | undefined;
    citedCount: number;
    uncertainCount: number;
    webSearchCount: number;
    estimatedCount: number;
    source: 'web_search' | 'model_knowledge';
    validCount: number;
    scorable: QueryResult[];
    scorePool: QueryResult[];
    finalResults: QueryResult[];
  };

  const judgeRuns: JudgeRun[] = [];
  for (let judgeRunIndex = 0; judgeRunIndex < AI_VISIBILITY_JUDGE_RUNS; judgeRunIndex++) {
    const judgedResults = await mapWithConcurrency<QueryResult, QueryResult>(
      judgeCandidates,
      QUERY_CONCURRENCY,
      async (result) => {
        const judgment = await resolveVisibilityJudgment({
          response: result.judgmentResponse,
          queryType: result.type as VisibilityQueryType,
          companyName: displayName,
          domain,
          keyword: k,
          question: result.modelQuestion,
          matchTerms,
          notFoundPhrases,
        });
        const flags = judgmentToFlags(judgment);
        return { ...result, known: flags.known, uncertain: flags.uncertain };
      }
    );

    const judgedByQuery = new Map(judgedResults.map((r) => [r.query, r]));
    const finalResults = queryResults.map((r) => judgedByQuery.get(r.query) ?? r);

    const valid = finalResults.filter((r) => !r.error);
    const scorable = valid.filter((r) => r.usedWebSearch);
    const scorePool = scorable.length > 0 ? scorable : valid;

    const totalWeight = scorePool.reduce((sum, r) => sum + r.weight, 0);
    const earnedWeight = scorePool.reduce((sum, r) => sum + (r.known ? r.weight : 0), 0);
    const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

    const unpromptedScorable = scorable.filter((r) => r.type === 'unprompted');
    const namedScorable = scorable.filter((r) => r.type === 'named');
    const discoveryScorable = scorable.filter((r) => r.type === 'discovery');
    const recommendationScore = calcWeightedScorePercent(unpromptedScorable);
    const knowledgeScore = calcWeightedScorePercent(namedScorable);
    const discoveryScore = calcWeightedScorePercent(discoveryScorable);

    const citedCount = scorePool.filter((r) => r.known).length;
    const uncertainCount = scorePool.filter((r) => r.uncertain).length;
    const webSearchCount = valid.filter((r) => r.usedWebSearch).length;
    const estimatedCount = valid.filter((r) => !r.usedWebSearch).length;

    // source = web_search kun når flertallet av gyldige spørringer faktisk brukte live søk.
    const source: 'web_search' | 'model_knowledge' =
      valid.length > 0 && webSearchCount >= valid.length / 2 ? 'web_search' : 'model_knowledge';

    judgeRuns.push({
      score,
      recommendationScore,
      knowledgeScore,
      discoveryScore,
      citedCount,
      uncertainCount,
      webSearchCount,
      estimatedCount,
      source,
      validCount: valid.length,
      scorable,
      scorePool,
      finalResults,
    });
  }

  const scores = judgeRuns.map((r) => r.score).slice().sort((a, b) => a - b);
  const medianScore = scores[Math.floor(scores.length / 2)] ?? 0;
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);

  const medianRun =
    judgeRuns.find((r) => r.score === medianScore) ??
    judgeRuns.slice().sort((a, b) => a.score - b.score)[Math.floor(judgeRuns.length / 2)] ??
    judgeRuns[0];

  const { score, recommendationScore, knowledgeScore, discoveryScore } = medianRun;

  // Konkurrent-innsikt: hva anbefalte AI i de nøytrale spørsmålene der bedriften IKKE dukket opp?
  let competitorsMentioned: string[] | undefined;
  let insight: string | undefined;
  const unpromptedMisses = medianRun.scorePool
    .filter((r) => r.type === 'unprompted' && !r.known && r.judgmentResponse)
    .map((r) => r.judgmentResponse);

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
    description = 'AI har begrenset kjennskap til bedriften, og anbefaler den nesten aldri uoppfordret.';
  } else {
    level = 'none';
    description = 'AI finner ikke bedriften – verken navngitt eller på nøytrale spørsmål.';
  }

  const rec = recommendationScore ?? 0;
  const know = knowledgeScore ?? 0;
  const disc = discoveryScore ?? 0;

  if (disc >= 70 && know >= 70 && rec < 30) {
    description = 'AI finner og kjenner bedriften godt, men nevner den sjelden i generelle anbefalinger. ChatGPT-appen (kart/lokale lister) kan gi et bedre bilde.';
    if (level === 'low') level = 'medium';
  } else if (know >= 50 && rec < 35 && disc < 50) {
    description = 'AI kjenner bedriften når den navngis, men anbefaler den sjelden på egne bransjespørsmål.';
    if (level === 'high') level = 'medium';
  } else if (rec >= 50 && know < 35) {
    description = 'AI nevner bedriften på nøytrale spørsmål, men viser svak kjennskap når den navngis direkte.';
  }

  return {
    score,
    level,
    description,
    ...(recommendationScore !== undefined ? { recommendationScore } : {}),
    ...(knowledgeScore !== undefined ? { knowledgeScore } : {}),
    ...(discoveryScore !== undefined ? { discoveryScore } : {}),
    details: {
      queriesTested: medianRun.scorePool.length,
      timesCited: medianRun.citedCount,
      timesMentioned: medianRun.uncertainCount,
      webSearchCount: medianRun.webSearchCount,
      estimatedCount: medianRun.estimatedCount,
      scoreStability: {
        runs: AI_VISIBILITY_JUDGE_RUNS,
        minScore,
        maxScore,
        medianScore,
      },
      ...(competitorsMentioned ? { competitorsMentioned } : {}),
      ...(insight ? { insight } : {}),
      queries: medianRun.finalResults.map((r) => ({
        query: r.query,
        cited: r.known,
        mentioned: r.uncertain,
        aiResponse: r.response || undefined,
        type: r.type,
        usedWebSearch: r.usedWebSearch,
        estimated: !r.usedWebSearch && !r.error,
        scored: medianRun.scorable.length > 0 ? r.usedWebSearch && !r.error : !r.error,
      })),
    },
    recommendations: [
      medianRun.scorable.length > 0 &&
        medianRun.estimatedCount > 0 &&
        'Noen svar ble estimert uten live websøk og telles ikke i hovedscore – kjør sjekken på nytt for fullstendig bilde.',
      score < 70 && 'Publiser mer innhold som svarer på vanlige spørsmål i din bransje',
      score < 50 && 'Øk online tilstedeværelse gjennom PR, artikler og bransjekataloger',
      medianRun.citedCount === 0 && 'Skap autoritativt innhold som etablerer bedriften som en kjent ekspert',
      competitorsMentioned &&
        competitorsMentioned.length > 0 &&
        `AI anbefaler i dag andre aktører (f.eks. ${competitorsMentioned.slice(0, 3).join(', ')}) på nøytrale spørsmål – jobb med omtale og innhold for å bli nevnt`,
    ].filter(Boolean) as string[],
    source: medianRun.validCount > 0 ? medianRun.source : undefined,
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
        aiResponse: q.aiResponse ? cleanAiVisibilityResponse(q.aiResponse) : undefined,
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
          error: 'Oppgi et bransjenøkkelord for AI-synlighetssjekken.',
          keywordsRequired: true,
        },
        { status: 400 }
      );
    }

    const mainDomain = getDomainFromUrl(url);
    const cacheKey = buildCacheKey(mainDomain, normalizedKeywords);

    const buildResponsePayload = (raw: AIVisibilityPayload) => {
      const cleaned = cleanPayloadQueriesForDisplay(raw, mainDomain);
      const payload = buildPayloadWithDescription(cleaned);
      const checkedAt = new Date().toISOString();
      return { payload, checkedAt };
    };

    /** Lagrer på analysen når analysisId er satt. Kaster ved feil slik at kvote ikke belastes uten persistert data. */
    const savePayloadToAnalysis = async (
      payload: AIVisibilityPayload,
      checkedAt: string
    ): Promise<void> => {
      if (!analysisId || typeof analysisId !== 'string') return;

      const { error: updateError } = await supabase
        .from('analyses')
        .update({ ai_visibility: { ...payload, checked_at: checkedAt } })
        .eq('id', analysisId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('AI visibility save to analysis:', updateError);
        throw new Error('SAVE_FAILED');
      }
    };

    const respondWithPayload = (
      payload: AIVisibilityPayload,
      checkedAt: string,
      remaining: number
    ) =>
      NextResponse.json({
        ai_visibility: { ...payload, checked_at: checkedAt },
        remaining,
        limit,
      });

    // Cache-treff: server umiddelbart uten å belaste månedskvote (ingen ny kostnad).
    const cached = await getCachedPayload(supabase, cacheKey);
    const hasCompatibleStability = cached?.details.scoreStability?.runs === AI_VISIBILITY_JUDGE_RUNS;
    if (cached && cached.details.queriesTested > 0 && hasCompatibleStability) {
      const { payload, checkedAt } = buildResponsePayload(cached);
      try {
        await savePayloadToAnalysis(payload, checkedAt);
      } catch {
        return NextResponse.json(
          { error: 'Kunne ikke lagre AI-synlighet på analysen. Prøv igjen.' },
          { status: 500 }
        );
      }
      return respondWithPayload(payload, checkedAt, Math.max(0, limit - used));
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

    const { payload, checkedAt } = buildResponsePayload(mainPayload);

    try {
      await savePayloadToAnalysis(payload, checkedAt);
    } catch {
      return NextResponse.json(
        { error: 'Kunne ikke lagre AI-synlighet på analysen. Prøv igjen.' },
        { status: 500 }
      );
    }

    await setCachedPayload(cacheKey, mainPayload);

    // Belast kvote kun etter vellykket lagring (unngår tap av sjekk uten persistert resultat).
    const { error: insertError } = await supabase
      .from('ai_visibility_checks')
      .insert({
        user_id: user.id,
        ...(analysisId && typeof analysisId === 'string' ? { analysis_id: analysisId } : {}),
      });

    if (insertError) {
      console.error('ai_visibility_checks insert error:', insertError);
      return NextResponse.json(
        { error: 'Kunne ikke registrere AI-synlighetssjekk. Prøv igjen.' },
        { status: 500 }
      );
    }

    return respondWithPayload(payload, checkedAt, Math.max(0, limit - used - 1));
  } catch (error) {
    console.error('AI visibility check error:', error);
    return NextResponse.json(
      { error: 'En feil oppstod under sjekk av AI-synlighet' },
      { status: 500 }
    );
  }
}
