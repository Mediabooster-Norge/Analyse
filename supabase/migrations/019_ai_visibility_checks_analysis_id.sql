-- ============================================================================
-- AI visibility: knytt sjekk til analyse for begrensning "maks 1 per analyse per 24t"
-- ============================================================================

ALTER TABLE ai_visibility_checks
  ADD COLUMN IF NOT EXISTS analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ai_visibility_checks_analysis_created
  ON ai_visibility_checks(user_id, analysis_id, created_at DESC)
  WHERE analysis_id IS NOT NULL;
