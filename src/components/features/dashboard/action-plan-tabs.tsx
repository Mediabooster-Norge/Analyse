'use client';

import { useState } from 'react';
import { Zap, Clock, TrendingUp } from 'lucide-react';

interface ActionPlanTabsProps {
  actionPlan: {
    immediate?: string[];
    shortTerm?: string[];
    longTerm?: string[];
  };
}

type TabId = 'immediate' | 'shortTerm' | 'longTerm';

interface Tab {
  id: TabId;
  label: string;
  icon: typeof Zap;
  color: 'red' | 'amber' | 'green';
  items: string[];
}

const colorClasses = {
  red: {
    active: 'bg-red-500 text-white shadow-sm',
    container: 'bg-red-50 border-red-200',
    text: 'text-red-900',
    badge: 'bg-red-200 text-red-700',
  },
  amber: {
    active: 'bg-amber-500 text-white shadow-sm',
    container: 'bg-amber-50 border-amber-200',
    text: 'text-amber-900',
    badge: 'bg-amber-200 text-amber-700',
  },
  green: {
    active: 'bg-green-500 text-white shadow-sm',
    container: 'bg-green-50 border-green-200',
    text: 'text-green-900',
    badge: 'bg-green-200 text-green-700',
  },
};

export function ActionPlanTabs({ actionPlan }: ActionPlanTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('immediate');

  const allTabs = [
    { id: 'immediate' as TabId, label: 'Nå', icon: Zap, color: 'red' as const, items: actionPlan.immediate || [] },
    { id: 'shortTerm' as TabId, label: 'Kort sikt', icon: Clock, color: 'amber' as const, items: actionPlan.shortTerm || [] },
    { id: 'longTerm' as TabId, label: 'Lang sikt', icon: TrendingUp, color: 'green' as const, items: actionPlan.longTerm || [] },
  ];
  const tabs: Tab[] = allTabs.filter((tab) => tab.items.length > 0);

  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];

  if (tabs.length === 0) return null;

  const colors = colorClasses[currentTab.color];

  return (
    <div>
      <h5 className="text-sm font-medium text-neutral-700 mb-3">
        Handlingsplan
      </h5>

      {/* Tab buttons */}
      <div className="flex gap-1 p-1 bg-neutral-100 rounded-lg mb-3">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          const tabColors = colorClasses[tab.color];

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? tabColors.active
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className={`p-4 rounded-xl border ${colors.container}`}>
        <ul className="space-y-2">
          {currentTab.items.map((item, i) => (
            <li
              key={i}
              className={`text-sm flex items-start gap-2 ${colors.text}`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${colors.badge}`}
              >
                <span className="text-xs font-bold">{i + 1}</span>
              </span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
