/**
 * Integration test for all AI endpoints after GPT-5 migration.
 * Tests that each endpoint returns valid structured responses.
 * 
 * Run with: npx tsx src/tests/ai-endpoints.test.ts
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
} catch { /* */ }

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PASS = '✅';
const FAIL = '❌';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

async function test(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    const elapsed = Date.now() - start;
    console.log(`${PASS} ${name} (${elapsed}ms)`);
    passed++;
  } catch (error) {
    const elapsed = Date.now() - start;
    console.log(`${FAIL} ${name} (${elapsed}ms)`);
    console.log(`   Error: ${error instanceof Error ? error.message : error}`);
    failed++;
  }
}

async function main() {

// Test 1: AI Analysis (gpt-5-mini + json_schema)
await test('AI Analysis (gpt-5-mini) - json_schema', async () => {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages: [
      { role: 'system', content: 'Du er en SEO-ekspert. Analyser data og gi anbefalinger på norsk.' },
      { role: 'user', content: 'Analyser: URL: example.no, SEO-score: 72/100, Title: "Eksempel AS", Sikkerhet: 85/100. Gi en kort analyse.' },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'seo_analysis',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            overallAssessment: { type: 'string' },
            keyFindings: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  type: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
                },
                required: ['text', 'type'],
                additionalProperties: false,
              },
            },
            keywordAnalysis: {
              type: ['object', 'null'],
              properties: {
                summary: { type: 'string' },
                primaryKeywords: { type: 'array', items: { type: 'string' } },
                missingKeywords: { type: 'array', items: { type: 'string' } },
                keywordDensityAssessment: { type: 'string' },
                titleKeywordMatch: { type: 'string' },
                targetKeywordMatches: { type: 'string' },
                recommendations: { type: 'string' },
              },
              required: ['summary', 'primaryKeywords', 'missingKeywords', 'keywordDensityAssessment', 'titleKeywordMatch', 'targetKeywordMatches', 'recommendations'],
              additionalProperties: false,
            },
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                  category: { type: 'string', enum: ['seo', 'content', 'security', 'performance', 'accessibility'] },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  expectedImpact: { type: 'string' },
                },
                required: ['priority', 'category', 'title', 'description', 'expectedImpact'],
                additionalProperties: false,
              },
            },
            competitorComparison: {
              type: ['object', 'null'],
              properties: {
                summary: { type: 'string' },
                scoreAnalysis: { type: 'string' },
                yourStrengths: { type: 'array', items: { type: 'string' } },
                competitorStrengths: { type: 'array', items: { type: 'string' } },
                opportunities: { type: 'array', items: { type: 'string' } },
                quickWins: { type: 'array', items: { type: 'string' } },
              },
              required: ['summary', 'scoreAnalysis', 'yourStrengths', 'competitorStrengths', 'opportunities', 'quickWins'],
              additionalProperties: false,
            },
            actionPlan: {
              type: 'object',
              properties: {
                immediate: { type: 'array', items: { type: 'string' } },
                shortTerm: { type: 'array', items: { type: 'string' } },
                longTerm: { type: 'array', items: { type: 'string' } },
              },
              required: ['immediate', 'shortTerm', 'longTerm'],
              additionalProperties: false,
            },
          },
          required: ['overallAssessment', 'keyFindings', 'keywordAnalysis', 'recommendations', 'competitorComparison', 'actionPlan'],
          additionalProperties: false,
        },
      },
    },
    max_completion_tokens: 8000,
  });
  const content = response.choices[0]?.message?.content;
  assert(!!content, 'Should have content');
  const parsed = JSON.parse(content!);
  assert(typeof parsed.overallAssessment === 'string', 'overallAssessment');
  assert(Array.isArray(parsed.keyFindings) && parsed.keyFindings.length > 0, 'keyFindings');
  assert(Array.isArray(parsed.recommendations), 'recommendations');
  const reasoning = (response.usage?.completion_tokens_details as { reasoning_tokens?: number })?.reasoning_tokens || 0;
  console.log(`   Findings: ${parsed.keyFindings.length}, Recs: ${parsed.recommendations.length}, Reasoning tokens: ${reasoning}`);
});

