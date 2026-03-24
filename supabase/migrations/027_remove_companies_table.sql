-- Remove the legacy companies table and all related artifacts.
-- The company-based flow was replaced by the user-based flow in migration 004.
-- The analyses.company_id column is nullable and unpopulated since migration 004.
-- The create_company function granted anon write access and is no longer used.

-- 1. Drop old company-based RLS policies that reference company_id
--    (these were superseded by user-based policies added in migration 004/006)
DROP POLICY IF EXISTS "Users can view analyses for own companies" ON analyses;
DROP POLICY IF EXISTS "Users can insert analyses for own companies" ON analyses;
DROP POLICY IF EXISTS "Users can update analyses for own companies" ON analyses;
DROP POLICY IF EXISTS "Users can view own analyses" ON analyses;
DROP POLICY IF EXISTS "Users can insert own analyses" ON analyses;
DROP POLICY IF EXISTS "Users can update own analyses" ON analyses;
DROP POLICY IF EXISTS "Users can delete own analyses" ON analyses;

-- Policies on dependent tables that join through company_id
DROP POLICY IF EXISTS "Users can view competitors for own analyses" ON competitors;
DROP POLICY IF EXISTS "Users can insert competitors for own analyses" ON competitors;
DROP POLICY IF EXISTS "Users can view recommendations for own analyses" ON recommendations;
DROP POLICY IF EXISTS "Users can insert recommendations for own analyses" ON recommendations;
DROP POLICY IF EXISTS "Users can update recommendations for own analyses" ON recommendations;

-- 2. Remove the company_id FK column from analyses (CASCADE drops any remaining dependents)
ALTER TABLE analyses DROP COLUMN IF EXISTS company_id CASCADE;

-- 3. Drop the companies table and all its indexes/policies
DROP TABLE IF EXISTS companies CASCADE;

-- 4. Drop the create_company function (had SECURITY DEFINER + anon grant – security risk)
DROP FUNCTION IF EXISTS create_company CASCADE;
