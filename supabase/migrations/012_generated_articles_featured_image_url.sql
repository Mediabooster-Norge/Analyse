-- ============================================================================
-- Generated articles: actual featured image URL from Unsplash (optional)
-- ============================================================================

ALTER TABLE generated_articles
  ADD COLUMN IF NOT EXISTS featured_image_url TEXT,
  ADD COLUMN IF NOT EXISTS featured_image_attribution TEXT;
