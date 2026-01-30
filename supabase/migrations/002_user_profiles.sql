-- ============================================================================
-- User Profiles Table for Premium Status
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_premium BOOLEAN DEFAULT FALSE,
  premium_since TIMESTAMP WITH TIME ZONE,
  premium_expires_at TIMESTAMP WITH TIME ZONE,
  monthly_analysis_limit INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_premium ON user_profiles(is_premium);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid duplicates
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Users can only see their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (but not is_premium - that's admin only)
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, is_premium, monthly_analysis_limit)
  VALUES (
    NEW.id, 
    NEW.email,
    -- Set premium for specific test email
    CASE WHEN NEW.email = 'web@mediabooster.no' THEN TRUE ELSE FALSE END,
    -- Premium users get unlimited (999), free users get 3
    CASE WHEN NEW.email = 'web@mediabooster.no' THEN 999 ELSE 3 END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to get user premium status (can be called from client)
CREATE OR REPLACE FUNCTION get_user_premium_status()
RETURNS TABLE(
  is_premium BOOLEAN,
  monthly_analysis_limit INTEGER,
  premium_expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.is_premium,
    up.monthly_analysis_limit,
    up.premium_expires_at
  FROM user_profiles up
  WHERE up.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_premium_status TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user TO service_role;

-- Insert profile for existing users (run once)
INSERT INTO user_profiles (id, email, is_premium, monthly_analysis_limit)
SELECT 
  id, 
  email,
  CASE WHEN email = 'web@mediabooster.no' THEN TRUE ELSE FALSE END,
  CASE WHEN email = 'web@mediabooster.no' THEN 999 ELSE 3 END
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  is_premium = CASE WHEN EXCLUDED.email = 'web@mediabooster.no' THEN TRUE ELSE user_profiles.is_premium END,
  monthly_analysis_limit = CASE WHEN EXCLUDED.email = 'web@mediabooster.no' THEN 999 ELSE user_profiles.monthly_analysis_limit END,
  updated_at = NOW();

-- ============================================================================
-- Success message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'User profiles table created successfully!';
END $$;
