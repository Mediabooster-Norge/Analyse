-- Grant premium to the first 100 registered users (founding members).
-- Restores full_name/phone handling that was lost when 009_update_free_limits.sql
-- overwrote handle_new_user().

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  existing_user_count INTEGER;
  grant_premium BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO existing_user_count FROM public.user_profiles;

  grant_premium := existing_user_count < 100
    OR NEW.email ILIKE '%@mediabooster.no';

  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    phone,
    is_premium,
    premium_since,
    monthly_analysis_limit
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    grant_premium,
    CASE WHEN grant_premium THEN NOW() ELSE NULL END,
    CASE
      WHEN NEW.email ILIKE '%@mediabooster.no' THEN 999
      WHEN grant_premium THEN 30
      ELSE 5
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill premium for existing founding members (first 100 by registration date)
WITH founding_members AS (
  SELECT id
  FROM public.user_profiles
  ORDER BY created_at ASC
  LIMIT 100
)
UPDATE public.user_profiles up
SET
  is_premium = TRUE,
  premium_since = COALESCE(up.premium_since, NOW()),
  monthly_analysis_limit = CASE
    WHEN up.email ILIKE '%@mediabooster.no' THEN 999
    ELSE 30
  END,
  updated_at = NOW()
FROM founding_members fm
WHERE up.id = fm.id
  AND up.is_premium = FALSE;
