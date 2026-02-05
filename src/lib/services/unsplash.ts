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
  // Places & objects
  kontor: 'office',
  rom: 'room',
  bygning: 'building',
  skrivebord: 'desk',
  laptop: 'laptop',
  datamaskin: 'computer',
  skjerm: 'screen',
  
  // People
  mennesker: 'people',
  gruppe: 'team',
  person: 'person',
  personer: 'people',
  profesjonelle: 'professional',
  profesjonell: 'professional',
  utvikler: 'developer',
  utviklere: 'developers',
  designer: 'designer',
  designere: 'designers',
  
  // Actions
  arbeid: 'work',
  møte: 'meeting',
  diskutere: 'discussing',
  diskuterer: 'discussing',
  samarbeid: 'collaboration',
  presentasjon: 'presentation',
  
  // Tech & business
  bedrift: 'business',
  teknologi: 'technology',
  design: 'design',
  webdesign: 'web design',
  nettside: 'website',
  nettsider: 'websites',
  markedsføring: 'marketing',
  digital: 'digital',
  strategi: 'strategy',
  analyse: 'analysis',
  kode: 'code',
  programmering: 'programming',
  
  // Adjectives
  moderne: 'modern',
  
  // Compound word parts (Norwegian suffixes)
  trender: 'trends',
  løsninger: 'solutions',
  verktøy: 'tools',
  systemer: 'systems',
  
  // Filter words (map to empty to remove)
  bilde: '',
  av: '',
  som: '',
  viser: '',
  med: '',
  for: '',
  til: '',
  den: '',
  det: '',
  de: '',
  en: '',
  et: '',
  på: '',
  og: '',
  eller: '',
};

/** Try to extract English keywords from Norwegian compound words */
function extractFromCompound(word: string): string | null {
  const lower = word.toLowerCase();
  
  // Common Norwegian compound patterns
  const patterns: [RegExp, string][] = [
    [/webdesign/i, 'web design'],
    [/nettside/i, 'website'],
    [/markedsføring/i, 'marketing'],
    [/forretning/i, 'business'],
    [/teknologi/i, 'technology'],
    [/løsning/i, 'solution'],
    [/system/i, 'system'],
    [/utvikling/i, 'development'],
    [/programmering/i, 'programming'],
    [/design/i, 'design'],
    [/trend/i, 'trends'],
    [/analyse/i, 'analysis'],
    [/strategi/i, 'strategy'],
    [/kontor/i, 'office'],
    [/møte/i, 'meeting'],
  ];
  
  for (const [pattern, english] of patterns) {
    if (pattern.test(lower)) {
      return english;
    }
  }
  
  return null;
}

/**
 * Convert AI suggestion to a short search query. Prefer English for Unsplash.
 * If the API sends featuredImageSearchQuery (English), it's used as-is; otherwise we derive from suggestion.
 */
function toSearchQuery(suggestion: string): string {
  const trimmed = suggestion.trim();
  if (!trimmed) return 'business office';
  const words = trimmed.split(/\s+/).filter(Boolean);
  const lower = trimmed.toLowerCase();

  // Short, likely English query (e.g. "AI team meeting office") – use as-is, max 4 words
  // But only if it doesn't contain Norwegian indicators
  if (words.length <= 4 && !lower.includes('bilde') && !lower.includes('som') && !lower.includes('av ')) {
    return words.slice(0, 4).join(' ');
  }

  // Long or Norwegian sentence: extract meaningful words and map to English
  const seen = new Set<string>();
  const result: string[] = [];
  
  for (const w of words) {
    const clean = w.replace(/[^a-zæøåA-ZÆØÅa-zA-Z]/g, '').toLowerCase();
    if (clean.length < 3) continue;
    
    // First, check direct dictionary match
    let en: string | null | undefined = NO_TO_EN[clean];
    
    // Try removing common Norwegian suffixes
    if (!en && en !== '') {
      const withoutEr = clean.replace(/er$/, '');
      const withoutEne = clean.replace(/ene$/, '');
      en = NO_TO_EN[withoutEr] ?? NO_TO_EN[withoutEne];
    }
    
    // Try extracting from compound words (e.g. "webdesigntrender" → "web design")
    if (!en && en !== '') {
      en = extractFromCompound(clean);
    }
    
    // Add translated word if found and not empty
    if (en && en.length > 0 && !seen.has(en)) {
      seen.add(en);
      result.push(en);
    }
    // Only keep pure English words (no Norwegian letters, common English words)
    else if (!en && /^[a-zA-Z]{3,}$/.test(clean) && isLikelyEnglish(clean) && !seen.has(clean)) {
      seen.add(clean);
      result.push(clean);
    }
    
    if (result.length >= 5) break;
  }
  
  if (result.length > 0) return result.join(' ');
  return 'business office professional';
}

