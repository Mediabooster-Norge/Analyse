-- ============================================================================
-- Article Suggestions – lagre AI-genererte artikkelforslag per analyse
-- Forslag lagres så brukeren kan se dem igjen uten å regenerere
-- ============================================================================

CREATE TABLE IF NOT EXISTS article_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  suggestions JSONB NOT NULL DEFAULT '[]',
  with_competitors BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indekser for rask oppslag
CREATE INDEX IF NOT EXISTS idx_article_suggestions_user_id ON article_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_article_suggestions_analysis_id ON article_suggestions(analysis_id);

-- Kun én rad per analyse (nyeste forslag erstatter gamle)
CREATE UNIQUE INDEX IF NOT EXISTS idx_article_suggestions_analysis_unique ON article_suggestions(analysis_id);

-- RLS
ALTER TABLE article_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own article_suggestions" ON article_suggestions;
DROP POLICY IF EXISTS "Users can insert own article_suggestions" ON article_suggestions;
DROP POLICY IF EXISTS "Users can update own article_suggestions" ON article_suggestions;
DROP POLICY IF EXISTS "Users can delete own article_suggestions" ON article_suggestions;

CREATE POLICY "Users can view own article_suggestions"
  ON article_suggestions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own article_suggestions"
  ON article_suggestions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own article_suggestions"
  ON article_suggestions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own article_suggestions"
  ON article_suggestions FOR DELETE
  USING (auth.uid() = user_id);
