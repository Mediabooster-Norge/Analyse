import OpenAI from 'openai';

/** Dommer bruker gpt-4o-mini – gpt-5-nano kan bruke alle tokens på reasoning og returnere tom JSON. */
const JUDGE_MODEL = 'gpt-4o-mini';

export type VisibilityQueryType = 'unprompted' | 'named' | 'discovery';

export type VisibilityJudgment = {
  positive: boolean;
  uncertain: boolean;
};

type JudgeInput = {
  response: string;
  queryType: VisibilityQueryType;
  companyName: string;
  domain: string;
  keyword: string;
  question: string;
  matchTerms?: string[];
};

type ResolveJudgmentInput = JudgeInput & {
  matchTerms: string[];
  notFoundPhrases: string[];
};

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

/** Visningsnavn i navngitte spørsmål (unngår «mediabooster.no (mediabooster.no)»). */
export function getVisibilityDisplayName(domain: string, companyName?: string): string {
  const raw = companyName?.trim();
  if (raw && !raw.includes('.') && raw.length >= 2) return raw;
  const brand = getDomainBrand(domain);
  if (brand) return brand.charAt(0).toUpperCase() + brand.slice(1);
  return domain;
}

/** Hoveddel av domenet uten TLD, f.eks. «mediabooster» fra mediabooster.no. */
function getDomainBrand(domain: string): string | null {
  const host = domain.toLowerCase().replace(/^www\./, '');
  const parts = host.split('.').filter(Boolean);
  if (parts.length < 2) return null;
  const sld = parts.length === 2 ? parts[0] : parts[parts.length - 2];
  if (!sld || sld.length < 2) return null;
  if (parts.length > 2 && sld.length <= 2) {
    const fallback = parts[0];
    return fallback && fallback.length >= 2 ? fallback : null;
  }
  return sld;
}

/** Navn/alias å lete etter i AI-svar (domene, merke, firmanavn med/uten AS). */
export function buildVisibilityMatchTerms(domain: string, companyName?: string): string[] {
  const terms = new Set<string>();
  const domainLower = domain.toLowerCase().replace(/^www\./, '');
  terms.add(domainLower);

  const brand = getDomainBrand(domainLower);
  if (brand) terms.add(brand);

  const rawName = companyName?.trim();
  if (rawName) {
    const nameLower = rawName.toLowerCase();
    terms.add(nameLower);
    const withoutLegal = nameLower.replace(/\s+(as|asa|ab|ba|ans|aps)\.?$/i, '').trim();
    if (withoutLegal.length >= 2) terms.add(withoutLegal);
    if (withoutLegal !== nameLower) terms.add(`${withoutLegal} as`);
    const firstToken = rawName.split(/[\s|–—-]+/)[0]?.trim().toLowerCase();
    if (firstToken && firstToken.length >= 2) terms.add(firstToken);
  }

  const display = getVisibilityDisplayName(domain, companyName).toLowerCase();
  if (display.length >= 2) terms.add(display);
  if (display.length >= 2 && !display.endsWith(' as')) terms.add(`${display} as`);

  return [...terms];
}

/** Regex-fallback når dommer-kallet feiler. */
export function regexFallbackJudgment(
  responseLower: string,
  matchTerms: string[],
  notFoundPhrases: string[]
): VisibilityJudgment {
  const appears = matchTerms.some((term) => {
    if (term.includes('.')) return responseLower.includes(term);
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, 'iu');
    return regex.test(responseLower);
  });
  const negated = notFoundPhrases.some((phrase) => responseLower.includes(phrase));
  if (appears && !negated) return { positive: true, uncertain: false };
  if (appears && negated) return { positive: false, uncertain: true };
  return { positive: false, uncertain: false };
}

export function judgmentToFlags(judgment: VisibilityJudgment): { known: boolean; uncertain: boolean } {
  const known = judgment.positive && !judgment.uncertain;
  return {
    known,
    uncertain: !known && judgment.uncertain,
  };
}

