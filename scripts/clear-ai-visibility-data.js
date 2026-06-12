/**
 * Sletter all AI-synlighetsdata i Supabase (cache, kvoter, analyser).
 * Krever: NEXT_PUBLIC_SUPABASE_URL og SUPABASE_SERVICE_ROLE_KEY.
 * Laster .env.local automatisk hvis den finnes.
 *
 * Kjør: node scripts/clear-ai-visibility-data.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  });
}

const SENTINEL_UUID = '00000000-0000-0000-0000-000000000000';

async function deleteAllById(supabase, table) {
  const { error, count } = await supabase
    .from(table)
    .delete({ count: 'exact' })
    .neq('id', SENTINEL_UUID);
  if (error) throw new Error(`${table}: ${error.message}`);
  return count ?? 0;
}

async function deleteAllCache(supabase) {
  const { error, count } = await supabase
    .from('ai_visibility_cache')
    .delete({ count: 'exact' })
    .neq('domain', '');
  if (error) throw new Error(`ai_visibility_cache: ${error.message}`);
  return count ?? 0;
}

async function main() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error('Mangler NEXT_PUBLIC_SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY i .env.local');
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('Sletter AI-synlighetsdata...\n');

  const cacheDeleted = await deleteAllCache(supabase);
  console.log(`ai_visibility_cache: ${cacheDeleted} rader slettet`);

  const partialDeleted = await deleteAllById(supabase, 'ai_visibility_partial');
  console.log(`ai_visibility_partial: ${partialDeleted} rader slettet`);

  const checksDeleted = await deleteAllById(supabase, 'ai_visibility_checks');
  console.log(`ai_visibility_checks: ${checksDeleted} rader slettet`);

  const { data: analysesWithVisibility, error: selectError } = await supabase
    .from('analyses')
    .select('id')
    .not('ai_visibility', 'is', null);

  if (selectError) throw new Error(`analyses select: ${selectError.message}`);

  if (analysesWithVisibility?.length) {
    const { error: clearError } = await supabase
      .from('analyses')
      .update({ ai_visibility: null })
      .not('ai_visibility', 'is', null);
    if (clearError) throw new Error(`analyses ai_visibility: ${clearError.message}`);
    console.log(`analyses.ai_visibility: nullstilt på ${analysesWithVisibility.length} analyser`);
  } else {
    console.log('analyses.ai_visibility: ingen rader å nullstille');
  }

  const { data: withCompetitors, error: compSelectError } = await supabase
    .from('analyses')
    .select('id, competitor_results')
    .not('competitor_results', 'is', null);

  if (compSelectError) throw new Error(`competitor_results select: ${compSelectError.message}`);

  let competitorsCleared = 0;
  for (const row of withCompetitors ?? []) {
    const competitors = row.competitor_results;
    if (!Array.isArray(competitors) || competitors.length === 0) continue;

    const hasAiVisibility = competitors.some(
      (c) => c?.results && typeof c.results === 'object' && 'aiVisibility' in c.results
    );
    if (!hasAiVisibility) continue;

    const cleaned = competitors.map((c) => {
      if (!c?.results || typeof c.results !== 'object') return c;
      const { aiVisibility: _removed, ...restResults } = c.results;
      return { ...c, results: restResults };
    });

    const { error: updateError } = await supabase
      .from('analyses')
      .update({ competitor_results: cleaned })
      .eq('id', row.id);
    if (updateError) throw new Error(`competitor_results ${row.id}: ${updateError.message}`);
    competitorsCleared++;
  }
  console.log(`competitor_results: fjernet aiVisibility fra ${competitorsCleared} analyser`);

  console.log('\nFerdig – all AI-synlighetsdata er slettet.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
