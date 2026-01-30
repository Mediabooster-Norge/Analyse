-- ============================================================================
-- User-Based Analyses Migration
-- This changes the system from company-based to user-based analyses
-- Users can now analyze any website without registering a company
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Add user_id column to analyses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analyses' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE analyses ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add website_url column to analyses table (so we don't need company)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analyses' AND column_name = 'website_url'
  ) THEN
    ALTER TABLE analyses ADD COLUMN website_url TEXT;
  END IF;
END $$;

-- Add website_name column for display purposes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analyses' AND column_name = 'website_name'
  ) THEN
    ALTER TABLE analyses ADD COLUMN website_name TEXT;
  END IF;
END $$;

-- Make company_id optional (nullable)
ALTER TABLE analyses ALTER COLUMN company_id DROP NOT NULL;

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_website_url ON analyses(website_url);

-- Migrate existing data: copy user_id from companies to analyses
UPDATE analyses a
SET user_id = c.user_id,
    website_url = c.website_url,
    website_name = c.name
FROM companies c
WHERE a.company_id = c.id
  AND a.user_id IS NULL;

-- ============================================================================
-- RLS Policies for user-based access
-- ============================================================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view own company analyses" ON analyses;
DROP POLICY IF EXISTS "Users can insert own company analyses" ON analyses;
DROP POLICY IF EXISTS "Users can update own company analyses" ON analyses;
DROP POLICY IF EXISTS "Users can view own analyses" ON analyses;
DROP POLICY IF EXISTS "Users can insert own analyses" ON analyses;
DROP POLICY IF EXISTS "Users can update own analyses" ON analyses;

-- New policies based on user_id
CREATE POLICY "Users can view own analyses"
  ON analyses FOR SELECT
  USING (
    user_id = auth.uid() OR 
    company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own analyses"
  ON analyses FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR 
    company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own analyses"
  ON analyses FOR UPDATE
  USING (
    user_id = auth.uid() OR 
    company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
  );

-- ============================================================================
-- Function to create analysis directly for a user
-- ============================================================================
CREATE OR REPLACE FUNCTION create_user_analysis(
  p_user_id UUID,
  p_website_url TEXT,
  p_website_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_analysis_id UUID;
BEGIN
  INSERT INTO analyses (user_id, website_url, website_name, status)
  VALUES (p_user_id, p_website_url, COALESCE(p_website_name, p_website_url), 'pending')
  RETURNING id INTO v_analysis_id;
  
  RETURN v_analysis_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_user_analysis TO authenticated;

-- ============================================================================
-- Success message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'User-based analyses migration complete! Users can now analyze any website without company registration.';
END $$;
