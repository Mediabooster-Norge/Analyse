'use client';

import { BarChart3, TrendingUp, Tag, Sparkles, Eye } from 'lucide-react';
import type { DashboardTab } from '@/types/dashboard';

const AI_VISIBILITY_ENABLED = false;

interface TabNavigationProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  competitorCount?: number;
}

const allTabs = [
  { id: 'overview' as const, label: 'Oversikt', shortLabel: 'Oversikt', icon: BarChart3 },
  { id: 'competitors' as const, label: 'Konkurrenter', shortLabel: 'Konk.', icon: TrendingUp, showCount: true },
  { id: 'keywords' as const, label: 'Nøkkelord', shortLabel: 'Nøkkel', icon: Tag },
  { id: 'ai' as const, label: 'AI-analyse', shortLabel: 'AI', icon: Sparkles },
  { id: 'ai-visibility' as const, label: 'AI-synlighet', shortLabel: 'AI-syn', icon: Eye, disabled: true },
];

export function TabNavigation({ activeTab, onTabChange, competitorCount }: TabNavigationProps) {
  const tabs = AI_VISIBILITY_ENABLED ? allTabs : allTabs.filter((t) => t.id !== 'ai-visibility');

  return (
    <div className="overflow-x-auto -mx-3 max-[400px]:-mx-3 min-[401px]:-mx-4 sm:mx-0 px-3 max-[400px]:px-3 min-[401px]:px-4 sm:px-0 scrollbar-hide touch-pan-x">
      <div className="flex items-center gap-0.5 max-[400px]:gap-0.5 min-[401px]:gap-1 p-0.5 max-[400px]:p-0.5 min-[401px]:p-1 bg-neutral-100 rounded-xl w-max sm:w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isDisabled = 'disabled' in tab && tab.disabled;

          if (isDisabled) {
            return (
              <span
                key={tab.id}
                className="px-2 max-[400px]:px-1.5 min-[401px]:px-2.5 sm:px-4 py-1.5 max-[400px]:py-1 min-[401px]:py-2 rounded-lg text-[11px] max-[400px]:text-[10px] min-[401px]:text-xs sm:text-sm font-medium whitespace-nowrap flex items-center gap-1 max-[400px]:gap-0.5 min-[401px]:gap-1.5 sm:gap-2 text-neutral-400 cursor-not-allowed bg-neutral-50/80"
              >
                <Icon className="h-3.5 w-3.5 max-[400px]:h-3 max-[400px]:w-3 min-[401px]:h-4 min-[401px]:w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="px-1 max-[400px]:px-0.5 min-[401px]:px-1 py-0.5 rounded text-[9px] max-[400px]:text-[8px] min-[401px]:text-[10px] bg-neutral-200 text-neutral-500 font-medium">
                  Snart
                </span>
              </span>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-2 max-[400px]:px-1.5 min-[401px]:px-2.5 sm:px-4 py-1.5 max-[400px]:py-1 min-[401px]:py-2 rounded-lg text-[11px] max-[400px]:text-[10px] min-[401px]:text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap touch-manipulation ${
                isActive
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <span className="flex items-center gap-1 max-[400px]:gap-0.5 min-[401px]:gap-1.5 sm:gap-2">
                <Icon className="h-3.5 w-3.5 max-[400px]:h-3 max-[400px]:w-3 min-[401px]:h-4 min-[401px]:w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
                {tab.showCount && competitorCount && competitorCount > 0 && (
                  <span className="w-3.5 h-3.5 max-[400px]:w-3 max-[400px]:h-3 min-[401px]:w-4 min-[401px]:h-4 sm:w-5 sm:h-5 bg-neutral-200 rounded-full text-[9px] max-[400px]:text-[8px] min-[401px]:text-[10px] sm:text-xs flex items-center justify-center">
                    {competitorCount}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
