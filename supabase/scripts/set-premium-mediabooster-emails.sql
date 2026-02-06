-- ============================================================================
-- Sett premium + visningsnavn for Mediabooster-testbrukere (kjør i Supabase SQL Editor)
-- ============================================================================

-- 1) Visningsnavn i auth.users (viser i Supabase Dashboard → Authentication → Users)
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', v.name)
FROM (VALUES
  ('daniel@mediabooster.no', 'Daniel'),
  ('sylvia@mediabooster.no', 'Sylvia'),
  ('hector@mediabooster.no', 'Hector'),
  ('jonas@mediabooster.no', 'Jonas'),
  ('julia@mediabooster.no', 'Julia')
) AS v(email, name)
WHERE auth.users.email = v.email;

-- 2) Premium + full_name i user_profiles (brukes i appen)
UPDATE public.user_profiles
SET
  is_premium = TRUE,
  monthly_analysis_limit = 999,
  full_name = v.name,
  updated_at = NOW()
FROM (VALUES
  ('daniel@mediabooster.no', 'Daniel'),
  ('sylvia@mediabooster.no', 'Sylvia'),
  ('hector@mediabooster.no', 'Hector'),
  ('jonas@mediabooster.no', 'Jonas'),
  ('julia@mediabooster.no', 'Julia')
) AS v(email, name)
WHERE public.user_profiles.email = v.email;

-- 3) Vis resultat
SELECT email, full_name, is_premium, monthly_analysis_limit
FROM public.user_profiles
WHERE email IN (
  'daniel@mediabooster.no',
  'sylvia@mediabooster.no',
  'hector@mediabooster.no',
  'jonas@mediabooster.no',
  'julia@mediabooster.no'
)
ORDER BY email;
