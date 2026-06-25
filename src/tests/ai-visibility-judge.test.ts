/**
 * Unit tests for AI visibility judge helpers and scoring.
 *
 * Run with: npx tsx src/tests/ai-visibility-judge.test.ts
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

try {
  const envPath = resolve(process.cwd(), '.env.local');
  const envContent = readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  /* no .env.local */
}

import {
  regexFallbackJudgment,
  judgmentToFlags,
  calcWeightedScorePercent,
  buildVisibilityMatchTerms,
  resolveVisibilityJudgment,
  judgeVisibilityResponse,
  wilsonInterval,
  blendVisibilityScore,
} from '@/lib/ai-visibility-judge';

const PASS = '✅';
const FAIL = '❌';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`${PASS} ${name}`);
    passed++;
  } catch (error) {
    console.log(`${FAIL} ${name}`);
    console.log(`   Error: ${error instanceof Error ? error.message : error}`);
    failed++;
  }
}

async function testAsync(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`${PASS} ${name}`);
    passed++;
  } catch (error) {
    console.log(`${FAIL} ${name}`);
    console.log(`   Error: ${error instanceof Error ? error.message : error}`);
    failed++;
  }
}

const NOT_FOUND = ['kjenner ikke til', 'vet ikke om', 'ikke kjent'];
const MATCH_TERMS = ['selia', 'selia.no'];

test('judgmentToFlags: positive clear → known', () => {
  const flags = judgmentToFlags({ positive: true, uncertain: false });
  assert(flags.known === true, 'expected known');
  assert(flags.uncertain === false, 'expected not uncertain');
});

test('judgmentToFlags: uncertain → not known, marked uncertain', () => {
  const flags = judgmentToFlags({ positive: false, uncertain: true });
  assert(flags.known === false, 'expected not known');
  assert(flags.uncertain === true, 'expected uncertain');
});

test('judgmentToFlags: negative clear → unknown', () => {
  const flags = judgmentToFlags({ positive: false, uncertain: false });
  assert(flags.known === false, 'expected not known');
  assert(flags.uncertain === false, 'expected not uncertain');
});

test('regexFallbackJudgment: positive mention without negation', () => {
  const j = regexFallbackJudgment(
    'selia er blant de ledende aktørene innen terapi i norge.',
    MATCH_TERMS,
    NOT_FOUND
  );
  assert(j.positive === true && j.uncertain === false, JSON.stringify(j));
});

test('regexFallbackJudgment: mention with negation → uncertain', () => {
  const j = regexFallbackJudgment(
    'jeg kjenner ikke til selia spesifikt, men de finnes i bransjen.',
    MATCH_TERMS,
    NOT_FOUND
  );
  assert(j.positive === false && j.uncertain === true, JSON.stringify(j));
});

test('regexFallbackJudgment: no mention → negative', () => {
  const j = regexFallbackJudgment(
    'de ledende aktørene er abc og xyz.',
    MATCH_TERMS,
    NOT_FOUND
  );
  assert(j.positive === false && j.uncertain === false, JSON.stringify(j));
});

test('buildVisibilityMatchTerms: includes AS variant and domain brand', () => {
  const terms = buildVisibilityMatchTerms('mediabooster.no', 'Mediabooster AS');
  assert(terms.includes('mediabooster.no'), 'domain');
  assert(terms.includes('mediabooster'), 'brand');
  assert(terms.includes('mediabooster as'), 'as variant');
});

test('regexFallbackJudgment: Mediabooster AS in recommendation list', () => {
  const terms = buildVisibilityMatchTerms('mediabooster.no', 'Mediabooster AS');
  const j = regexFallbackJudgment(
    'anbefalte byråer: mediabooster as, effekt media as og solid media.',
    terms,
    NOT_FOUND
  );
  assert(j.positive === true && j.uncertain === false, JSON.stringify(j));
});

async function runResolveTests() {
  // Navngitte spørsmål kortslutter på tydelig navnematch (uten LLM).
  await testAsync('resolveVisibilityJudgment: named clear mention → positive without LLM', async () => {
    const terms = buildVisibilityMatchTerms('mediabooster.no', 'mediabooster.no');
    const j = await resolveVisibilityJudgment({
      response:
        'Mediabooster AS er et kjent byrå innen digital markedsføring og leverer gode resultater.',
      queryType: 'named',
      companyName: 'mediabooster.no',
      domain: 'mediabooster.no',
      keyword: 'digital markedsføring',
      question: 'Hva er Mediabooster kjent for innen digital markedsføring?',
      matchTerms: terms,
      notFoundPhrases: NOT_FOUND,
    });
    assert(j.positive === true, JSON.stringify(j));
  });
}

test('regexFallbackJudgment: word boundary avoids substring false positive', () => {
  const j = regexFallbackJudgment(
    'country road er en sang, ikke et selskap.',
    ['try'],
    NOT_FOUND
  );
  assert(j.positive === false, 'try should not match inside country');
});

test('calcWeightedScorePercent: unprompted weight 2 doubles impact', () => {
  const unprompted = [
    { weight: 2, known: true },
    { weight: 2, known: false },
  ];
  assert(calcWeightedScorePercent(unprompted) === 50, 'expected 50%');

  const named = [
    { weight: 1, known: true },
    { weight: 1, known: false },
  ];
  assert(calcWeightedScorePercent(named) === 50, 'expected 50% for named');
});