/** Check if a word is likely English (not a Norwegian word that slipped through) */
function isLikelyEnglish(word: string): boolean {
  const lower = word.toLowerCase();
  
  // Common English words we want to keep
  const englishWords = new Set([
    'team', 'office', 'work', 'business', 'meeting', 'professional',
    'modern', 'digital', 'tech', 'technology', 'computer', 'laptop',
    'desk', 'workspace', 'creative', 'design', 'marketing', 'seo',
    'web', 'website', 'online', 'social', 'media', 'content',
  ]);
  
  if (englishWords.has(lower)) return true;
  
  // Reject words with Norwegian-looking patterns
  if (lower.endsWith('trender') || lower.endsWith('løsninger') || 
      lower.endsWith('systemer') || lower.endsWith('verktøy')) {
    return false;
  }
  
  // Short words (3-4 chars) that aren't in our whitelist are risky
  if (lower.length <= 4 && !englishWords.has(lower)) {
    return false;
  }
  
  return true;
}

/** Get fallback queries based on the original search context */
function getFallbackQueries(originalQuery: string): string[] {
  const lower = originalQuery.toLowerCase();
  
  // Context-aware fallbacks
  if (lower.includes('design') || lower.includes('web')) {
    return ['web design team', 'designers working', 'creative office', 'design studio'];
  }
  if (lower.includes('meeting') || lower.includes('team') || lower.includes('discussing')) {
    return ['business meeting', 'team collaboration', 'office meeting', 'professional discussion'];
  }
  if (lower.includes('tech') || lower.includes('code') || lower.includes('develop')) {
    return ['technology team', 'developers working', 'coding office', 'tech startup'];
  }
  if (lower.includes('marketing') || lower.includes('seo')) {
    return ['marketing team', 'digital marketing', 'business strategy', 'marketing office'];
  }
  
  // Generic fallbacks
  return ['business office', 'professional team', 'modern workspace', 'office meeting'];
}

/**
 * Fetch one photo from Unsplash search. Returns null if no key, no results, or error.
 * @param suggestion - The search query or suggestion text
 * @param randomize - If true, fetches a random result from multiple pages (default: false)
 */
export async function fetchFeaturedImage(suggestion: string, randomize = false): Promise<UnsplashPhotoResult | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Unsplash] UNSPLASH_ACCESS_KEY is not set – skipping featured image');
    }
    return null;
  }

  const query = toSearchQuery(suggestion);
  
  // Try main query first, then context-aware fallbacks if no results
  const queriesToTry = [query, ...getFallbackQueries(query)];
  
  for (const searchQuery of queriesToTry) {
    const queryEnc = encodeURIComponent(searchQuery);
    
    // When randomizing, fetch multiple results and pick one randomly
    const perPage = randomize ? 10 : 1;
    const page = randomize ? Math.floor(Math.random() * 5) + 1 : 1; // Random page 1-5
    
    // Use client_id in URL (works when Authorization header is stripped, e.g. some proxies)
    const url = `${UNSPLASH_API}/search/photos?query=${queryEnc}&per_page=${perPage}&page=${page}&orientation=landscape&client_id=${accessKey}`;

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
        continue; // Try next query
      }

      const data = (await res.json()) as {
        results?: Array<{
          urls?: { regular?: string; full?: string; small?: string };
          user?: { name?: string; username?: string; links?: { html?: string } };
          links?: { html?: string };
        }>;
      };

      // Pick a random photo from results when randomizing, otherwise take the first
      const results = data.results ?? [];
      
      if (results.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Unsplash] No results for query:', searchQuery, '- trying fallback');
        }
        continue; // Try next query
      }
      
      const photoIndex = randomize && results.length > 1 
        ? Math.floor(Math.random() * results.length) 
        : 0;
      const photo = results[photoIndex];
      const displayUrl = photo?.urls?.regular ?? photo?.urls?.small;
      const downloadUrl = photo?.urls?.full ?? photo?.urls?.regular ?? photo?.urls?.small;
      
      if (!displayUrl || !photo?.user) {
        continue; // Try next query
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
        console.warn('[Unsplash] Error for query:', searchQuery, err);
      }
      continue; // Try next query
    }
  }
  
  // All queries failed
  return null;
}
