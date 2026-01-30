-- ============================================================================
-- Add DELETE policy for analyses table
-- This allows users to delete their own analyses
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Users can delete own analyses" ON analyses;

-- Create DELETE policy for analyses based on user_id
CREATE POLICY "Users can delete own analyses"
  ON analyses FOR DELETE
  USING (
    user_id = auth.uid() OR 
    company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
  );

-- ============================================================================
-- Success message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'DELETE policy for analyses added successfully!';
END $$;
