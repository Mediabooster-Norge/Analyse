-- ============================================================================
-- Accessibility results – detailed Lighthouse/WCAG audit data (Premium only)
-- ============================================================================

ALTER TABLE analyses ADD COLUMN IF NOT EXISTS accessibility_results JSONB;
