import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

const PREMIUM_EMAILS = [
  'web@mediabooster.no',
  'daniel@mediabooster.no',
  'sylvia@mediabooster.no',
  'hector@mediabooster.no',
  'jonas@mediabooster.no',
  'julia@mediabooster.no',
];

/** Emails with unlimited article generations */
const UNLIMITED_ARTICLE_EMAILS = ['web@mediabooster.no'];

/** Article generations per month: free 5, premium 30, unlimited 999 */
const ARTICLE_GENERATIONS = { free: 5, premium: 30, unlimited: 999 };

/**
 * Server-side premium check. Use this in API routes and Server Components.
 * Do not import from usePremium (client hook) on the server.
 */
export async function getPremiumStatusServer(user: User | null): Promise<{
  isPremium: boolean;
  monthlyAnalysisLimit: number;
  articleGenerationsPerMonth: number;
}> {
  if (!user) {
    return { isPremium: false, monthlyAnalysisLimit: 5, articleGenerationsPerMonth: ARTICLE_GENERATIONS.free };
  }

  if (user.email && PREMIUM_EMAILS.includes(user.email)) {
    const hasUnlimitedArticles = UNLIMITED_ARTICLE_EMAILS.includes(user.email);
    return { 
      isPremium: true, 
      monthlyAnalysisLimit: 999, 
      articleGenerationsPerMonth: hasUnlimitedArticles ? ARTICLE_GENERATIONS.unlimited : ARTICLE_GENERATIONS.premium 
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_profiles')
    .select('is_premium, monthly_analysis_limit')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data) {
    return { isPremium: false, monthlyAnalysisLimit: 5, articleGenerationsPerMonth: ARTICLE_GENERATIONS.free };
  }

  const isPremium = data.is_premium ?? false;
  return {
    isPremium,
    monthlyAnalysisLimit: data.monthly_analysis_limit ?? 3,
    articleGenerationsPerMonth: isPremium ? ARTICLE_GENERATIONS.premium : ARTICLE_GENERATIONS.free,
  };
}
