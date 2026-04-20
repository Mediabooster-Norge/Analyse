-- Shared analysis links (manual sharing per analysis)

CREATE TABLE IF NOT EXISTS analysis_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (analysis_id)
);

CREATE INDEX IF NOT EXISTS idx_analysis_shares_analysis_id ON analysis_shares(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_shares_token_hash ON analysis_shares(token_hash);

ALTER TABLE analysis_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own analysis shares" ON analysis_shares;
DROP POLICY IF EXISTS "Users can insert own analysis shares" ON analysis_shares;
DROP POLICY IF EXISTS "Users can update own analysis shares" ON analysis_shares;
DROP POLICY IF EXISTS "Users can delete own analysis shares" ON analysis_shares;

CREATE POLICY "Users can view own analysis shares"
  ON analysis_shares FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can insert own analysis shares"
  ON analysis_shares FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own analysis shares"
  ON analysis_shares FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete own analysis shares"
  ON analysis_shares FOR DELETE
  USING (created_by = auth.uid());
