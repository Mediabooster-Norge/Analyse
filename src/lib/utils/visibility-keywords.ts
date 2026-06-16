import type { DashboardAnalysisResult, AIVisibilityData } from '@/types/dashboard';

/**
 * Vanlige norske sammenslåinger i søk – «digitalt byrå» og «digitalbyrå» skal gi samme sjekk/cache.
 * Utvides etter behov; hold mønstrene konservative for å unngå feil sammenslåing.
 */
const VISIBILITY_COMPOUND_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bdigitalt\s+byrå\b/gi, 'digitalbyrå'],
  [/\bdigital\s+byrå\b/gi, 'digitalbyrå'],
  [/\bmarkedsførings\s+byrå\b/gi, 'markedsføringsbyrå'],
  [/\binnholds\s+markedsføring\b/gi, 'innholdsmarkedsføring'],
  [/\bsøkemotor\s*optimalisering\b/gi, 'søkemotoroptimalisering'],
  [/\bseo\s+tjenester\b/gi, 'seotjenester'],
  [/\bpr\s+tjenester\b/gi, 'prtjenester'],
  [/\bweb\s*design\b/gi, 'webdesign'],
  [/\bux\s*design\b/gi, 'uxdesign'],
  [/\bui\s*design\b/gi, 'uidesign'],
];

export const VISIBILITY_KEYWORD_MIN_LENGTH = 2;
export const VISIBILITY_KEYWORD_MAX_LENGTH = 80;

/** Normaliserer nøkkelord for AI-synlighet (cache, spørsmål, deduplisering i UI). */
export function normalizeVisibilityKeyword(keyword: string): string {
  let k = keyword.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!k) return '';

  for (const [pattern, replacement] of VISIBILITY_COMPOUND_REPLACEMENTS) {
    k = k.replace(pattern, replacement);
  }

  return k.replace(/\s+/g, ' ').trim();
}

/** Nøkkelord fra nøkkelordanalyse som kan brukes i AI-synlighetssjekk. */
export function getVisibilityKeywordOptions(result: DashboardAnalysisResult | null): string[] {
  if (!result?.keywordResearch?.length) return [];

  const seen = new Set<string>();
  const options: string[] = [];

  for (const entry of result.keywordResearch) {
    const normalized = normalizeVisibilityKeyword(entry.keyword);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    options.push(normalized);
  }

  return options;
}

export function isValidVisibilityKeyword(keyword: string): boolean {
  const k = normalizeVisibilityKeyword(keyword);
  return k.length >= VISIBILITY_KEYWORD_MIN_LENGTH && k.length <= VISIBILITY_KEYWORD_MAX_LENGTH;
}

export function hasKeywordsForAiVisibility(result: DashboardAnalysisResult | null): boolean {
  return getVisibilityKeywordOptions(result).length > 0;
}

/** Velger aktivt nøkkelord: lagret/custom først, ellers første fra analysen. */
export function resolveVisibilityKeywordSelection(
  selection: string | null | undefined,
  options: string[]
): string | null {
  const normalized = selection ? normalizeVisibilityKeyword(selection) : '';
  if (normalized && isValidVisibilityKeyword(normalized)) return normalized;
  return options[0] ?? null;
}

/** Standardvalg ved innlasting av analyse (siste brukte nøkkelord fra lagret sjekk). */
export function getDefaultAiVisibilityKeyword(
  result: DashboardAnalysisResult | null
): string | null {
  const options = getVisibilityKeywordOptions(result);
  const saved = normalizeVisibilityKeyword(result?.aiVisibility?.focusKeyword ?? '');
  if (saved && isValidVisibilityKeyword(saved)) return saved;
  return options[0] ?? null;
}

/**
 * Velger AI-synlighetsdata å vise.
 * Session-state brukes kun når den tilhører samme analyse som currentAnalysisId.
 */
export function resolveAiVisibilityData(
  result: DashboardAnalysisResult | null,
  aiVisibilityResult: AIVisibilityData | null,
  currentAnalysisId: string | null,
  aiVisibilityAnalysisId: string | null
): AIVisibilityData | null {
  const fromResult = result?.aiVisibility ?? null;
  const sessionMatches =
    !!currentAnalysisId &&
    currentAnalysisId === aiVisibilityAnalysisId &&
    !!aiVisibilityResult;
  const fromSession = sessionMatches ? aiVisibilityResult : null;

  if (!fromSession) return fromResult;
  if (!fromResult) return fromSession;

  const resultAt = fromResult.checked_at ? new Date(fromResult.checked_at).getTime() : 0;
  const freshAt = fromSession.checked_at ? new Date(fromSession.checked_at).getTime() : 0;

  return freshAt >= resultAt ? fromSession : fromResult;
}