// Test 2: Keyword Research (gpt-5-mini + json_schema)
await test('Keyword Research (gpt-5-mini) - json_schema', async () => {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages: [
      { role: 'system', content: 'Du er en SEO-ekspert. Estimer søkeordsdata for norsk marked.' },
      { role: 'user', content: 'Analyser: 1. "bilpleie oslo" 2. "detailing bærum".' },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'keyword_research',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            keywords: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  keyword: { type: 'string' },
                  searchVolume: { type: 'number' },
                  cpc: { type: 'number' },
                  competition: { type: 'string', enum: ['lav', 'medium', 'høy'] },
                  competitionScore: { type: 'number' },
                  intent: { type: 'string', enum: ['informational', 'commercial', 'transactional', 'navigational'] },
                  difficulty: { type: 'number' },
                  trend: { type: 'string', enum: ['stigende', 'stabil', 'synkende'] },
                },
                required: ['keyword', 'searchVolume', 'cpc', 'competition', 'competitionScore', 'intent', 'difficulty', 'trend'],
                additionalProperties: false,
              },
            },
          },
          required: ['keywords'],
          additionalProperties: false,
        },
      },
    },
    max_completion_tokens: 3000,
  });
  const content = response.choices[0]?.message?.content;
  assert(!!content, 'Should have content');
  const parsed = JSON.parse(content!);
  assert(Array.isArray(parsed.keywords) && parsed.keywords.length >= 2, 'keywords array');
  assert(typeof parsed.keywords[0].searchVolume === 'number', 'searchVolume is number');
  console.log(`   Keywords: ${parsed.keywords.map((k: { keyword: string }) => k.keyword).join(', ')}`);
});

// Test 3: Article Suggestions (gpt-5-mini + json_schema)
await test('Article Suggestions (gpt-5-mini) - json_schema', async () => {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages: [
      { role: 'system', content: 'Foreslå artikler. Svar i JSON.' },
      { role: 'user', content: 'Kontekst: bilpleie-firma. Foreslå 3 artikler.' },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'article_suggestions',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  rationale: { type: 'string' },
                  priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                },
                required: ['title', 'rationale', 'priority'],
                additionalProperties: false,
              },
            },
          },
          required: ['suggestions'],
          additionalProperties: false,
        },
      },
    },
    max_completion_tokens: 3000,
  });
  const content = response.choices[0]?.message?.content;
  assert(!!content, 'Should have content');
  const parsed = JSON.parse(content!);
  assert(Array.isArray(parsed.suggestions) && parsed.suggestions.length >= 1, 'suggestions');
  console.log(`   Suggestions: ${parsed.suggestions.length}`);
});

// Test 4: AI SEO Suggestion (gpt-5-mini + json_schema)
await test('AI SEO Suggestion (gpt-5-mini) - json_schema', async () => {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages: [
      { role: 'system', content: 'Gi SEO-forbedringsforslag.' },
      { role: 'user', content: 'Element: Title. Verdi: "Velkommen". Problem: For kort.' },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'seo_suggestion',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            problem: { type: ['string', 'null'] },
            summary: { type: 'string' },
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  priority: { type: 'string' },
                  example: { type: ['string', 'null'] },
                },
                required: ['title', 'description', 'priority', 'example'],
                additionalProperties: false,
              },
            },
            quickWin: { type: 'string' },
          },
          required: ['problem', 'summary', 'suggestions', 'quickWin'],
          additionalProperties: false,
        },
      },
    },
    max_completion_tokens: 3000,
  });
  const content = response.choices[0]?.message?.content;
  assert(!!content, 'Should have content');
  const parsed = JSON.parse(content!);
  assert(typeof parsed.summary === 'string', 'summary');
  assert(Array.isArray(parsed.suggestions), 'suggestions');
  console.log(`   Quick win: ${parsed.quickWin?.slice(0, 60)}...`);
});

