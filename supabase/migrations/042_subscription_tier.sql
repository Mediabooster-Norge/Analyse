-- Three-tier subscriptions: free | plus | premium

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free';

ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_subscription_tier_check;

ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'plus', 'premium'));

-- Existing paid users become Pluss (former single Premium tier)
UPDATE user_profiles
SET subscription_tier = 'plus'
WHERE is_premium = TRUE
  AND subscription_tier = 'free';

-- Keep is_premium in sync for legacy scripts and RLS
UPDATE user_profiles
SET is_premium = (subscription_tier <> 'free');

CREATE OR REPLACE FUNCTION sync_is_premium_from_tier()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_premium := (NEW.subscription_tier <> 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_is_premium_from_tier ON user_profiles;
CREATE TRIGGER trg_sync_is_premium_from_tier
  BEFORE INSERT OR UPDATE OF subscription_tier ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_is_premium_from_tier();

CREATE OR REPLACE FUNCTION prevent_premium_self_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.role() = 'authenticated' AND auth.uid() = OLD.id THEN
    IF NEW.is_premium IS DISTINCT FROM OLD.is_premium
       OR NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier
       OR NEW.monthly_analysis_limit IS DISTINCT FROM OLD.monthly_analysis_limit
       OR NEW.premium_since IS DISTINCT FROM OLD.premium_since
       OR NEW.premium_expires_at IS DISTINCT FROM OLD.premium_expires_at THEN
      RAISE EXCEPTION 'premium fields cannot be modified by users';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS get_user_premium_status();

CREATE OR REPLACE FUNCTION get_user_premium_status()
RETURNS TABLE(
  is_premium BOOLEAN,
  subscription_tier TEXT,
  monthly_analysis_limit INTEGER,
  premium_expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.is_premium,
    up.subscription_tier,
    up.monthly_analysis_limit,
    up.premium_expires_at
  FROM user_profiles up
  WHERE up.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_premium_status TO authenticated;
