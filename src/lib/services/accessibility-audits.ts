import type { AccessibilityImpact, AccessibilityIssue, AccessibilityResults } from '@/types';

/** Lighthouse audit shape (subset used for accessibility parsing). */
interface LighthouseAudit {
  id?: string;
  title?: string;
  description?: string;
  score?: number | null;
  scoreDisplayMode?: string;
  displayValue?: string;
  details?: {
    type?: string;
    items?: unknown[];
  };
}

interface LighthouseAuditNode {
  selector?: string;
  snippet?: string;
  nodeLabel?: string;
  explanation?: string;
}

const MAX_AFFECTED_PER_ISSUE = 8;

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function extractAffectedElements(audit: LighthouseAudit): AccessibilityIssue['affectedElements'] {
  const rawItems = audit.details?.items;
  if (!Array.isArray(rawItems)) return [];

  const elements: NonNullable<AccessibilityIssue['affectedElements']> = [];

  for (const raw of rawItems) {
    if (elements.length >= MAX_AFFECTED_PER_ISSUE) break;
    if (!raw || typeof raw !== 'object') continue;

    const item = raw as Record<string, unknown>;
    const node = item.node as LighthouseAuditNode | undefined;
    const element: NonNullable<AccessibilityIssue['affectedElements']>[number] = {};

    if (node) {
      if (node.selector) element.selector = node.selector;
      if (node.snippet) element.snippet = node.snippet.replace(/\s+/g, ' ').trim();
      if (node.nodeLabel) element.label = node.nodeLabel;
      if (node.explanation) element.explanation = stripHtml(node.explanation);
    }

    if (typeof item.nodeLabel === 'string' && !element.label) {
      element.label = item.nodeLabel;
    }
    if (typeof item.snippet === 'string' && !element.snippet) {
      element.snippet = item.snippet.replace(/\s+/g, ' ').trim();
    }
    if (typeof item.selector === 'string' && !element.selector) {
      element.selector = item.selector;
    }

    if (element.selector || element.snippet || element.label || element.explanation) {
      elements.push(element);
    }
  }

  return elements.length > 0 ? elements : undefined;
}

interface LighthouseResult {
  categories?: {
    accessibility?: { score?: number | null };
  };
  audits?: Record<string, LighthouseAudit>;
}

/** Known high-impact accessibility audit IDs from Lighthouse. */
const CRITICAL_AUDIT_IDS = new Set([
  'accesskeys',
  'aria-allowed-attr',
  'aria-hidden-body',
  'aria-hidden-focus',
  'aria-input-field-name',
  'aria-required-attr',
  'aria-required-children',
  'aria-required-parent',
  'aria-roles',
  'aria-valid-attr',
  'aria-valid-attr-value',
  'button-name',
  'bypass',
  'document-title',
  'duplicate-id-aria',
  'form-field-multiple-labels',
  'frame-title',
  'html-has-lang',
  'html-lang-valid',
  'image-alt',
  'input-image-alt',
  'label',
  'link-name',
  'list',
  'listitem',
  'meta-refresh',
  'meta-viewport',
  'object-alt',
  'tabindex',
  'td-headers-attr',
  'th-has-data-cells',
  'valid-lang',
  'video-caption',
]);

const SERIOUS_AUDIT_IDS = new Set([
  'color-contrast',
  'definition-list',
  'dlitem',
  'heading-order',
  'identical-links-same-purpose',
  'landmark-one-main',
  'link-in-text-block',
  'select-name',
  'skip-link',
  'table-duplicate-name',
  'table-fake-caption',
  'target-size',
]);

const MODERATE_AUDIT_IDS = new Set([
  'aria-command-name',
  'aria-dialog-name',
  'aria-meter-name',
  'aria-progressbar-name',
  'aria-text',
  'aria-toggle-field-name',
  'aria-tooltip-name',
  'aria-treeitem-name',
  'focusable-controls',
  'interactive-element-affordance',
  'logical-tab-order',
  'managed-focus',
  'offscreen-content-hidden',
  'use-landmarks',
  'visual-order-follows-dom',
]);

