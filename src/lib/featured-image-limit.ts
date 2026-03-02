/**
 * Grense for «nytt bilde» (regenerering): maks antall per bruker per time.
 * Ved generering av artikkel eller SoMe hentes alltid forsidebilde (begrenset av 30 gen/mnd).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_REGENERATES_PER_HOUR = 3;
const WINDOW_MINUTES = 60;

export function getRegeneratesPerHourLimit(): number {
  const env = process.env.FEATURED_IMAGE_REGENERATES_PER_HOUR;
  if (env === undefined || env === '') return DEFAULT_REGENERATES_PER_HOUR;
  const n = parseInt(env, 10);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_REGENERATES_PER_HOUR;
}

function sinceLastHourIso(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - WINDOW_MINUTES);
  return d.toISOString();
}

export async function getRegenerateCountLastHour(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const since = sinceLastHourIso();
  const { count, error } = await supabase
    .from('featured_image_requests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', since);

  if (error) {
    console.error('featured_image_requests count error:', error);
    return 0;
  }
  return count ?? 0;
}

export async function recordRegenerate(
  supabase: SupabaseClient,
  userId: string,
  articleId: string | null,
  postId: string | null
): Promise<void> {
  const { error } = await supabase.from('featured_image_requests').insert({
    user_id: userId,
    ...(articleId ? { article_id: articleId } : {}),
    ...(postId ? { social_post_id: postId } : {}),
  });
  if (error) {
    console.error('featured_image_requests insert error:', error);
    throw new Error('Kunne ikke registrere regenerering');
  }
}

export async function canRegenerate(
  supabase: SupabaseClient,
  userId: string
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const limit = getRegeneratesPerHourLimit();
  const used = await getRegenerateCountLastHour(supabase, userId);
  return { allowed: used < limit, used, limit };
}
