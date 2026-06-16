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
  await testAsync('resolveVisibilityJudgment: clear list mention → positive without LLM', async () => {
    const terms = buildVisibilityMatchTerms('mediabooster.no', 'mediabooster.no');
    const j = await resolveVisibilityJudgment({
      response:
        '1. Mediabooster AS – passer for SMB. 2. Effekt Media AS. 3. Solid Media.',
      queryType: 'unprompted',
      companyName: 'mediabooster.no',
      domain: 'mediabooster.no',
      keyword: 'digital markedsføring',
      question: 'Kan du anbefale en bedrift som tilbyr digital markedsføring?',
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
