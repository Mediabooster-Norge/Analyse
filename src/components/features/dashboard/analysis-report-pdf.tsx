'use client';

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';
import type { DashboardAnalysisResult } from '@/types/dashboard';

// Dashboard-aligned colors (matching Tailwind theme)
const colors = {
  // Score colors
  green: {
    bg: '#f0fdf4',
    border: '#86efac',
    text: '#15803d',
    light: '#dcfce7',
  },
  amber: {
    bg: '#fffbeb',
    border: '#fcd34d',
    text: '#b45309',
    light: '#fef3c7',
  },
  red: {
    bg: '#fef2f2',
    border: '#fca5a5',
    text: '#b91c1c',
    light: '#fee2e2',
  },
  // Neutral palette
  neutral: {
    900: '#171717',
    800: '#262626',
    700: '#404040',
    600: '#525252',
    500: '#737373',
    400: '#a3a3a3',
    300: '#d4d4d4',
    200: '#e5e5e5',
    100: '#f5f5f5',
    50: '#fafafa',
    white: '#ffffff',
  },
} as const;

function getScoreColor(score: number) {
  if (score >= 80) return colors.green;
  if (score >= 60) return colors.amber;
  return colors.red;
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Bra';
  if (score >= 60) return 'OK';
  return 'Trenger forbedring';
}

function getStatusIcon(isGood: boolean): string {
  return isGood ? '✓' : '✗';
}

const styles = StyleSheet.create({
  // Page setup
  page: {
    padding: 32,
    fontFamily: 'Helvetica',
    fontSize: 9,
    backgroundColor: colors.neutral[50],
    color: colors.neutral[700],
  },

  // Header / Title
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.neutral[500],
    marginBottom: 2,
  },
  headerUrl: {
    fontSize: 9,
    color: colors.neutral[400],
  },

  // Summary Card
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  summaryLeft: {
    flex: 1,
    paddingRight: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryDesc: {
    fontSize: 9,
    lineHeight: 1.4,
  },
  summaryScoreBox: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    minWidth: 70,
  },
  summaryScore: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  summaryScoreLabel: {
    fontSize: 8,
    marginTop: 2,
  },

  // Section Card
  card: {
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: colors.neutral[100],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  cardBody: {
    padding: 12,
  },

  // Score boxes row
  scoreRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  scoreBox: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 8,
    color: colors.neutral[500],
    marginTop: 2,
  },
  scoreStatus: {
    fontSize: 7,
    marginTop: 2,
  },

  // Two column grid
  grid2: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCol: {
    flex: 1,
  },

  // Detail rows
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  detailLabel: {
    fontSize: 9,
    color: colors.neutral[600],
    flex: 1,
  },
  detailValue: {
    fontSize: 9,
    color: colors.neutral[900],
    fontWeight: 'bold',
    textAlign: 'right',
  },
  detailStatus: {
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 6,
  },

  // Tables
  table: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 6,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    backgroundColor: colors.neutral[50],
  },
  tableCell: {
    padding: 6,
    fontSize: 8,
    flex: 1,
  },
  tableCellWide: {
    padding: 6,
    fontSize: 8,
    flex: 2,
  },
  tableHeaderCell: {
    padding: 6,
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.neutral[700],
    flex: 1,
  },
  tableHeaderCellWide: {
    padding: 6,
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.neutral[700],
    flex: 2,
  },

  // Badges
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 7,
    fontWeight: 'bold',
  },
  badgeGreen: {
    backgroundColor: colors.green.light,
    color: colors.green.text,
  },
  badgeAmber: {
    backgroundColor: colors.amber.light,
    color: colors.amber.text,
  },
  badgeRed: {
    backgroundColor: colors.red.light,
    color: colors.red.text,
  },

  // Lists
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 12,
    fontSize: 9,
    color: colors.neutral[400],
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    color: colors.neutral[700],
    lineHeight: 1.4,
  },

  // Recommendation blocks
  recBlock: {
    marginBottom: 8,
    padding: 10,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 6,
  },
  recPriority: {
    fontSize: 7,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  recTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: 3,
  },
  recDesc: {
    fontSize: 8,
    color: colors.neutral[600],
    lineHeight: 1.4,
  },

  // Section titles inside cards
  sectionSubtitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.neutral[700],
    marginBottom: 6,
    marginTop: 8,
  },

  // Muted text
  muted: {
    fontSize: 8,
    color: colors.neutral[500],
  },

  // Page break hint
  pageBreak: {
    marginTop: 10,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 32,
    right: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: colors.neutral[400],
  },
});

