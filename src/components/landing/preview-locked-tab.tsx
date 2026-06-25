'use client';

import Link from 'next/link';
import {
  TrendingUp,
  Tag,
  Eye,
  FileText,
  Share2,
  Sparkles,
  Lock,
  Globe,
  PenLine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScoreRing } from '@/components/features/dashboard';
import type { DashboardTab } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface PreviewLockedTabProps {
  tab: DashboardTab;
  previewToken: string;
  websiteName: string;
}

const TAB_META: Record<
  Exclude<DashboardTab, 'overview'>,
  { title: string; description: string; icon: typeof TrendingUp }
> = {
  competitors: {
    title: 'Konkurrentsammenligning',
    description: 'Sammenlign score på tvers av SEO, innhold, sikkerhet og hastighet',
    icon: TrendingUp,
  },
  keywords: {
    title: 'SEO / Nøkkelord',
    description: 'Søkevolum, CPC og konkurranse for relevante søkeord',
    icon: Tag,
  },
  'ai-visibility': {
    title: 'AI-synlighet',
    description: 'Se om ChatGPT og andre AI-verktøy kjenner og anbefaler bedriften din',
    icon: Eye,
  },
  articles: {
    title: 'Artikkelgenerator',
    description: 'Generer SEO-artikler basert på analysen din',
    icon: FileText,
  },
  social: {
    title: 'SoMe-post generator',
    description: 'Ferdige innlegg for LinkedIn, Instagram og X',
    icon: Share2,
  },
  ai: {
    title: 'AI anbefalinger',
    description: 'Ferdig meta-tekst, handlingsplan og konkrete forbedringsforslag',
    icon: Sparkles,
  },
};

function LockedTabMock({ tab }: { tab: Exclude<DashboardTab, 'overview'> }) {
  if (tab === 'competitors') {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="grid grid-cols-6 gap-2 p-3 bg-muted/40 border-b border-border text-[10px] font-medium text-muted-foreground uppercase">
            <span className="col-span-2">Nettside</span>
            <span className="text-center">Total</span>
            <span className="text-center">SEO</span>
            <span className="text-center">Innhold</span>
            <span className="text-center">Speed</span>
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="grid grid-cols-6 gap-2 p-3 border-b border-border last:border-0 items-center">
              <div className="col-span-2 flex items-center gap-2">
                <div className={cn('size-8 rounded-lg', i === 0 ? 'bg-green-100' : 'bg-muted')} />
                <div className="space-y-1 flex-1">
                  <div className="h-3 w-16 bg-muted rounded" />
                  <div className="h-2 w-24 bg-muted/70 rounded" />
                </div>
              </div>
              {[78, 72, 65, 88].map((n, j) => (
                <div key={j} className="flex justify-center">
                  <span className="size-8 rounded-full bg-muted text-xs font-bold flex items-center justify-center text-muted-foreground">
                    {i === 0 ? n : n - 8 + j}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tab === 'keywords') {
    return (
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="grid grid-cols-4 gap-2 p-3 bg-muted/40 border-b border-border text-[10px] font-medium text-muted-foreground uppercase">
          <span className="col-span-2">Nøkkelord</span>
          <span className="text-right">Volum</span>
          <span className="text-right">CPC</span>
        </div>
        {['tjenester oslo', 'bedrift norge', 'bransje tips', 'kunde guide'].map((kw) => (
          <div key={kw} className="grid grid-cols-4 gap-2 p-3 border-b border-border last:border-0 text-sm">
            <span className="col-span-2 font-medium text-muted-foreground">{kw}</span>
            <span className="text-right text-muted-foreground">~420</span>
            <span className="text-right text-muted-foreground">~15 kr</span>
          </div>
        ))}
      </div>
    );
  }

  if (tab === 'ai-visibility') {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border p-5 flex items-center gap-4">
          <ScoreRing score={72} label="AI" size="md" />
          <div className="space-y-2 flex-1">
            <div className="h-3 w-3/4 bg-muted rounded" />
            <div className="h-2 w-1/2 bg-muted/70 rounded" />
          </div>
        </div>
        <div className="rounded-xl bg-muted/40 border border-border p-5 space-y-2">
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-5/6 bg-muted rounded" />
          <div className="h-3 w-4/6 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (tab === 'articles') {
    return (
      <div className="rounded-xl border border-border p-5 max-w-xl space-y-3">
        <div className="h-4 w-2/3 bg-muted rounded" />
        <div className="rounded-lg bg-muted/50 p-4 space-y-2">
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-3/4 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (tab === 'social') {
    return (
      <div className="rounded-xl border border-border p-5 max-w-xl">
        <PenLine className="size-4 text-muted-foreground mb-3" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-5/6 bg-muted rounded" />
          <div className="h-3 w-4/6 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-muted/60" />
        ))}
      </div>
      <div className="rounded-xl bg-muted/40 border border-border p-5 space-y-2">
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-2/3 bg-muted rounded" />
      </div>
    </div>
  );
}

export function PreviewLockedTab({ tab, previewToken, websiteName }: PreviewLockedTabProps) {
  if (tab === 'overview') return null;

  const meta = TAB_META[tab];
  const Icon = meta.icon;

  return (
    <div className="relative min-h-[280px]">
      <div className="pointer-events-none select-none blur-[6px] opacity-60" aria-hidden>
        <div className="mb-4">
          <h3 className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
            <Icon className="size-4" />
            {meta.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">{meta.description}</p>
        </div>
        <LockedTabMock tab={tab} />
      </div>

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="max-w-sm w-full rounded-xl border border-border bg-card/95 backdrop-blur-sm shadow-lg p-5 sm:p-6 text-center">
          <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-muted">
            <Lock className="size-5 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground text-sm sm:text-base">{meta.title}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
            {meta.description} for <span className="font-medium text-foreground">{websiteName}</span>
          </p>
          <Button size="sm" className="mt-4 w-full sm:w-auto" asChild>
            <Link href={`/register?preview=${previewToken}`}>Opprett konto og lås opp</Link>
          </Button>
          <p className="mt-2 text-[10px] text-muted-foreground flex items-center justify-center gap-1">
            <Globe className="size-3" />
            Nettside-fanen er allerede tilgjengelig gratis
          </p>
        </div>
      </div>
    </div>
  );
}
