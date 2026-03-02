-- ============================================================================
-- AI visibility: global cache per domene (30 dager TTL) – sparer API-kall
-- Alle brukere deler cache; samme domene bruker cached resultat innen TTL.
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_visibility_cache (
  domain TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_visibility_cache_checked_at
  ON ai_visibility_cache(checked_at);

COMMENT ON TABLE ai_visibility_cache IS 'Cache av AI-synlighetssjekk per domene. TTL 30 dager.';

ALTER TABLE ai_visibility_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read cache" ON ai_visibility_cache;
DROP POLICY IF EXISTS "Authenticated can insert update cache" ON ai_visibility_cache;

CREATE POLICY "Authenticated can read cache"
  ON ai_visibility_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert update cache"
  ON ai_visibility_cache FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
