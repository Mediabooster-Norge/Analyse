export type CompetitorEntry = {
  url: string;
  results?: unknown;
};

/** Slår sammen beholdte konkurrenter med nylig analyserte (bevarer rekkefølge fra editUrls). */
export function mergeCompetitorResults(
  existing: CompetitorEntry[],
  editUrls: string[],
  newlyAnalyzed: CompetitorEntry[]
): CompetitorEntry[] {
  const byUrl = new Map<string, CompetitorEntry>();

  for (const competitor of existing) {
    byUrl.set(competitor.url, competitor);
  }
  for (const competitor of newlyAnalyzed) {
    byUrl.set(competitor.url, competitor);
  }

  return editUrls
    .map((url) => byUrl.get(url))
    .filter((entry): entry is CompetitorEntry => !!entry);
}
