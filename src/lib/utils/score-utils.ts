/**
 * Utility functions for score calculations and formatting
 */

/**
 * Get text color class based on score
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-neutral-900';
  if (score >= 70) return 'text-neutral-800';
  if (score >= 50) return 'text-neutral-700';
  return 'text-neutral-500';
}

/**
 * Get badge color classes based on score
 */
export function getScoreBadge(score: number): string {
  if (score >= 90) return 'bg-green-50 text-green-700 border-green-200';
  if (score >= 70) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-red-50 text-red-700 border-red-200';
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
 * Get background color classes based on score threshold
 */
export function getScoreBackground(score: number): {
  bg: string;
  border: string;
  text: string;
  icon: string;
} {
  if (score >= 80) {
    return {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      icon: 'text-green-600',
    };
  }
  if (score >= 60) {
    return {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-900',
      icon: 'text-amber-600',
    };
  }
  return {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-900',
    icon: 'text-red-600',
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
