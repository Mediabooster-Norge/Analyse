import type { AccessibilityIssue, AccessibilityResults } from '@/types';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function truncateText(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/** Short label for an affected element (from Lighthouse). */
export function formatAffectedElementLabel(
  el: NonNullable<AccessibilityIssue['affectedElements']>[number]
): string {
  if (el.label) return el.label;
  if (el.snippet) {
    const compact = el.snippet.replace(/\s+/g, ' ').trim();
    return compact.length > 70 ? `${compact.slice(0, 70)}…` : compact;
  }
  if (el.selector) return el.selector;
  return 'Ukjent element';
}

function formatElementCardPreview(
  el: NonNullable<AccessibilityIssue['affectedElements']>[number]
): string {
  if (el.label) return truncateText(el.label, 48);
  if (el.snippet) {
    const compact = el.snippet.replace(/\s+/g, ' ').trim();
    const tagMatch = compact.match(/^<([a-zA-Z0-9-]+)/);
    if (tagMatch) return `<${tagMatch[1]}>`;
    return truncateText(compact, 48);
  }
  if (el.selector) {
    const last = el.selector.split('>').pop()?.trim() ?? el.selector;
    return truncateText(last, 48);
  }
  return 'Ukjent element';
}

/** Short badge label for MetricCard footer (not the full Lighthouse explanation). */
export function formatAccessibilityIssueRecommendation(issue: AccessibilityIssue): string {
  const impactLabels: Record<AccessibilityIssue['impact'], string> = {
    critical: 'Kritisk',
    serious: 'Bør fikses',
    moderate: 'Vurder fiks',
    minor: 'Mindre viktig',
  };
  return impactLabels[issue.impact];
}

/** Short scope line under the title in MetricCard. */
export function formatAccessibilityIssueCardDescription(issue: AccessibilityIssue): string {
  const count = issue.affectedElements?.length ?? 0;
  if (count > 0) {
    return count === 1 ? '1 element' : `${count} elementer`;
  }
  if (issue.displayValue && issue.displayValue.length <= 36) {
    return issue.displayValue;
  }
  return 'Påvirker siden';
}

/** Value line for MetricCard – short summary, not full selectors or audit text. */
export function formatAccessibilityIssueValue(issue: AccessibilityIssue): string {
  if (issue.affectedElements && issue.affectedElements.length > 0) {
    const first = formatElementCardPreview(issue.affectedElements[0]);
    const extra = issue.affectedElements.length > 1 ? ` (+${issue.affectedElements.length - 1})` : '';
    return first + extra;
  }
  const plain = stripHtml(issue.description);
  return truncateText(plain, 60);
}

/** One-line summary for the Forbedringer chip list – title only, no element details. */
export function formatAccessibilityImprovementDesc(issue: AccessibilityIssue): string {
  const colonIndex = issue.title.indexOf(':');
  return colonIndex >= 0 ? issue.title.slice(0, colonIndex).trim() : issue.title;
}

/** Full audit context for AI – must only reference listed elements. */
export function buildAccessibilityIssueContext(issue: AccessibilityIssue, url?: string): string {
  const lines = [
    'Lighthouse-audit (kun faktiske funn fra siden – ikke finn på elementer som ikke er listet):',
    `Sjekk: ${issue.title}`,
    `Beskrivelse: ${stripHtml(issue.description)}`,
  ];
  if (issue.displayValue) lines.push(`Omfang: ${issue.displayValue}`);
  if (issue.wcagTags?.length) lines.push(`WCAG: ${issue.wcagTags.join(', ')}`);
  if (url) lines.push(`URL: ${url}`);

  if (issue.affectedElements && issue.affectedElements.length > 0) {
    lines.push('Påvirkede elementer (fiks disse – ikke andre):');
    issue.affectedElements.forEach((el, index) => {
      const parts = [
        el.selector ? `selector: ${el.selector}` : null,
        el.label ? `label: ${el.label}` : null,
        el.snippet ? `HTML: ${el.snippet}` : null,
        el.explanation ? `forklaring: ${el.explanation}` : null,
      ].filter(Boolean);
      lines.push(`  ${index + 1}. ${parts.join(' | ')}`);
    });
  } else {
    lines.push('Ingen enkelt-elementer i rapporten – gi generell fiks basert på sjekkens beskrivelse.');
  }

  return lines.join('\n');
}

/** One-line status under the WCAG score in Nettside-fanen. */
export function formatAccessibilitySummaryStatus(
  score: number,
  data: AccessibilityResults | null
): { text: string; tone: 'success' | 'warning' | 'neutral' } {
  if (!data) {
    return {
      text: 'Oversiktsscore fra PageSpeed. Kjør hastighetsmåling på nytt for detaljerte WCAG-funn per element.',
      tone: 'neutral',
    };
  }
  if (data.issues.length > 0) {
    return { text: '', tone: 'neutral' };
  }
  if (score >= 100) {
    return { text: 'Ingen feilede WCAG-sjekker funnet.', tone: 'success' };
  }
  return {
    text: `Lighthouse gir ${score}/100 uten konkrete elementfeil i rapporten. Score under 100 kan skyldes vektet scoring – ikke nødvendigvis manglende sjekker i listen.`,
    tone: 'warning',
  };
}

export function buildAccessibilityScoreContext(
  data: AccessibilityResults,
  url?: string
): string {
  const lines = [
    'Lighthouse-audit (kun faktiske funn fra siden – ikke finn på elementer som ikke er listet):',
    `Samlet tilgjengelighetsscore: ${data.score}/100`,
    `Bestått: ${data.passedCount}, feilet: ${data.failedCount}`,
  ];
  if (url) lines.push(`URL: ${url}`);
  if (data.issues.length > 0) {
    lines.push('Feilede sjekker:');
    for (const issue of data.issues.slice(0, 8)) {
      lines.push(`- ${formatAccessibilityImprovementDesc(issue)}`);
    }
  }
  return lines.join('\n');
}
