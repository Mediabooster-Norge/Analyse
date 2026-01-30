-- ============================================================================
-- Add Contact Info to User Profiles for Lead Generation
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Add name and phone columns to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN full_name TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN phone TEXT;
  END IF;
END $$;

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_user_profiles_full_name ON user_profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);

-- Update the handle_new_user function to also copy name from user_metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, phone, is_premium, monthly_analysis_limit)
  VALUES (
    NEW.id, 
    NEW.email,
    -- Get name from user_metadata if available
    NEW.raw_user_meta_data->>'full_name',
    -- Get phone from user_metadata if available
    NEW.raw_user_meta_data->>'phone',
    -- Set premium for specific test email
    CASE WHEN NEW.email = 'web@mediabooster.no' THEN TRUE ELSE FALSE END,
    -- Premium users get unlimited (999), free users get 3
    CASE WHEN NEW.email = 'web@mediabooster.no' THEN 999 ELSE 3 END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user profile (can be called from client)
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

-- Function to get full user profile (for leads export)
CREATE OR REPLACE FUNCTION get_user_profile()
RETURNS TABLE(
  id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
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
    up.is_premium,
    up.created_at
  FROM user_profiles up
  WHERE up.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile TO authenticated;

-- Sync existing users: copy name/phone from auth.users metadata to user_profiles
UPDATE user_profiles up
SET 
  full_name = COALESCE(up.full_name, u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  phone = COALESCE(up.phone, u.raw_user_meta_data->>'phone'),
  updated_at = NOW()
FROM auth.users u
WHERE up.id = u.id
  AND (up.full_name IS NULL OR up.phone IS NULL);

-- ============================================================================
-- View for easy lead export (admin only)
-- ============================================================================
CREATE OR REPLACE VIEW leads_export AS
SELECT 
  up.email,
  up.full_name AS name,
  up.phone,
  up.is_premium,
  up.created_at AS registered_at,
  COUNT(a.id) AS total_analyses,
  MAX(a.created_at) AS last_analysis
FROM user_profiles up
LEFT JOIN analyses a ON a.user_id = up.id
GROUP BY up.id, up.email, up.full_name, up.phone, up.is_premium, up.created_at
ORDER BY up.created_at DESC;

-- ============================================================================
-- Success message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'User profiles updated with contact info for lead generation!';
  RAISE NOTICE 'New columns: full_name, phone';
  RAISE NOTICE 'New functions: update_user_profile(), get_user_profile()';
  RAISE NOTICE 'New view: leads_export (for admin export)';
END $$;
