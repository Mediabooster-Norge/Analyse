/** Styres med AI_VISIBILITY_QUERY_MODEL: auto | hybrid | premium | mini (standard: hybrid). */
export type AiVisibilityModelMode = 'auto' | 'hybrid' | 'premium' | 'mini';

export type AiVisibilityModelProfile = 'hybrid' | 'premium' | 'mini';

const UNPROMPTED_QUERY_MODEL = 'gpt-5-mini';
const NAMED_QUERY_MODEL = 'gpt-4o-mini';
const INSIGHT_MODEL = 'gpt-5-nano';

export const AI_VISIBILITY_WEB_SEARCH_TOOL = {
  type: 'web_search' as const,
  user_location: {
    type: 'approximate' as const,
    country: 'NO',
    region: 'Norway',
    timezone: 'Europe/Oslo',
  },
};

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
  queryType: 'unprompted' | 'named',
  mode: AiVisibilityModelMode = getAiVisibilityModelMode()
): string {
  const profile = resolveModelProfile(mode === 'auto' ? 'hybrid' : mode);

  switch (profile) {
    case 'premium':
      return UNPROMPTED_QUERY_MODEL;
    case 'mini':
      return NAMED_QUERY_MODEL;
    case 'hybrid':
    default:
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
    hybrid: 'OpenAI (gpt-5-mini på nøytrale spørsmål, gpt-4o-mini på navngitte)',
    premium: 'OpenAI gpt-5-mini',
    mini: 'OpenAI gpt-4o-mini',
  };

  if (source === 'web_search') {
    return `Testet med ${modelText[profile]} og live websøk (Norge)`;
  }
  return `Testet med ${modelText[profile]} – modellkunnskap (websøk utilgjengelig)`;
}
