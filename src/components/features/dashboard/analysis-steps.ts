'use client';

import { Globe, Search, Shield, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { RocketIcon } from './rocket-icon';

export interface AnalysisStepConfig {
  label: string;
  description: string;
  duration: string;
  icon: LucideIcon | typeof RocketIcon;
}

/** Felles stegliste for analyse- og «kjør på nytt»-modal (6 steg inkl. hastighet/konkurrenter). */
export const ANALYSIS_STEPS: AnalysisStepConfig[] = [
  { label: 'Henter nettside', description: 'Laster inn og scraper innhold fra nettsiden', duration: '~5s', icon: Globe },
  { label: 'Analyserer SEO', description: 'Sjekker meta-tags, overskrifter, lenker og innhold', duration: '~10s', icon: Search },
  { label: 'Sjekker sikkerhet', description: 'Tester SSL-sertifikat og sikkerhetsheaders', duration: '~15s', icon: Shield },
  { label: 'Måler ytelse', description: 'Henter Google PageSpeed-score og Core Web Vitals', duration: '~30s', icon: Zap },
  { label: 'Genererer rapport', description: 'AI sammenligner resultater og lager anbefalinger', duration: '~20s', icon: RocketIcon },
  { label: 'Hastighet og konkurrenter', description: 'PageSpeed og konkurrentsammenligning', duration: '~30s', icon: Zap },
];
