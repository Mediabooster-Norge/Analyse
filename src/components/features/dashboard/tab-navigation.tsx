'use client';

import { BarChart3, TrendingUp, Tag, Sparkles, Eye } from 'lucide-react';
import type { DashboardTab } from '@/types/dashboard';

interface TabNavigationProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  competitorCount?: number;
}

const tabs = [
  { id: 'overview' as const, label: 'Oversikt', icon: BarChart3 },
  { id: 'competitors' as const, label: 'Konkurrenter', icon: TrendingUp, showCount: true },
  { id: 'keywords' as const, label: 'Nøkkelord', icon: Tag },
  { id: 'ai' as const, label: 'AI-analyse', icon: Sparkles },
  { id: 'ai-visibility' as const, label: 'AI-synlighet', icon: Eye },
];

export function TabNavigation({ activeTab, onTabChange, competitorCount }: TabNavigationProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl w-fit">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              isActive
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <span className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.showCount && competitorCount && competitorCount > 0 && (
                <span className="w-5 h-5 bg-neutral-200 rounded-full text-xs flex items-center justify-center">
                  {competitorCount}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
