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
    <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-gradient-to-br from-white to-neutral-50">
      <div className="flex flex-col items-center justify-center py-20 px-8">
        <div className="w-20 h-20 bg-neutral-100 rounded-2xl flex items-center justify-center mb-6">
          <BarChart3 className="w-10 h-10 text-neutral-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-neutral-900">
          {isPremium ? 'Klar for analyse' : 'Klar for din gratis analyse'}
        </h3>
        <p className="text-neutral-500 text-center max-w-md mb-8">
          Start analysen for å få en komplett rapport om nettsiden med SEO, sikkerhet og AI-drevne anbefalinger.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={onStartAnalysis} size="lg" className="bg-neutral-900 hover:bg-neutral-800 text-white">
            <Plus className="mr-2 h-5 w-5" />
            {isPremium ? 'Start analyse' : 'Start din første analyse'}
          </Button>
        </div>
        <div className="flex items-center gap-6 mt-8 text-sm text-neutral-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>{isPremium ? 'Ubegrenset analyser' : `${monthlyLimit} gratis/mnd`}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>AI-analyse</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Konkurrentsjekk</span>
          </div>
          {isPremium && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>AI-synlighet</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
