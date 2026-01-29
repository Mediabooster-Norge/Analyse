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

export async function analyzePageSpeed(url: string): Promise<PageSpeedResults> {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

  // Build API URL
  const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  apiUrl.searchParams.set('url', normalizedUrl);
  apiUrl.searchParams.set('strategy', 'mobile');
  apiUrl.searchParams.set('category', 'performance');
  apiUrl.searchParams.set('category', 'accessibility');
  apiUrl.searchParams.set('category', 'best-practices');
  apiUrl.searchParams.set('category', 'seo');

  if (apiKey) {
    apiUrl.searchParams.set('key', apiKey);
  }

  try {
    const response = await fetch(apiUrl.toString());

    if (!response.ok) {
      console.error('PageSpeed API error:', response.status, await response.text());
      return getDefaultResults();
    }

    const data = (await response.json()) as PageSpeedAPIResponse;
    const lighthouse = data.lighthouseResult;

    return {
      performance: Math.round((lighthouse.categories.performance?.score || 0) * 100),
      accessibility: Math.round((lighthouse.categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((lighthouse.categories['best-practices']?.score || 0) * 100),
      seo: Math.round((lighthouse.categories.seo?.score || 0) * 100),
      coreWebVitals: {
        lcp: lighthouse.audits['largest-contentful-paint']?.numericValue || 0,
        fid: lighthouse.audits['max-potential-fid']?.numericValue || lighthouse.audits['total-blocking-time']?.numericValue || 0,
        cls: lighthouse.audits['cumulative-layout-shift']?.numericValue || 0,
      },
    };
  } catch (error) {
    console.error('PageSpeed API error:', error);
    return getDefaultResults();
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
