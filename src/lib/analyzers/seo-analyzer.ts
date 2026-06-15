import type { CheerioAPI } from 'cheerio';
import type { SEOResults, MetaTagsAnalysis, HeadingsAnalysis, ImagesAnalysis, LinksAnalysis, MobileAnalysis, TechnicalSEOAnalysis, StructuredDataAnalysis } from '@/types';
import { fetchRobotsTxt, fetchSitemap } from '@/lib/services/scraper';
import { clampScore } from '@/lib/utils/score-utils';

export async function analyzeSEO($: CheerioAPI, url: string): Promise<SEOResults> {
  const [meta, headings, images, links, mobile, technical] = await Promise.all([
    analyzeMetaTags($),
    analyzeHeadings($),
    analyzeImages($, url),
    analyzeLinks($, url),
    analyzeMobile($),
    analyzeTechnicalSEO($, url),
  ]);

  // Structured data is a synchronous, in-memory parse of the already-fetched HTML
  // (no network calls), so it adds negligible time even with max competitors.
  const structuredData = analyzeStructuredData($);

  // Calculate overall SEO score
  const scores = [
    calculateMetaScore(meta),
    calculateHeadingsScore(headings),
    images.score,
    calculateLinksScore(links),
    calculateMobileScore(mobile),
    calculateTechnicalScore(technical),
    structuredData.score,
  ];

  const score = clampScore(scores.reduce((a, b) => a + b, 0) / scores.length);

  return {
    meta,
    headings,
    images,
    links,
    mobile,
    technical,
    structuredData,
    score,
  };
}

function analyzeMetaTags($: CheerioAPI): MetaTagsAnalysis {
  const title = $('title').text().trim();
  const description = $('meta[name="description"]').attr('content') || null;

  return {
    title: {
      content: title || null,
      length: title.length,
      isOptimal: title.length >= 30 && title.length <= 60,
    },
    description: {
      content: description,
      length: description?.length || 0,
      isOptimal: description ? description.length >= 150 && description.length <= 160 : false,
    },
    ogTags: {
      title: $('meta[property="og:title"]').attr('content') || null,
      description: $('meta[property="og:description"]').attr('content') || null,
      image: $('meta[property="og:image"]').attr('content') || null,
      url: $('meta[property="og:url"]').attr('content') || null,
    },
    twitterTags: {
      card: $('meta[name="twitter:card"]').attr('content') || null,
      title: $('meta[name="twitter:title"]').attr('content') || null,
      description: $('meta[name="twitter:description"]').attr('content') || null,
      image: $('meta[name="twitter:image"]').attr('content') || null,
    },
    canonical: $('link[rel="canonical"]').attr('href') || null,
    robots: $('meta[name="robots"]').attr('content') || null,
  };
}

function analyzeHeadings($: CheerioAPI): HeadingsAnalysis {
  const getHeadings = (tag: string) => {
    const elements = $(tag);
    return {
      count: elements.length,
      contents: elements
        .map((_, el) => $(el).text().trim())
        .get()
        .slice(0, 5), // Limit to first 5
    };
  };

  const h1 = getHeadings('h1');
  const h2 = getHeadings('h2');
  const h3 = getHeadings('h3');
  const h4 = getHeadings('h4');
  const h5 = getHeadings('h5');
  const h6 = getHeadings('h6');

  const issues: string[] = [];

  if (h1.count === 0) {
    issues.push('Mangler H1-tag');
  } else if (h1.count > 1) {
    issues.push(`For mange H1-tags (${h1.count}). Bør kun ha én.`);
  }

  if (h2.count === 0 && h3.count > 0) {
    issues.push('H3 brukt uten H2 - brutt hierarki');
  }

  const hasProperHierarchy = h1.count === 1 && issues.length === 0;

  return {
    h1,
    h2,
    h3,
    h4,
    h5,
    h6,
    hasProperHierarchy,
    issues,
  };
}

