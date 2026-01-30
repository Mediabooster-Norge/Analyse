-- ============================================================================
-- Remove unique constraint on website_url
-- This allows multiple users to analyze the same website
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Drop the unique index on website_url if it exists
DROP INDEX IF EXISTS idx_companies_unique_website_url;

-- Update the check_company_exists function to only check org_number
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

-- Update the create_company function to only check org_number
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
-- Success message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Website URL unique constraint removed. Multiple users can now analyze the same website.';
END $$;
