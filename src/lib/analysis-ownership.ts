import type { SupabaseClient } from '@supabase/supabase-js';

export async function verifyAnalysisOwnership(
  supabase: SupabaseClient,
  userId: string,
  analysisId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('analyses')
    .select('id')
    .eq('id', analysisId)
    .eq('user_id', userId)
    .maybeSingle();

  return !!data;
}
