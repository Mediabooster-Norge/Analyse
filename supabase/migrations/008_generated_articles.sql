-- ============================================================================
-- Generated articles – lagre genererte artikler med tittel, innhold og domene
-- Brukes for "Mine artikler"-siden; telling for grense bruker article_generations
-- ============================================================================

CREATE TABLE IF NOT EXISTS generated_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  website_url TEXT,
  website_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generated_articles_user_id ON generated_articles(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_articles_created_at ON generated_articles(created_at DESC);

-- RLS
ALTER TABLE generated_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own generated_articles" ON generated_articles;
DROP POLICY IF EXISTS "Users can insert own generated_articles" ON generated_articles;

CREATE POLICY "Users can view own generated_articles"
  ON generated_articles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generated_articles"
  ON generated_articles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
