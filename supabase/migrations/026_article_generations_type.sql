-- Add type column to distinguish articles from social posts while sharing the same quota
ALTER TABLE article_generations
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'article'
    CHECK (type IN ('article', 'social_post'));

-- Index to filter by type efficiently (e.g. count articles vs social posts per user per month)
CREATE INDEX IF NOT EXISTS idx_article_generations_user_type_created
  ON article_generations (user_id, type, created_at);

-- Back-fill existing rows: all pre-migration rows were article generations
UPDATE article_generations SET type = 'article' WHERE type IS NULL;
