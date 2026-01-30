'use client';

import { ChevronRight, Lightbulb } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type MetricStatus = 'good' | 'warning' | 'bad';

interface MetricCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  value: string;
  recommendation: string;
  status: MetricStatus;
  onClick?: () => void;
}

const statusColors = {
  good: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-600',
    badge: 'bg-green-100 text-green-700',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
  },
  bad: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-600',
    badge: 'bg-red-100 text-red-700',
  },
};

export function MetricCard({
  icon: Icon,
  title,
  description,
  value,
  recommendation,
  status,
  onClick,
}: MetricCardProps) {
  const colors = statusColors[status];

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-all group ${colors.bg} ${colors.border}`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 bg-white/80`}>
            <Icon className={`w-3 h-3 ${colors.icon}`} />
          </div>
          <span className="font-medium text-xs text-neutral-900 truncate">{title}</span>
        </div>
        <div className="flex items-center gap-0.5 text-neutral-400 group-hover:text-amber-500 transition-colors shrink-0">
          <Lightbulb className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <ChevronRight className="w-3 h-3" />
        </div>
      </div>

      {/* Value */}
      <p className="text-xs text-neutral-700 line-clamp-1 mb-1.5" title={value}>
        {value}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-neutral-500 truncate">{description}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${colors.badge}`}>
          {recommendation}
        </span>
      </div>
    </div>
  );
}
