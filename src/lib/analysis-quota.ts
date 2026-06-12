import type { SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import { getPremiumStatusServer } from '@/lib/premium-server';

export type AnalysisQuotaEventType = 'keyword_update' | 'competitor_update';

export function getFirstDayOfMonthIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

/** Monthly usage = new analyses + keyword/competitor updates logged as quota events. */
export async function getMonthlyAnalysisUsage(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const firstDayOfMonth = getFirstDayOfMonthIso();

  const [{ count: analysesCount }, { count: eventsCount }] = await Promise.all([
    supabase
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', firstDayOfMonth),
    supabase
      .from('analysis_quota_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', firstDayOfMonth),
  ]);

  return (analysesCount ?? 0) + (eventsCount ?? 0);
}

export type MonthlyAnalysisQuotaResult = {
  allowed: boolean;
  usage: number;
  limit: number;
  remaining: number;
  limitReached: boolean;
};

export async function checkMonthlyAnalysisQuota(
  supabase: SupabaseClient,
  user: User
): Promise<MonthlyAnalysisQuotaResult> {
  const premiumStatus = await getPremiumStatusServer(user);
  const limit = premiumStatus.monthlyAnalysisLimit;
  const usage = await getMonthlyAnalysisUsage(supabase, user.id);
  const unlimited = limit >= 999;
  const remaining = unlimited ? limit : Math.max(0, limit - usage);
  const limitReached = !unlimited && usage >= limit;

  return {
    allowed: unlimited || usage < limit,
    usage,
    limit,
    remaining,
    limitReached,
  };
}

export async function recordAnalysisQuotaEvent(
  supabase: SupabaseClient,
  userId: string,
  analysisId: string | null | undefined,
  eventType: AnalysisQuotaEventType
): Promise<void> {
  const { error } = await supabase.from('analysis_quota_events').insert({
    user_id: userId,
    analysis_id: analysisId ?? null,
    event_type: eventType,
  });
  if (error) throw new Error(`Kunne ikke registrere analysekvote: ${error.message}`);
}

export function buildAnalysisLimitError(limit: number, isPremium: boolean): string {
  if (isPremium) {
    return `Du har brukt opp dine ${limit} analyser denne måneden. Oppdateringer av nøkkelord og konkurrenter teller også som analyser.`;
  }
  return `Du har brukt opp dine ${limit} gratis analyser denne måneden. Oppgrader til Premium for flere analyser!`;
}
