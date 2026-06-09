-- Shared analysis links no longer expire; only revocation disables them.

UPDATE public.analysis_shares
SET expires_at = NULL, updated_at = NOW()
WHERE expires_at IS NOT NULL;
