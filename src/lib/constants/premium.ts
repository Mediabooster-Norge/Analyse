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
