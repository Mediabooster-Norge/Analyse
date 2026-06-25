-- Store WCAG accessibility results from Lighthouse in guest previews
ALTER TABLE preview_analyses
  ADD COLUMN IF NOT EXISTS accessibility_results JSONB;