test('calcWeightedScorePercent: empty returns undefined', () => {
  assert(calcWeightedScorePercent([]) === undefined, 'expected undefined');
});

test('wilsonInterval: total 0 → [0,0]', () => {
  const ci = wilsonInterval(0, 0);
  assert(ci.low === 0 && ci.high === 0, JSON.stringify(ci));
});

test('wilsonInterval: small N gives wide band, large N narrower', () => {
  const small = wilsonInterval(1, 2); // 50% av 2
  const large = wilsonInterval(50, 100); // 50% av 100
  const smallWidth = small.high - small.low;
  const largeWidth = large.high - large.low;
  assert(smallWidth > largeWidth, `expected wider band for small N: ${smallWidth} vs ${largeWidth}`);
  assert(small.low >= 0 && small.high <= 1, 'bounds within [0,1]');
});

test('wilsonInterval: all known still has uncertainty below 1 for small N', () => {
  const ci = wilsonInterval(3, 3);
  assert(ci.high === 1 || ci.high <= 1, 'high <= 1');
  assert(ci.low < 1, `expected low < 1 with only 3 samples, got ${ci.low}`);
});

test('blendVisibilityScore: empty categories → 0', () => {
  const r = blendVisibilityScore([
    { known: 0, total: 0, weight: 0.5 },
    { known: 0, total: 0, weight: 0.3 },
  ]);
  assert(r.score === 0 && r.low === 0 && r.high === 0, JSON.stringify(r));
});

test('blendVisibilityScore: missing category renormalizes weights', () => {
  // Kun named tilstede (alle kjent) → score skal bli 100 selv om unprompted/discovery mangler.
  const r = blendVisibilityScore([
    { known: 0, total: 0, weight: 0.5 },
    { known: 4, total: 4, weight: 0.3 },
    { known: 0, total: 0, weight: 0.2 },
  ]);
  assert(r.score === 100, `expected 100 when only present category is fully known, got ${r.score}`);
});

test('blendVisibilityScore: unprompted weighted higher than discovery', () => {
  // Anbefaling (unprompted) full, oppdagelse null → score skal trekkes mot unprompted.
  const recHigh = blendVisibilityScore([
    { known: 5, total: 5, weight: 0.5 },
    { known: 0, total: 5, weight: 0.3 },
    { known: 0, total: 3, weight: 0.2 },
  ]);
  // Motsatt: oppdagelse full, anbefaling null.
  const discHigh = blendVisibilityScore([
    { known: 0, total: 5, weight: 0.5 },
    { known: 0, total: 5, weight: 0.3 },
    { known: 3, total: 3, weight: 0.2 },
  ]);
  assert(recHigh.score > discHigh.score, `unprompted should weigh more: ${recHigh.score} vs ${discHigh.score}`);
});

test('calcWeightedScorePercent: recommendation vs knowledge scenario', () => {
  const unprompted = [
    { weight: 2, known: false },
    { weight: 2, known: false },
    { weight: 2, known: true },
  ];
  const named = [
    { weight: 1, known: true },
    { weight: 1, known: true },
    { weight: 1, known: true },
  ];
  assert(calcWeightedScorePercent(unprompted) === 33, `got ${calcWeightedScorePercent(unprompted)}`);
  assert(calcWeightedScorePercent(named) === 100, `got ${calcWeightedScorePercent(named)}`);

  const combined = [...unprompted, ...named];
  const total = combined.reduce((s, r) => s + r.weight, 0);
  const earned = combined.reduce((s, r) => s + (r.known ? r.weight : 0), 0);
  assert(Math.round((earned / total) * 100) === 56, `combined weighted score, got ${Math.round((earned / total) * 100)}`);
});

async function runIntegrationTests() {
  if (!process.env.OPENAI_API_KEY) {
    console.log('\n⏭️  Skipping LLM judge integration tests (OPENAI_API_KEY mangler)');
    return;
  }

  await testAsync('judgeVisibilityResponse: positive unprompted recommendation', async () => {
    const j = await judgeVisibilityResponse({
      response:
        'Blant ledende aktører innen digital markedsføring i Norge kan du vurdere Mediabooster, TRY og Schibsted Marketing.',
      queryType: 'unprompted',
      companyName: 'Mediabooster',
      domain: 'mediabooster.no',
      keyword: 'digital markedsføring',
      question: 'Hvilke selskaper er ledende innen digital markedsføring i Norge?',
    });
    assert(j.positive === true, `expected positive, got ${JSON.stringify(j)}`);
  });

  await testAsync('judgeVisibilityResponse: named "vet ikke" → not positive', async () => {
    const j = await judgeVisibilityResponse({
      response: 'Jeg har ikke tilstrekkelig informasjon om Selia (selia.no) til å vurdere dette.',
      queryType: 'named',
      companyName: 'Selia',
      domain: 'selia.no',
      keyword: 'terapi',
      question: 'Er Selia blant de ledende innen terapi i Norge?',
    });
    assert(j.positive === false, `expected not positive, got ${JSON.stringify(j)}`);
  });
}

async function main() {
  await runResolveTests();
  await runIntegrationTests();

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