export function calcWeightedScorePercent(
  results: Array<{ weight: number; known: boolean }>
): number | undefined {
  if (results.length === 0) return undefined;
  const totalWeight = results.reduce((sum, r) => sum + r.weight, 0);
  const earnedWeight = results.reduce((sum, r) => sum + (r.known ? r.weight : 0), 0);
  return totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
}

/**
 * Kombinerer navnegjenkjenning + LLM-dommer.
 * Tydelig nevnt firmanavn i svaret teller alltid – dommeren skal ikke underkjenne det.
 */
export async function resolveVisibilityJudgment(input: ResolveJudgmentInput): Promise<VisibilityJudgment> {
  const responseLower = input.response.toLowerCase();
  const regexResult = regexFallbackJudgment(responseLower, input.matchTerms, input.notFoundPhrases);

  if (regexResult.positive && !regexResult.uncertain) {
    return regexResult;
  }

  if (!process.env.OPENAI_API_KEY || !input.response.trim()) {
    return regexResult;
  }

  try {
    const llmResult = await judgeVisibilityResponse({
      ...input,
      matchTerms: input.matchTerms,
    });

    if (llmResult.positive) return llmResult;
    if (regexResult.positive || regexResult.uncertain) return regexResult;
    return llmResult;
  } catch {
    return regexResult;
  }
}

/**
 * LLM-dommer for tvetydige tilfeller (supplement til navnegjenkjenning).
 */
export async function judgeVisibilityResponse(input: JudgeInput): Promise<VisibilityJudgment> {
  if (!process.env.OPENAI_API_KEY || !input.response.trim()) {
    return { positive: false, uncertain: false };
  }

  const displayName = getVisibilityDisplayName(input.domain, input.companyName);
  const aliases = (input.matchTerms ?? []).slice(0, 8).join(', ');
  const typeGuidance =
    input.queryType === 'unprompted'
      ? `Spørsmålet nevnte IKKE bedriften på forhånd. "positive"=true hvis svaret anbefaler, lister eller omtaler "${displayName}" (eller alias: ${aliases}) som relevant aktør for ${input.keyword} – også som nr. 1–6 i en liste.`
      : input.queryType === 'discovery'
        ? `Spørsmålet søkte etter bedriftens nettside for å vurdere relevans. "positive"=true hvis svaret bekrefter at "${displayName}" (${input.domain}) tilbyr ${input.keyword} eller er relevant for dette, selv om det nevner begrensninger. "positive"=false kun hvis bedriften ikke finnes eller er irrelevant.`
        : `Spørsmålet nevnte bedriften direkte. "positive"=true hvis svaret viser reell kunnskap om "${displayName}" (${input.domain}) eller alias (${aliases}). "Jeg vet ikke" / "ingen info" = positive false.`;

  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: JUDGE_MODEL,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Du vurderer AI-synlighet. Svar kun med gyldig JSON: {"positive": boolean, "uncertain": boolean}. uncertain=true ved tvetydig svar. Hvis firmanavnet eller et alias står tydelig i svaret som anbefaling eller i en liste: positive=true.',
        },
        {
          role: 'user',
          content: `Bedrift: "${displayName}" (${input.domain})\nBransje/nøkkelord: ${input.keyword}\n${typeGuidance}\n\nSpørsmål: ${input.question}\n\nAI-svar:\n${input.response.slice(0, 3000)}\n\nReturner JSON.`,
        },
      ],
      max_tokens: 120,
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    if (!raw.trim()) {
      return { positive: false, uncertain: true };
    }

    const parsed = JSON.parse(raw) as { positive?: unknown; uncertain?: unknown };
    return {
      positive: parsed.positive === true,
      uncertain: parsed.uncertain === true,
    };
  } catch (err) {
    console.warn('AI visibility judge fallback:', err instanceof Error ? err.message : err);
    return { positive: false, uncertain: false };
  }
}
