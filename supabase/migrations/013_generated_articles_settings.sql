-- ============================================================================
-- Add article generation settings (length, tone, audience) to generated_articles
-- These are stored for display purposes when viewing saved articles
-- ============================================================================

ALTER TABLE generated_articles
ADD COLUMN IF NOT EXISTS article_length TEXT,
ADD COLUMN IF NOT EXISTS article_tone TEXT,
ADD COLUMN IF NOT EXISTS article_audience TEXT;

-- Add comment for clarity
COMMENT ON COLUMN generated_articles.article_length IS 'Article length setting: short, medium, long';
COMMENT ON COLUMN generated_articles.article_tone IS 'Article tone setting: professional, casual, educational';
COMMENT ON COLUMN generated_articles.article_audience IS 'Article audience setting: general, beginners, experts, business';
