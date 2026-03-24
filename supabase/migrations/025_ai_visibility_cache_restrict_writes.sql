-- ============================================================================
-- Restrict ai_visibility_cache writes to service_role only.
-- Previously any authenticated user could overwrite any domain's cached result,
-- which could be abused to poison competitor scores.
-- After this migration: authenticated users can still READ the cache,
-- but only the server-side service_role key can INSERT/UPDATE/DELETE.
-- ============================================================================

-- Remove the overly permissive write policy
DROP POLICY IF EXISTS "Authenticated can insert update cache" ON ai_visibility_cache;

-- Keep read access for authenticated users (needed to check cache before running a check)
-- The SELECT policy "Authenticated can read cache" is unchanged.

-- No explicit INSERT/UPDATE/DELETE policy means only service_role (which bypasses RLS) can write.
-- API routes that write to this table must use the admin client (SUPABASE_SERVICE_ROLE_KEY).
