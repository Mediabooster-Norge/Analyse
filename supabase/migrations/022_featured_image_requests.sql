-- ============================================================================
-- Featured image requests – telling per bruker per måned (Unsplash-begrensning)
-- Begrenser antall hentinger av forsidebilde (artikkel/SoMe + «nytt bilde») inntil prod-kvote er på plass.
-- ============================================================================

CREATE TABLE IF NOT EXISTS featured_image_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_featured_image_requests_user_id ON featured_image_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_featured_image_requests_created_at ON featured_image_requests(created_at);

ALTER TABLE featured_image_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own featured_image_requests" ON featured_image_requests;
DROP POLICY IF EXISTS "Users can select own featured_image_requests" ON featured_image_requests;

CREATE POLICY "Users can insert own featured_image_requests"
  ON featured_image_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select own featured_image_requests"
  ON featured_image_requests FOR SELECT
  USING (auth.uid() = user_id);

COMMENT ON TABLE featured_image_requests IS 'Telling av Unsplash featured image-forespørsler per bruker per måned. Brukes for å begrense bruk inntil prod-kvote.';
