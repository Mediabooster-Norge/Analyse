import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';
import { PREMIUM_EMAILS, UNLIMITED_ARTICLE_EMAILS, FREE_MONTHLY_ANALYSIS_LIMIT } from '@/lib/constants/premium';

/** Article generations per month: free 5, premium 30, unlimited 999 */
const ARTICLE_GENERATIONS = { free: 5, premium: 30, unlimited: 999 };

/** AI visibility checks per month: free 0 (Premium required), premium ubegrenset */
const AI_VISIBILITY_CHECKS = { free: 0, premium: 999 };

/**
 * Server-side premium check. Use this in API routes and Server Components.
 * Do not import from usePremium (client hook) on the server.
 */
export async function getPremiumStatusServer(user: User | null): Promise<{
  isPremium: boolean;
  monthlyAnalysisLimit: number;
  articleGenerationsPerMonth: number;
  aiVisibilityChecksPerMonth: number;
}> {
  if (!user) {
    return {
      isPremium: false,
      monthlyAnalysisLimit: 5,
      articleGenerationsPerMonth: ARTICLE_GENERATIONS.free,
      aiVisibilityChecksPerMonth: AI_VISIBILITY_CHECKS.free,
    };
  }

  if (user.email && PREMIUM_EMAILS.includes(user.email)) {
    const hasUnlimitedArticles = UNLIMITED_ARTICLE_EMAILS.includes(user.email);
    return {
      isPremium: true,
      monthlyAnalysisLimit: 999,
      articleGenerationsPerMonth: hasUnlimitedArticles ? ARTICLE_GENERATIONS.unlimited : ARTICLE_GENERATIONS.premium,
      aiVisibilityChecksPerMonth: AI_VISIBILITY_CHECKS.premium,
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_profiles')
    .select('is_premium, monthly_analysis_limit')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data) {
    return {
      isPremium: false,
      monthlyAnalysisLimit: 5,
      articleGenerationsPerMonth: ARTICLE_GENERATIONS.free,
      aiVisibilityChecksPerMonth: AI_VISIBILITY_CHECKS.free,
    };
  }

  const isPremium = data.is_premium ?? false;
  return {
    isPremium,
    monthlyAnalysisLimit: data.monthly_analysis_limit ?? FREE_MONTHLY_ANALYSIS_LIMIT,
    articleGenerationsPerMonth: isPremium ? ARTICLE_GENERATIONS.premium : ARTICLE_GENERATIONS.free,
    aiVisibilityChecksPerMonth: isPremium ? AI_VISIBILITY_CHECKS.premium : AI_VISIBILITY_CHECKS.free,
  };
}
