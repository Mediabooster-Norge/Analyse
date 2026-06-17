/**
 * Unit tests for PageSpeed DB cache domain matching and premium accessibility gating.
 *
 * Run with: npx tsx src/tests/pagespeed-db-cache.test.ts
 */
import {
  canUseDbPagespeedCache,
  findCachedAnalysisForDomain,
  normalizeAnalysisHostname,
} from '@/lib/utils/pagespeed-db-cache';

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

test('normalizeAnalysisHostname strips www and lowercases', () => {
  assertEqual(normalizeAnalysisHostname('https://WWW.Example.COM/path'), 'example.com', 'hostname');
});

test('findCachedAnalysisForDomain requires exact hostname match', () => {
  const rows = [
    {
      id: 'old-1',
      website_url: 'https://notexample.com',
      pagespeed_results: { performance: 90 },
      accessibility_results: null,
    },
    {
      id: 'old-2',
      website_url: 'https://www.example.com',
      pagespeed_results: { performance: 70 },
      accessibility_results: { score: 80, issues: [], passedCount: 1, failedCount: 0, checkedAt: '' },
    },
  ];
  const match = findCachedAnalysisForDomain(rows, 'example.com', 'current');
  assertEqual(match?.id, 'old-2', 'should match example.com only');
});

test('findCachedAnalysisForDomain excludes current analysis id', () => {
  const rows = [
    {
      id: 'current',
      website_url: 'https://example.com',
      pagespeed_results: { performance: 50 },
      accessibility_results: null,
    },
  ];
  const match = findCachedAnalysisForDomain(rows, 'example.com', 'current');
  assertEqual(match, null, 'should not match excluded id');
});

test('canUseDbPagespeedCache allows free users with pagespeed only', () => {
  assertEqual(
    canUseDbPagespeedCache({ pagespeed_results: { performance: 80 }, accessibility_results: null }, false),
    true,
    'free tier'
  );
});

test('canUseDbPagespeedCache blocks premium when accessibility is missing', () => {
  assertEqual(
    canUseDbPagespeedCache({ pagespeed_results: { performance: 80 }, accessibility_results: null }, true),
    false,
    'premium without accessibility'
  );
});

test('canUseDbPagespeedCache allows premium when accessibility exists', () => {
  assertEqual(
    canUseDbPagespeedCache(
      {
        pagespeed_results: { performance: 80 },
        accessibility_results: { score: 90, issues: [], passedCount: 1, failedCount: 0, checkedAt: '' },
      },
      true
    ),
    true,
    'premium with accessibility'
  );
});

console.log('\n' + '='.repeat(60));
console.log(`Results: ${PASS} ${passed} passed, ${FAIL} ${failed} failed`);
console.log('='.repeat(60));
if (failed > 0) process.exit(1);
