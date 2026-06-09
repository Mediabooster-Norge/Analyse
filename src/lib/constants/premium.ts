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

/** Free-tier monthly analysis limit (matches DB default) */
export const FREE_MONTHLY_ANALYSIS_LIMIT = 5;

/** Premium-tier monthly analysis limit (non-Mediabooster users) */
export const PREMIUM_MONTHLY_ANALYSIS_LIMIT = 30;

/** Unlimited monthly analyses (Mediabooster team emails) */
export const UNLIMITED_MONTHLY_ANALYSIS_LIMIT = 999;

/** First N registered users automatically receive premium (founding members) */
export const FOUNDING_MEMBER_LIMIT = 100;

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
