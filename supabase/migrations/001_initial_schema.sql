-- ============================================================================
-- Nettsjekk Database Schema
-- Run this in your Supabase SQL Editor
-- Safe to run multiple times (idempotent)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Companies Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  org_number TEXT,                -- Norwegian organization number (9 digits) from Brønnøysundregistrene
  address TEXT,                   -- Street address from Brønnøysundregistrene
  postal_code TEXT,               -- Postal code from Brønnøysundregistrene
  city TEXT,                      -- City from Brønnøysundregistrene
  phone TEXT,
  industry TEXT,
  employee_count TEXT,
  contact_person TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if they don't exist (for existing databases)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'org_number') THEN
    ALTER TABLE companies ADD COLUMN org_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'address') THEN
    ALTER TABLE companies ADD COLUMN address TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'postal_code') THEN
    ALTER TABLE companies ADD COLUMN postal_code TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'city') THEN
    ALTER TABLE companies ADD COLUMN city TEXT;
  END IF;
END $$;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_org_number ON companies(org_number);
CREATE INDEX IF NOT EXISTS idx_companies_website_url ON companies(website_url);

-- Unique constraints to prevent duplicate companies
-- Only one company per org_number (if provided)
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_unique_org_number 
  ON companies(org_number) WHERE org_number IS NOT NULL;
-- NOTE: We allow multiple users to analyze the same website
-- DROP INDEX IF EXISTS idx_companies_unique_website_url;

-- ============================================================================
-- Analyses Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  seo_results JSONB,
  content_results JSONB,
  security_results JSONB,
  competitor_results JSONB,
  ai_summary JSONB,
  keyword_research JSONB,
  overall_score INTEGER,
  ai_model TEXT,
  tokens_used INTEGER DEFAULT 0,
  cost_usd DECIMAL(10, 6) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add keyword_research column if it doesn't exist (for existing databases)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analyses' AND column_name = 'keyword_research'
  ) THEN
    ALTER TABLE analyses ADD COLUMN keyword_research JSONB;
  END IF;
END $$;

-- Add remaining updates columns for post-analysis updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analyses' AND column_name = 'remaining_competitor_updates'
  ) THEN
    ALTER TABLE analyses ADD COLUMN remaining_competitor_updates INTEGER DEFAULT 2;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analyses' AND column_name = 'remaining_keyword_updates'
  ) THEN
    ALTER TABLE analyses ADD COLUMN remaining_keyword_updates INTEGER DEFAULT 2;
  END IF;
END $$;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_analyses_company_id ON analyses(company_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);

-- ============================================================================
-- Competitors Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_competitors_analysis_id ON competitors(analysis_id);

-- ============================================================================
-- Recommendations Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('seo', 'content', 'security', 'performance', 'accessibility')),
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_recommendations_analysis_id ON recommendations(analysis_id);

-- ============================================================================
-- API Usage Table (for rate limiting and cost tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  analyses_count INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost_usd DECIMAL(10, 6) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, usage_date)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_api_usage_user_date ON api_usage(user_id, usage_date);

