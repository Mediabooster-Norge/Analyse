/**
 * Fetch a single featured image from Unsplash by search query.
 * Requires UNSPLASH_ACCESS_KEY in env. Used for article generation.
 * See https://unsplash.com/documentation#search-photos and API guidelines (attribution).
 */

const UNSPLASH_API = 'https://api.unsplash.com';

export interface UnsplashPhotoResult {
  url: string;
  /** e.g. "Photo by John Doe on Unsplash" */
  attribution: string;
  /** Photographer profile URL for attribution link (with utm_source) */
  profileUrl: string;
  /** Photo page URL */
  photoPageUrl: string;
}

/**
 * Convert AI suggestion to a short search query. Prefer English-like terms for Unsplash.
 */
function toSearchQuery(suggestion: string): string {
  const trimmed = suggestion.trim();
  if (!trimmed) return 'business';
  const words = trimmed.split(/\s+/).filter(Boolean);
  // If it looks like a Norwegian sentence ("Bilde som viser..."), use a generic English fallback
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('bilde som') || lower.startsWith('søk') || words.length > 5) {
    const fallbacks = ['business', 'professional', 'office', 'team', 'work'];
    const lastWord = words[words.length - 1];
    if (lastWord && lastWord.length > 3 && /^[a-z]+$/i.test(lastWord)) return lastWord;
    return fallbacks[0];
  }
  if (words.length <= 4) return words.join(' ');
  return words.slice(0, 3).join(' ');
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
        urls?: { regular?: string; small?: string };
        user?: { name?: string; username?: string; links?: { html?: string } };
        links?: { html?: string };
      }>;
    };

    const photo = data.results?.[0];
    if (!photo?.urls?.regular || !photo.user) {
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
      url: photo.urls.regular,
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
