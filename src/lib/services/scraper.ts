import * as cheerio from 'cheerio';
import * as https from 'node:https';
import * as http from 'node:http';
import type { ScrapedData } from '@/types';

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2_000;

/**
 * Fetch a URL using Node.js native http/https modules.
 * Bypasses Next.js fetch patching which can cause connection issues in dev.
 */
function nativeFetch(
  url: string,
  options: { timeoutMs: number; userAgent: string }
): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const transport = parsedUrl.protocol === 'https:' ? https : http;

    const req = transport.get(
      url,
      {
        headers: {
          'User-Agent': options.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'no,en;q=0.9',
        },
        timeout: options.timeoutMs,
      },
      (res) => {
        // Follow redirects (301, 302, 307, 308)
        if (res.statusCode && [301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
          const redirectUrl = new URL(res.headers.location, url).toString();
          nativeFetch(redirectUrl, options).then(resolve).catch(reject);
          res.resume(); // Drain the response
          return;
        }

        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf-8');
          const headers: Record<string, string> = {};
          for (const [key, value] of Object.entries(res.headers)) {
            if (value) headers[key] = Array.isArray(value) ? value.join(', ') : value;
          }
          resolve({
            statusCode: res.statusCode ?? 0,
            headers,
            body,
          });
        });
        res.on('error', reject);
      }
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`CONNECT_TIMEOUT: Tilkoblingen til ${parsedUrl.hostname} tok for lang tid (>${options.timeoutMs / 1000}s)`));
    });
    req.on('error', reject);
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function scrapeUrl(url: string, options?: { timeoutMs?: number }): Promise<ScrapedData> {
  const startTime = Date.now();
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  // Ensure URL has protocol
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

  const userAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (compatible; SEOAnalyzer/1.0; +https://mediabooster.no)',
  ];

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      console.log(`[scraper] Retry ${attempt + 1}/${MAX_RETRIES} for ${normalizedUrl}...`);
      await delay(RETRY_DELAY_MS);
    }

    const userAgent = userAgents[attempt % userAgents.length];

    try {
      console.log(`[scraper] Fetching ${normalizedUrl} (attempt ${attempt + 1}, timeout ${timeoutMs}ms)...`);
      const result = await nativeFetch(normalizedUrl, { timeoutMs, userAgent });
      const loadTime = Date.now() - startTime;

      console.log(`[scraper] Success: ${normalizedUrl} → ${result.statusCode} in ${loadTime}ms`);

      return {
        url: normalizedUrl,
        html: result.body,
        statusCode: result.statusCode,
        headers: result.headers,
        loadTime,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const code = (error as NodeJS.ErrnoException)?.code;
      console.warn(`[scraper] Attempt ${attempt + 1} failed: ${code || lastError.message}`);
    }
  }

  // All retries exhausted – provide a clear error message
  const code = (lastError as NodeJS.ErrnoException)?.code;
  let userMessage: string;

  if (lastError?.message.startsWith('CONNECT_TIMEOUT') || code === 'ETIMEDOUT' || code === 'UND_ERR_CONNECT_TIMEOUT') {
    userMessage = `Kunne ikke koble til ${normalizedUrl} – serveren svarer ikke (timeout etter ${timeoutMs / 1000}s). Sjekk at URLen er riktig og at nettsiden er tilgjengelig.`;
  } else if (code === 'ENOTFOUND') {
    userMessage = `Domenet ${new URL(normalizedUrl).hostname} finnes ikke. Sjekk at URLen er stavet riktig.`;
  } else if (code === 'ECONNREFUSED') {
    userMessage = `Tilkoblingen ble avvist av ${new URL(normalizedUrl).hostname}. Serveren kjører ikke eller nekter tilkoblinger.`;
  } else if (code === 'ECONNRESET') {
    userMessage = `Tilkoblingen til ${new URL(normalizedUrl).hostname} ble avbrutt. Prøv igjen.`;
  } else if (code === 'CERT_HAS_EXPIRED' || code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
    userMessage = `SSL-sertifikatet for ${new URL(normalizedUrl).hostname} er ugyldig eller utløpt.`;
  } else {
    userMessage = `Klarte ikke å hente ${normalizedUrl}: ${lastError?.message || 'Ukjent feil'}`;
  }

  throw new Error(userMessage);
}

export async function checkUrlExists(url: string): Promise<boolean> {
  try {
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    const result = await nativeFetch(normalizedUrl, {
      timeoutMs: 10_000,
      userAgent: 'Mozilla/5.0 (compatible; SEOAnalyzer/1.0)',
    });
    return result.statusCode >= 200 && result.statusCode < 400;
  } catch {
    return false;
  }
}

export async function fetchRobotsTxt(baseUrl: string): Promise<string | null> {
  try {
    const url = new URL('/robots.txt', baseUrl).toString();
    const result = await nativeFetch(url, {
      timeoutMs: 10_000,
      userAgent: 'Mozilla/5.0 (compatible; SEOAnalyzer/1.0)',
    });
    if (result.statusCode >= 200 && result.statusCode < 400) {
      return result.body;
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
      const url = new URL(path, baseUrl).toString();
      const result = await nativeFetch(url, {
        timeoutMs: 10_000,
        userAgent: 'Mozilla/5.0 (compatible; SEOAnalyzer/1.0)',
      });
      if (result.statusCode >= 200 && result.statusCode < 400) {
        return { exists: true, url };
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
