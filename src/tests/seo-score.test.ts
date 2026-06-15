/**
 * Regression tests for SEO score bounds (0–100).
 *
 * Run with: npx tsx src/tests/seo-score.test.ts
 */
import { clampScore } from '@/lib/utils/score-utils';

const PASS = '✅';
const FAIL = '❌';

let passed = 0;
let failed = 0;

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

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

test('clampScore caps values above 100', () => {
  assert(clampScore(101) === 100, `expected 100, got ${clampScore(101)}`);
  assert(clampScore(113) === 100, `expected 100, got ${clampScore(113)}`);
});

test('lazy-loading ratio cannot push image SEO subscore above 100', () => {
  const total = 10;
  const withLazyAmongDeferred = 7; // all images after the first 3
  const altRatio = 1;
  const lazyEligible = Math.max(0, total - 3);
  const lazyRatio = lazyEligible > 0 ? Math.min(1, withLazyAmongDeferred / lazyEligible) : 1;
  const imageScore = clampScore(altRatio * 70 + lazyRatio * 30);
  assert(imageScore <= 100, `image score should be <= 100, got ${imageScore}`);
  assert(imageScore === 100, `expected 100 for perfect alt + lazy, got ${imageScore}`);
});

test('old lazy-loading bug would have exceeded 100 without cap', () => {
  const total = 10;
  const withLazyLoading = 10; // counted all images, including first 3
  const lazyRatioUncapped = total > 3 ? withLazyLoading / (total - 3) : 1;
  const uncappedScore = Math.round(1 * 70 + lazyRatioUncapped * 30);
  assert(uncappedScore > 100, 'sanity: old formula should exceed 100 in this scenario');
  const fixedRatio = Math.min(1, withLazyLoading / Math.max(0, total - 3));
  const fixedScore = clampScore(70 + fixedRatio * 30);
  assert(fixedScore === 100, `fixed score should be 100, got ${fixedScore}`);
});

test('SEO aggregate from perfect subscores never exceeds 100', () => {
  const subscores = [100, 100, 100, 100, 100, 90, 100]; // technical max ~90
  const seoScore = clampScore(subscores.reduce((a, b) => a + b, 0) / subscores.length);
  assert(seoScore <= 100, `seo score should be <= 100, got ${seoScore}`);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
