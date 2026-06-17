import type { AccessibilityIssue, AccessibilityResults } from '@/types';

const MAX_ELEMENTS_IN_SUMMARY = 3;

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
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

/** Value line for MetricCard – shows what was actually found on the page. */
export function formatAccessibilityIssueValue(issue: AccessibilityIssue): string {
  if (issue.affectedElements && issue.affectedElements.length > 0) {
    const labels = issue.affectedElements
      .slice(0, MAX_ELEMENTS_IN_SUMMARY)
      .map(formatAffectedElementLabel);
    const extra =
      issue.affectedElements.length > MAX_ELEMENTS_IN_SUMMARY
        ? ` (+${issue.affectedElements.length - MAX_ELEMENTS_IN_SUMMARY} til)`
        : '';
    return labels.join(' · ') + extra;
  }
  if (issue.displayValue) return issue.displayValue;
  const plain = stripHtml(issue.description);
  return plain.length > 100 ? `${plain.slice(0, 100)}…` : plain;
}

/** Recommendation line – Lighthouse explanation for the first affected element. */
export function formatAccessibilityIssueRecommendation(issue: AccessibilityIssue): string {
  const first = issue.affectedElements?.[0];
  if (first?.explanation) {
    const text = first.explanation.length > 120 ? `${first.explanation.slice(0, 120)}…` : first.explanation;
    return text;
  }
  if (first?.selector) return `Påvirket: ${first.selector}`;
  if (issue.wcagTags && issue.wcagTags.length > 0) return issue.wcagTags.join(', ');
  return 'Se konkrete elementer i funnet';
}

/** One-line summary for the Forbedringer chip list. */
export function formatAccessibilityImprovementDesc(issue: AccessibilityIssue): string {
  if (issue.affectedElements && issue.affectedElements.length > 0) {
    const preview = issue.affectedElements
      .slice(0, 2)
      .map(formatAffectedElementLabel)
      .join(', ');
    const suffix = issue.affectedElements.length > 2 ? '…' : '';
    return `${issue.title}: ${preview}${suffix}`;
  }
  if (issue.displayValue) return `${issue.title} (${issue.displayValue})`;
  return issue.title;
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
