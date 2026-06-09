-- Prevent authenticated users from self-granting premium via direct profile updates.

CREATE OR REPLACE FUNCTION prevent_premium_self_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.role() = 'authenticated' AND auth.uid() = OLD.id THEN
    IF NEW.is_premium IS DISTINCT FROM OLD.is_premium
       OR NEW.monthly_analysis_limit IS DISTINCT FROM OLD.monthly_analysis_limit
       OR NEW.premium_since IS DISTINCT FROM OLD.premium_since
       OR NEW.premium_expires_at IS DISTINCT FROM OLD.premium_expires_at THEN
      RAISE EXCEPTION 'premium fields cannot be modified by users';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_premium_self_escalation ON user_profiles;
CREATE TRIGGER trg_prevent_premium_self_escalation
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_premium_self_escalation();
