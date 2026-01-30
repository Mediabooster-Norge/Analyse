'use client';

import { CheckCircle2, AlertCircle } from 'lucide-react';

interface SummaryCardProps {
  score: number;
}

export function SummaryCard({ score }: SummaryCardProps) {
  const isGood = score >= 80;
  const isOk = score >= 60;

  const colors = isGood
    ? { bg: 'bg-green-50 border-green-200', icon: 'bg-green-100', iconColor: 'text-green-600', title: 'text-green-900', text: 'text-green-700', score: 'text-green-600' }
    : isOk
    ? { bg: 'bg-amber-50 border-amber-200', icon: 'bg-amber-100', iconColor: 'text-amber-600', title: 'text-amber-900', text: 'text-amber-700', score: 'text-amber-600' }
    : { bg: 'bg-red-50 border-red-200', icon: 'bg-red-100', iconColor: 'text-red-600', title: 'text-red-900', text: 'text-red-700', score: 'text-red-600' };

  const title = isGood
    ? 'Nettsiden din ser bra ut!'
    : isOk
    ? 'Nettsiden din har forbedringspotensial'
    : 'Nettsiden din trenger oppmerksomhet';

  const description = isGood
    ? 'De viktigste elementene er på plass. Se gjennom detaljene under for ytterligere optimalisering.'
    : isOk
    ? 'Vi har funnet noen områder som kan forbedres for bedre synlighet i Google.'
    : 'Det er flere viktige ting som bør fikses for at nettsiden skal fungere optimalt.';

  return (
    <div className={`rounded-2xl p-6 border ${colors.bg}`}>
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${colors.icon}`}>
          {isGood ? (
            <CheckCircle2 className={`h-7 w-7 ${colors.iconColor}`} />
          ) : (
            <AlertCircle className={`h-7 w-7 ${colors.iconColor}`} />
          )}
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${colors.title}`}>{title}</h3>
          <p className={`text-sm mt-1 ${colors.text}`}>{description}</p>
        </div>
        <div className="text-right shrink-0">
          <div className={`text-4xl font-bold ${colors.score}`}>{score}</div>
          <p className="text-xs text-neutral-500 mt-1">av 100 poeng</p>
        </div>
      </div>
    </div>
  );
}
