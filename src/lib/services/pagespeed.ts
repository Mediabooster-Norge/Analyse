import type { PageSpeedResults } from '@/types';

interface PageSpeedAPIResponse {
  lighthouseResult: {
    categories: {
      performance: { score: number };
      accessibility: { score: number };
      'best-practices': { score: number };
      seo: { score: number };
    };
    audits: {
      'largest-contentful-paint': { numericValue: number };
      'first-input-delay'?: { numericValue: number };
      'max-potential-fid'?: { numericValue: number };
      'cumulative-layout-shift': { numericValue: number };
      'total-blocking-time': { numericValue: number };
    };
  };
}

// Cache for PageSpeed results (1 hour TTL)
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const pageSpeedCache = new Map<string, { results: PageSpeedResults; timestamp: number }>();

function getDomainFromUrl(url: string): string {
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    return new URL(normalized).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function getCachedResults(domain: string): PageSpeedResults | null {
  const cached = pageSpeedCache.get(domain);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log(`[PageSpeed] Using cached results for ${domain} (${Math.round((Date.now() - cached.timestamp) / 1000 / 60)}min old)`);
    return cached.results;
  }
  return null;
}

function setCachedResults(domain: string, results: PageSpeedResults): void {
  pageSpeedCache.set(domain, { results, timestamp: Date.now() });
}

// Timeout wrapper for fetch
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Simple rate limiter - max concurrent calls
let activePageSpeedCalls = 0;
const MAX_CONCURRENT_PAGESPEED_CALLS = 2; // Reduced to avoid API throttling
const pageSpeedQueue: Array<() => void> = [];

async function waitForSlot(): Promise<void> {
  if (activePageSpeedCalls < MAX_CONCURRENT_PAGESPEED_CALLS) {
    activePageSpeedCalls++;
    return;
  }
  
  return new Promise((resolve) => {
    pageSpeedQueue.push(() => {
      activePageSpeedCalls++;
      resolve();
    });
  });
}

function releaseSlot(): void {
  activePageSpeedCalls--;
  const next = pageSpeedQueue.shift();
  if (next) next();
}

export async function analyzePageSpeed(url: string, options?: { timeout?: number; skipRateLimit?: boolean; skipCache?: boolean }): Promise<PageSpeedResults> {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
  const domain = getDomainFromUrl(normalizedUrl);
  const timeout = options?.timeout ?? 45000; // 45 second default timeout (API can take 30-40s)

  // Check cache first (unless skipCache is true)
  if (!options?.skipCache) {
    const cached = getCachedResults(domain);
    if (cached) {
      return cached;
    }
  }

  // Build API URL
  const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  apiUrl.searchParams.set('url', normalizedUrl);
  apiUrl.searchParams.set('strategy', 'desktop'); // Desktop gives more realistic scores
  // Use append() for multiple category values (set() would overwrite)
  apiUrl.searchParams.append('category', 'performance');
  apiUrl.searchParams.append('category', 'accessibility');
  apiUrl.searchParams.append('category', 'best-practices');
  apiUrl.searchParams.append('category', 'seo');

  if (apiKey) {
    apiUrl.searchParams.set('key', apiKey);
  }

  // Wait for available slot (rate limiting)
  if (!options?.skipRateLimit) {
    await waitForSlot();
  }

  try {
    console.log(`[PageSpeed] Starting analysis for ${normalizedUrl}...`);
    const startTime = Date.now();
    
    const response = await fetchWithTimeout(apiUrl.toString(), timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[PageSpeed] API error for ${normalizedUrl}:`, response.status, errorText);
      if (response.status === 429) {
        console.warn('[PageSpeed] Rate limited! Consider adding an API key or reducing concurrent calls.');
      }
      throw new Error(`PageSpeed API error: ${response.status}`);
    }

    const data = await response.json();
    const lighthouse = data.lighthouseResult;
    if (!lighthouse) {
      console.error(`[PageSpeed] No lighthouseResult in response for ${normalizedUrl}`);
      throw new Error('PageSpeed: no lighthouse result');
    }

    const elapsed = Date.now() - startTime;
    console.log(`[PageSpeed] Completed ${domain} in ${Math.round(elapsed/1000)}s - Performance: ${Math.round((data.lighthouseResult?.categories?.performance?.score || 0) * 100)}`);
    
    const performanceScore = lighthouse.categories?.performance?.score;
    const accessibilityScore = lighthouse.categories?.accessibility?.score;
    const bestPracticesScore = lighthouse.categories?.['best-practices']?.score;
    const seoScore = lighthouse.categories?.seo?.score;
    
    const result = {
      performance: performanceScore != null ? Math.round(performanceScore * 100) : 0,
      accessibility: accessibilityScore != null ? Math.round(accessibilityScore * 100) : 0,
      bestPractices: bestPracticesScore != null ? Math.round(bestPracticesScore * 100) : 0,
      seo: seoScore != null ? Math.round(seoScore * 100) : 0,
      coreWebVitals: {
        lcp: lighthouse.audits?.['largest-contentful-paint']?.numericValue || 0,
        fid: lighthouse.audits?.['max-potential-fid']?.numericValue || lighthouse.audits?.['total-blocking-time']?.numericValue || 0,
        cls: lighthouse.audits?.['cumulative-layout-shift']?.numericValue || 0,
      },
    };
    
    // Cache successful results
    setCachedResults(domain, result);
    
    return result;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[PageSpeed] Timeout (${timeout}ms) for ${normalizedUrl}`);
    } else {
      console.error(`[PageSpeed] Error for ${normalizedUrl}:`, error);
    }
    throw error;
  } finally {
    if (!options?.skipRateLimit) {
      releaseSlot();
    }
  }
}

function getDefaultResults(): PageSpeedResults {
  return {
    performance: 0,
    accessibility: 0,
    bestPractices: 0,
    seo: 0,
    coreWebVitals: {
      lcp: 0,
      fid: 0,
      cls: 0,
    },
  };
}

export function getPerformanceRating(score: number): string {
  if (score >= 90) return 'Utmerket';
  if (score >= 50) return 'Trenger forbedring';
  return 'Dårlig';
}

export function getLCPRating(lcp: number): string {
  if (lcp <= 2500) return 'God';
  if (lcp <= 4000) return 'Trenger forbedring';
  return 'Dårlig';
}

export function getCLSRating(cls: number): string {
  if (cls <= 0.1) return 'God';
  if (cls <= 0.25) return 'Trenger forbedring';
  return 'Dårlig';
}

export function getFIDRating(fid: number): string {
  if (fid <= 100) return 'God';
  if (fid <= 300) return 'Trenger forbedring';
  return 'Dårlig';
}
