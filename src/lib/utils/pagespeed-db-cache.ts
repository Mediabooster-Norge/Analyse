import type { AccessibilityResults, PageSpeedResults } from '@/types';

export type PagespeedDbCacheRow = {
  id: string;
  website_url: string;
  pagespeed_results: PageSpeedResults | null;
  accessibility_results?: AccessibilityResults | null;
};

/** Normalize hostname for exact domain matching (strips www, lowercases). */
export function normalizeAnalysisHostname(url: string): string {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`)
      .hostname.replace(/^www\./, '')
      .toLowerCase();
  } catch {
    return '';
  }
}

/** Find the most recent cached analysis row for an exact domain match. */
export function findCachedAnalysisForDomain(
  rows: PagespeedDbCacheRow[] | null | undefined,
  domain: string,
  excludeAnalysisId: string
): PagespeedDbCacheRow | null {
  const normalizedDomain = domain.toLowerCase();
  if (!normalizedDomain) return null;

  for (const row of rows ?? []) {
    if (row.id === excludeAnalysisId || !row.pagespeed_results) continue;
    if (normalizeAnalysisHostname(row.website_url) === normalizedDomain) {
      return row;
    }
  }
  return null;
}

/**
 * Premium WCAG requires accessibility_results. Reuse DB cache only when that data
 * exists for premium users; otherwise fall through to a live Lighthouse run.
 */
export function canUseDbPagespeedCache(
  cached: Pick<PagespeedDbCacheRow, 'pagespeed_results' | 'accessibility_results'>,
  isPremium: boolean
): boolean {
  if (!cached.pagespeed_results) return false;
  if (isPremium && !cached.accessibility_results) return false;
  return true;
}