function analyzeImages($: CheerioAPI, pageUrl: string): ImagesAnalysis {
  const images = $('img');
  const total = images.length;

  let withAlt = 0;
  let withoutAlt = 0;
  let withLazyLoading = 0;
  let withLazyAmongDeferred = 0;
  const missingAltImages: string[] = [];
  const largeImages: string[] = [];
  const allImageUrls: string[] = [];

  // Helper to resolve relative URLs
  const resolveUrl = (src: string): string => {
    if (!src) return '';
    if (src.startsWith('data:')) return ''; // Skip data URIs
    if (src.startsWith('http://') || src.startsWith('https://')) return src;
    try {
      return new URL(src, pageUrl).href;
    } catch {
      return '';
    }
  };

  images.each((index, el) => {
    const $img = $(el);
    const alt = $img.attr('alt');
    const rawSrc = $img.attr('src') || '';
    // When src is a data URI placeholder (WordPress lazy loading pattern),
    // fall through to data-src to get the real image URL
    const src = rawSrc.startsWith('data:')
      ? ($img.attr('data-src') || $img.attr('data-lazy-src') || $img.attr('data-original') || '')
      : (rawSrc || $img.attr('data-src') || $img.attr('data-lazy-src') || $img.attr('data-original') || '');
    // Fall back to the first URL in srcset when no src is present at all
    const srcset = !src ? ($img.attr('srcset') || $img.attr('data-srcset') || '') : '';
    const srcFromSrcset = srcset ? srcset.split(',')[0].trim().split(/\s+/)[0] : '';
    const loading = $img.attr('loading');
    const resolvedSrc = resolveUrl(src || srcFromSrcset);

    // Collect valid image URLs for relevance analysis (max 5)
    if (resolvedSrc && allImageUrls.length < 5) {
      // Skip tiny images (likely icons/trackers)
      const width = parseInt($img.attr('width') || '0', 10);
      const height = parseInt($img.attr('height') || '0', 10);
      if (!(width > 0 && width < 50) && !(height > 0 && height < 50)) {
        allImageUrls.push(resolvedSrc);
      }
    }

    if (alt && alt.trim().length > 0) {
      withAlt++;
    } else {
      withoutAlt++;
      if (resolvedSrc && missingAltImages.length < 5) {
        missingAltImages.push(resolvedSrc);
      }
    }

    if (loading === 'lazy') {
      withLazyLoading++;
      if (index >= 3) withLazyAmongDeferred++;
    }

    // Check for potentially large images (no lazy loading on images that aren't first few)
    if (!loading && resolvedSrc && largeImages.length < 5) {
      largeImages.push(resolvedSrc);
    }
  });

  // Calculate score
  let score = 100;
  if (total > 0) {
    const altRatio = withAlt / total;
    const lazyEligible = Math.max(0, total - 3);
    const lazyRatio = lazyEligible > 0 ? Math.min(1, withLazyAmongDeferred / lazyEligible) : 1;
    score = clampScore(altRatio * 70 + lazyRatio * 30);
  }

  return {
    total,
    withAlt,
    withoutAlt,
    withLazyLoading,
    largeImages,
    missingAltImages,
    allImageUrls, // Add this for relevance analysis
    score,
  };
}

function analyzeLinks($: CheerioAPI, pageUrl: string): LinksAnalysis {
  const links = $('a[href]');
  const pageHost = new URL(pageUrl).hostname;

  const internal: string[] = [];
  const external: string[] = [];
  const nofollow: string[] = [];

  links.each((_, el) => {
    const $link = $(el);
    const href = $link.attr('href') || '';
    const rel = $link.attr('rel') || '';

    // Skip anchors, javascript, and mailto
    if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }

    try {
      const linkUrl = new URL(href, pageUrl);

      if (linkUrl.hostname === pageHost) {
        if (!internal.includes(linkUrl.pathname) && internal.length < 50) {
          internal.push(linkUrl.pathname);
        }
      } else {
        if (!external.includes(linkUrl.href) && external.length < 20) {
          external.push(linkUrl.href);
        }
      }

      if (rel.includes('nofollow') && nofollow.length < 10) {
        nofollow.push(href);
      }
    } catch {
      // Invalid URL, skip
    }
  });

  return {
    internal: { count: internal.length, urls: internal.slice(0, 10) },
    external: { count: external.length, urls: external.slice(0, 10) },
    broken: { count: 0, urls: [] }, // Would need async checks
    nofollow: { count: nofollow.length, urls: nofollow },
  };
}

