/**
 * Quick performance estimate for competitors (no PageSpeed API).
 * Uses scraper data: response time (TTFB), HTML size, resource counts,
 * and additional heuristics for render-blocking resources, lazy loading,
 * compression, and image optimization.
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
  /** Response headers from scrape (for compression, HTTP/2 detection) */
  headers?: Record<string, string>;
}

/**
 * Returns a performance estimate (0-100) and PageSpeedResults-shaped object
 * with isEstimate: true for UI to show "Ytelsesestimat" vs "PageSpeed".
 */
export function estimatePerformanceFromScrape(input: QuickPerformanceInput): PageSpeedResults {
  const { html, loadTimeMs, headers } = input;
  const $ = cheerio.load(html);

  // ── Resource counts ──
  const allScripts = $('script[src]');
  const inlineScripts = $('script:not([src])');
  const scriptCount = allScripts.length + (inlineScripts.length > 0 ? 1 : 0);
  const styleCount = $('link[rel="stylesheet"]').length + $('style').length;
  const images = $('img');
  const imageCount = images.length;
  const htmlSizeKb = Math.round(Buffer.byteLength(html, 'utf8') / 1024);

  const getAttrs = (el: unknown): Record<string, string> => (el && typeof el === 'object' && 'attribs' in el && el.attribs) ? (el.attribs as Record<string, string>) : {};

  // ── Render-blocking analysis ──
  let renderBlockingScripts = 0;
  allScripts.each((_, el) => {
    const attrs = getAttrs(el);
    const hasAsync = 'async' in attrs;
    const hasDefer = 'defer' in attrs;
    const hasModule = attrs.type === 'module';
    if (!hasAsync && !hasDefer && !hasModule) {
      renderBlockingScripts++;
    }
  });
  // Render-blocking CSS (stylesheets without media="print" or preload)
  let renderBlockingStyles = 0;
  $('link[rel="stylesheet"]').each((_, el) => {
    const attrs = getAttrs(el);
    if (attrs.media !== 'print' && attrs.rel !== 'preload') {
      renderBlockingStyles++;
    }
  });

  // ── Image optimization ──
  let lazyLoadedImages = 0;
  let imagesWithDimensions = 0;
  images.each((_, el) => {
    const attrs = getAttrs(el);
    if (attrs.loading === 'lazy' || attrs['data-src'] || attrs['data-lazy']) {
      lazyLoadedImages++;
    }
    if (attrs.width && attrs.height) {
      imagesWithDimensions++;
    }
  });

  // ── Compression detection ──
  const contentEncoding = headers?.['content-encoding'] || '';
  const hasCompression = /gzip|br|deflate/i.test(contentEncoding);

  // ── HTTP/2 detection ──
  const altSvc = headers?.['alt-svc'] || '';
  const hasHttp2 = altSvc.includes('h2') || altSvc.includes('h3');

  // ── Score components 0-100 (higher = better) ──
  const loadTimeScore =
    loadTimeMs <= MAX_LOADTIME_GOOD_MS ? 100 :
    loadTimeMs <= MAX_LOADTIME_OK_MS ? Math.max(0, 100 - (loadTimeMs - MAX_LOADTIME_GOOD_MS) / 20) :
    Math.max(0, 50 - (loadTimeMs - MAX_LOADTIME_OK_MS) / 100);

  const sizeScore = htmlSizeKb <= MAX_HTML_KB ? 100 : Math.max(0, 100 - (htmlSizeKb - MAX_HTML_KB) / 2);
  const scriptScore = scriptCount <= MAX_SCRIPTS ? 100 : Math.max(0, 100 - (scriptCount - MAX_SCRIPTS) * 3);
  const styleScore = styleCount <= MAX_STYLES ? 100 : Math.max(0, 100 - (styleCount - MAX_STYLES) * 4);
  const imageScore = imageCount <= MAX_IMAGES ? 100 : Math.max(0, 100 - (imageCount - MAX_IMAGES));

  // Render-blocking penalty: each blocking resource costs up to 3 points
  const totalRenderBlocking = renderBlockingScripts + renderBlockingStyles;
  const renderBlockingPenalty = Math.min(15, totalRenderBlocking * 3);

  // Image optimization bonus: reward for lazy loading + explicit dimensions
  const imageOptPct = imageCount > 0
    ? (lazyLoadedImages / imageCount * 0.6 + imagesWithDimensions / imageCount * 0.4)
    : 1;
  const imageOptBonus = Math.round(imageOptPct * 8); // 0–8 points

  // Compression bonus
  const compressionBonus = hasCompression ? 5 : 0;

  // HTTP/2 bonus
  const http2Bonus = hasHttp2 ? 3 : 0;

  // Weighted overall
  const rawScore =
    loadTimeScore * 0.35 +
    sizeScore * 0.20 +
    scriptScore * 0.15 +
    styleScore * 0.10 +
    imageScore * 0.10 +
    imageOptBonus +
    compressionBonus +
    http2Bonus -
    renderBlockingPenalty;

  const performance = Math.min(100, Math.max(0, Math.round(rawScore)));

  return {
    performance,
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
