'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import {
  UNLIMITED_ARTICLE_EMAILS,
  FREE_MONTHLY_ANALYSIS_LIMIT,
  UNLIMITED_MONTHLY_ANALYSIS_LIMIT,
  UNLIMITED_MONTHLY_ARTICLE_LIMIT,
  isAllowlistedPremiumEmail,
  isPaidTier,
  getMonthlyAnalysisLimit,
  getArticleGenerationsLimit,
  getTierLimits,
  parseSubscriptionTier,
  tierFromLegacyPremiumFlag,
  TIER_LIMITS,
  type SubscriptionTier,
  type TierLimits,
} from '@/lib/constants/premium';

interface PremiumStatus {
  subscriptionTier: SubscriptionTier;
  isPremium: boolean;
  monthlyAnalysisLimit: number;
  articleGenerationsPerMonth: number;
  premiumExpiresAt: Date | null;
  loading: boolean;
}

/** @deprecated Use TIER_LIMITS from @/lib/constants/premium */
export const PREMIUM_LIMITS = TIER_LIMITS;

export function getTierLimitsForHook(tier: SubscriptionTier): TierLimits {
  return getTierLimits(tier);
}

/** @deprecated Use getTierLimitsForHook(subscriptionTier) */
export function getPremiumLimits(isPremium: boolean): TierLimits {
  return getTierLimits(isPremium ? 'plus' : 'free');
}

export function usePremium(): PremiumStatus {
  const [status, setStatus] = useState<PremiumStatus>({
    subscriptionTier: 'free',
    isPremium: false,
    monthlyAnalysisLimit: FREE_MONTHLY_ANALYSIS_LIMIT,
    articleGenerationsPerMonth: TIER_LIMITS.free.articleGenerationsPerMonth,
    premiumExpiresAt: null,
    loading: true,
  });

  useEffect(() => {
    async function checkPremiumStatus() {
      const supabase = createClient();

      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setStatus({
            subscriptionTier: 'free',
            isPremium: false,
            monthlyAnalysisLimit: FREE_MONTHLY_ANALYSIS_LIMIT,
            articleGenerationsPerMonth: TIER_LIMITS.free.articleGenerationsPerMonth,
            premiumExpiresAt: null,
            loading: false,
          });
          return;
        }

        if (isAllowlistedPremiumEmail(user.email)) {
          const hasUnlimitedArticles = UNLIMITED_ARTICLE_EMAILS.includes(user.email!);
          setStatus({
            subscriptionTier: 'premium',
            isPremium: true,
            monthlyAnalysisLimit: UNLIMITED_MONTHLY_ANALYSIS_LIMIT,
            articleGenerationsPerMonth: hasUnlimitedArticles
              ? UNLIMITED_MONTHLY_ARTICLE_LIMIT
              : getArticleGenerationsLimit('premium', user.email),
            premiumExpiresAt: null,
            loading: false,
          });
          return;
        }

        const { data, error } = await supabase.rpc('get_user_premium_status');

        if (error) {
          console.warn('Premium status check failed, using fallback:', error.message);
          setStatus({
            subscriptionTier: 'free',
            isPremium: false,
            monthlyAnalysisLimit: FREE_MONTHLY_ANALYSIS_LIMIT,
            articleGenerationsPerMonth: TIER_LIMITS.free.articleGenerationsPerMonth,
            premiumExpiresAt: null,
            loading: false,
          });
          return;
        }

        if (data && data.length > 0) {
          const profile = data[0];
          const subscriptionTier =
            profile.subscription_tier != null
              ? parseSubscriptionTier(profile.subscription_tier)
              : tierFromLegacyPremiumFlag(profile.is_premium ?? false);

          setStatus({
            subscriptionTier,
            isPremium: isPaidTier(subscriptionTier),
            monthlyAnalysisLimit: getMonthlyAnalysisLimit(
              subscriptionTier,
              user.email,
              profile.monthly_analysis_limit
            ),
            articleGenerationsPerMonth: getArticleGenerationsLimit(subscriptionTier, user.email),
            premiumExpiresAt: profile.premium_expires_at
              ? new Date(profile.premium_expires_at)
              : null,
            loading: false,
          });
        } else {
          setStatus({
            subscriptionTier: 'free',
            isPremium: false,
            monthlyAnalysisLimit: FREE_MONTHLY_ANALYSIS_LIMIT,
            articleGenerationsPerMonth: TIER_LIMITS.free.articleGenerationsPerMonth,
            premiumExpiresAt: null,
            loading: false,
          });
        }
      } catch (error) {
        console.error('Error checking premium status:', error);
        setStatus({
          subscriptionTier: 'free',
          isPremium: false,
          monthlyAnalysisLimit: FREE_MONTHLY_ANALYSIS_LIMIT,
          articleGenerationsPerMonth: TIER_LIMITS.free.articleGenerationsPerMonth,
          premiumExpiresAt: null,
          loading: false,
        });
      }
    }

    checkPremiumStatus();
  }, []);

  return status;
}

export async function checkPremiumStatusClient(user: User | null): Promise<{
  subscriptionTier: SubscriptionTier;
  isPremium: boolean;
  monthlyAnalysisLimit: number;
}> {
  if (!user) {
    return { subscriptionTier: 'free', isPremium: false, monthlyAnalysisLimit: FREE_MONTHLY_ANALYSIS_LIMIT };
  }

  if (isAllowlistedPremiumEmail(user.email)) {
    return {
      subscriptionTier: 'premium',
      isPremium: true,
      monthlyAnalysisLimit: UNLIMITED_MONTHLY_ANALYSIS_LIMIT,
    };
  }

  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc('get_user_premium_status');

    if (error || !data || data.length === 0) {
      return { subscriptionTier: 'free', isPremium: false, monthlyAnalysisLimit: FREE_MONTHLY_ANALYSIS_LIMIT };
    }

    const profile = data[0];
    const subscriptionTier =
      profile.subscription_tier != null
        ? parseSubscriptionTier(profile.subscription_tier)
        : tierFromLegacyPremiumFlag(profile.is_premium ?? false);

    return {
      subscriptionTier,
      isPremium: isPaidTier(subscriptionTier),
      monthlyAnalysisLimit: getMonthlyAnalysisLimit(
        subscriptionTier,
        user.email,
        profile.monthly_analysis_limit
      ),
    };
  } catch {
    return { subscriptionTier: 'free', isPremium: false, monthlyAnalysisLimit: FREE_MONTHLY_ANALYSIS_LIMIT };
  }
}