function analyzeMobile($: CheerioAPI): MobileAnalysis {
  const viewportMeta = $('meta[name="viewport"]');
  const hasViewportMeta = viewportMeta.length > 0;
  const viewportContent = viewportMeta.attr('content') || null;

  const issues: string[] = [];

  if (!hasViewportMeta) {
    issues.push('Mangler viewport meta tag');
  } else if (viewportContent && !viewportContent.includes('width=device-width')) {
    issues.push('Viewport bør inkludere width=device-width');
  }

  // Check for fixed widths on common elements
  const hasFixedWidthElements = $('[style*="width:"][style*="px"]').length > 0;
  if (hasFixedWidthElements) {
    issues.push('Noen elementer har faste pikselbredder');
  }

  const isResponsive = hasViewportMeta && viewportContent?.includes('width=device-width');

  return {
    hasViewportMeta,
    viewportContent,
    isResponsive: isResponsive || false,
    issues,
  };
}

async function analyzeTechnicalSEO($: CheerioAPI, url: string): Promise<TechnicalSEOAnalysis> {
  const baseUrl = new URL(url).origin;

  const [robotsTxt, sitemap] = await Promise.all([
    fetchRobotsTxt(baseUrl),
    fetchSitemap(baseUrl),
  ]);

  // Check for hreflang
  const hreflangTags: { lang: string; url: string }[] = [];
  $('link[rel="alternate"][hreflang]').each((_, el) => {
    const $el = $(el);
    const lang = $el.attr('hreflang');
    const href = $el.attr('href');
    if (lang && href) {
      hreflangTags.push({ lang, url: href });
    }
  });

  return {
    hasRobotsTxt: robotsTxt !== null,
    hasSitemap: sitemap.exists,
    sitemapUrl: sitemap.url,
    hasHttps: url.startsWith('https://'),
    hasHreflang: hreflangTags.length > 0,
    hreflangTags,
  };
}

// ============================================================================
// Structured data (Schema.org / JSON-LD / microdata / RDFa)
// ============================================================================

/** Guardrails so a pathological page can never blow the analysis time budget. */
const SD_MAX_JSONLD_SCRIPTS = 30;
const SD_MAX_SCRIPT_LENGTH = 100_000; // skip JSON-LD blobs larger than ~100KB
const SD_MAX_NODES = 200;

/** Schema.org types we recognize as meaningful for Norwegian SMB sites. */
const SD_KNOWN_TYPES = new Set([
  'Organization',
  'LocalBusiness',
  'Corporation',
  'WebSite',
  'WebPage',
  'Article',
  'BlogPosting',
  'NewsArticle',
  'Product',
  'Service',
  'Offer',
  'FAQPage',
  'BreadcrumbList',
  'Event',
  'Person',
  'Review',
  'AggregateRating',
  'Recipe',
  'VideoObject',
  'ImageObject',
  'SearchAction',
]);

/** Recommended (not strictly required) fields per type, used to flag gaps. */
const SD_REQUIRED_FIELDS: Record<string, string[]> = {
  Organization: ['name', 'url'],
  Corporation: ['name', 'url'],
  LocalBusiness: ['name', 'address', 'telephone'],
  WebSite: ['name', 'url'],
  WebPage: ['name'],
  Article: ['headline', 'datePublished', 'author'],
  BlogPosting: ['headline', 'datePublished', 'author'],
  NewsArticle: ['headline', 'datePublished', 'author'],
  Product: ['name'],
  FAQPage: ['mainEntity'],
  BreadcrumbList: ['itemListElement'],
  Event: ['name', 'startDate'],
  Person: ['name'],
};

