import type { CheerioAPI } from 'cheerio';
import type { ContentResults } from '@/types';

export function analyzeContent($: CheerioAPI): ContentResults {
  // Get main content text (exclude navigation, header, footer, scripts, styles)
  const excludeSelectors = 'script, style, nav, header, footer, aside, [role="navigation"], [role="banner"], [role="contentinfo"]';
  const $content = $('body').clone();
  $content.find(excludeSelectors).remove();

  const text = $content.text().replace(/\s+/g, ' ').trim();
  const words = text.split(/\s+/).filter((word) => word.length > 0);

  const wordCount = words.length;
  const characterCount = text.length;

  // Count sentences (basic: split by . ! ?)
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  const sentenceCount = sentences.length;

  // Count paragraphs
  const paragraphCount = $('p').length;

  // Calculate readability (LIX score for Norwegian/Scandinavian text)
  const readability = calculateLIX(text, words, sentences);

  // Extract keywords
  const keywords = extractKeywords(words);

  // Check for CTAs
  const { hasCTA, ctaElements } = analyzeCTAs($);

  // Calculate content score
  const score = calculateContentScore(wordCount, readability.lixScore, hasCTA, keywords);

  return {
    wordCount,
    characterCount,
    paragraphCount,
    sentenceCount,
    readability,
    keywords,
    hasCTA,
    ctaElements,
    score,
  };
}

function calculateLIX(
  text: string,
  words: string[],
  sentences: string[]
): {
  lixScore: number;
  lixLevel: string;
  avgWordsPerSentence: number;
  avgWordLength: number;
} {
  if (words.length === 0 || sentences.length === 0) {
    return {
      lixScore: 0,
      lixLevel: 'Ikke nok tekst',
      avgWordsPerSentence: 0,
      avgWordLength: 0,
    };
  }

  // LIX = (words / sentences) + (long words * 100 / words)
  // Long words = words with more than 6 characters
  const longWords = words.filter((word) => word.length > 6).length;
  const avgWordsPerSentence = words.length / sentences.length;
  const longWordPercentage = (longWords * 100) / words.length;

  const lixScore = Math.round(avgWordsPerSentence + longWordPercentage);

  // Calculate average word length
  const totalCharacters = words.reduce((sum, word) => sum + word.length, 0);
  const avgWordLength = totalCharacters / words.length;

  // Interpret LIX score
  let lixLevel: string;
  if (lixScore < 25) {
    lixLevel = 'Veldig lett (barnebøker)';
  } else if (lixScore < 35) {
    lixLevel = 'Lett (skjønnlitteratur)';
  } else if (lixScore < 45) {
    lixLevel = 'Middels (aviser)';
  } else if (lixScore < 55) {
    lixLevel = 'Vanskelig (faglitteratur)';
  } else {
    lixLevel = 'Veldig vanskelig (akademisk)';
  }

  return {
    lixScore,
    lixLevel,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    avgWordLength: Math.round(avgWordLength * 10) / 10,
  };
}

function extractKeywords(
  words: string[]
): { word: string; count: number; density: number }[] {
  // Norwegian stop words
  const stopWords = new Set([
    'og', 'i', 'er', 'det', 'som', 'en', 'et', 'til', 'på', 'av', 'for', 'med',
    'har', 'de', 'ikke', 'om', 'fra', 'vi', 'var', 'kan', 'den', 'så', 'men',
    'jeg', 'han', 'hun', 'seg', 'eller', 'være', 'bli', 'skal', 'vil', 'ved',
    'også', 'etter', 'alle', 'nå', 'denne', 'dette', 'sin', 'sitt', 'sine',
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
    'and', 'or', 'but', 'if', 'then', 'else', 'when', 'at', 'from', 'by',
    'for', 'with', 'about', 'against', 'between', 'into', 'through',
    'during', 'before', 'after', 'above', 'below', 'to', 'of', 'in', 'on',
  ]);

  // Count word frequencies
  const wordCounts = new Map<string, number>();
  const totalWords = words.length;

  words.forEach((word) => {
    const normalized = word.toLowerCase().replace(/[^a-zæøå]/g, '');
    if (normalized.length > 2 && !stopWords.has(normalized)) {
      wordCounts.set(normalized, (wordCounts.get(normalized) || 0) + 1);
    }
  });

  // Sort by count and take top 15
  const sorted = Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  return sorted.map(([word, count]) => ({
    word,
    count,
    density: Math.round((count / totalWords) * 1000) / 10, // Percentage with 1 decimal
  }));
}

function analyzeCTAs($: CheerioAPI): { hasCTA: boolean; ctaElements: string[] } {
  const ctaSelectors = [
    'a[href*="kontakt"]',
    'a[href*="contact"]',
    'a[href*="bestill"]',
    'a[href*="order"]',
    'a[href*="kjøp"]',
    'a[href*="buy"]',
    'button',
    '[class*="cta"]',
    '[class*="btn"]',
    'a[class*="button"]',
  ];

  const ctaKeywords = [
    'kontakt', 'contact', 'bestill', 'order', 'kjøp', 'buy', 'prøv', 'try',
    'registrer', 'register', 'start', 'få', 'get', 'les mer', 'read more',
    'last ned', 'download', 'gratis', 'free', 'tilbud', 'offer',
  ];

  const ctaElements: string[] = [];

  // Check for CTA-like elements
  ctaSelectors.forEach((selector) => {
    $(selector).each((_, el) => {
      const text = $(el).text().trim().toLowerCase();
      if (text.length > 0 && text.length < 50 && ctaElements.length < 10) {
        ctaElements.push(text);
      }
    });
  });

  // Check for CTA keywords in links
  $('a').each((_, el) => {
    const text = $(el).text().trim().toLowerCase();
    if (ctaKeywords.some((kw) => text.includes(kw)) && ctaElements.length < 10) {
      if (!ctaElements.includes(text)) {
        ctaElements.push(text);
      }
    }
  });

  return {
    hasCTA: ctaElements.length > 0,
    ctaElements: [...new Set(ctaElements)].slice(0, 5),
  };
}

function calculateContentScore(
  wordCount: number,
  lixScore: number,
  hasCTA: boolean,
  keywords: { word: string; count: number; density: number }[]
): number {
  let score = 0;

  // Word count (30 points)
  if (wordCount >= 300) score += 30;
  else if (wordCount >= 200) score += 20;
  else if (wordCount >= 100) score += 10;

  // Readability (25 points) - aim for LIX 35-45 (newspaper level)
  if (lixScore >= 30 && lixScore <= 50) score += 25;
  else if (lixScore >= 25 && lixScore <= 55) score += 15;
  else score += 5;

  // Has CTA (20 points)
  if (hasCTA) score += 20;

  // Keyword diversity (25 points)
  if (keywords.length >= 10) score += 25;
  else if (keywords.length >= 5) score += 15;
  else score += 5;

  return Math.min(100, score);
}

export function getLIXDescription(lixScore: number): string {
  if (lixScore < 25) return 'Teksten er veldig lett å lese, egnet for et bredt publikum.';
  if (lixScore < 35) return 'Teksten har en behagelig leselighet, lignende skjønnlitteratur.';
  if (lixScore < 45) return 'Teksten har middels vanskelighetsgrad, som en avisartikkel.';
  if (lixScore < 55) return 'Teksten er relativt krevende å lese, typisk for faglitteratur.';
  return 'Teksten er svært krevende og kan være vanskelig for mange lesere.';
}
