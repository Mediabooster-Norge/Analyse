/**
 * Utility functions for score calculations and formatting.
 *
 * Pastel colour palette (3-4 tiers):
 *   Excellent  ≥90  → green-600  / green-50  bg / green-200  border
 *   Good       ≥70  → green-500  / green-50  bg / green-200  border
 *   Warning    ≥50  → amber-500  / amber-50  bg / amber-200  border
 *   Poor       <50  → red-500    / red-50    bg / red-200    border
 */

/** Primary brand colour */
export const BRAND_GREEN = '#16a34a'; // green-600
/** Darker brand for hover / active states */
export const BRAND_GREEN_HOVER = '#15803d'; // green-700
/** Lighter brand for "excellent" highlight accent */
export const BRAND_GREEN_BEST = '#22c55e'; // green-500

// ---------------------------------------------------------------------------
// Hex literals used for SVG strokes (Tailwind `currentColor` via text class)
// ---------------------------------------------------------------------------
export const SCORE_HEX = {
  excellent: '#16a34a', // green-600
  good:      '#22c55e', // green-500
  warning:   '#f59e0b', // amber-500
  poor:      '#ef4444', // red-500
} as const;

/**
 * Tailwind text-colour class for a score value (used on SVG strokes via
 * `currentColor` and on plain numeric labels).
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 70) return 'text-green-500';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
}

/**
 * Tailwind badge classes (bg + text + border) for a pill/badge element.
 */
export function getScoreBadge(score: number): string {
  if (score >= 90) return 'bg-green-50 text-green-700 border-green-200';
  if (score >= 70) return 'bg-green-50 text-green-600 border-green-200';
  if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-red-50 text-red-600 border-red-200';
}

/**
 * Human-readable label for a score.
 */
export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Veldig bra';
  if (score >= 70) return 'Bra';
  if (score >= 50) return 'Ok';
  return 'Trenger forbedring';
}

/**
 * Structured background/border/text/icon Tailwind classes for card areas.
 * Uses a 3-tier split (≥80 / ≥60 / <60) suited for larger UI surfaces.
 */
export function getScoreBackground(score: number): {
  bg: string;
  border: string;
  text: string;
  icon: string;
} {
  if (score >= 80) {
    return {
      bg:     'bg-green-50',
      border: 'border-green-200',
      text:   'text-green-700',
      icon:   'text-green-600',
    };
  }
  if (score >= 60) {
    return {
      bg:     'bg-amber-50',
      border: 'border-amber-200',
      text:   'text-amber-700',
      icon:   'text-amber-600',
    };
  }
  return {
    bg:     'bg-red-50',
    border: 'border-red-200',
    text:   'text-red-700',
    icon:   'text-red-600',
  };
}

/**
 * Simple status colour token for dot indicators and inline labels.
 */
export function getStatusColor(
  value: boolean | number,
  thresholds?: { good: number; warning: number }
): 'green' | 'yellow' | 'red' {
  if (typeof value === 'boolean') {
    return value ? 'green' : 'red';
  }
  const { good = 80, warning = 60 } = thresholds || {};
  if (value >= good)    return 'green';
  if (value >= warning) return 'yellow';
  return 'red';
}

/**
 * Normalize URL by prepending https:// if no protocol is present.
 */
export function normalizeUrl(inputUrl: string): string {
  const normalized = inputUrl.trim();
  if (normalized && !normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    return 'https://' + normalized;
  }
  return normalized;
}

/**
 * Extract bare hostname from a URL string.
 */
export function extractDomain(url: string): string {
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    return new URL(normalized).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
