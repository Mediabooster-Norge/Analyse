-- Persist retrievable public token so owners can reopen/copy same share URL.

ALTER TABLE analysis_shares
  ADD COLUMN IF NOT EXISTS public_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_analysis_shares_public_token
  ON analysis_shares(public_token)
  WHERE public_token IS NOT NULL;
