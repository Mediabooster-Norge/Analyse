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

export type SubscriptionTier = 'free' | 'plus' | 'premium';

export const SUBSCRIPTION_TIERS = ['free', 'plus', 'premium'] as const;

/** Free-tier monthly analysis limit (matches DB default) */
export const FREE_MONTHLY_ANALYSIS_LIMIT = 5;
export const FREE_MONTHLY_ARTICLE_LIMIT = 5;
export const FREE_MONTHLY_AI_VISIBILITY_LIMIT = 0;

/** Pluss-tier monthly limits */
export const PLUS_MONTHLY_ANALYSIS_LIMIT = 30;
export const PLUS_MONTHLY_AI_VISIBILITY_LIMIT = 10;
export const PLUS_MONTHLY_ARTICLE_LIMIT = 30;

/** Premium-tier monthly limits (higher volume, same features as Pluss) */
export const PREMIUM_MONTHLY_ANALYSIS_LIMIT = 80;
export const PREMIUM_MONTHLY_AI_VISIBILITY_LIMIT = 40;
export const PREMIUM_MONTHLY_ARTICLE_LIMIT = 60;

/** Unlimited monthly analyses (internal team emails) */
export const UNLIMITED_MONTHLY_ANALYSIS_LIMIT = 999;
export const UNLIMITED_MONTHLY_AI_VISIBILITY_LIMIT = 999;
export const UNLIMITED_MONTHLY_ARTICLE_LIMIT = 999;

/** Max keywords per analysis by plan */
export const FREE_KEYWORD_LIMIT = 10;
export const PAID_KEYWORD_LIMIT = 50;

export const FREE_COMPETITOR_LIMIT = 2;
export const PAID_COMPETITOR_LIMIT = 5;

export const FREE_UPDATE_LIMIT = 5;
export const PAID_UPDATE_LIMIT = 999;

export interface TierLimits {
  monthlyAnalyses: number;
  competitors: number;
  keywords: number;
  keywordUpdates: number;
  competitorUpdates: number;
  aiVisibilityChecks: number;
  articleGenerationsPerMonth: number;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    monthlyAnalyses: FREE_MONTHLY_ANALYSIS_LIMIT,
    competitors: FREE_COMPETITOR_LIMIT,
    keywords: FREE_KEYWORD_LIMIT,
    keywordUpdates: FREE_UPDATE_LIMIT,
    competitorUpdates: FREE_UPDATE_LIMIT,
    aiVisibilityChecks: FREE_MONTHLY_AI_VISIBILITY_LIMIT,
    articleGenerationsPerMonth: FREE_MONTHLY_ARTICLE_LIMIT,
  },
  plus: {
    monthlyAnalyses: PLUS_MONTHLY_ANALYSIS_LIMIT,
    competitors: PAID_COMPETITOR_LIMIT,
    keywords: PAID_KEYWORD_LIMIT,
    keywordUpdates: PAID_UPDATE_LIMIT,
    competitorUpdates: PAID_UPDATE_LIMIT,
    aiVisibilityChecks: PLUS_MONTHLY_AI_VISIBILITY_LIMIT,
    articleGenerationsPerMonth: PLUS_MONTHLY_ARTICLE_LIMIT,
  },
  premium: {
    monthlyAnalyses: PREMIUM_MONTHLY_ANALYSIS_LIMIT,
    competitors: PAID_COMPETITOR_LIMIT,
    keywords: PAID_KEYWORD_LIMIT,
    keywordUpdates: PAID_UPDATE_LIMIT,
    competitorUpdates: PAID_UPDATE_LIMIT,
    aiVisibilityChecks: PREMIUM_MONTHLY_AI_VISIBILITY_LIMIT,
    articleGenerationsPerMonth: PREMIUM_MONTHLY_ARTICLE_LIMIT,
  },
};

export function isPaidTier(tier: SubscriptionTier): boolean {
  return tier !== 'free';
}

export function parseSubscriptionTier(value: string | null | undefined): SubscriptionTier {
  if (value === 'plus' || value === 'premium') return value;
  return 'free';
}

export function tierFromLegacyPremiumFlag(isPremium: boolean): SubscriptionTier {
  return isPremium ? 'plus' : 'free';
}

export function isAllowlistedPremiumEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return PREMIUM_EMAILS.includes(email.toLowerCase());
}

/** @deprecated Use isAllowlistedPremiumEmail */
export function isMediaboosterEmail(email: string | null | undefined): boolean {
  return isAllowlistedPremiumEmail(email);
}

export function getTierLimits(tier: SubscriptionTier): TierLimits {
  return TIER_LIMITS[tier];
}

export function getKeywordLimit(tierOrIsPremium: SubscriptionTier | boolean): number {
  const tier =
    typeof tierOrIsPremium === 'boolean'
      ? tierFromLegacyPremiumFlag(tierOrIsPremium)
      : tierOrIsPremium;
  return isPaidTier(tier) ? PAID_KEYWORD_LIMIT : FREE_KEYWORD_LIMIT;
}

export function getMonthlyAnalysisLimit(
  tier: SubscriptionTier,
  email?: string | null,
  dbLimit?: number | null
): number {
  if (tier === 'free') return FREE_MONTHLY_ANALYSIS_LIMIT;
  if (isAllowlistedPremiumEmail(email)) return UNLIMITED_MONTHLY_ANALYSIS_LIMIT;
  if (dbLimit != null && dbLimit > 0) return dbLimit;
  return TIER_LIMITS[tier].monthlyAnalyses;
}

export function getAiVisibilityChecksLimit(
  tier: SubscriptionTier,
  email?: string | null
): number {
  if (!isPaidTier(tier)) return 0;
  if (email && UNLIMITED_AI_VISIBILITY_EMAILS.includes(email.toLowerCase())) {
    return UNLIMITED_MONTHLY_AI_VISIBILITY_LIMIT;
  }
  return TIER_LIMITS[tier].aiVisibilityChecks;
}

export function getArticleGenerationsLimit(
  tier: SubscriptionTier,
  email?: string | null
): number {
  if (tier === 'free') return FREE_MONTHLY_ARTICLE_LIMIT;
  if (email && UNLIMITED_ARTICLE_EMAILS.includes(email.toLowerCase())) {
    return UNLIMITED_MONTHLY_ARTICLE_LIMIT;
  }
  return TIER_LIMITS[tier].articleGenerationsPerMonth;
}
