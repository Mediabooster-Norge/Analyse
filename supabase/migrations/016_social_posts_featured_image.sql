-- ============================================================================
-- Add featured image fields to generated_social_posts (for Unsplash suggestion)
-- ============================================================================

ALTER TABLE generated_social_posts
  ADD COLUMN IF NOT EXISTS featured_image_suggestion TEXT,
  ADD COLUMN IF NOT EXISTS featured_image_url TEXT,
  ADD COLUMN IF NOT EXISTS featured_image_attribution TEXT;
