-- Update remaining keyword and competitor updates from 2 to 5 for existing analyses
-- Only update if current value is 2 (the old limit)

UPDATE public.analyses
SET remaining_keyword_updates = 5
WHERE remaining_keyword_updates = 2;

UPDATE public.analyses
SET remaining_competitor_updates = 5
WHERE remaining_competitor_updates = 2;

-- Update default values for new analyses
ALTER TABLE public.analyses
ALTER COLUMN remaining_keyword_updates SET DEFAULT 5;

ALTER TABLE public.analyses
ALTER COLUMN remaining_competitor_updates SET DEFAULT 5;
