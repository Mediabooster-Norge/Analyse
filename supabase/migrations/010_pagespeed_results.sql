-- ============================================================================
-- PageSpeed Results Migration
-- Adds pagespeed_results column to store Core Web Vitals and performance scores
-- ============================================================================

-- Add pagespeed_results column to analyses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analyses' AND column_name = 'pagespeed_results'
  ) THEN
    ALTER TABLE analyses ADD COLUMN pagespeed_results JSONB;
  END IF;
END $$;

-- Add ai_visibility column if not exists (was added via code but may not be in all DBs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analyses' AND column_name = 'ai_visibility'
  ) THEN
    ALTER TABLE analyses ADD COLUMN ai_visibility JSONB;
  END IF;
END $$;

-- ============================================================================
-- Success message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'PageSpeed results migration complete! Analyses can now store Core Web Vitals data.';
END $$;
