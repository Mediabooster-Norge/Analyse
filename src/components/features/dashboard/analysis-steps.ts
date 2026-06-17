'use client';

import { Globe, Search, Shield, Zap, Accessibility } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { RocketIcon } from './rocket-icon';

export type AnalysisStepId =
  | 'fetch'
  | 'seo'
  | 'security'
  | 'report'
  | 'pagespeed'
  | 'accessibility'
  | 'competitors';

export interface AnalysisStepConfig {
  id: AnalysisStepId;
  label: string;
  description: string;
  duration: string;
  icon: LucideIcon | typeof RocketIcon;
}

/** Felles stegliste for analyse- og «kjør på nytt»-modal (7 steg inkl. hastighet, WCAG og konkurrenter). */
export const ANALYSIS_STEPS: AnalysisStepConfig[] = [
  { id: 'fetch', label: 'Henter nettside', description: 'Laster inn og scraper innhold fra nettsiden', duration: '~5s', icon: Globe },
  { id: 'seo', label: 'Analyserer SEO', description: 'Sjekker meta-tags, overskrifter, lenker og innhold', duration: '~10s', icon: Search },
  { id: 'security', label: 'Sjekker sikkerhet', description: 'Tester SSL-sertifikat og sikkerhetsheaders', duration: '~15s', icon: Shield },
  { id: 'report', label: 'Genererer rapport', description: 'AI sammenligner resultater og lager anbefalinger', duration: '~20s', icon: RocketIcon },
  { id: 'pagespeed', label: 'Måler hastighet', description: 'Henter Google PageSpeed-score og Core Web Vitals', duration: '~30s', icon: Zap },
  { id: 'accessibility', label: 'Sjekker tilgjengelighet', description: 'Lighthouse WCAG-analyse og konkrete funn', duration: '~15s', icon: Accessibility },
  { id: 'competitors', label: 'Konkurrenter', description: 'Sammenligner med konkurrentenes nettsider', duration: '~30s', icon: Zap },
];

export function getAnalysisStepIndex(id: AnalysisStepId): number {
  const index = ANALYSIS_STEPS.findIndex((step) => step.id === id);
  if (index < 0) {
    throw new Error(`Analysis step not found: ${id}`);
  }
  return index;
}

/** Stable indices – prefer these over numeric literals in hooks/dialog. */
export const ANALYSIS_STEP_INDEX = {
  fetch: getAnalysisStepIndex('fetch'),
  seo: getAnalysisStepIndex('seo'),
  security: getAnalysisStepIndex('security'),
  report: getAnalysisStepIndex('report'),
  pagespeed: getAnalysisStepIndex('pagespeed'),
  accessibility: getAnalysisStepIndex('accessibility'),
  competitors: getAnalysisStepIndex('competitors'),
} as const;

/** Siste steg i hovedanalysen (/api/analyze) før PageSpeed og konkurrenter. */
export const ANALYSIS_MAIN_PHASE_LAST_INDEX = ANALYSIS_STEP_INDEX.report;
