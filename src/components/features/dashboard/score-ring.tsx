'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ScoreRingProps {
  score: number;
  label: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  neutral?: boolean;
  /** Forklaring som vises i tooltip ved hover */
  title?: string;
}

const sizes = {
  sm: { ring: 56, stroke: 4, text: 'text-lg', label: 'text-xs' },
  md: { ring: 72, stroke: 5, text: 'text-xl', label: 'text-xs' },
  lg: { ring: 96, stroke: 6, text: 'text-2xl', label: 'text-sm' },
  xl: { ring: 120, stroke: 7, text: 'text-3xl', label: 'text-sm' },
};

function getScoreColor(score: number, neutral: boolean): string {
  if (neutral) return 'text-neutral-400';
  if (score >= 90) return 'text-green-500';
  if (score >= 70) return 'text-emerald-500';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
}

function getStatusLabel(score: number): string {
  if (score >= 90) return 'Veldig bra';
  if (score >= 70) return 'Bra';
  if (score >= 50) return 'Ok';
  return 'Trenger forbedring';
}

export function ScoreRing({
  score,
  label,
  size = 'md',
  showStatus = false,
  neutral = false,
  title,
}: ScoreRingProps) {
  const s = sizes[size];
  const radius = (s.ring - s.stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const scoreColor = getScoreColor(score, neutral);

  const content = (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: s.ring, height: s.ring }}>
        <svg
          className="-rotate-90"
          style={{ width: s.ring, height: s.ring }}
          viewBox={`0 0 ${s.ring} ${s.ring}`}
        >
          {/* Background circle */}
          <circle
            cx={s.ring / 2}
            cy={s.ring / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={s.stroke}
            className="text-neutral-100"
          />
          {/* Progress circle */}
          <circle
            cx={s.ring / 2}
            cy={s.ring / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={s.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`${scoreColor} transition-all duration-1000`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${s.text} font-semibold text-neutral-900`}>
            {score}
          </span>
        </div>
      </div>
      <span className={`${s.label} text-neutral-500 font-medium`}>{label}</span>
      {showStatus && (
        <span
          className={`text-xs font-medium ${neutral ? 'text-neutral-500' : scoreColor}`}
        >
          {getStatusLabel(score)}
        </span>
      )}
    </div>
  );

  if (title) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help w-full flex flex-col items-center">{content}</div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px] text-center">
          {title}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
