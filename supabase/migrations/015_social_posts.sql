-- ============================================================================
-- Social post suggestions – lagre AI-genererte postforslag per analyse
-- Samme logikk som article_suggestions: én rad per analyse, nyeste erstatter
-- ============================================================================

CREATE TABLE IF NOT EXISTS social_post_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  suggestions JSONB NOT NULL DEFAULT '[]',
  with_competitors BOOLEAN NOT NULL DEFAULT false,
  platform TEXT NOT NULL DEFAULT 'linkedin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_post_suggestions_user_id ON social_post_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_social_post_suggestions_analysis_id ON social_post_suggestions(analysis_id);
-- Én rad per analyse + platform (bruker kan ha både linkedin og instagram forslag)
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_post_suggestions_analysis_platform ON social_post_suggestions(analysis_id, platform);

ALTER TABLE social_post_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own social_post_suggestions" ON social_post_suggestions;
DROP POLICY IF EXISTS "Users can insert own social_post_suggestions" ON social_post_suggestions;
DROP POLICY IF EXISTS "Users can update own social_post_suggestions" ON social_post_suggestions;
DROP POLICY IF EXISTS "Users can delete own social_post_suggestions" ON social_post_suggestions;

CREATE POLICY "Users can view own social_post_suggestions"
  ON social_post_suggestions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own social_post_suggestions"
  ON social_post_suggestions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own social_post_suggestions"
  ON social_post_suggestions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own social_post_suggestions"
  ON social_post_suggestions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Generated social posts – lagre genererte SoMe-innlegg (samme idé som generated_articles)
-- Telling for grense bruker article_generations (delt kvote med artikler)
-- ============================================================================

CREATE TABLE IF NOT EXISTS generated_social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  hashtags TEXT[] DEFAULT '{}',
  website_url TEXT,
  website_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generated_social_posts_user_id ON generated_social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_social_posts_created_at ON generated_social_posts(created_at DESC);

ALTER TABLE generated_social_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own generated_social_posts" ON generated_social_posts;
DROP POLICY IF EXISTS "Users can insert own generated_social_posts" ON generated_social_posts;

CREATE POLICY "Users can view own generated_social_posts"
  ON generated_social_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generated_social_posts"
  ON generated_social_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
