'use client';

import { CheckCircle2, AlertCircle } from 'lucide-react';

interface SummaryCardProps {
  score: number;
}

export function SummaryCard({ score }: SummaryCardProps) {
  const isGood = score >= 80;
  const isOk = score >= 60;

  const colors = isGood
    ? { bg: 'bg-[#14b8a6]/10 border-[#14b8a6]/30', icon: 'bg-[#14b8a6]/15', iconColor: 'text-[#14b8a6]', title: 'text-[#14b8a6]', text: 'text-[#14b8a6]', score: 'text-[#14b8a6]' }
    : isOk
    ? { bg: 'bg-[#fdba32]/15 border-[#fdba32]/40', icon: 'bg-[#fdba32]/25', iconColor: 'text-[#b8860b]', title: 'text-[#b8860b]', text: 'text-[#b8860b]', score: 'text-[#b8860b]' }
    : { bg: 'bg-[#fd966f]/15 border-[#fd966f]/40', icon: 'bg-[#fd966f]/25', iconColor: 'text-[#c45c3e]', title: 'text-[#c45c3e]', text: 'text-[#c45c3e]', score: 'text-[#c45c3e]' };

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
    <div className={`rounded-2xl p-3 max-[400px]:p-3 min-[401px]:p-4 sm:p-6 border ${colors.bg}`}>
      <div className="flex items-start gap-2 max-[400px]:gap-2 min-[401px]:gap-3 sm:gap-4">
        <div className={`w-10 h-10 max-[400px]:w-10 max-[400px]:h-10 min-[401px]:w-12 min-[401px]:h-12 sm:w-14 sm:h-14 rounded-xl max-[400px]:rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${colors.icon}`}>
          {isGood ? (
            <CheckCircle2 className={`h-5 w-5 max-[400px]:h-5 min-[401px]:h-6 sm:h-7 ${colors.iconColor}`} />
          ) : (
            <AlertCircle className={`h-5 w-5 max-[400px]:h-5 min-[401px]:h-6 sm:h-7 ${colors.iconColor}`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-base max-[400px]:text-sm min-[401px]:text-base sm:text-lg font-semibold ${colors.title}`}>{title}</h3>
          <p className={`text-xs max-[400px]:text-[11px] min-[401px]:text-xs sm:text-sm mt-0.5 sm:mt-1 line-clamp-2 ${colors.text}`}>{description}</p>
        </div>
        <div className="text-right shrink-0">
          <div className={`text-2xl max-[400px]:text-xl min-[401px]:text-2xl sm:text-4xl font-bold ${colors.score}`}>{score}</div>
          <p className="text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs text-neutral-500 mt-0 sm:mt-1">av 100</p>
        </div>
      </div>
    </div>
  );
}
