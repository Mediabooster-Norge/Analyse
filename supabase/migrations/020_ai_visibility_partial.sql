-- ============================================================================
-- AI visibility: delvis resultat for automatisk fortsettelse (teller som 1 sjekk)
-- Lagres når vi nærmer oss timeout; klienten kaller med continuationToken for resten.
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_visibility_partial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
  main_payload JSONB NOT NULL,
  competitor_payloads JSONB NOT NULL DEFAULT '[]',
  completed_competitor_urls TEXT[] NOT NULL DEFAULT '{}',
  remaining_competitor_urls TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_visibility_partial_user_created
  ON ai_visibility_partial(user_id, created_at DESC);

ALTER TABLE ai_visibility_partial ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own ai_visibility_partial" ON ai_visibility_partial;
DROP POLICY IF EXISTS "Users can select own ai_visibility_partial" ON ai_visibility_partial;
DROP POLICY IF EXISTS "Users can delete own ai_visibility_partial" ON ai_visibility_partial;

CREATE POLICY "Users can insert own ai_visibility_partial"
  ON ai_visibility_partial FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select own ai_visibility_partial"
  ON ai_visibility_partial FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ai_visibility_partial"
  ON ai_visibility_partial FOR DELETE
  USING (auth.uid() = user_id);
