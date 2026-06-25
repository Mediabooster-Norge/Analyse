import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';
import {
  UNLIMITED_ARTICLE_EMAILS,
  FREE_MONTHLY_ANALYSIS_LIMIT,
  FREE_MONTHLY_ARTICLE_LIMIT,
  UNLIMITED_MONTHLY_ANALYSIS_LIMIT,
  UNLIMITED_MONTHLY_ARTICLE_LIMIT,
  isAllowlistedPremiumEmail,
  isPaidTier,
  getMonthlyAnalysisLimit,
  getAiVisibilityChecksLimit,
  getArticleGenerationsLimit,
  parseSubscriptionTier,
  tierFromLegacyPremiumFlag,
  type SubscriptionTier,
} from '@/lib/constants/premium';

export type PremiumStatusServer = {
  subscriptionTier: SubscriptionTier;
  /** True for Pluss or Premium (paid plans) */
  isPremium: boolean;
  monthlyAnalysisLimit: number;
  articleGenerationsPerMonth: number;
  aiVisibilityChecksPerMonth: number;
};

/**
 * Server-side premium check. Use this in API routes and Server Components.
 * Do not import from usePremium (client hook) on the server.
 */
export async function getPremiumStatusServer(user: User | null): Promise<PremiumStatusServer> {
  if (!user) {
    return {
      subscriptionTier: 'free',
      isPremium: false,
      monthlyAnalysisLimit: FREE_MONTHLY_ANALYSIS_LIMIT,
      articleGenerationsPerMonth: FREE_MONTHLY_ARTICLE_LIMIT,
      aiVisibilityChecksPerMonth: 0,
    };
  }

  if (isAllowlistedPremiumEmail(user.email)) {
    const hasUnlimitedArticles = UNLIMITED_ARTICLE_EMAILS.includes(user.email!);
    return {
      subscriptionTier: 'premium',
      isPremium: true,
      monthlyAnalysisLimit: UNLIMITED_MONTHLY_ANALYSIS_LIMIT,
      articleGenerationsPerMonth: hasUnlimitedArticles
        ? UNLIMITED_MONTHLY_ARTICLE_LIMIT
        : getArticleGenerationsLimit('premium', user.email),
      aiVisibilityChecksPerMonth: getAiVisibilityChecksLimit('premium', user.email),
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_profiles')
    .select('is_premium, subscription_tier, monthly_analysis_limit')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data) {
    return {
      subscriptionTier: 'free',
      isPremium: false,
      monthlyAnalysisLimit: FREE_MONTHLY_ANALYSIS_LIMIT,
      articleGenerationsPerMonth: FREE_MONTHLY_ARTICLE_LIMIT,
      aiVisibilityChecksPerMonth: 0,
    };
  }

  const subscriptionTier =
    data.subscription_tier != null
      ? parseSubscriptionTier(data.subscription_tier)
      : tierFromLegacyPremiumFlag(data.is_premium ?? false);

  return {
    subscriptionTier,
    isPremium: isPaidTier(subscriptionTier),
    monthlyAnalysisLimit: getMonthlyAnalysisLimit(
      subscriptionTier,
      user.email,
      data.monthly_analysis_limit
    ),
    articleGenerationsPerMonth: getArticleGenerationsLimit(subscriptionTier, user.email),
    aiVisibilityChecksPerMonth: getAiVisibilityChecksLimit(subscriptionTier, user.email),
  };
}
