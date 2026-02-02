-- ============================================================================
-- Article generations – track monthly usage for full article generation (AI)
-- Free: 1 per month, Premium: 30 per month
-- ============================================================================

CREATE TABLE IF NOT EXISTS article_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_article_generations_user_id ON article_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_article_generations_created_at ON article_generations(created_at);

-- RLS
ALTER TABLE article_generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own article_generations" ON article_generations;
DROP POLICY IF EXISTS "Users can select own article_generations" ON article_generations;

CREATE POLICY "Users can insert own article_generations"
  ON article_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select own article_generations"
  ON article_generations FOR SELECT
  USING (auth.uid() = user_id);
