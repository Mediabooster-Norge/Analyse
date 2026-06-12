import type { KeywordData } from '@/lib/services/openai';
import { generateKeywordResearch } from '@/lib/services/openai';

const BATCH_SIZE = 8;
const BATCH_CONCURRENCY = 2;

function normalizeKeyword(value: string): string {
  return value.toLowerCase().trim();
}

function findKeywordMatch(requested: string, results: KeywordData[]): KeywordData | undefined {
  const target = normalizeKeyword(requested);
  return results.find((row) => normalizeKeyword(row.keyword) === target);
}

function stubKeyword(keyword: string): KeywordData {
  return {
    keyword,
    searchVolume: 100,
    cpc: 5,
    competition: 'medium',
    competitionScore: 50,
    intent: 'commercial',
    difficulty: 50,
    trend: 'stabil',
  };
}

/** Bevarer rekkefølge og sikrer at hvert forespurt nøkkelord finnes i resultatet. */
export function mergeKeywordResearch(requested: string[], fromApi: KeywordData[]): KeywordData[] {
  return requested.map((keyword) => {
    const match = findKeywordMatch(keyword, fromApi);
    return match ? { ...match, keyword } : stubKeyword(keyword);
  });
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await fn(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

export async function generateKeywordResearchForList(
  keywords: string[],
  industry?: string
): Promise<{ keywords: KeywordData[]; tokensUsed: number; costUsd: number }> {
  const unique = [...new Map(keywords.map((k) => [normalizeKeyword(k), k.trim()])).values()].filter(Boolean);

  if (unique.length === 0) {
    return { keywords: [], tokensUsed: 0, costUsd: 0 };
  }

  const batches = chunkArray(unique, BATCH_SIZE);
  const batchResults = await mapWithConcurrency(batches, BATCH_CONCURRENCY, (batch) =>
    generateKeywordResearch(batch, industry)
  );

  const merged = mergeKeywordResearch(
    unique,
    batchResults.flatMap((result) => result.keywords)
  );

  return {
    keywords: merged,
    tokensUsed: batchResults.reduce((sum, result) => sum + result.tokensUsed, 0),
    costUsd: batchResults.reduce((sum, result) => sum + result.costUsd, 0),
  };
}
