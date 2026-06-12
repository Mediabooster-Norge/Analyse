-- ============================================================================
-- Analysis quota events – keyword/competitor updates count toward monthly analysis limit
-- New full analyses are counted via analyses.created_at; updates log here.
-- ============================================================================

CREATE TABLE IF NOT EXISTS analysis_quota_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('keyword_update', 'competitor_update')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analysis_quota_events_user_id ON analysis_quota_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_quota_events_created_at ON analysis_quota_events(created_at);

ALTER TABLE analysis_quota_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own analysis_quota_events" ON analysis_quota_events;
DROP POLICY IF EXISTS "Users can select own analysis_quota_events" ON analysis_quota_events;

CREATE POLICY "Users can insert own analysis_quota_events"
  ON analysis_quota_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select own analysis_quota_events"
  ON analysis_quota_events FOR SELECT
  USING (auth.uid() = user_id);