const IMPACT_ORDER: AccessibilityImpact[] = ['critical', 'serious', 'moderate', 'minor'];

const ALL_KNOWN_A11Y_AUDIT_IDS = new Set([
  ...CRITICAL_AUDIT_IDS,
  ...SERIOUS_AUDIT_IDS,
  ...MODERATE_AUDIT_IDS,
]);

function resolveImpact(auditId: string): AccessibilityImpact {
  if (CRITICAL_AUDIT_IDS.has(auditId)) return 'critical';
  if (SERIOUS_AUDIT_IDS.has(auditId)) return 'serious';
  if (MODERATE_AUDIT_IDS.has(auditId)) return 'moderate';
  return 'minor';
}

function extractWcagTags(description: string): string[] {
  const matches = description.match(/WCAG\s*[\d.]+\s*(?:[A-Z]{2,3})?/gi) ?? [];
  return [...new Set(matches.map((m) => m.trim()))];
}

function isAccessibilityAudit(audit: LighthouseAudit, auditId: string, accessibilityRefs: Set<string>): boolean {
  if (audit.scoreDisplayMode === 'notApplicable' || audit.scoreDisplayMode === 'manual' || audit.scoreDisplayMode === 'informative') {
    return false;
  }
  // Only audits in Lighthouse accessibility category (never performance/SEO audits)
  if (accessibilityRefs.size > 0) return accessibilityRefs.has(auditId);
  return ALL_KNOWN_A11Y_AUDIT_IDS.has(auditId);
}

function isFailedAudit(audit: LighthouseAudit): boolean {
  if (audit.score == null) return false;
  if (audit.scoreDisplayMode === 'informative' || audit.scoreDisplayMode === 'manual') {
    return false;
  }
  return audit.score < 1;
}

/**
 * Parse Lighthouse accessibility category audits into structured results.
 */
export function parseAccessibilityAudits(lighthouse: LighthouseResult): AccessibilityResults {
  const audits = lighthouse.audits ?? {};
  const accessibilityCategory = lighthouse.categories?.accessibility;
  const score =
    accessibilityCategory?.score != null
      ? Math.round(accessibilityCategory.score * 100)
      : 0;

  const accessibilityRefs = new Set<string>();
  const categoryAuditRefs = (accessibilityCategory as { auditRefs?: { id: string }[] } | undefined)
    ?.auditRefs;
  if (categoryAuditRefs) {
    for (const ref of categoryAuditRefs) {
      if (ref.id) accessibilityRefs.add(ref.id);
    }
  }

  const issues: AccessibilityIssue[] = [];
  let passedCount = 0;
  let failedCount = 0;

  const auditIdsToCheck =
    accessibilityRefs.size > 0
      ? [...accessibilityRefs]
      : Object.keys(audits).filter((id) => ALL_KNOWN_A11Y_AUDIT_IDS.has(id));

  for (const auditId of auditIdsToCheck) {
    const audit = audits[auditId];
    if (!audit || !isAccessibilityAudit(audit, auditId, accessibilityRefs)) {
      continue;
    }

    if (isFailedAudit(audit)) {
      failedCount += 1;
      const description = audit.description ?? '';
      issues.push({
        id: auditId,
        title: audit.title ?? auditId,
        description,
        impact: resolveImpact(auditId),
        wcagTags: extractWcagTags(description),
        displayValue: audit.displayValue,
        affectedElements: extractAffectedElements(audit),
      });
    } else if (audit.score === 1) {
      passedCount += 1;
    }
  }

  issues.sort((a, b) => IMPACT_ORDER.indexOf(a.impact) - IMPACT_ORDER.indexOf(b.impact));

  return {
    score,
    issues,
    passedCount,
    failedCount,
    checkedAt: new Date().toISOString(),
  };
}
