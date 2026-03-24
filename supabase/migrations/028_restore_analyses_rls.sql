-- Restore RLS policies on the analyses table.
-- Migration 027 dropped the old company-based policies, but those policies also covered
-- user-based access via `user_id = auth.uid() OR company_id IN (...)`.
-- Since the companies table is now gone, we replace them with clean user_id-only policies.

-- Drop any remnants (idempotent)
DROP POLICY IF EXISTS "Users can view own analyses" ON analyses;
DROP POLICY IF EXISTS "Users can insert own analyses" ON analyses;
DROP POLICY IF EXISTS "Users can update own analyses" ON analyses;
DROP POLICY IF EXISTS "Users can delete own analyses" ON analyses;

-- SELECT: users can only read their own analyses
CREATE POLICY "Users can view own analyses"
  ON analyses FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: users can only insert rows for themselves
CREATE POLICY "Users can insert own analyses"
  ON analyses FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: users can only update their own rows
CREATE POLICY "Users can update own analyses"
  ON analyses FOR UPDATE
  USING (user_id = auth.uid());

-- DELETE: users can only delete their own rows
CREATE POLICY "Users can delete own analyses"
  ON analyses FOR DELETE
  USING (user_id = auth.uid());
