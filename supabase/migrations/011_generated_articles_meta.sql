-- ============================================================================
-- Generated articles: SEO meta and featured image suggestion
-- ============================================================================

ALTER TABLE generated_articles
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS featured_image_suggestion TEXT;
