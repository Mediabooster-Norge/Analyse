'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TabNavigation } from '@/components/features/dashboard';
import { OverviewTab } from '@/components/features/dashboard/tabs';
import type { DashboardAnalysisResult, DashboardTab } from '@/types/dashboard';
import { PreviewLockedTab } from '@/components/landing/preview-locked-tab';
import { PreviewRegisterWall } from '@/components/landing/preview-register-wall';

const LOCKED_PREVIEW_TABS: DashboardTab[] = [
  'competitors',
  'keywords',
  'ai-visibility',
  'articles',
  'social',
  'ai',
];

interface TeaserOverviewProps {
  result: DashboardAnalysisResult;
  websiteUrl: string;
  websiteName: string | null;
  previewToken: string;
}

export function TeaserOverview({
  result,
  websiteUrl,
  websiteName,
  previewToken,
}: TeaserOverviewProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [wallOpen, setWallOpen] = useState(false);
  const [wallMetric, setWallMetric] = useState<string | undefined>();
  const displayUrl = websiteName || websiteUrl.replace(/^https?:\/\//, '');

  const openRegisterWall = useCallback((metricTitle?: string) => {
    setWallMetric(metricTitle);
    setWallOpen(true);
  }, []);

  const handleFetchAISuggestion = useCallback(
    (element: string) => {
      openRegisterWall(element);
    },
    [openRegisterWall]
  );

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
        <span className="font-medium text-foreground">Smakebit av {displayUrl}</span>
        <span className="text-muted-foreground">
          {' '}
          Se alle funn gratis. Opprett konto for AI-forslag og full rapport.
        </span>
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <Button size="sm" asChild>
            <Link href={`/register?preview=${previewToken}`}>Opprett konto og lås opp</Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/login?preview=${previewToken}`}>Har du konto? Logg inn</Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Globe className="h-4 w-4 shrink-0" />
        <span className="truncate">{websiteUrl}</span>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="px-3 sm:px-4 pt-3 pb-2 border-b border-border bg-muted/30">
          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isPremium
            lockedTabs={LOCKED_PREVIEW_TABS}
          />
        </div>
      </div>

      {activeTab === 'overview' ? (
        <OverviewTab
          result={result}
          isPremium={false}
          guestPreview
          url={websiteUrl}
          openSubpageDialog={() => openRegisterWall()}
          fetchAISuggestion={handleFetchAISuggestion}
          setActiveTab={setActiveTab}
          articleSuggestions={null}
          loadingArticleSuggestions={false}
          articleSuggestionsSavedAt={null}
          fetchArticleSuggestions={() => openRegisterWall('Artikkelgenerator')}
          hasCompetitors={false}
          remainingArticleGenerations={0}
          articleGenerationsLimit={0}
          generatedArticleResult={null}
          generatingArticleIndex={null}
          fetchGenerateArticle={() => openRegisterWall('Artikkelgenerator')}
          setGeneratedArticle={() => {}}
          analysisHistory={[]}
          loadingPageSpeed={false}
          accessibilityResult={result.accessibility ?? null}
        />
      ) : (
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <PreviewLockedTab
            tab={activeTab}
            previewToken={previewToken}
            websiteName={displayUrl}
          />
        </div>
      )}

      <PreviewRegisterWall
        open={wallOpen}
        onOpenChange={setWallOpen}
        previewToken={previewToken}
        metricTitle={wallMetric}
      />
    </div>
  );
}
