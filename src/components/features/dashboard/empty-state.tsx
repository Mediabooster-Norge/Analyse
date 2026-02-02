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
    <div className="rounded-2xl max-[400px]:rounded-xl border-2 border-dashed border-neutral-200 bg-gradient-to-br from-white to-neutral-50 min-w-0">
      <div className="flex flex-col items-center justify-center py-12 max-[400px]:py-8 min-[401px]:py-12 sm:py-20 px-4 max-[400px]:px-3 min-[401px]:px-5 sm:px-8">
        <div className="w-16 h-16 max-[400px]:w-14 max-[400px]:h-14 min-[401px]:w-16 sm:w-20 sm:h-20 bg-neutral-100 rounded-xl max-[400px]:rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 max-[400px]:mb-4 min-[401px]:mb-5 sm:mb-6">
          <BarChart3 className="w-8 h-8 max-[400px]:w-7 max-[400px]:h-7 min-[401px]:w-8 sm:w-10 sm:h-10 text-neutral-400" />
        </div>
        <h3 className="text-lg max-[400px]:text-base min-[401px]:text-lg sm:text-xl font-semibold mb-1.5 max-[400px]:mb-1.5 min-[401px]:mb-2 text-neutral-900 text-center">
          {isPremium ? 'Klar for analyse' : 'Klar for din gratis analyse'}
        </h3>
        <p className="text-neutral-500 text-center max-w-md mb-6 max-[400px]:mb-5 min-[401px]:mb-6 sm:mb-8 text-xs max-[400px]:text-[11px] min-[401px]:text-sm">
          Start analysen for å få rapport om nettsiden med SEO, sikkerhet og AI-anbefalinger.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 max-[400px]:gap-2 min-[401px]:gap-3 w-full sm:w-auto max-w-xs">
          <Button onClick={onStartAnalysis} size="lg" className="bg-neutral-900 hover:bg-neutral-800 text-white w-full text-sm max-[400px]:text-xs max-[400px]:h-10 min-[401px]:h-11">
            <Plus className="mr-1.5 max-[400px]:mr-1 h-4 w-4 max-[400px]:h-3.5 max-[400px]:w-3.5 min-[401px]:h-5 min-[401px]:w-5" />
            {isPremium ? 'Start analyse' : 'Start din første analyse'}
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 max-[400px]:gap-2 min-[401px]:gap-4 sm:gap-6 mt-6 max-[400px]:mt-5 min-[401px]:mt-6 sm:mt-8 text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs sm:text-sm text-neutral-400">
          <div className="flex items-center gap-1.5 max-[400px]:gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 max-[400px]:h-3 max-[400px]:w-3 text-green-500" />
            <span>{isPremium ? 'Ubegrenset' : `${monthlyLimit} gratis/mnd`}</span>
          </div>
          <div className="flex items-center gap-1.5 max-[400px]:gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 max-[400px]:h-3 max-[400px]:w-3 text-green-500" />
            <span>AI-analyse</span>
          </div>
          <div className="flex items-center gap-1.5 max-[400px]:gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 max-[400px]:h-3 max-[400px]:w-3 text-green-500" />
            <span>Konkurrentsjekk</span>
          </div>
          {isPremium && (
            <div className="flex items-center gap-1.5 max-[400px]:gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 max-[400px]:h-3 max-[400px]:w-3 text-green-500" />
              <span>AI-synlighet</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
