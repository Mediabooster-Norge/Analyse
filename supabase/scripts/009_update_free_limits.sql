-- Update default monthly analysis limit from 3 to 5 for free users

-- Update existing free users to new limit
UPDATE public.user_profiles 
SET monthly_analysis_limit = 5 
WHERE monthly_analysis_limit = 3 AND is_premium = FALSE;

-- Update the trigger function to use new default
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, is_premium, monthly_analysis_limit)
  VALUES (
    NEW.id, 
    NEW.email,
    -- Set premium for specific test email
    CASE WHEN NEW.email = 'web@mediabooster.no' THEN TRUE ELSE FALSE END,
    -- Premium users get unlimited (999), free users get 5
    CASE WHEN NEW.email = 'web@mediabooster.no' THEN 999 ELSE 5 END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update column default
ALTER TABLE public.user_profiles 
ALTER COLUMN monthly_analysis_limit SET DEFAULT 5;
