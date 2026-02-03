/**
 * Quick performance estimate for competitors (no PageSpeed API).
 * Uses scraper data: response time (TTFB), HTML size, and resource counts.
 */
import * as cheerio from 'cheerio';
import type { PageSpeedResults } from '@/types';

const MAX_LOADTIME_GOOD_MS = 800;
const MAX_LOADTIME_OK_MS = 2000;
const MAX_HTML_KB = 150;
const MAX_SCRIPTS = 25;
const MAX_STYLES = 15;
const MAX_IMAGES = 50;

export interface QuickPerformanceInput {
  html: string;
  loadTimeMs: number;
}

/**
 * Returns a performance estimate (0-100) and PageSpeedResults-shaped object
 * with isEstimate: true for UI to show "Ytelsesestimat" vs "PageSpeed".
 */
export function estimatePerformanceFromScrape(input: QuickPerformanceInput): PageSpeedResults {
  const { html, loadTimeMs } = input;
  const $ = cheerio.load(html);

  // Resource counts
  const scriptCount = $('script[src]').length + ($('script:not([src])').length > 0 ? 1 : 0);
  const styleCount = $('link[rel="stylesheet"]').length + $('style').length;
  const imageCount = $('img').length;
  const htmlSizeKb = Math.round(Buffer.byteLength(html, 'utf8') / 1024);

  // Score components 0-100 (higher = better)
  const loadTimeScore =
    loadTimeMs <= MAX_LOADTIME_GOOD_MS ? 100 :
    loadTimeMs <= MAX_LOADTIME_OK_MS ? Math.max(0, 100 - (loadTimeMs - MAX_LOADTIME_GOOD_MS) / 20) :
    Math.max(0, 50 - (loadTimeMs - MAX_LOADTIME_OK_MS) / 100);

  const sizeScore = htmlSizeKb <= MAX_HTML_KB ? 100 : Math.max(0, 100 - (htmlSizeKb - MAX_HTML_KB) / 2);
  const scriptScore = scriptCount <= MAX_SCRIPTS ? 100 : Math.max(0, 100 - (scriptCount - MAX_SCRIPTS) * 3);
  const styleScore = styleCount <= MAX_STYLES ? 100 : Math.max(0, 100 - (styleCount - MAX_STYLES) * 4);
  const imageScore = imageCount <= MAX_IMAGES ? 100 : Math.max(0, 100 - (imageCount - MAX_IMAGES));

  // Weighted overall: load time and size matter most
  const performance = Math.round(
    loadTimeScore * 0.4 + sizeScore * 0.25 + scriptScore * 0.15 + styleScore * 0.1 + imageScore * 0.1
  );

  return {
    performance: Math.min(100, Math.max(0, performance)),
    accessibility: 0,
    bestPractices: 0,
    seo: 0,
    coreWebVitals: {
      lcp: loadTimeMs, // Use loadTime as proxy for "first content" in ms
      fid: 0,
      cls: 0,
    },
    isEstimate: true,
  };
}
