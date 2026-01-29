import * as cheerio from 'cheerio';
import type { ScrapedData } from '@/types';

export async function scrapeUrl(url: string): Promise<ScrapedData> {
  const startTime = Date.now();

  // Ensure URL has protocol
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

  try {
    const response = await fetch(normalizedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEOAnalyzer/1.0; +https://mediabooster.no)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'no,en;q=0.9',
      },
      redirect: 'follow',
    });

    const html = await response.text();
    const loadTime = Date.now() - startTime;

    // Convert headers to object
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      url: normalizedUrl,
      html,
      statusCode: response.status,
      headers,
      loadTime,
    };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    throw new Error(`Failed to fetch URL: ${url}`);
  }
}

export async function checkUrlExists(url: string): Promise<boolean> {
  try {
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    const response = await fetch(normalizedUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEOAnalyzer/1.0)',
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function fetchRobotsTxt(baseUrl: string): Promise<string | null> {
  try {
    const url = new URL('/robots.txt', baseUrl);
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEOAnalyzer/1.0)',
      },
    });
    if (response.ok) {
      return await response.text();
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchSitemap(baseUrl: string): Promise<{ exists: boolean; url: string | null }> {
  const possibleUrls = [
    '/sitemap.xml',
    '/sitemap_index.xml',
    '/sitemap/',
  ];

  for (const path of possibleUrls) {
    try {
      const url = new URL(path, baseUrl);
      const response = await fetch(url.toString(), {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEOAnalyzer/1.0)',
        },
      });
      if (response.ok) {
        return { exists: true, url: url.toString() };
      }
    } catch {
      continue;
    }
  }

  // Check robots.txt for sitemap directive
  const robotsTxt = await fetchRobotsTxt(baseUrl);
  if (robotsTxt) {
    const sitemapMatch = robotsTxt.match(/Sitemap:\s*(.+)/i);
    if (sitemapMatch) {
      return { exists: true, url: sitemapMatch[1].trim() };
    }
  }

  return { exists: false, url: null };
}

export function parseHtml(html: string) {
  return cheerio.load(html);
}