-- ============================================================================
-- Function to check if company exists (only checks org_number, not website)
-- Multiple users can analyze the same website
-- ============================================================================
CREATE OR REPLACE FUNCTION check_company_exists(
  p_website_url TEXT,
  p_org_number TEXT DEFAULT NULL
)
RETURNS TABLE(exists_by TEXT, company_name TEXT) AS $$
BEGIN
  -- Only check by org_number (if provided)
  -- We allow multiple users to analyze the same website
  IF p_org_number IS NOT NULL THEN
    RETURN QUERY
    SELECT 'org_number'::TEXT, c.name
    FROM companies c
    WHERE c.org_number = p_org_number
    LIMIT 1;
  END IF;
  
  -- No check for website_url - multiple users can analyze same site
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function to create company (bypasses RLS for new signups)
-- ============================================================================
CREATE OR REPLACE FUNCTION create_company(
  p_user_id UUID,
  p_name TEXT,
  p_website_url TEXT,
  p_org_number TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_postal_code TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_industry TEXT DEFAULT NULL,
  p_employee_count TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_contact_person TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_company_id UUID;
  v_existing_check RECORD;
BEGIN
  -- Only check org_number uniqueness (if provided)
  IF p_org_number IS NOT NULL THEN
    SELECT * INTO v_existing_check 
    FROM check_company_exists(p_website_url, p_org_number) LIMIT 1;
    
    IF v_existing_check IS NOT NULL AND v_existing_check.exists_by = 'org_number' THEN
      RAISE EXCEPTION 'COMPANY_EXISTS_ORG:Bedriften med dette organisasjonsnummeret er allerede registrert';
    END IF;
  END IF;

  INSERT INTO companies (
    user_id, name, website_url, org_number, address, 
    postal_code, city, industry, employee_count, phone, contact_person
  )
  VALUES (
    p_user_id, p_name, p_website_url, p_org_number, p_address,
    p_postal_code, p_city, p_industry, p_employee_count, p_phone, p_contact_person
  )
  RETURNING id INTO v_company_id;
  
  RETURN v_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function to increment API usage
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_api_usage(
  p_user_id UUID,
  p_date DATE,
  p_tokens INTEGER,
  p_cost DECIMAL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO api_usage (user_id, usage_date, analyses_count, total_tokens, total_cost_usd)
  VALUES (p_user_id, p_date, 1, p_tokens, p_cost)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET
    analyses_count = api_usage.analyses_count + 1,
    total_tokens = api_usage.total_tokens + p_tokens,
    total_cost_usd = api_usage.total_cost_usd + p_cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid duplicates
DROP POLICY IF EXISTS "Users can view own companies" ON companies;
DROP POLICY IF EXISTS "Users can insert own companies" ON companies;
DROP POLICY IF EXISTS "Users can update own companies" ON companies;
DROP POLICY IF EXISTS "Users can delete own companies" ON companies;

DROP POLICY IF EXISTS "Users can view analyses for own companies" ON analyses;
DROP POLICY IF EXISTS "Users can insert analyses for own companies" ON analyses;
DROP POLICY IF EXISTS "Users can update analyses for own companies" ON analyses;

DROP POLICY IF EXISTS "Users can view competitors for own analyses" ON competitors;
DROP POLICY IF EXISTS "Users can insert competitors for own analyses" ON competitors;

DROP POLICY IF EXISTS "Users can view recommendations for own analyses" ON recommendations;
DROP POLICY IF EXISTS "Users can insert recommendations for own analyses" ON recommendations;
DROP POLICY IF EXISTS "Users can update recommendations for own analyses" ON recommendations;

DROP POLICY IF EXISTS "Users can view own api usage" ON api_usage;

-- Companies: Users can only see/manage their own companies
CREATE POLICY "Users can view own companies"
  ON companies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own companies"
  ON companies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own companies"
  ON companies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own companies"
  ON companies FOR DELETE
  USING (auth.uid() = user_id);

-- Analyses: Users can only see analyses for their companies
CREATE POLICY "Users can view analyses for own companies"
  ON analyses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = analyses.company_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert analyses for own companies"
  ON analyses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = analyses.company_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update analyses for own companies"
  ON analyses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = analyses.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- Competitors: Users can only see competitors for their analyses
CREATE POLICY "Users can view competitors for own analyses"
  ON competitors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM analyses
      JOIN companies ON companies.id = analyses.company_id
      WHERE analyses.id = competitors.analysis_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert competitors for own analyses"
  ON competitors FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM analyses
      JOIN companies ON companies.id = analyses.company_id
      WHERE analyses.id = competitors.analysis_id
      AND companies.user_id = auth.uid()
    )
  );

-- Recommendations: Users can only see/manage recommendations for their analyses
CREATE POLICY "Users can view recommendations for own analyses"
  ON recommendations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM analyses
      JOIN companies ON companies.id = analyses.company_id
      WHERE analyses.id = recommendations.analysis_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert recommendations for own analyses"
  ON recommendations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM analyses
      JOIN companies ON companies.id = analyses.company_id
      WHERE analyses.id = recommendations.analysis_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update recommendations for own analyses"
  ON recommendations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM analyses
      JOIN companies ON companies.id = analyses.company_id
      WHERE analyses.id = recommendations.analysis_id
      AND companies.user_id = auth.uid()
    )
  );

-- API Usage: Users can only see their own usage
CREATE POLICY "Users can view own api usage"
  ON api_usage FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- Grant permissions to authenticated users
-- ============================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION increment_api_usage TO authenticated;
GRANT EXECUTE ON FUNCTION check_company_exists TO authenticated;
GRANT EXECUTE ON FUNCTION check_company_exists TO anon;
GRANT EXECUTE ON FUNCTION create_company TO authenticated;
GRANT EXECUTE ON FUNCTION create_company TO anon;

-- ============================================================================
-- Success message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Database schema created/updated successfully!';
END $$;
