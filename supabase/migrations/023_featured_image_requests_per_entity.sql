-- ============================================================================
-- Featured image: telling per artikkel/post (maks 3 «nytt bilde» per post)
-- Generering av artikkel/SoMe henter alltid bilde (begrenset av 30/mnd).
-- Regenerering telles per artikkel og per SoMe-post.
-- ============================================================================

ALTER TABLE featured_image_requests
  ADD COLUMN IF NOT EXISTS article_id UUID REFERENCES generated_articles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS social_post_id UUID REFERENCES generated_social_posts(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_featured_image_requests_article
  ON featured_image_requests(user_id, article_id) WHERE article_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_featured_image_requests_social_post
  ON featured_image_requests(user_id, social_post_id) WHERE social_post_id IS NOT NULL;

COMMENT ON COLUMN featured_image_requests.article_id IS 'Ved regenerering for en artikkel: teller mot 3 per artikkel per måned.';
COMMENT ON COLUMN featured_image_requests.social_post_id IS 'Ved regenerering for et SoMe-innlegg: teller mot 3 per innlegg per måned.';
