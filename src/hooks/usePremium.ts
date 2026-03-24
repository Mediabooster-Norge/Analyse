'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { PREMIUM_EMAILS, UNLIMITED_ARTICLE_EMAILS, FREE_MONTHLY_ANALYSIS_LIMIT } from '@/lib/constants/premium';

interface PremiumStatus {
  isPremium: boolean;
  monthlyAnalysisLimit: number;
  articleGenerationsPerMonth: number;
  premiumExpiresAt: Date | null;
  loading: boolean;
}

// Premium feature limits — defined before the hook so they can be referenced in initial state
export const PREMIUM_LIMITS = {
  free: {
    monthlyAnalyses: FREE_MONTHLY_ANALYSIS_LIMIT,
    competitors: 2,
    keywords: 10,
    keywordUpdates: 5,
    competitorUpdates: 5,
    aiVisibilityChecks: 1,
    articleGenerationsPerMonth: 5,
  },
  premium: {
    monthlyAnalyses: 999,
    competitors: 5,
    keywords: 50,
    keywordUpdates: 999,
    competitorUpdates: 999,
    aiVisibilityChecks: 999,
    articleGenerationsPerMonth: 30,
  },
};

export function getPremiumLimits(isPremium: boolean) {
  return isPremium ? PREMIUM_LIMITS.premium : PREMIUM_LIMITS.free;
}

export function usePremium(): PremiumStatus {
  const [status, setStatus] = useState<PremiumStatus>({
    isPremium: false,
    monthlyAnalysisLimit: FREE_MONTHLY_ANALYSIS_LIMIT,
    articleGenerationsPerMonth: PREMIUM_LIMITS.free.articleGenerationsPerMonth,
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
            isPremium: false,
            monthlyAnalysisLimit: FREE_MONTHLY_ANALYSIS_LIMIT,
            articleGenerationsPerMonth: PREMIUM_LIMITS.free.articleGenerationsPerMonth,
            premiumExpiresAt: null,
            loading: false,
          });
          return;
        }

        if (user.email && PREMIUM_EMAILS.includes(user.email)) {
          const hasUnlimitedArticles = UNLIMITED_ARTICLE_EMAILS.includes(user.email);
          setStatus({
            isPremium: true,
            monthlyAnalysisLimit: 999,
            articleGenerationsPerMonth: hasUnlimitedArticles ? 999 : PREMIUM_LIMITS.premium.articleGenerationsPerMonth,
            premiumExpiresAt: null,
            loading: false,
          });
          return;
        }

        const { data, error } = await supabase.rpc('get_user_premium_status');

        if (error) {
          console.warn('Premium status check failed, using fallback:', error.message);
          setStatus({
            isPremium: false,
            monthlyAnalysisLimit: FREE_MONTHLY_ANALYSIS_LIMIT,
            articleGenerationsPerMonth: PREMIUM_LIMITS.free.articleGenerationsPerMonth,
            premiumExpiresAt: null,
            loading: false,
          });
          return;
        }

        if (data && data.length > 0) {
          const profile = data[0];
          const isPremium = profile.is_premium ?? false;
          setStatus({
            isPremium,
            monthlyAnalysisLimit: profile.monthly_analysis_limit ?? FREE_MONTHLY_ANALYSIS_LIMIT,
            articleGenerationsPerMonth: isPremium
              ? PREMIUM_LIMITS.premium.articleGenerationsPerMonth
              : PREMIUM_LIMITS.free.articleGenerationsPerMonth,
            premiumExpiresAt: profile.premium_expires_at ? new Date(profile.premium_expires_at) : null,
            loading: false,
          });
        } else {
          setStatus({
            isPremium: false,
            monthlyAnalysisLimit: FREE_MONTHLY_ANALYSIS_LIMIT,
            articleGenerationsPerMonth: PREMIUM_LIMITS.free.articleGenerationsPerMonth,
            premiumExpiresAt: null,
            loading: false,
          });
        }
      } catch (error) {
        console.error('Error checking premium status:', error);
        setStatus({
          isPremium: false,
          monthlyAnalysisLimit: FREE_MONTHLY_ANALYSIS_LIMIT,
          articleGenerationsPerMonth: PREMIUM_LIMITS.free.articleGenerationsPerMonth,
          premiumExpiresAt: null,
          loading: false,
        });
      }
    }

    checkPremiumStatus();
  }, []);

  return status;
}

// Helper for one-time client-side premium checks (e.g. in event handlers).
// NOTE: client-side only — does NOT bypass RLS. Use getPremiumStatusServer() for server routes.
export async function checkPremiumStatusClient(user: User | null): Promise<{
  isPremium: boolean;
  monthlyAnalysisLimit: number;
}> {
  if (!user) {
    return { isPremium: false, monthlyAnalysisLimit: FREE_MONTHLY_ANALYSIS_LIMIT };
  }

  if (user.email && PREMIUM_EMAILS.includes(user.email)) {
    return { isPremium: true, monthlyAnalysisLimit: 999 };
  }

  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc('get_user_premium_status');

    if (error || !data || data.length === 0) {
      return { isPremium: false, monthlyAnalysisLimit: FREE_MONTHLY_ANALYSIS_LIMIT };
    }

    return {
      isPremium: data[0].is_premium ?? false,
      monthlyAnalysisLimit: data[0].monthly_analysis_limit ?? FREE_MONTHLY_ANALYSIS_LIMIT,
    };
  } catch {
    return { isPremium: false, monthlyAnalysisLimit: FREE_MONTHLY_ANALYSIS_LIMIT };
  }
}
