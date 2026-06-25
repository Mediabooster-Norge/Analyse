-- Guest preview analyses (teaser before registration)
CREATE TABLE IF NOT EXISTS preview_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  token_hash TEXT NOT NULL UNIQUE,
  website_url TEXT NOT NULL,
  website_name TEXT,
  overall_score INTEGER,
  seo_results JSONB NOT NULL,
  content_results JSONB NOT NULL,
  security_results JSONB NOT NULL,
  pagespeed_results JSONB,
  ip_hash TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  claimed_by UUID REFERENCES auth.users(id),
  claimed_analysis_id UUID REFERENCES analyses(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_preview_analyses_expires ON preview_analyses(expires_at);
CREATE INDEX IF NOT EXISTS idx_preview_analyses_ip_created ON preview_analyses(ip_hash, created_at DESC);

ALTER TABLE preview_analyses ENABLE ROW LEVEL SECURITY;
