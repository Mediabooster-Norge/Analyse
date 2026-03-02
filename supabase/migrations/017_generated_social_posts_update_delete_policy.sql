-- ============================================================================
-- RLS: tillat UPDATE og DELETE på generated_social_posts (eget innlegg)
-- Uten dette kan ikke PATCH (bilde) og DELETE kalles fra API.
-- ============================================================================

DROP POLICY IF EXISTS "Users can update own generated_social_posts" ON generated_social_posts;
DROP POLICY IF EXISTS "Users can delete own generated_social_posts" ON generated_social_posts;

CREATE POLICY "Users can update own generated_social_posts"
  ON generated_social_posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own generated_social_posts"
  ON generated_social_posts FOR DELETE
  USING (auth.uid() = user_id);
