/**
 * Unit tests for structured data (Schema.org) detection in the SEO analyzer.
 *
 * Run with: npx tsx src/tests/structured-data.test.ts
 */
import * as cheerio from 'cheerio';
import { analyzeStructuredData } from '@/lib/analyzers/seo-analyzer';

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

const analyze = (html: string) => analyzeStructuredData(cheerio.load(html));

test('reports none when page has no structured data', () => {
  const sd = analyze('<html><body><h1>Hei</h1></body></html>');
  assert(sd.hasAny === false, 'hasAny should be false');
  assert(sd.score === 0, `score should be 0, got ${sd.score}`);
  assert(sd.issues.some((i) => i.includes('Mangler')), 'should flag missing structured data');
  assert(sd.recommendations.length > 0, 'should recommend adding schema');
});

test('detects valid JSON-LD Organization with complete fields', () => {
  const html = `<html><head><script type="application/ld+json">
    {"@context":"https://schema.org","@type":"Organization","name":"Acme","url":"https://acme.no"}
  </script></head><body></body></html>`;
  const sd = analyze(html);
  assert(sd.hasAny === true, 'hasAny should be true');
  assert(sd.formats.includes('json-ld'), 'format should include json-ld');
  assert(sd.types.includes('Organization'), 'types should include Organization');
  assert(sd.score === 100, `complete Organization should score 100, got ${sd.score}`);
  assert(sd.issues.length === 0, `should have no issues, got ${JSON.stringify(sd.issues)}`);
});

test('flags missing recommended fields', () => {
  const html = `<html><head><script type="application/ld+json">
    {"@context":"https://schema.org","@type":"LocalBusiness","name":"Acme"}
  </script></head><body></body></html>`;
  const sd = analyze(html);
  assert(sd.hasAny === true, 'hasAny should be true');
  assert(sd.types.includes('LocalBusiness'), 'should detect LocalBusiness');
  assert(sd.score === 75, `recognized type w/ missing fields should score 75, got ${sd.score}`);
  assert(sd.issues.some((i) => i.includes('address')), 'should flag missing address');
});

test('handles @graph with multiple nodes', () => {
  const html = `<html><head><script type="application/ld+json">
    {"@context":"https://schema.org","@graph":[
      {"@type":"WebSite","name":"Acme","url":"https://acme.no"},
      {"@type":"Organization","name":"Acme","url":"https://acme.no"}
    ]}
  </script></head><body></body></html>`;
  const sd = analyze(html);
  assert(sd.types.includes('WebSite'), 'should detect WebSite');
  assert(sd.types.includes('Organization'), 'should detect Organization');
  assert(sd.score === 100, `should score 100, got ${sd.score}`);
});

test('reports invalid JSON-LD', () => {
  const html = `<html><head><script type="application/ld+json">
    {"@type":"Organization", broken json}
  </script></head><body></body></html>`;
  const sd = analyze(html);
  assert(sd.hasAny === true, 'a present (broken) block still counts as present');
  assert(sd.invalidJsonLdCount === 1, `should count 1 invalid block, got ${sd.invalidJsonLdCount}`);
  assert(sd.score === 20, `only-invalid should score 20, got ${sd.score}`);
});

test('detects microdata', () => {
  const html = `<html><body>
    <div itemscope itemtype="https://schema.org/Product"><span itemprop="name">X</span></div>
  </body></html>`;
  const sd = analyze(html);
  assert(sd.hasAny === true, 'hasAny should be true');
  assert(sd.formats.includes('microdata'), 'format should include microdata');
  assert(sd.types.includes('Product'), 'should detect Product');
});

test('detects @type as array', () => {
  const html = `<html><head><script type="application/ld+json">
    {"@context":"https://schema.org","@type":["LocalBusiness","Restaurant"],"name":"Acme","address":"Gata 1","telephone":"123"}
  </script></head><body></body></html>`;
  const sd = analyze(html);
  assert(sd.types.includes('LocalBusiness'), 'should pick LocalBusiness from array');
  assert(sd.score === 100, `complete LocalBusiness should score 100, got ${sd.score}`);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
