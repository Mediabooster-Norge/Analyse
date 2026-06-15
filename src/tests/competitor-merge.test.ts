/**
 * Unit tests for competitor merge logic used when persisting competitor updates.
 *
 * Run with: npx tsx src/tests/competitor-merge.test.ts
 */
import { mergeCompetitorResults } from '@/lib/utils/competitor-merge';

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

function assertEqual<T>(actual: T, expected: T, message: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`${message}\n  expected: ${e}\n  actual:   ${a}`);
  }
}

test('keeps existing competitors in edit order', () => {
  const existing = [
    { url: 'https://a.no', results: { score: 1 } },
    { url: 'https://b.no', results: { score: 2 } },
  ];
  const result = mergeCompetitorResults(existing, ['https://b.no', 'https://a.no'], []);
  assertEqual(
    result.map((c) => c.url),
    ['https://b.no', 'https://a.no'],
    'order should follow editUrls'
  );
});

test('appends newly analyzed competitors', () => {
  const existing = [{ url: 'https://a.no', results: { score: 1 } }];
  const newly = [{ url: 'https://c.no', results: { score: 3 } }];
  const result = mergeCompetitorResults(existing, ['https://a.no', 'https://c.no'], newly);
  assertEqual(result.length, 2, 'should include both competitors');
  assertEqual(result[1].url, 'https://c.no', 'new competitor should be appended');
  assertEqual(result[1].results, { score: 3 }, 'new results should be used');
});

test('drops removed competitors not present in editUrls', () => {
  const existing = [
    { url: 'https://a.no', results: { score: 1 } },
    { url: 'https://b.no', results: { score: 2 } },
  ];
  const result = mergeCompetitorResults(existing, ['https://a.no'], []);
  assertEqual(result.map((c) => c.url), ['https://a.no'], 'removed competitor should be dropped');
});

console.log('\n' + '='.repeat(60));
console.log(`Results: ${PASS} ${passed} passed, ${FAIL} ${failed} failed`);
console.log('='.repeat(60));
if (failed > 0) process.exit(1);
