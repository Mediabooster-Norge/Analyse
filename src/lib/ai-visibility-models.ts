/** Styres med AI_VISIBILITY_QUERY_MODEL: auto | hybrid | premium | mini (standard: hybrid). */
export type AiVisibilityModelMode = 'auto' | 'hybrid' | 'premium' | 'mini';

export type AiVisibilityModelProfile = 'hybrid' | 'premium' | 'mini';

/** Nøytrale/anbefalingsspørsmål – gpt-4o + websøk er tilstrekkelig (testet mot 5.2). */
const UNPROMPTED_QUERY_MODEL = 'gpt-4o';
/** Navngitte og oppdagelsesspørsmål. */
const NAMED_QUERY_MODEL = 'gpt-4o';
/** Premium: samme modell på alle spørsmål. */
const PREMIUM_QUERY_MODEL = 'gpt-4o';
/** Budsjettprofil (mini). */
const MINI_QUERY_MODEL = 'gpt-4o-mini';
const INSIGHT_MODEL = 'gpt-5-nano';

export function getUnpromptedQueryModel(): string {
  return UNPROMPTED_QUERY_MODEL;
}

export function getNamedQueryModel(): string {
  return NAMED_QUERY_MODEL;
}

export interface WebSearchLocation {
  /** Fylke/region, f.eks. «Vestland». Utelates for nasjonalt søk. */
  region?: string | null;
  /** By/sted, f.eks. «Bergen». Utelates for nasjonalt søk. */
  city?: string | null;
}

/**
 * Bygger web_search-verktøyet med valgfri lokasjon.
 *
 * Tidligere var lokasjonen hardkodet til Oslo, noe som systematisk favoriserte
 * Oslo-bedrifter på nøytrale anbefalingsspørsmål. Standard er nå nasjonalt (kun
 * land = NO); by/region settes kun når vi faktisk kjenner bedriftens sted.
 */
export function buildWebSearchTool(location?: WebSearchLocation) {
  const city = location?.city?.trim() || undefined;
  const region = location?.region?.trim() || undefined;
  return {
    type: 'web_search' as const,
    /** Mer søkekontekst – bedre for lokale/bransje-anbefalinger. */
    search_context_size: 'high' as const,
    user_location: {
      type: 'approximate' as const,
      country: 'NO',
      ...(region ? { region } : {}),
      ...(city ? { city } : {}),
      timezone: 'Europe/Oslo',
    },
  };
}

export function getAiVisibilityModelMode(): AiVisibilityModelMode {
  const raw = process.env.AI_VISIBILITY_QUERY_MODEL?.toLowerCase().trim();
  if (raw === 'premium' || raw === 'mini' || raw === 'hybrid' || raw === 'auto') {
    return raw;
  }
  return 'hybrid';
}

export function resolveModelProfile(mode: AiVisibilityModelMode): AiVisibilityModelProfile {
  if (mode === 'premium' || mode === 'mini') return mode;
  return 'hybrid';
}

export function resolveQueryModel(
  queryType: 'unprompted' | 'named' | 'discovery',
  mode: AiVisibilityModelMode = getAiVisibilityModelMode()
): string {
  const profile = resolveModelProfile(mode === 'auto' ? 'hybrid' : mode);

  switch (profile) {
    case 'premium':
      return PREMIUM_QUERY_MODEL;
    case 'mini':
      return MINI_QUERY_MODEL;
    case 'hybrid':
    default:
      // Discovery bruker samme modell som named (søker etter bedriftens domene).
      return queryType === 'unprompted' ? UNPROMPTED_QUERY_MODEL : NAMED_QUERY_MODEL;
  }
}

export function resolveInsightModel(mode: AiVisibilityModelMode = getAiVisibilityModelMode()): string {
  const profile = resolveModelProfile(mode === 'auto' ? 'hybrid' : mode);
  return profile === 'mini' ? NAMED_QUERY_MODEL : INSIGHT_MODEL;
}

/** GPT-5-familien støtter ikke temperature og bruker max_completion_tokens. */
export function isGpt5FamilyModel(model: string): boolean {
  return model.startsWith('gpt-5');
}

export function optionalTemperature(
  model: string,
  temperature: number
): { temperature?: number } {
  return isGpt5FamilyModel(model) ? {} : { temperature };
}

export function chatCompletionTokenLimit(
  model: string,
  limit: number
): { max_tokens?: number; max_completion_tokens?: number } {
  if (isGpt5FamilyModel(model)) {
    // GPT-5 bruker reasoning-tokens før synlig output (jf. openai.ts)
    return { max_completion_tokens: Math.max(limit, 800) };
  }
  return { max_tokens: limit };
}

export function formatVisibilityTestLabel(
  source: 'web_search' | 'model_knowledge' | undefined,
  modelProfile: AiVisibilityModelProfile | undefined
): string | null {
  if (!source) return null;

  const profile = modelProfile ?? 'hybrid';
  const modelText: Record<AiVisibilityModelProfile, string> = {
    hybrid: `OpenAI ${UNPROMPTED_QUERY_MODEL}`,
    premium: `OpenAI ${PREMIUM_QUERY_MODEL}`,
    mini: `OpenAI ${MINI_QUERY_MODEL}`,
  };

  if (source === 'web_search') {
    return `Testet med ${modelText[profile]} og live websøk (Norge)`;
  }
  return `Testet med ${modelText[profile]} – modellkunnskap (websøk utilgjengelig)`;
}