// Test 5: Article Generation (gpt-5-mini + json_schema)
await test('Article Generation (gpt-5-mini) - json_schema', async () => {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages: [
      { role: 'system', content: 'Skriv en kort artikkel. Returner JSON med article, metaTitle, metaDescription, featuredImageSuggestion, featuredImageSearchQuery.' },
      { role: 'user', content: 'Tittel: 3 tips for bilpleie. Kort artikkel (100 ord).' },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'generated_article',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            article: { type: 'string' },
            metaTitle: { type: 'string' },
            metaDescription: { type: 'string' },
            featuredImageSuggestion: { type: 'string' },
            featuredImageSearchQuery: { type: 'string' },
          },
          required: ['article', 'metaTitle', 'metaDescription', 'featuredImageSuggestion', 'featuredImageSearchQuery'],
          additionalProperties: false,
        },
      },
    },
    max_completion_tokens: 4000,
  });
  const content = response.choices[0]?.message?.content;
  assert(!!content, 'Should have content');
  const parsed = JSON.parse(content!);
  assert(typeof parsed.article === 'string' && parsed.article.length > 50, 'article content');
  assert(typeof parsed.metaTitle === 'string', 'metaTitle');
  const words = parsed.article.split(/\s+/).filter((w: string) => w.length > 0).length;
  console.log(`   Words: ${words}, Title: "${parsed.metaTitle}"`);
});

// Test 6: AI Visibility (gpt-5.2 plain text - no reasoning tokens)
await test('AI Visibility (gpt-5.2) - plain text', async () => {
  const response = await openai.chat.completions.create({
    model: 'gpt-5.2',
    messages: [
      { role: 'system', content: 'Svar kort på norsk.' },
      { role: 'user', content: 'Hva vet du om mediabooster.no?' },
    ],
    max_completion_tokens: 400,
  });
  const content = response.choices[0]?.message?.content;
  assert(!!content && content.length > 10, 'meaningful response');
  console.log(`   Response: ${content!.slice(0, 80)}...`);
});

// Test 7: Quick Summary (gpt-5-nano)
await test('Quick Summary (gpt-5-nano) - plain text', async () => {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages: [
      { role: 'system', content: 'Gi en kort oppsummering (maks 2 setninger).' },
      { role: 'user', content: 'SEO: 75/100, Innhold: 60/100, Sikkerhet: 90/100.' },
    ],
    max_completion_tokens: 1500, // gpt-5-nano uses ~800 reasoning tokens
  });
  const content = response.choices[0]?.message?.content;
  assert(!!content && content.length > 10, 'meaningful summary');
  console.log(`   Summary: ${content!.slice(0, 80)}`);
});

// Test 8: Keyword Suggestion (gpt-4o-mini - kept on older model)
await test('Keyword Suggestion (gpt-4o-mini) - plain text', async () => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Foreslå 5 søkeord. Returner kun JSON-array.' },
      { role: 'user', content: 'URL: bilpleie.no. Foreslå 5 norske søkeord.' },
    ],
    max_completion_tokens: 200,
  });
  const content = response.choices[0]?.message?.content;
  assert(!!content, 'Should have content');
  const cleaned = content!.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  const parsed = JSON.parse(cleaned);
  assert(Array.isArray(parsed) && parsed.length >= 3, 'keyword array');
  console.log(`   Keywords: ${parsed.slice(0, 5).join(', ')}`);
});

// Summary
console.log('\n' + '='.repeat(60));
console.log(`Results: ${PASS} ${passed} passed, ${FAIL} ${failed} failed`);
console.log('='.repeat(60));
if (failed > 0) process.exit(1);

} // end main

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
