-- ============================================================================
-- Slett all AI-synlighetsdata for å starte med fresh data.
-- Kjør manuelt når ønsket (ikke en del av migrasjoner).
--
-- Kjør i Supabase Dashboard → SQL Editor (lim inn og kjør), eller med psql:
--   psql "<connection-string>" -f supabase/scripts/clear-ai-visibility-data.sql
-- ============================================================================

-- 1. Tøm cache (domene → resultat)
TRUNCATE TABLE ai_visibility_cache;

-- 2. Tøm delvis state (fortsettelse-tokens)
TRUNCATE TABLE ai_visibility_partial;

-- 3. Tøm telling av sjekker per bruker (kvote)
TRUNCATE TABLE ai_visibility_checks;

-- 4. Fjern AI-synlighet fra alle analyser (hovedresultat)
UPDATE analyses
SET ai_visibility = NULL
WHERE ai_visibility IS NOT NULL;

-- 5. Fjern aiVisibility fra hver konkurrent i competitor_results
UPDATE analyses
SET competitor_results = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'url', elem->'url',
        'results', (elem->'results') - 'aiVisibility'
      )
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(COALESCE(competitor_results, '[]'::jsonb)) AS elem
)
WHERE competitor_results IS NOT NULL
  AND competitor_results != '[]'::jsonb;
