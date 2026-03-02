-- ============================================================================
-- AI visibility checks – telling per bruker per måned (Premium-grense)
-- Premium: 5 sjekker/mnd (én sjekk = din URL + alle konkurrenter). Free: 0 (krever Premium).
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_visibility_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_visibility_checks_user_id ON ai_visibility_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_visibility_checks_created_at ON ai_visibility_checks(created_at);

ALTER TABLE ai_visibility_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own ai_visibility_checks" ON ai_visibility_checks;
DROP POLICY IF EXISTS "Users can select own ai_visibility_checks" ON ai_visibility_checks;

CREATE POLICY "Users can insert own ai_visibility_checks"
  ON ai_visibility_checks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select own ai_visibility_checks"
  ON ai_visibility_checks FOR SELECT
  USING (auth.uid() = user_id);
