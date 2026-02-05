-- ============================================================================
-- Add UPDATE policy for generated_articles
-- Allows users to update their own articles (e.g., regenerate featured image)
-- ============================================================================

DROP POLICY IF EXISTS "Users can update own generated_articles" ON generated_articles;

CREATE POLICY "Users can update own generated_articles"
  ON generated_articles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
