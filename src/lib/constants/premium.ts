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

export function isMediaboosterEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith('@mediabooster.no');
}

export function getMonthlyAnalysisLimit(
  isPremium: boolean,
  email?: string | null,
  dbLimit?: number | null
): number {
  if (!isPremium) return FREE_MONTHLY_ANALYSIS_LIMIT;
  if (isMediaboosterEmail(email)) return UNLIMITED_MONTHLY_ANALYSIS_LIMIT;
  return dbLimit ?? PREMIUM_MONTHLY_ANALYSIS_LIMIT;
}
