-- Company info on user profiles (BREG-validated at registration)

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS org_number TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS company_address TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS company_postal_code TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS company_city TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS company_verified BOOLEAN DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_unique_org_number
  ON user_profiles (org_number)
  WHERE org_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_company_name ON user_profiles (company_name);

CREATE OR REPLACE FUNCTION is_org_number_registered(p_org_number TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE org_number = regexp_replace(COALESCE(p_org_number, ''), '\s', '', 'g')
  );
$$;

GRANT EXECUTE ON FUNCTION is_org_number_registered(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION is_org_number_registered(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  existing_user_count INTEGER;
  grant_premium BOOLEAN;
  v_org_number TEXT;
BEGIN
  v_org_number := NULLIF(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'org_number', ''), '\s', '', 'g'), '');

  SELECT COUNT(*) INTO existing_user_count FROM public.user_profiles;

  grant_premium := existing_user_count < 100
    OR NEW.email ILIKE '%@mediabooster.no';

  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    phone,
    company_name,
    org_number,
    company_address,
    company_postal_code,
    company_city,
    company_verified,
    is_premium,
    premium_since,
    monthly_analysis_limit
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'company_name',
    v_org_number,
    NEW.raw_user_meta_data->>'company_address',
    NEW.raw_user_meta_data->>'company_postal_code',
    NEW.raw_user_meta_data->>'company_city',
    COALESCE((NEW.raw_user_meta_data->>'company_verified')::BOOLEAN, v_org_number IS NOT NULL),
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
    company_name = COALESCE(EXCLUDED.company_name, user_profiles.company_name),
    org_number = COALESCE(EXCLUDED.org_number, user_profiles.org_number),
    company_address = COALESCE(EXCLUDED.company_address, user_profiles.company_address),
    company_postal_code = COALESCE(EXCLUDED.company_postal_code, user_profiles.company_postal_code),
    company_city = COALESCE(EXCLUDED.company_city, user_profiles.company_city),
    company_verified = COALESCE(EXCLUDED.company_verified, user_profiles.company_verified),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_user_profile(
  p_full_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_profiles
  SET
    full_name = COALESCE(p_full_name, full_name),
    phone = COALESCE(p_phone, phone),
    updated_at = NOW()
  WHERE id = auth.uid();

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS get_user_profile();

CREATE OR REPLACE FUNCTION get_user_profile()
RETURNS TABLE(
  id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  company_name TEXT,
  org_number TEXT,
  company_verified BOOLEAN,
  is_premium BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id,
    up.email,
    up.full_name,
    up.phone,
    up.company_name,
    up.org_number,
    up.company_verified,
    up.is_premium,
    up.created_at
  FROM user_profiles up
  WHERE up.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP VIEW IF EXISTS leads_export;

CREATE OR REPLACE VIEW leads_export AS
SELECT
  up.email,
  up.full_name AS name,
  up.phone,
  up.company_name,
  up.org_number,
  up.company_verified,
  up.is_premium,
  up.created_at AS registered_at,
  COUNT(a.id) AS total_analyses,
  MAX(a.created_at) AS last_analysis
FROM user_profiles up
LEFT JOIN analyses a ON a.user_id = up.id
GROUP BY
  up.id,
  up.email,
  up.full_name,
  up.phone,
  up.company_name,
  up.org_number,
  up.company_verified,
  up.is_premium,
  up.created_at
ORDER BY up.created_at DESC;
