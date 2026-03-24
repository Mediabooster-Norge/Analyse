'use client';

import { BarChart3, TrendingUp, Tag, Eye, FileText, Share2, ChevronDown } from 'lucide-react';
import { RocketIcon } from './rocket-icon';
import type { DashboardTab } from '@/types/dashboard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const AI_VISIBILITY_ENABLED = true;

interface TabNavigationProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  competitorCount?: number;
  keywordCount?: number;
}

const allTabs = [
  { id: 'overview' as const, label: 'Nettside', shortLabel: 'Nettside', icon: BarChart3 },
  { id: 'competitors' as const, label: 'Konkurrenter', shortLabel: 'Konk.', icon: TrendingUp, showCount: true },
  { id: 'keywords' as const, label: 'SEO / Nøkkelord', shortLabel: 'SEO', icon: Tag, showCount: true },
  { id: 'ai-visibility' as const, label: 'AI-synlighet', shortLabel: 'AI-syn', icon: Eye },
  { id: 'articles' as const, label: 'Artikkel generator', shortLabel: 'Artikkel', icon: FileText },
  { id: 'social' as const, label: 'SoMe-post generator', shortLabel: 'SoMe', icon: Share2 },
  { id: 'ai' as const, label: 'AI anbefalinger', shortLabel: 'AI', icon: RocketIcon },
];

function getTabCount(tabId: string, competitorCount?: number, keywordCount?: number): number | undefined {
  if (tabId === 'competitors') return competitorCount;
  if (tabId === 'keywords') return keywordCount;
  return undefined;
}

export function TabNavigation({ activeTab, onTabChange, competitorCount, keywordCount }: TabNavigationProps) {
  const tabs = AI_VISIBILITY_ENABLED ? allTabs : allTabs.filter((t) => t.id !== 'ai-visibility');
  const activeTabConfig = tabs.find((t) => t.id === activeTab);
  const activeCount = activeTabConfig ? getTabCount(activeTabConfig.id, competitorCount, keywordCount) : undefined;

  return (
    <div className="-mx-3 max-[400px]:-mx-3 min-[401px]:-mx-4 sm:mx-0 px-3 max-[400px]:px-3 min-[401px]:px-4 sm:px-0">
      {/* Mobil og tablet: dropdown slik at alle faner (inkl. AI-synlighet) er synlige */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="md:hidden w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-neutral-100 text-neutral-900 text-sm font-medium touch-manipulation"
          >
            <span className="flex items-center gap-2 min-w-0">
              {activeTabConfig && (
                <>
                  <activeTabConfig.icon className="h-4 w-4 shrink-0 text-neutral-600" />
                  <span className="truncate">{activeTabConfig.label}</span>
                  {activeCount != null && activeCount > 0 && (
                    <span className="shrink-0 w-5 h-5 bg-neutral-200 rounded-full text-xs flex items-center justify-center">
                      {activeCount}
                    </span>
                  )}
                </>
              )}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[200px]">
          {tabs.map((tab) => {
            if ('disabled' in tab && tab.disabled) return null;
            const Icon = tab.icon;
            const count = getTabCount(tab.id, competitorCount, keywordCount);
            return (
              <DropdownMenuItem
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{tab.label}</span>
                {count != null && count > 0 && (
                  <span className="text-xs text-neutral-500 tabular-nums">{count}</span>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Desktop: én rad med korte etiketter (md–lg), fulle etiketter på xl. flex-nowrap = én linje. */}
      <div className="hidden md:block w-full min-w-0">
        <div className="flex flex-nowrap items-center gap-1 p-1 bg-neutral-100 rounded-xl overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isDisabled = 'disabled' in tab && tab.disabled;

          if (isDisabled) {
            return (
              <span
                key={tab.id}
                className="shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] xl:text-xs font-medium whitespace-nowrap flex items-center gap-1 xl:gap-1.5 text-neutral-400 cursor-not-allowed bg-neutral-50/80"
              >
                <Icon className="h-3.5 w-3.5 xl:h-4 xl:w-4" />
                <span className="md:inline xl:hidden">{tab.shortLabel}</span>
                <span className="hidden xl:inline">{tab.label}</span>
                <span className="px-1 py-0.5 rounded text-[9px] bg-neutral-200 text-neutral-500 font-medium">Snart</span>
              </span>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              title={tab.label}
              className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] xl:text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 xl:gap-1.5 ${
                isActive ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Icon className="h-3.5 w-3.5 xl:h-4 xl:w-4 shrink-0" />
              <span className="md:inline xl:hidden">{tab.shortLabel}</span>
              <span className="hidden xl:inline">{tab.label}</span>
              {tab.showCount && (() => {
                const count = getTabCount(tab.id, competitorCount, keywordCount);
                return count != null && count > 0 ? (
                  <span className="w-4 h-4 xl:w-5 xl:h-5 bg-neutral-200 rounded-full text-[9px] xl:text-[10px] flex items-center justify-center shrink-0">
                    {count}
                  </span>
                ) : null;
              })()}
            </button>
          );
        })}
        </div>
      </div>
    </div>
  );
}
