import { createClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client.
 * Bypasses Row Level Security — use only for server-side operations that
 * legitimately need to write to tables that are restricted from normal users
 * (e.g. ai_visibility_cache).
 *
 * Never expose this client or SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Admin client cannot be created.');
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