export interface AnalysisReportPdfProps {
  result: DashboardAnalysisResult;
  companyUrl: string;
  companyName: string | null;
}

// Score box component
function ScoreBox({ label, value }: { label: string; value: number }) {
  const c = getScoreColor(value);
  return (
    <View style={[styles.scoreBox, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[styles.scoreValue, { color: c.text }]}>{value}</Text>
      <Text style={styles.scoreLabel}>{label}</Text>
      <Text style={[styles.scoreStatus, { color: c.text }]}>{getScoreLabel(value)}</Text>
    </View>
  );
}

// Detail row component
function DetailRow({ label, value, isGood }: { label: string; value: string; isGood?: boolean }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
      {isGood !== undefined && (
        <Text style={[styles.detailStatus, { color: isGood ? colors.green.text : colors.red.text }]}>
          {getStatusIcon(isGood)}
        </Text>
      )}
    </View>
  );
}

export function AnalysisReportPdf({ result, companyUrl, companyName }: AnalysisReportPdfProps) {
  const dateStr = new Date().toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const perfScore = result.pageSpeedResults?.performance ?? 0;
  const hasPerf = perfScore > 0;
  const summaryColor = getScoreColor(result.overallScore);

  const getSummaryContent = () => {
    if (result.overallScore >= 80) return {
      title: 'Nettsiden din ser bra ut!',
      desc: 'De viktigste elementene er på plass. Se gjennom detaljene for ytterligere optimalisering.',
    };
    if (result.overallScore >= 60) return {
      title: 'Nettsiden har forbedringspotensial',
      desc: 'Vi har funnet noen områder som kan forbedres for bedre synlighet i Google.',
    };
    return {
      title: 'Nettsiden trenger oppmerksomhet',
      desc: 'Det er flere viktige ting som bør fikses for at nettsiden skal fungere optimalt.',
    };
  };

  const summary = getSummaryContent();

  return (
    <Document>
      {/* Page 1: Overview */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analyserapport</Text>
          <Text style={styles.headerSubtitle}>{companyName || companyUrl}</Text>
          <Text style={styles.headerUrl}>{companyUrl} · {dateStr}</Text>
        </View>

        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: summaryColor.bg, borderColor: summaryColor.border }]}>
          <View style={styles.summaryLeft}>
            <Text style={[styles.summaryTitle, { color: summaryColor.text }]}>{summary.title}</Text>
            <Text style={[styles.summaryDesc, { color: summaryColor.text }]}>{summary.desc}</Text>
          </View>
          <View style={[styles.summaryScoreBox, { backgroundColor: colors.neutral.white }]}>
            <Text style={[styles.summaryScore, { color: summaryColor.text }]}>{result.overallScore}</Text>
            <Text style={[styles.summaryScoreLabel, { color: colors.neutral[500] }]}>av 100</Text>
          </View>
        </View>

        {/* Score Overview */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Poengoversikt</Text>
          </View>
          <View style={styles.cardBody}>
            <View style={styles.scoreRow}>
              <ScoreBox label="Totalt" value={result.overallScore} />
              <ScoreBox label="SEO" value={result.seoResults.score} />
              <ScoreBox label="Innhold" value={result.contentResults.score} />
              <ScoreBox label="Sikkerhet" value={result.securityResults.score} />
              {hasPerf && <ScoreBox label="Hastighet" value={perfScore} />}
            </View>
          </View>
        </View>

        {/* SEO Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>SEO-analyse</Text>
            <Text style={[styles.badge, result.seoResults.score >= 80 ? styles.badgeGreen : result.seoResults.score >= 60 ? styles.badgeAmber : styles.badgeRed]}>
              {result.seoResults.score}/100
            </Text>
          </View>
          <View style={styles.cardBody}>
            <View style={styles.grid2}>
              <View style={styles.gridCol}>
                <Text style={styles.sectionSubtitle}>Meta-tags</Text>
                <DetailRow
                  label="Sidetittel"
                  value={result.seoResults.meta.title.content ? `${result.seoResults.meta.title.length} tegn` : 'Mangler'}
                  isGood={!!result.seoResults.meta.title.content && result.seoResults.meta.title.isOptimal}
                />
                <DetailRow
                  label="Meta-beskrivelse"
                  value={result.seoResults.meta.description.content ? `${result.seoResults.meta.description.length} tegn` : 'Mangler'}
                  isGood={!!result.seoResults.meta.description.content && result.seoResults.meta.description.isOptimal}
                />
                <DetailRow
                  label="OG Title"
                  value={result.seoResults.meta.ogTags.title ? 'OK' : 'Mangler'}
                  isGood={!!result.seoResults.meta.ogTags.title}
                />
                <DetailRow
                  label="OG Description"
                  value={result.seoResults.meta.ogTags.description ? 'OK' : 'Mangler'}
                  isGood={!!result.seoResults.meta.ogTags.description}
                />
                <DetailRow
                  label="OG Image"
                  value={result.seoResults.meta.ogTags.image ? 'OK' : 'Mangler'}
                  isGood={!!result.seoResults.meta.ogTags.image}
                />
                <DetailRow
                  label="Canonical URL"
                  value={result.seoResults.meta.canonical ? 'OK' : 'Mangler'}
                  isGood={!!result.seoResults.meta.canonical}
                />
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.sectionSubtitle}>Overskrifter & Media</Text>
                <DetailRow
                  label="H1-overskrift"
                  value={`${result.seoResults.headings.h1.count} stk`}
                  isGood={result.seoResults.headings.h1.count === 1}
                />
                <DetailRow
                  label="H2-overskrifter"
                  value={`${result.seoResults.headings.h2.count} stk`}
                  isGood={result.seoResults.headings.h2.count > 0}
                />
                <DetailRow
                  label="Overskriftshierarki"
                  value={result.seoResults.headings.hasProperHierarchy ? 'OK' : 'Feil'}
                  isGood={result.seoResults.headings.hasProperHierarchy}
                />
                <DetailRow
                  label="Bilder totalt"
                  value={`${result.seoResults.images.total} stk`}
                />
                <DetailRow
                  label="Bilder med alt-tekst"
                  value={`${result.seoResults.images.withAlt}/${result.seoResults.images.total}`}
                  isGood={result.seoResults.images.withoutAlt === 0}
                />
                <DetailRow
                  label="Interne lenker"
                  value={`${result.seoResults.links.internal.count} stk`}
                  isGood={result.seoResults.links.internal.count > 0}
                />
                <DetailRow
                  label="Eksterne lenker"
                  value={`${result.seoResults.links.external.count} stk`}
                />
              </View>
            </View>

            {/* H1 Content */}
            {result.seoResults.headings.h1.contents.length > 0 && (
              <>
                <Text style={[styles.sectionSubtitle, { marginTop: 10 }]}>H1-innhold</Text>
                {result.seoResults.headings.h1.contents.slice(0, 3).map((h1, i) => (
                  <View key={i} style={styles.bulletItem}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{h1}</Text>
                  </View>
                ))}
              </>
            )}

            {/* Meta content preview */}
            {result.seoResults.meta.title.content && (
              <>
                <Text style={[styles.sectionSubtitle, { marginTop: 10 }]}>Sidetittel</Text>
                <Text style={[styles.muted, { marginBottom: 6 }]}>{result.seoResults.meta.title.content}</Text>
              </>
            )}
            {result.seoResults.meta.description.content && (
              <>
                <Text style={styles.sectionSubtitle}>Meta-beskrivelse</Text>
                <Text style={styles.muted}>{result.seoResults.meta.description.content}</Text>
              </>
            )}
          </View>
        </View>

        {/* Content & Security side by side */}
        <View style={styles.grid2}>
          {/* Content Details */}
          <View style={[styles.card, { flex: 1 }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Innhold</Text>
              <Text style={[styles.badge, result.contentResults.score >= 80 ? styles.badgeGreen : result.contentResults.score >= 60 ? styles.badgeAmber : styles.badgeRed]}>
                {result.contentResults.score}/100
              </Text>
            </View>
            <View style={styles.cardBody}>
              <DetailRow
                label="Antall ord"
                value={`${result.contentResults.wordCount}`}
                isGood={result.contentResults.wordCount >= 300}
              />
              {result.contentResults.readability && (
                <>
                  <DetailRow
                    label="LIX-score"
                    value={`${result.contentResults.readability.lixScore}`}
                  />
                  <DetailRow
                    label="Lesbarhetsgrad"
                    value={result.contentResults.readability.lixLevel}
                  />
                  <DetailRow
                    label="Ord/setning"
                    value={`${result.contentResults.readability.avgWordsPerSentence.toFixed(1)}`}
                  />
                </>
              )}
            </View>
          </View>

          {/* Security Details */}
          <View style={[styles.card, { flex: 1 }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Sikkerhet</Text>
              <Text style={[styles.badge, result.securityResults.score >= 80 ? styles.badgeGreen : result.securityResults.score >= 60 ? styles.badgeAmber : styles.badgeRed]}>
                {result.securityResults.score}/100
              </Text>
            </View>
            <View style={styles.cardBody}>
              <DetailRow
                label="SSL-karakter"
                value={result.securityResults.ssl.grade || 'Ukjent'}
                isGood={['A', 'A+'].includes(result.securityResults.ssl.grade)}
              />
              <DetailRow
                label="Utløper om"
                value={result.securityResults.ssl.certificate.daysUntilExpiry ? `${result.securityResults.ssl.certificate.daysUntilExpiry} dager` : 'Ukjent'}
                isGood={(result.securityResults.ssl.certificate.daysUntilExpiry ?? 0) > 30}
              />
              <DetailRow
                label="Observatory"
                value={result.securityResults.observatory.grade || 'Ukjent'}
              />
              <DetailRow
                label="Headers-score"
                value={`${result.securityResults.headers.score}/100`}
                isGood={result.securityResults.headers.score >= 60}
              />
            </View>
          </View>
        </View>

        {/* PageSpeed / Performance */}
        {hasPerf && result.pageSpeedResults && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Ytelse (PageSpeed)</Text>
              <Text style={[styles.badge, perfScore >= 80 ? styles.badgeGreen : perfScore >= 60 ? styles.badgeAmber : styles.badgeRed]}>
                {perfScore}/100
              </Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.grid2}>
                <View style={styles.gridCol}>
                  <DetailRow label="Ytelse" value={`${result.pageSpeedResults.performance}`} isGood={result.pageSpeedResults.performance >= 80} />
                  <DetailRow label="Tilgjengelighet" value={`${result.pageSpeedResults.accessibility}`} isGood={result.pageSpeedResults.accessibility >= 80} />
                  <DetailRow label="Best Practices" value={`${result.pageSpeedResults.bestPractices}`} isGood={result.pageSpeedResults.bestPractices >= 80} />
                  <DetailRow label="SEO" value={`${result.pageSpeedResults.seo}`} isGood={result.pageSpeedResults.seo >= 80} />
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.sectionSubtitle}>Core Web Vitals</Text>
                  <DetailRow
                    label="LCP (Largest Contentful Paint)"
                    value={`${(result.pageSpeedResults.coreWebVitals.lcp / 1000).toFixed(2)}s`}
                    isGood={result.pageSpeedResults.coreWebVitals.lcp <= 2500}
                  />
                  <DetailRow
                    label="FID/TBT"
                    value={`${result.pageSpeedResults.coreWebVitals.fid}ms`}
                    isGood={result.pageSpeedResults.coreWebVitals.fid <= 100}
                  />
                  <DetailRow
                    label="CLS (Layout Shift)"
                    value={`${result.pageSpeedResults.coreWebVitals.cls.toFixed(3)}`}
                    isGood={result.pageSpeedResults.coreWebVitals.cls <= 0.1}
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generert av Analyseverktøy</Text>
          <Text style={styles.footerText}>{dateStr}</Text>
          <Text style={styles.footerText}>Side 1</Text>
        </View>
      </Page>

      {/* Page 2: Competitors & Keywords */}
      {((result.competitors && result.competitors.length > 0) || (result.keywordResearch && result.keywordResearch.length > 0)) && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Konkurrenter & Nøkkelord</Text>
            <Text style={styles.headerSubtitle}>{companyName || companyUrl}</Text>
          </View>

          {/* Competitors Table */}
          {result.competitors && result.competitors.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Konkurrentsammenligning</Text>
                <Text style={styles.muted}>{result.competitors.length} konkurrenter</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={styles.tableHeaderCellWide}>Nettside</Text>
                    <Text style={styles.tableHeaderCell}>Total</Text>
                    <Text style={styles.tableHeaderCell}>SEO</Text>
                    <Text style={styles.tableHeaderCell}>Innhold</Text>
                    <Text style={styles.tableHeaderCell}>Sikkerhet</Text>
                    {hasPerf && <Text style={styles.tableHeaderCell}>Hastighet</Text>}
                  </View>
                  {/* Your site */}
                  <View style={[styles.tableRow, { backgroundColor: colors.neutral[100] }]}>
                    <Text style={[styles.tableCellWide, { fontWeight: 'bold' }]}>{companyName || 'Din side'}</Text>
                    <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>{result.overallScore}</Text>
                    <Text style={styles.tableCell}>{result.seoResults.score}</Text>
                    <Text style={styles.tableCell}>{result.contentResults.score}</Text>
                    <Text style={styles.tableCell}>{result.securityResults.score}</Text>
                    {hasPerf && <Text style={styles.tableCell}>{perfScore}</Text>}
                  </View>
                  {/* Competitors */}
                  {result.competitors.map((c, i) => (
                    <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                      <Text style={styles.tableCellWide}>{new URL(c.url).hostname}</Text>
                      <Text style={styles.tableCell}>{c.results.overallScore}</Text>
                      <Text style={styles.tableCell}>{c.results.seoResults.score}</Text>
                      <Text style={styles.tableCell}>{c.results.contentResults.score}</Text>
                      <Text style={styles.tableCell}>{c.results.securityResults.score}</Text>
                      {hasPerf && <Text style={styles.tableCell}>{c.results.pageSpeedResults?.performance ?? '-'}</Text>}
                    </View>
                  ))}
                </View>

                {/* Summary */}
                {(() => {
                  const avgScore = Math.round(result.competitors.reduce((sum, c) => sum + c.results.overallScore, 0) / result.competitors.length);
                  const diff = result.overallScore - avgScore;
                  return (
                    <Text style={[styles.muted, { marginTop: 8 }]}>
                      {diff > 0 ? `Du ligger ${diff} poeng over` : diff < 0 ? `Du ligger ${Math.abs(diff)} poeng under` : 'Du ligger likt med'} konkurrentgjennomsnittet ({avgScore})
                    </Text>
                  );
                })()}
              </View>
            </View>
          )}

          {/* Keywords Table */}
          {result.keywordResearch && result.keywordResearch.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Nøkkelordanalyse</Text>
                <Text style={styles.muted}>{result.keywordResearch.length} nøkkelord</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={styles.tableHeaderCellWide}>Nøkkelord</Text>
                    <Text style={styles.tableHeaderCell}>Volum</Text>
                    <Text style={styles.tableHeaderCell}>CPC</Text>
                    <Text style={styles.tableHeaderCell}>Konkurranse</Text>
                    <Text style={styles.tableHeaderCell}>Vanskelighet</Text>
                    <Text style={styles.tableHeaderCell}>Intensjon</Text>
                  </View>
                  {result.keywordResearch.slice(0, 20).map((kw, i) => (
                    <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                      <Text style={styles.tableCellWide}>{kw.keyword}</Text>
                      <Text style={styles.tableCell}>{kw.searchVolume.toLocaleString()}</Text>
                      <Text style={styles.tableCell}>{kw.cpc}</Text>
                      <Text style={styles.tableCell}>{kw.competition}</Text>
                      <Text style={styles.tableCell}>{kw.difficulty}</Text>
                      <Text style={styles.tableCell}>
                        {kw.intent === 'transactional' ? 'Kjøp' :
                         kw.intent === 'commercial' ? 'Komm.' :
                         kw.intent === 'informational' ? 'Info' : 'Nav.'}
                      </Text>
                    </View>
                  ))}
                </View>
                {result.keywordResearch.length > 20 && (
                  <Text style={[styles.muted, { marginTop: 8 }]}>
                    Viser 20 av {result.keywordResearch.length} nøkkelord
                  </Text>
                )}
              </View>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Generert av Analyseverktøy</Text>
            <Text style={styles.footerText}>{dateStr}</Text>
            <Text style={styles.footerText}>Side 2</Text>
          </View>
        </Page>
      )}

      {/* Page 3: AI Analysis */}
      {result.aiSummary && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>AI-analyse</Text>
            <Text style={styles.headerSubtitle}>{companyName || companyUrl}</Text>
          </View>

          {/* Overall Assessment */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Helhetsvurdering</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.recDesc, { lineHeight: 1.5 }]}>{result.aiSummary.overallAssessment}</Text>
            </View>
          </View>

          {/* Key Findings */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Viktigste funn</Text>
            </View>
            <View style={styles.cardBody}>
              {result.aiSummary.keyFindings.slice(0, 10).map((finding, i) => {
                const text = typeof finding === 'object' && finding !== null
                  ? (finding as { text: string }).text
                  : String(finding);
                return (
                  <View key={i} style={styles.bulletItem}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{text}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Recommendations */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Anbefalinger</Text>
              <Text style={styles.muted}>{result.aiSummary.recommendations.length} anbefalinger</Text>
            </View>
            <View style={styles.cardBody}>
              {result.aiSummary.recommendations.slice(0, 8).map((rec, i) => {
                const priorityColor = rec.priority === 'high' ? colors.red : rec.priority === 'medium' ? colors.amber : colors.green;
                const priorityLabel = rec.priority === 'high' ? 'Høy prioritet' : rec.priority === 'medium' ? 'Medium prioritet' : 'Lav prioritet';
                return (
                  <View key={i} style={styles.recBlock}>
                    <Text style={[styles.recPriority, { color: priorityColor.text }]}>{priorityLabel}</Text>
                    <Text style={styles.recTitle}>{rec.title}</Text>
                    <Text style={styles.recDesc}>{rec.description}</Text>
                    {rec.expectedImpact && (
                      <Text style={[styles.muted, { marginTop: 4 }]}>Forventet effekt: {rec.expectedImpact}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Action Plan */}
          {result.aiSummary.actionPlan && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Handlingsplan</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.grid2}>
                  {result.aiSummary.actionPlan.immediate && result.aiSummary.actionPlan.immediate.length > 0 && (
                    <View style={styles.gridCol}>
                      <Text style={[styles.sectionSubtitle, { color: colors.red.text }]}>Umiddelbart</Text>
                      {result.aiSummary.actionPlan.immediate.slice(0, 5).map((item, i) => (
                        <View key={i} style={styles.bulletItem}>
                          <Text style={styles.bulletDot}>•</Text>
                          <Text style={styles.bulletText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {result.aiSummary.actionPlan.shortTerm && result.aiSummary.actionPlan.shortTerm.length > 0 && (
                    <View style={styles.gridCol}>
                      <Text style={[styles.sectionSubtitle, { color: colors.amber.text }]}>Kort sikt</Text>
                      {result.aiSummary.actionPlan.shortTerm.slice(0, 5).map((item, i) => (
                        <View key={i} style={styles.bulletItem}>
                          <Text style={styles.bulletDot}>•</Text>
                          <Text style={styles.bulletText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                {result.aiSummary.actionPlan.longTerm && result.aiSummary.actionPlan.longTerm.length > 0 && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={[styles.sectionSubtitle, { color: colors.green.text }]}>Lang sikt</Text>
                    {result.aiSummary.actionPlan.longTerm.slice(0, 5).map((item, i) => (
                      <View key={i} style={styles.bulletItem}>
                        <Text style={styles.bulletDot}>•</Text>
                        <Text style={styles.bulletText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Keyword Analysis from AI */}
          {result.aiSummary.keywordAnalysis && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>AI Nøkkelordvurdering</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.recDesc}>{result.aiSummary.keywordAnalysis.summary}</Text>
                {result.aiSummary.keywordAnalysis.primaryKeywords && result.aiSummary.keywordAnalysis.primaryKeywords.length > 0 && (
                  <>
                    <Text style={[styles.sectionSubtitle, { marginTop: 8 }]}>Primære nøkkelord</Text>
                    <Text style={styles.muted}>{result.aiSummary.keywordAnalysis.primaryKeywords.join(', ')}</Text>
                  </>
                )}
                {result.aiSummary.keywordAnalysis.missingKeywords && result.aiSummary.keywordAnalysis.missingKeywords.length > 0 && (
                  <>
                    <Text style={[styles.sectionSubtitle, { marginTop: 8 }]}>Manglende nøkkelord</Text>
                    <Text style={styles.muted}>{result.aiSummary.keywordAnalysis.missingKeywords.join(', ')}</Text>
                  </>
                )}
              </View>
            </View>
          )}

          {/* Competitor Comparison from AI */}
          {result.aiSummary.competitorComparison && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Konkurranseanalyse</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.recDesc}>{result.aiSummary.competitorComparison.summary}</Text>
                <View style={[styles.grid2, { marginTop: 10 }]}>
                  {result.aiSummary.competitorComparison.yourStrengths && result.aiSummary.competitorComparison.yourStrengths.length > 0 && (
                    <View style={styles.gridCol}>
                      <Text style={[styles.sectionSubtitle, { color: colors.green.text }]}>Dine styrker</Text>
                      {result.aiSummary.competitorComparison.yourStrengths.slice(0, 4).map((item, i) => (
                        <View key={i} style={styles.bulletItem}>
                          <Text style={styles.bulletDot}>+</Text>
                          <Text style={styles.bulletText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {result.aiSummary.competitorComparison.opportunities && result.aiSummary.competitorComparison.opportunities.length > 0 && (
                    <View style={styles.gridCol}>
                      <Text style={[styles.sectionSubtitle, { color: colors.amber.text }]}>Muligheter</Text>
                      {result.aiSummary.competitorComparison.opportunities.slice(0, 4).map((item, i) => (
                        <View key={i} style={styles.bulletItem}>
                          <Text style={styles.bulletDot}>→</Text>
                          <Text style={styles.bulletText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Generert av Analyseverktøy</Text>
            <Text style={styles.footerText}>{dateStr}</Text>
            <Text style={styles.footerText}>Side 3</Text>
          </View>
        </Page>
      )}

      {/* Page 4: AI Visibility (if available) */}
      {result.aiVisibility && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>AI-synlighet</Text>
            <Text style={styles.headerSubtitle}>{companyName || companyUrl}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Synlighet i AI-søk</Text>
              <Text style={[styles.badge, result.aiVisibility.score >= 80 ? styles.badgeGreen : result.aiVisibility.score >= 60 ? styles.badgeAmber : styles.badgeRed]}>
                {result.aiVisibility.score}/100
              </Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.recDesc}>{result.aiVisibility.description}</Text>
              {result.aiVisibility.details && (
                <View style={{ marginTop: 10 }}>
                  <DetailRow label="Spørringer testet" value={`${result.aiVisibility.details.queriesTested}`} />
                  <DetailRow label="Ganger nevnt" value={`${result.aiVisibility.details.timesMentioned}`} />
                </View>
              )}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Generert av Analyseverktøy</Text>
            <Text style={styles.footerText}>{dateStr}</Text>
            <Text style={styles.footerText}>Side 4</Text>
          </View>
        </Page>
      )}
    </Document>
  );
}

/**
 * Generate and download the analysis report as PDF
 */
export async function downloadAnalysisReportPdf(props: AnalysisReportPdfProps): Promise<void> {
  const blob = await pdf(<AnalysisReportPdf {...props} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = (props.companyName || props.companyUrl).replace(/[^a-zA-Z0-9]/g, '-').slice(0, 30);
  a.download = `analyserapport-${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
