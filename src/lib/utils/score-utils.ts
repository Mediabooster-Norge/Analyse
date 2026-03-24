/**
 * Utility functions for score calculations and formatting
 * Brand green: #0f515a. 90+ (best) tydelig grønn #14b8a6, 70+ teal #1a6b75, gul #fdba32 (ok), rød-oransje #fd966f (dårlig)
 */

/** Brand green (teal) */
export const BRAND_GREEN = '#0f515a';
/** Darker teal for hover/primary */
export const BRAND_GREEN_HOVER = '#0c4047';
/** Tydelig grønn for «beste» score (90+) – skiller seg fra nest beste */
export const BRAND_GREEN_BEST = '#14b8a6';

/**
 * Get text color class based on score
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-[#14b8a6]';
  if (score >= 70) return 'text-[#1a6b75]';
  if (score >= 50) return 'text-[#b8860b]';
  return 'text-[#c45c3e]';
}

/**
 * Get badge color classes based on score
 * 90+ tydelig grønn (best), 70+ teal
 */
export function getScoreBadge(score: number): string {
  if (score >= 90) return 'bg-[#14b8a6]/25 text-[#14b8a6] border-[#14b8a6]/55';
  if (score >= 70) return 'bg-[#1a6b75]/25 text-[#1a6b75] border-[#1a6b75]/55';
  if (score >= 50) return 'bg-[#fdba32]/25 text-[#b8860b] border-[#fdba32]/50';
  return 'bg-[#fd966f]/25 text-[#c45c3e] border-[#fd966f]/50';
}

/**
 * Get human-readable label based on score
 */
export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Veldig bra';
  if (score >= 70) return 'Bra';
  if (score >= 50) return 'Ok';
  return 'Trenger forbedring';
}

/**
 * Get background color classes based on score threshold (pastel palette)
 */
export function getScoreBackground(score: number): {
  bg: string;
  border: string;
  text: string;
  icon: string;
} {
  if (score >= 80) {
    return {
      bg: 'bg-[#14b8a6]/20',
      border: 'border-[#14b8a6]/50',
      text: 'text-[#14b8a6]',
      icon: 'text-[#14b8a6]',
    };
  }
  if (score >= 60) {
    return {
      bg: 'bg-[#fdba32]/20',
      border: 'border-[#fdba32]/50',
      text: 'text-[#b8860b]',
      icon: 'text-[#b8860b]',
    };
  }
  return {
    bg: 'bg-[#fd966f]/20',
    border: 'border-[#fd966f]/50',
    text: 'text-[#c45c3e]',
    icon: 'text-[#c45c3e]',
  };
}

/**
 * Get status indicator color based on boolean or score
 */
export function getStatusColor(
  value: boolean | number,
  thresholds?: { good: number; warning: number }
): 'green' | 'yellow' | 'red' {
  if (typeof value === 'boolean') {
    return value ? 'green' : 'red';
  }
  
  const { good = 80, warning = 60 } = thresholds || {};
  if (value >= good) return 'green';
  if (value >= warning) return 'yellow';
  return 'red';
}

/**
 * Normalize URL by adding https:// if missing
 */
export function normalizeUrl(inputUrl: string): string {
  let normalized = inputUrl.trim();
  if (normalized && !normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }
  return normalized;
}

/**
 * Extract domain name from URL
 */
export function extractDomain(url: string): string {
  try {
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    return new URL(normalizedUrl).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
