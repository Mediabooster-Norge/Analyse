import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

const PREMIUM_EMAILS = ['web@mediabooster.no'];

/**
 * Server-side premium check. Use this in API routes and Server Components.
 * Do not import from usePremium (client hook) on the server.
 */
export async function getPremiumStatusServer(user: User | null): Promise<{
  isPremium: boolean;
  monthlyAnalysisLimit: number;
}> {
  if (!user) {
    return { isPremium: false, monthlyAnalysisLimit: 3 };
  }

  if (user.email && PREMIUM_EMAILS.includes(user.email)) {
    return { isPremium: true, monthlyAnalysisLimit: 999 };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_profiles')
    .select('is_premium, monthly_analysis_limit')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data) {
    return { isPremium: false, monthlyAnalysisLimit: 3 };
  }

  return {
    isPremium: data.is_premium ?? false,
    monthlyAnalysisLimit: data.monthly_analysis_limit ?? 3,
  };
}
