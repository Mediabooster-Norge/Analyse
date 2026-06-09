-- Premium users get 30 analyses/month; @mediabooster.no keeps unlimited (999).

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

-- Backfill existing premium users (except Mediabooster emails)
UPDATE public.user_profiles
SET
  monthly_analysis_limit = 30,
  updated_at = NOW()
WHERE is_premium = TRUE
  AND email NOT ILIKE '%@mediabooster.no'
  AND monthly_analysis_limit > 30;
