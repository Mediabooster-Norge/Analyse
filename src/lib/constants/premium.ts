/**
 * Hardcoded premium email list used both server-side and client-side.
 * This is the single source of truth — update here to affect all checks.
 */
export const PREMIUM_EMAILS: string[] = [
  'web@mediabooster.no',
  'daniel@mediabooster.no',
  'sylvia@mediabooster.no',
  'hector@mediabooster.no',
  'jonas@mediabooster.no',
  'julia@mediabooster.no',
];

/** Emails that receive unlimited article generations */
export const UNLIMITED_ARTICLE_EMAILS: string[] = ['web@mediabooster.no'];

/** Emails that receive unlimited AI visibility checks (dev / internal) */
export const UNLIMITED_AI_VISIBILITY_EMAILS: string[] = [
  'web@mediabooster.no',
  'kvam@mediabooster.no',
];

/** Premium-tier monthly AI visibility checks (non-internal users) */
export const PREMIUM_MONTHLY_AI_VISIBILITY_LIMIT = 10;

/** Unlimited AI visibility checks (internal dev accounts) */
export const UNLIMITED_MONTHLY_AI_VISIBILITY_LIMIT = 999;

/** Free-tier monthly analysis limit (matches DB default) */
export const FREE_MONTHLY_ANALYSIS_LIMIT = 5;

/** Max keywords per analysis by plan */
export const FREE_KEYWORD_LIMIT = 10;
export const PREMIUM_KEYWORD_LIMIT = 50;

export function getKeywordLimit(isPremium: boolean): number {
  return isPremium ? PREMIUM_KEYWORD_LIMIT : FREE_KEYWORD_LIMIT;
}

/** Premium-tier monthly analysis limit (non-Mediabooster users) */
export const PREMIUM_MONTHLY_ANALYSIS_LIMIT = 30;

/** Unlimited monthly analyses (Mediabooster team emails) */
export const UNLIMITED_MONTHLY_ANALYSIS_LIMIT = 999;

export function isAllowlistedPremiumEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return PREMIUM_EMAILS.includes(email.toLowerCase());
}

/** @deprecated Use isAllowlistedPremiumEmail — suffix matching allowed any @mediabooster.no address */
export function isMediaboosterEmail(email: string | null | undefined): boolean {
  return isAllowlistedPremiumEmail(email);
}

export function getMonthlyAnalysisLimit(
  isPremium: boolean,
  email?: string | null,
  dbLimit?: number | null
): number {
  if (!isPremium) return FREE_MONTHLY_ANALYSIS_LIMIT;
  if (isAllowlistedPremiumEmail(email)) return UNLIMITED_MONTHLY_ANALYSIS_LIMIT;
  return dbLimit ?? PREMIUM_MONTHLY_ANALYSIS_LIMIT;
}

export function getAiVisibilityChecksLimit(
  isPremium: boolean,
  email?: string | null
): number {
  if (!isPremium) return 0;
  if (email && UNLIMITED_AI_VISIBILITY_EMAILS.includes(email.toLowerCase())) {
    return UNLIMITED_MONTHLY_AI_VISIBILITY_LIMIT;
  }
  return PREMIUM_MONTHLY_AI_VISIBILITY_LIMIT;
}
