-- Restrict increment_api_usage to the caller's own user id.

CREATE OR REPLACE FUNCTION increment_api_usage(
  p_user_id UUID,
  p_date DATE,
  p_tokens INTEGER,
  p_cost DECIMAL
)
RETURNS VOID AS $$
BEGIN
  IF auth.uid() IS NULL OR p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: can only increment own API usage';
  END IF;

  INSERT INTO api_usage (user_id, usage_date, analyses_count, total_tokens, total_cost_usd)
  VALUES (p_user_id, p_date, 1, p_tokens, p_cost)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET
    analyses_count = api_usage.analyses_count + 1,
    total_tokens = api_usage.total_tokens + p_tokens,
    total_cost_usd = api_usage.total_cost_usd + p_cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
