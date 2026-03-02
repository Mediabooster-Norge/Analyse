-- Add CTA (call-to-action) field to generated_social_posts so AI-generated CTA is persisted
ALTER TABLE generated_social_posts
  ADD COLUMN IF NOT EXISTS cta TEXT;

COMMENT ON COLUMN generated_social_posts.cta IS 'Call-to-action tekster generert av AI (valgfritt).';
