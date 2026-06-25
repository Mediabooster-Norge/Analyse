import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  generatePreviewToken,
  hashPreviewToken,
  hashClientIp,
  isPreviewRateLimited,
  mapPreviewRowToResult,
} from '@/lib/preview-analysis';
import { buildOverviewIssues } from '@/lib/utils/overview-issues';

test('generatePreviewToken returns 64-char hex', () => {
  const token = generatePreviewToken();
  assert.match(token, /^[a-f0-9]{64}$/);
});

test('hashPreviewToken is deterministic', () => {
  const token = 'abc123';
  assert.equal(hashPreviewToken(token), hashPreviewToken(token));
  assert.notEqual(hashPreviewToken(token), hashPreviewToken('other'));
});

test('isPreviewRateLimited at 5 per day', () => {
  assert.equal(isPreviewRateLimited(4), false);
  assert.equal(isPreviewRateLimited(5), true);
});

test('mapPreviewRowToResult maps scores from DB row', () => {
  const result = mapPreviewRowToResult({
    overall_score: 72,
    seo_results: { score: 80, meta: { title: { content: 'T', length: 1, isOptimal: false }, description: { content: null, length: 0, isOptimal: false }, ogTags: { title: null, description: null, image: null }, canonical: null }, headings: { h1: { count: 1, contents: ['H'] }, h2: { count: 0, contents: [] }, hasProperHierarchy: true }, images: { total: 0, withAlt: 0, withoutAlt: 0 }, links: { internal: { count: 0, urls: [] }, external: { count: 0 } } },
    content_results: { score: 65, wordCount: 100 },
    security_results: { score: 90, ssl: { grade: 'A', certificate: { daysUntilExpiry: 100 } }, headers: { contentSecurityPolicy: true, strictTransportSecurity: true, xFrameOptions: true, xContentTypeOptions: true, referrerPolicy: true, permissionsPolicy: true, score: 90 }, observatory: { grade: 'A', score: 90 } },
    pagespeed_results: null,
  });
  assert.equal(result.overallScore, 72);
  assert.equal(result.seoResults.score, 80);
  assert.equal(result.contentResults.wordCount, 100);
});

test('buildOverviewIssues flags missing meta description', () => {
  const result = mapPreviewRowToResult({
    overall_score: 50,
    seo_results: {
      score: 50,
      meta: {
        title: { content: 'Title', length: 5, isOptimal: false },
        description: { content: null, length: 0, isOptimal: false },
        ogTags: { title: null, description: null, image: null },
        canonical: null,
      },
      headings: { h1: { count: 1, contents: ['H'] }, h2: { count: 0, contents: [] }, hasProperHierarchy: true },
      images: { total: 0, withAlt: 0, withoutAlt: 0 },
      links: { internal: { count: 0, urls: [] }, external: { count: 0 } },
    },
    content_results: { score: 40, wordCount: 50 },
    security_results: {
      score: 50,
      ssl: { grade: 'B', certificate: { daysUntilExpiry: 100 } },
      headers: {
        contentSecurityPolicy: false,
        strictTransportSecurity: false,
        xFrameOptions: true,
        xContentTypeOptions: true,
        referrerPolicy: true,
        permissionsPolicy: false,
        score: 50,
      },
      observatory: { grade: 'B', score: 50 },
    },
    pagespeed_results: null,
  });
  const issues = buildOverviewIssues(result);
  assert.ok(issues.some((i) => i.label === 'Meta-beskrivelse'));
  assert.ok(issues.some((i) => i.label === 'Innhold'));
});

test('hashClientIp hashes without exposing raw ip', () => {
  const h = hashClientIp('203.0.113.1');
  assert.equal(h.length, 64);
  assert.notEqual(h, '203.0.113.1');
});
