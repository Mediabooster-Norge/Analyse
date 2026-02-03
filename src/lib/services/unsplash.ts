/**
 * Fetch a single featured image from Unsplash by search query.
 * Requires UNSPLASH_ACCESS_KEY in env. Used for article generation.
 * See https://unsplash.com/documentation#search-photos and API guidelines (attribution).
 */

const UNSPLASH_API = 'https://api.unsplash.com';

export interface UnsplashPhotoResult {
  /** URL for preview (e.g. regular 1080px) */
  url: string;
  /** Full-size URL for download */
  downloadUrl: string;
  /** e.g. "Photo by John Doe on Unsplash" */
  attribution: string;
  /** Photographer profile URL for attribution link (with utm_source) */
  profileUrl: string;
  /** Photo page URL */
  photoPageUrl: string;
}

/** Norwegian → English map for common image-description words (Unsplash works best with English). */
const NO_TO_EN: Record<string, string> = {
  kontor: 'office',
  mennesker: 'people',
  gruppe: 'team',
  person: 'person',
  personer: 'people',
  arbeid: 'work',
  møte: 'meeting',
  diskutere: 'discussing',
  diskuterer: 'discussing',
  moderne: 'modern',
  laptop: 'laptop',
  datamaskin: 'computer',
  skjerm: 'screen',
  presentasjon: 'presentation',
  bedrift: 'business',
  teknologi: 'technology',
  samarbeid: 'collaboration',
  skrivebord: 'desk',
  rom: 'room',
  bygning: 'building',
};

/**
 * Convert AI suggestion to a short search query. Prefer English for Unsplash.
 * If the API sends featuredImageSearchQuery (English), it's used as-is; otherwise we derive from suggestion.
 */
function toSearchQuery(suggestion: string): string {
  const trimmed = suggestion.trim();
  if (!trimmed) return 'business';
  const words = trimmed.split(/\s+/).filter(Boolean);
  const lower = trimmed.toLowerCase();

  // Short, likely English query (e.g. "AI team meeting office") – use as-is, max 4 words
  if (words.length <= 4 && !lower.includes('bilde') && !lower.includes('som viser')) {
    return words.slice(0, 4).join(' ');
  }

  // Long or Norwegian sentence: extract meaningful words and map to English
  const seen = new Set<string>();
  const result: string[] = [];
  for (const w of words) {
    const clean = w.replace(/[^a-zæøåA-ZÆØÅa-zA-Z]/g, '').toLowerCase();
    if (clean.length < 3) continue;
    const en = NO_TO_EN[clean] ?? (NO_TO_EN[clean.replace(/er$/, '')] ?? null);
    if (en && !seen.has(en)) {
      seen.add(en);
      result.push(en);
    } else if (/^[a-zA-Z]{3,}$/.test(clean) && !seen.has(clean)) {
      // Keep English-looking words (e.g. AI, team)
      seen.add(clean);
      result.push(clean);
    }
    if (result.length >= 5) break;
  }
  if (result.length > 0) return result.join(' ');
  return 'business professional';
}

/**
 * Fetch one photo from Unsplash search. Returns null if no key, no results, or error.
 */
export async function fetchFeaturedImage(suggestion: string): Promise<UnsplashPhotoResult | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Unsplash] UNSPLASH_ACCESS_KEY is not set – skipping featured image');
    }
    return null;
  }

  const query = toSearchQuery(suggestion);
  const queryEnc = encodeURIComponent(query);
  // Use client_id in URL (works when Authorization header is stripped, e.g. some proxies)
  const url = `${UNSPLASH_API}/search/photos?query=${queryEnc}&per_page=1&orientation=landscape&client_id=${accessKey}`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Unsplash] Search failed:', res.status, res.statusText, await res.text().catch(() => ''));
      }
      return null;
    }

    const data = (await res.json()) as {
      results?: Array<{
        urls?: { regular?: string; full?: string; small?: string };
        user?: { name?: string; username?: string; links?: { html?: string } };
        links?: { html?: string };
      }>;
    };

    const photo = data.results?.[0];
    const displayUrl = photo?.urls?.regular ?? photo?.urls?.small;
    const downloadUrl = photo?.urls?.full ?? photo?.urls?.regular ?? photo?.urls?.small;
    if (!displayUrl || !photo?.user) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Unsplash] No results for query:', query, 'results count:', data.results?.length ?? 0);
      }
      return null;
    }

    const name = photo.user.name || photo.user.username || 'Unknown';
    const profileUrl = photo.user.links?.html
      ? `${photo.user.links.html}?utm_source=analyseverktyy&utm_medium=referral`
      : 'https://unsplash.com';
    const photoPageUrl = photo.links?.html
      ? `${photo.links.html}?utm_source=analyseverktyy&utm_medium=referral`
      : profileUrl;

    return {
      url: displayUrl,
      downloadUrl: downloadUrl ?? displayUrl,
      attribution: `Photo by ${name} on Unsplash`,
      profileUrl,
      photoPageUrl,
    };
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Unsplash] Error:', err);
    }
    return null;
  }
}
