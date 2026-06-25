import type { DashboardAnalysisResult } from '@/types/dashboard';
import type { AccessibilityResults } from '@/types';
import {
  formatAccessibilityImprovementDesc,
} from '@/lib/utils/accessibility-display';
import type { AccessibilityImpact } from '@/types';

export type OverviewIssuePriority = 'high' | 'medium' | 'low';

export interface OverviewIssue {
  label: string;
  desc: string;
  priority: OverviewIssuePriority;
  category: string;
}

interface BuildOverviewIssuesOptions {
  isPremium?: boolean;
  accessibilityScore?: number | null;
  /** Guest preview: include WCAG findings without premium */
  includeAccessibilityIssues?: boolean;
  accessibilityData?: AccessibilityResults | null;
}

function accessibilityImpactToPriority(impact: AccessibilityImpact): OverviewIssuePriority {
  if (impact === 'critical' || impact === 'serious') return 'high';
  if (impact === 'moderate') return 'medium';
  return 'low';
}

/** Builds the improvement issue list shown on the overview tab. */
export function buildOverviewIssues(
  result: DashboardAnalysisResult,
  options: BuildOverviewIssuesOptions = {}
): OverviewIssue[] {
  const { isPremium = false, includeAccessibilityIssues = false } = options;
  const accessibilityData = options.accessibilityData ?? result.accessibility ?? null;
  const accessibilityScore =
    options.accessibilityScore ??
    accessibilityData?.score ??
    (result.pageSpeedResults?.accessibility && result.pageSpeedResults.accessibility > 0
      ? result.pageSpeedResults.accessibility
      : null);
  const showAccessibilityIssues = isPremium || includeAccessibilityIssues;
  const issues: OverviewIssue[] = [];

  if (result.seoResults.headings.h1.count !== 1) {
    issues.push({
      label: 'H1-overskrift',
      desc:
        result.seoResults.headings.h1.count === 0
          ? 'Mangler hovedoverskrift'
          : 'Flere hovedoverskrifter',
      priority: 'high',
      category: 'seo',
    });
  }
  if (!result.seoResults.meta.title.content) {
    issues.push({ label: 'Sidetittel', desc: 'Mangler tittel', priority: 'high', category: 'seo' });
  }
  if (result.seoResults.meta.title.content && !result.seoResults.meta.title.isOptimal) {
    issues.push({
      label: 'Sidetittel',
      desc: 'Ikke optimal lengde',
      priority: 'medium',
      category: 'seo',
    });
  }
  if (!result.seoResults.meta.description.content) {
    issues.push({
      label: 'Meta-beskrivelse',
      desc: 'Mangler beskrivelse',
      priority: 'high',
      category: 'seo',
    });
  }
  if (result.seoResults.meta.description.content && !result.seoResults.meta.description.isOptimal) {
    issues.push({
      label: 'Meta-beskrivelse',
      desc: 'Ikke optimal lengde',
      priority: 'medium',
      category: 'seo',
    });
  }
  if (!result.seoResults.meta.ogTags.title) {
    issues.push({ label: 'Open Graph', desc: 'Mangler OG-tittel', priority: 'low', category: 'seo' });
  }
  if (!result.seoResults.meta.ogTags.description) {
    issues.push({
      label: 'Open Graph',
      desc: 'Mangler OG-beskrivelse',
      priority: 'low',
      category: 'seo',
    });
  }
  if (!result.seoResults.meta.canonical) {
    issues.push({
      label: 'Canonical URL',
      desc: 'Mangler canonical tag',
      priority: 'medium',
      category: 'seo',
    });
  }
  if (result.seoResults.structuredData && !result.seoResults.structuredData.hasAny) {
    issues.push({
      label: 'Strukturert data',
      desc: 'Mangler Schema.org-markup',
      priority: 'medium',
      category: 'seo',
    });
  } else if (
    result.seoResults.structuredData &&
    result.seoResults.structuredData.invalidJsonLdCount > 0 &&
    result.seoResults.structuredData.types.length === 0
  ) {
    issues.push({
      label: 'Strukturert data',
      desc: 'Ugyldig JSON-LD',
      priority: 'medium',
      category: 'seo',
    });
  }
  if (result.contentResults.wordCount < 300) {
    issues.push({ label: 'Innhold', desc: 'For lite tekst', priority: 'medium', category: 'content' });
  }
  if (result.contentResults.readability && result.contentResults.readability.lixScore > 44) {
    const lixScore = result.contentResults.readability.lixScore;
    if (lixScore > 55) {
      issues.push({
        label: 'Lesbarhet',
        desc: 'Meget vanskelig tekst',
        priority: 'high',
        category: 'content',
      });
    } else {
      issues.push({
        label: 'Lesbarhet',
        desc: 'Vanskelig tekst (faglitteratur)',
        priority: 'medium',
        category: 'content',
      });
    }
  }
  if (result.seoResults.headings.h2.count === 0) {
    issues.push({
      label: 'H2-overskrifter',
      desc: 'Mangler underoverskrifter',
      priority: 'low',
      category: 'content',
    });
  }
  if (result.seoResults.images.withoutAlt > 0) {
    issues.push({
      label: 'Bilder',
      desc: `${result.seoResults.images.withoutAlt} mangler alt-tekst`,
      priority: 'low',
      category: 'seo',
    });
  }
  if (result.securityResults.score < 60) {
    issues.push({
      label: 'Sikkerhet',
      desc: 'Lav sikkerhetsscore',
      priority: 'medium',
      category: 'security',
    });
  }
  if (!result.securityResults.headers.strictTransportSecurity) {
    issues.push({ label: 'HSTS', desc: 'Mangler HSTS-header', priority: 'medium', category: 'security' });
  }
  if (!result.securityResults.headers.contentSecurityPolicy) {
    issues.push({
      label: 'CSP',
      desc: 'Mangler Content Security Policy',
      priority: 'low',
      category: 'security',
    });
  }
  if (result.pageSpeedResults) {
    if (result.pageSpeedResults.performance < 50) {
      issues.push({
        label: 'Ytelse',
        desc: `Kritisk lav score (${result.pageSpeedResults.performance}/100)`,
        priority: 'high',
        category: 'performance',
      });
    } else if (result.pageSpeedResults.performance < 90) {
      issues.push({
        label: 'Ytelse',
        desc: `Kan forbedres (${result.pageSpeedResults.performance}/100)`,
        priority: 'medium',
        category: 'performance',
      });
    }
    if (!result.pageSpeedResults.isEstimate) {
      if (result.pageSpeedResults.coreWebVitals.lcp > 4000) {
        issues.push({
          label: 'LCP',
          desc: 'Treg innlasting av hovedinnhold',
          priority: 'high',
          category: 'performance',
        });
      } else if (result.pageSpeedResults.coreWebVitals.lcp > 2500) {
        issues.push({
          label: 'LCP',
          desc: 'Moderat innlastingstid',
          priority: 'medium',
          category: 'performance',
        });
      }
      if (result.pageSpeedResults.coreWebVitals.cls > 0.25) {
        issues.push({ label: 'CLS', desc: 'Ustabilt layout', priority: 'high', category: 'performance' });
      } else if (result.pageSpeedResults.coreWebVitals.cls > 0.1) {
        issues.push({
          label: 'CLS',
          desc: 'Noe layoutforskyvning',
          priority: 'medium',
          category: 'performance',
        });
      }
    }
  }
  if (showAccessibilityIssues && accessibilityData?.issues.length) {
    for (const issue of accessibilityData.issues.slice(0, 5)) {
      issues.push({
        label: 'Tilgjengelighet',
        desc: formatAccessibilityImprovementDesc(issue),
        priority: accessibilityImpactToPriority(issue.impact),
        category: 'accessibility',
      });
    }
  } else if (showAccessibilityIssues && accessibilityScore != null && accessibilityScore < 100) {
    issues.push({
      label: 'Tilgjengelighet',
      desc:
        accessibilityScore < 90
          ? `Score ${accessibilityScore}/100 – kan forbedres`
          : `God score (${accessibilityScore}/100) – kan forbedres mot 100`,
      priority: accessibilityScore < 50 ? 'high' : accessibilityScore < 90 ? 'medium' : 'low',
      category: 'accessibility',
    });
  }

  return issues;
}
