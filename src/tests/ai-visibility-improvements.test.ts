/**
 * Run with: npx tsx src/tests/ai-visibility-improvements.test.ts
 */
import assert from 'node:assert/strict';
import { buildAiVisibilityImprovements } from '../lib/utils/ai-visibility-improvements';
import type { AIVisibilityData } from '../types';

const baseVis: AIVisibilityData = {
  score: 25,
  level: 'low',
  description: 'Lav',
  recommendationScore: 20,
  knowledgeScore: 35,
  discoveryScore: 40,
  focusKeyword: 'digital markedsføring',
  details: {
    queriesTested: 10,
    timesCited: 2,
    timesMentioned: 1,
    webSearchCount: 10,
    estimatedCount: 0,
    competitorsMentioned: ['Konkurrent AS', 'Rival AS'],
    queries: [],
  },
  recommendations: [],
};

const improvements = buildAiVisibilityImprovements(baseVis);
assert.ok(improvements.length >= 5, 'gir flere konkrete tiltak');
assert.ok(improvements.some((i) => i.id === 'bransje-innhold'), 'inkluderer bransjeinnhold ved lav anbefaling');
assert.ok(improvements.some((i) => i.id === 'konkurrent-differensiering'), 'inkluderer konkurrenttiltak');
assert.ok(!improvements.some((i) => i.id === 'handlingsplan'), 'ingen meta-tiltak om å prioritere listen');
assert.ok(improvements[0].priority === 'high', 'sorterer høy prioritet først');

const highVis: AIVisibilityData = {
  ...baseVis,
  score: 82,
  level: 'high',
  recommendationScore: 75,
  knowledgeScore: 80,
  discoveryScore: 78,
  details: { ...baseVis.details, timesCited: 8, competitorsMentioned: undefined },
};
const maintenance = buildAiVisibilityImprovements(highVis);
assert.ok(maintenance.some((i) => i.category === 'maintenance'), 'høy score gir vedlikeholdstips');

console.log('ai-visibility-improvements.test.ts: OK');