/** Normalize a Schema.org @type (string or array) to a list of short type names. */
function normalizeSchemaType(rawType: unknown): string[] {
  const toShort = (t: string): string => {
    const trimmed = t.trim();
    // Handle full URLs like "https://schema.org/Organization"
    const lastSegment = trimmed.split(/[/#]/).pop() ?? trimmed;
    return lastSegment;
  };
  if (typeof rawType === 'string') return [toShort(rawType)];
  if (Array.isArray(rawType)) {
    return rawType.filter((t): t is string => typeof t === 'string').map(toShort);
  }
  return [];
}

/** Recursively collect JSON-LD nodes (handles @graph and nested arrays/objects). */
function collectJsonLdNodes(value: unknown, out: Record<string, unknown>[], depth = 0): void {
  if (out.length >= SD_MAX_NODES || depth > 6) return;
  if (Array.isArray(value)) {
    for (const item of value) collectJsonLdNodes(item, out, depth + 1);
    return;
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if ('@graph' in obj) {
      collectJsonLdNodes(obj['@graph'], out, depth + 1);
    }
    if ('@type' in obj) {
      out.push(obj);
    }
  }
}

export function analyzeStructuredData($: CheerioAPI): StructuredDataAnalysis {
  const blocks: StructuredDataAnalysis['blocks'] = [];
  const formatsFound = new Set<StructuredDataAnalysis['formats'][number]>();
  const typesFound = new Set<string>();
  let invalidJsonLdCount = 0;

  // --- JSON-LD (preferred format) ---
  const scripts = $('script[type="application/ld+json"]');
  scripts.slice(0, SD_MAX_JSONLD_SCRIPTS).each((_, el) => {
    const raw = $(el).contents().text().trim();
    if (!raw || raw.length > SD_MAX_SCRIPT_LENGTH) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      invalidJsonLdCount++;
      blocks.push({ type: 'Unknown', format: 'json-ld', valid: false, missingFields: [] });
      return;
    }

    formatsFound.add('json-ld');
    const nodes: Record<string, unknown>[] = [];
    collectJsonLdNodes(parsed, nodes);

    for (const node of nodes) {
      const types = normalizeSchemaType(node['@type']);
      const primaryType = types.find((t) => SD_KNOWN_TYPES.has(t)) ?? types[0] ?? 'Unknown';
      if (SD_KNOWN_TYPES.has(primaryType)) typesFound.add(primaryType);

      const required = SD_REQUIRED_FIELDS[primaryType] ?? [];
      const missingFields = required.filter((field) => {
        const v = node[field];
        return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
      });

      blocks.push({ type: primaryType, format: 'json-ld', valid: true, missingFields });
    }
  });

  // --- Microdata (lightweight detection, no deep field validation) ---
  $('[itemscope][itemtype]').slice(0, SD_MAX_NODES).each((_, el) => {
    const itemtype = $(el).attr('itemtype') || '';
    const types = normalizeSchemaType(itemtype);
    const primaryType = types.find((t) => SD_KNOWN_TYPES.has(t)) ?? types[0] ?? 'Unknown';
    if (!primaryType) return;
    formatsFound.add('microdata');
    if (SD_KNOWN_TYPES.has(primaryType)) typesFound.add(primaryType);
    blocks.push({ type: primaryType, format: 'microdata', valid: true, missingFields: [] });
  });

  // --- RDFa (lightweight detection) ---
  $('[typeof]').slice(0, SD_MAX_NODES).each((_, el) => {
    const typeofAttr = $(el).attr('typeof') || '';
    const types = normalizeSchemaType(typeofAttr);
    const primaryType = types.find((t) => SD_KNOWN_TYPES.has(t)) ?? types[0] ?? 'Unknown';
    if (!primaryType) return;
    formatsFound.add('rdfa');
    if (SD_KNOWN_TYPES.has(primaryType)) typesFound.add(primaryType);
    blocks.push({ type: primaryType, format: 'rdfa', valid: true, missingFields: [] });
  });

  const hasAny = blocks.length > 0;
  const types = [...typesFound];
  const hasValidBlock = blocks.some((b) => b.valid);
  const hasKnownType = types.length > 0;

  // --- Issues & recommendations ---
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (!hasAny) {
    issues.push('Mangler strukturert data (Schema.org)');
    recommendations.push('Legg til JSON-LD med Organization eller LocalBusiness (navn, adresse, kontaktinfo)');
    recommendations.push('Legg til WebSite-markup slik at søkemotorer og AI forstår nettstedet');
  } else {
    if (invalidJsonLdCount > 0) {
      issues.push(`${invalidJsonLdCount} JSON-LD-blokk${invalidJsonLdCount > 1 ? 'er' : ''} kunne ikke tolkes (ugyldig JSON)`);
    }
    const hasFoundation = types.some((t) =>
      ['Organization', 'LocalBusiness', 'Corporation', 'WebSite'].includes(t)
    );
    if (!hasFoundation) {
      recommendations.push('Legg til Organization/LocalBusiness for å beskrive bedriften');
    }
    for (const block of blocks) {
      if (block.missingFields.length > 0) {
        issues.push(`${block.type} mangler felt: ${block.missingFields.join(', ')}`);
      }
    }
  }

  const score = calculateStructuredDataScore({ hasAny, hasValidBlock, hasKnownType, blocks });

  return {
    hasAny,
    formats: [...formatsFound],
    types,
    blocks,
    invalidJsonLdCount,
    issues,
    recommendations,
    score,
  };
}

// Scoring functions
function calculateMetaScore(meta: MetaTagsAnalysis): number {
  let score = 0;
  let maxScore = 0;

  // Title (25 points)
  maxScore += 25;
  if (meta.title.content) {
    score += meta.title.isOptimal ? 25 : 15;
  }

  // Description (25 points)
  maxScore += 25;
  if (meta.description.content) {
    score += meta.description.isOptimal ? 25 : 15;
  }

  // OG Tags (25 points)
  maxScore += 25;
  const ogScore = [meta.ogTags.title, meta.ogTags.description, meta.ogTags.image].filter(Boolean).length;
  score += (ogScore / 3) * 25;

  // Canonical (15 points)
  maxScore += 15;
  if (meta.canonical) score += 15;

  // Robots (10 points)
  maxScore += 10;
  if (meta.robots !== 'noindex') score += 10;

  return clampScore((score / maxScore) * 100);
}

function calculateHeadingsScore(headings: HeadingsAnalysis): number {
  let score = 100;

  if (headings.h1.count === 0) score -= 30;
  else if (headings.h1.count > 1) score -= 15;

  if (headings.h2.count === 0) score -= 10;

  score -= headings.issues.length * 10;

  return clampScore(score);
}

function calculateLinksScore(links: LinksAnalysis): number {
  let score = 100;

  if (links.internal.count === 0) score -= 20;
  if (links.internal.count < 3) score -= 10;
  if (links.broken.count > 0) score -= links.broken.count * 10;

  return clampScore(score);
}

function calculateMobileScore(mobile: MobileAnalysis): number {
  let score = 100;

  if (!mobile.hasViewportMeta) score -= 40;
  if (!mobile.isResponsive) score -= 30;
  score -= mobile.issues.length * 10;

  return clampScore(score);
}

function calculateTechnicalScore(technical: TechnicalSEOAnalysis): number {
  let score = 0;

  if (technical.hasHttps) score += 30;
  if (technical.hasRobotsTxt) score += 20;
  if (technical.hasSitemap) score += 25;
  if (technical.hasHreflang) score += 15;
  else score += 10; // Not having hreflang is okay for single-language sites

  return score;
}

/**
 * Structured data score:
 *  - none                                   → 0
 *  - present but only invalid JSON-LD       → 20
 *  - valid structured data with a type      → 50
 *  - + recognized/relevant Schema.org type  → +25
 *  - + recommended fields complete          → +25
 */
function calculateStructuredDataScore(input: {
  hasAny: boolean;
  hasValidBlock: boolean;
  hasKnownType: boolean;
  blocks: { valid: boolean; missingFields: string[] }[];
}): number {
  if (!input.hasAny) return 0;
  if (!input.hasValidBlock) return 20;

  let score = 50;
  if (input.hasKnownType) score += 25;

  const validBlocks = input.blocks.filter((b) => b.valid);
  const allFieldsComplete =
    validBlocks.length > 0 && validBlocks.every((b) => b.missingFields.length === 0);
  if (allFieldsComplete) score += 25;

  return clampScore(score);
}
