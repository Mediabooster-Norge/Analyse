'use client';

import { Globe, Search, Shield, Zap, Accessibility } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { RocketIcon } from './rocket-icon';

export interface AnalysisStepConfig {
  label: string;
  description: string;
  duration: string;
  icon: LucideIcon | typeof RocketIcon;
}

/** Felles stegliste for analyse- og «kjør på nytt»-modal (7 steg inkl. hastighet, WCAG og konkurrenter). */
export const ANALYSIS_STEPS: AnalysisStepConfig[] = [
  { label: 'Henter nettside', description: 'Laster inn og scraper innhold fra nettsiden', duration: '~5s', icon: Globe },
  { label: 'Analyserer SEO', description: 'Sjekker meta-tags, overskrifter, lenker og innhold', duration: '~10s', icon: Search },
  { label: 'Sjekker sikkerhet', description: 'Tester SSL-sertifikat og sikkerhetsheaders', duration: '~15s', icon: Shield },
  { label: 'Genererer rapport', description: 'AI sammenligner resultater og lager anbefalinger', duration: '~20s', icon: RocketIcon },
  { label: 'Måler hastighet', description: 'Henter Google PageSpeed-score og Core Web Vitals', duration: '~30s', icon: Zap },
  { label: 'Sjekker tilgjengelighet', description: 'Lighthouse WCAG-analyse og konkrete funn', duration: '~15s', icon: Accessibility },
  { label: 'Konkurrenter', description: 'Sammenligner med konkurrentenes nettsider', duration: '~30s', icon: Zap },
];
