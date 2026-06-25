'use client';

import { Globe, Search, Shield, BarChart3, Accessibility } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export interface GuestPreviewStep {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const GUEST_PREVIEW_STEPS: GuestPreviewStep[] = [
  {
    id: 'fetch',
    label: 'Henter nettside',
    description: 'Laster inn og scraper innhold fra nettsiden',
    icon: Globe,
  },
  {
    id: 'seo',
    label: 'Analyserer SEO',
    description: 'Sjekker meta-tags, overskrifter og lenker',
    icon: Search,
  },
  {
    id: 'security',
    label: 'Sjekker sikkerhet',
    description: 'Tester SSL-sertifikat og sikkerhetsheaders',
    icon: Shield,
  },
  {
    id: 'accessibility',
    label: 'Sjekker tilgjengelighet',
    description: 'Lighthouse WCAG-analyse og hastighet',
    icon: Accessibility,
  },
  {
    id: 'score',
    label: 'Beregner poeng',
    description: 'Sammenstiller score og forbedringsfunn',
    icon: BarChart3,
  },
];

interface GuestAnalysisProgressProps {
  step: number;
  elapsedSeconds: number;
  websiteUrl: string;
}

export function GuestAnalysisProgress({ step, elapsedSeconds, websiteUrl }: GuestAnalysisProgressProps) {
  const current = GUEST_PREVIEW_STEPS[step] ?? GUEST_PREVIEW_STEPS[0];
  const Icon = current.icon;
  const progress = Math.min(100, ((step + 1) / GUEST_PREVIEW_STEPS.length) * 100);

  return (
    <div className="max-w-md mx-auto text-center space-y-6">
      <div>
        <p className="text-sm text-muted-foreground mb-1">Analyserer</p>
        <p className="font-medium text-foreground truncate">{websiteUrl}</p>
      </div>

      <div className="relative w-20 h-20 mx-auto">
        <div className="absolute inset-0 rounded-full border-4 border-muted" />
        <div
          className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
          style={{ animationDuration: '1.2s' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="h-8 w-8 text-primary" />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground">{current.label}</h2>
        <p className="text-sm text-muted-foreground mt-1">{current.description}</p>
        <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" />
          {elapsedSeconds}s
        </p>
      </div>

      <div className="space-y-2">
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground px-1">
          {GUEST_PREVIEW_STEPS.map((s, i) => (
            <span key={s.id} className={i <= step ? 'text-primary font-medium' : ''}>
              {i + 1}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
