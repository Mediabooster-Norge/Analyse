'use client';

import { BarChart3, Plus, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  isPremium: boolean;
  monthlyLimit: number;
  onStartAnalysis: () => void;
}

export function DashboardEmptyState({ isPremium, monthlyLimit, onStartAnalysis }: EmptyStateProps) {
  return (
    <div className="rounded-2xl max-[400px]:rounded-xl border border-neutral-200 bg-white shadow-sm min-w-0 overflow-hidden">
      <div className="flex flex-col items-center justify-center py-14 max-[400px]:py-10 min-[401px]:py-14 sm:py-20 px-5 max-[400px]:px-4 min-[401px]:px-6 sm:px-10">
        <div className="w-20 h-20 max-[400px]:w-16 max-[400px]:h-16 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-50 flex items-center justify-center mb-6 max-[400px]:mb-5 sm:mb-7 ring-1 ring-neutral-100/80">
          <BarChart3 className="w-10 h-10 max-[400px]:w-8 max-[400px]:h-8 sm:w-12 sm:h-12 text-neutral-500" />
        </div>
        <h3 className="text-xl max-[400px]:text-lg sm:text-2xl font-semibold text-neutral-900 text-center tracking-tight mb-2">
          {isPremium ? 'Klar for analyse' : 'Klar for din gratis analyse'}
        </h3>
        <p className="text-neutral-500 text-center max-w-sm text-sm leading-relaxed mb-8 max-[400px]:mb-6 sm:mb-10">
          Få en rapport med SEO, sikkerhet og AI-anbefalinger på 1–2 minutter.
        </p>
        <Button
          onClick={onStartAnalysis}
          size="lg"
          className="bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm hover:shadow transition-shadow w-full sm:w-auto min-w-[200px] h-11 sm:h-12 text-sm font-medium rounded-xl px-6"
        >
          <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          {isPremium ? 'Start analyse' : 'Start din første analyse'}
        </Button>
        <p className="text-neutral-400 text-center text-xs mt-4 max-w-sm leading-relaxed">
          Legg inn URL i dialogen – vi analyserer SEO, innhold, sikkerhet, hastighet, nøkkelord og konkurrenter, og gir deg konkrete AI-forslag.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-8 max-[400px]:mt-6 sm:mt-10 pt-8 sm:pt-10 border-t border-neutral-100">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-50 text-neutral-600 text-xs font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
            {isPremium ? 'Ubegrenset' : `${monthlyLimit} gratis/mnd`}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-50 text-neutral-600 text-xs font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
            AI-analyse
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-50 text-neutral-600 text-xs font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
            Konkurrentsjekk
          </span>
        </div>
      </div>
    </div>
  );
}
