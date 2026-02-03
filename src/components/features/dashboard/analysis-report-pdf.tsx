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
import { getScoreLabel } from '@/lib/utils/score-utils';

// Dashboard-aligned colors (Tailwind equivalents in hex)
const colors = {
  green: {
    bg: '#f0fdf4',
    border: '#bbf7d0',
    text: '#15803d',
    score: '#16a34a',
    label: '#14532d',
  },
  amber: {
    bg: '#fffbeb',
    border: '#fde68a',
    text: '#b45309',
    score: '#d97706',
    label: '#78350f',
  },
  red: {
    bg: '#fef2f2',
    border: '#fecaca',
    text: '#b91c1c',
    score: '#dc2626',
    label: '#7f1d1d',
  },
  neutral: {
    bg: '#fafafa',
    card: '#ffffff',
    border: '#e5e5e5',
    muted: '#737373',
    foreground: '#171717',
    body: '#404040',
    headerBg: '#f5f5f5',
  },
} as const;

function getScoreColors(score: number): typeof colors.green | typeof colors.amber | typeof colors.red {
  if (score >= 80) return colors.green;
  if (score >= 60) return colors.amber;
  return colors.red;
}

function getSummaryContent(score: number): { title: string; description: string } {
  if (score >= 80)
    return {
      title: 'Nettsiden din ser bra ut!',
      description: 'De viktigste elementene er på plass. Se gjennom detaljene under for ytterligere optimalisering.',
    };
  if (score >= 60)
    return {
      title: 'Nettsiden din har forbedringspotensial',
      description: 'Vi har funnet noen områder som kan forbedres for bedre synlighet i Google.',
    };
  return {
    title: 'Nettsiden din trenger oppmerksomhet',
    description: 'Det er flere viktige ting som bør fikses for at nettsiden skal fungere optimalt.',
  };
}

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontFamily: 'Helvetica',
    fontSize: 10,
    backgroundColor: colors.neutral.bg,
  },
  // Header / cover block
  headerCard: {
    backgroundColor: colors.neutral.card,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    padding: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.neutral.foreground,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 10,
    color: colors.neutral.muted,
    marginBottom: 4,
  },
  url: {
    fontSize: 9,
    color: colors.neutral.muted,
    marginTop: 4,
  },
  // Summary card (green/amber/red – style applied dynamically)
  summaryCard: {
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLeft: { flex: 1, paddingRight: 12 },
  summaryTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  summaryDesc: { fontSize: 9, lineHeight: 1.35 },
  summaryScoreWrap: { alignItems: 'flex-end' },
  summaryScore: { fontSize: 28, fontWeight: 'bold' },
  summaryScoreLabel: { fontSize: 9, color: colors.neutral.muted, marginTop: 2 },
  // Section block (white card)
  sectionCard: {
    backgroundColor: colors.neutral.card,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    padding: 16,
    marginTop: 16,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.neutral.foreground,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 9,
    color: colors.neutral.muted,
    marginBottom: 10,
  },
  // Score grid (small boxes)
  scoreRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 8 },
  scoreBox: {
    padding: 12,
    width: '18%',
    minWidth: 70,
    borderWidth: 1,
    alignItems: 'center',
  },
  scoreValue: { fontSize: 18, fontWeight: 'bold', color: colors.neutral.foreground },
  scoreLabel: { fontSize: 8, color: colors.neutral.muted, marginTop: 4 },
  scoreStatus: { fontSize: 8, marginTop: 2 },
  // Forbedringer list
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 4,
  },
  bulletDot: { marginRight: 6, color: colors.neutral.muted },
  bulletText: { fontSize: 10, color: colors.neutral.body, flex: 1 },
  // Tables
  table: { marginTop: 8, borderWidth: 1, borderColor: colors.neutral.border },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: colors.neutral.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
    backgroundColor: colors.neutral.card,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
    backgroundColor: colors.neutral.bg,
  },
  tableCell: { padding: 8, flex: 1, fontSize: 9 },
  tableCellWide: { padding: 8, flex: 2, fontSize: 9 },
  tableHeaderCell: {
    padding: 8,
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.neutral.foreground,
  },
  tableHeaderCellWide: {
    padding: 8,
    flex: 2,
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.neutral.foreground,
  },
  // AI / lists
  recBlock: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: colors.neutral.bg,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  recTitle: { fontSize: 10, fontWeight: 'bold', color: colors.neutral.foreground, marginBottom: 4 },
  recDesc: { fontSize: 9, color: colors.neutral.body, lineHeight: 1.4 },
  recBadge: { fontSize: 8, marginBottom: 4 },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 28,
    right: 28,
    fontSize: 8,
    color: colors.neutral.muted,
  },
});

export interface AnalysisReportPdfProps {
  result: DashboardAnalysisResult;
  companyUrl: string;
  companyName: string | null;
}

export function AnalysisReportPdf({ result, companyUrl, companyName }: AnalysisReportPdfProps) {
  const dateStr = new Date().toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const perfScore = result.pageSpeedResults?.performance ?? 0;
  const hasPerf = perfScore > 0;
  const summaryColors = getScoreColors(result.overallScore);
  const summaryContent = getSummaryContent(result.overallScore);

  const scores = [
    { label: 'Totalt', value: result.overallScore },
    { label: 'SEO', value: result.seoResults.score },
    { label: 'Innhold', value: result.contentResults.score },
    { label: 'Sikkerhet', value: result.securityResults.score },
    ...(hasPerf ? [{ label: 'Hastighet', value: perfScore }] : []),
  ] as const;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header card – same feel as dashboard */}
        <View style={styles.headerCard}>
          <Text style={styles.title}>Analyserapport</Text>
          <Text style={styles.subtitle}>
            {companyName || companyUrl} · {dateStr}
          </Text>
          <Text style={styles.url}>{companyUrl}</Text>
        </View>

        {/* Summary card – green/amber/red like SummaryCard */}
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: summaryColors.bg,
              borderColor: summaryColors.border,
            },
          ]}
        >
          <View style={styles.summaryLeft}>
            <Text style={[styles.summaryTitle, { color: summaryColors.label }]}>{summaryContent.title}</Text>
            <Text style={[styles.summaryDesc, { color: summaryColors.text }]}>{summaryContent.description}</Text>
          </View>
          <View style={styles.summaryScoreWrap}>
            <Text style={[styles.summaryScore, { color: summaryColors.score }]}>{result.overallScore}</Text>
            <Text style={styles.summaryScoreLabel}>av 100</Text>
          </View>
        </View>

        {/* Poengoversikt – score boxes with colored borders */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Poengoversikt</Text>
          <Text style={styles.sectionSubtitle}>Høyere poeng = bedre synlighet</Text>
          <View style={styles.scoreRow}>
            {scores.map(({ label, value }) => {
              const c = getScoreColors(value);
              return (
                <View
                  key={label}
                  style={[
                    styles.scoreBox,
                    { backgroundColor: c.bg, borderColor: c.border },
                  ]}
                >
                  <Text style={[styles.scoreValue, { color: c.score }]}>{value}</Text>
                  <Text style={styles.scoreLabel}>{label}</Text>
                  <Text style={[styles.scoreStatus, { color: c.text }]}>{getScoreLabel(value)}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Forbedringer */}
        {(() => {
          const issues: string[] = [];
          if (result.seoResults.headings.h1.count !== 1)
            issues.push(result.seoResults.headings.h1.count === 0 ? 'Mangler H1' : 'Flere H1-overskrifter');
          if (!result.seoResults.meta.title.content) issues.push('Mangler sidetittel');
          if (!result.seoResults.meta.description.content) issues.push('Mangler meta-beskrivelse');
          if (result.contentResults.wordCount < 300) issues.push('For lite innhold (under 300 ord)');
          if (issues.length === 0) return null;
          return (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Forbedringer (utvalg)</Text>
              {issues.map((issue, i) => (
                <View key={i} style={styles.bulletItem}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{issue}</Text>
                </View>
              ))}
            </View>
          );
        })()}

        {/* Konkurrenter */}
        {result.competitors && result.competitors.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Konkurrenter</Text>
            <Text style={styles.sectionSubtitle}>Sammenligning med dine konkurrenter</Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={styles.tableHeaderCellWide}>Nettside</Text>
                <Text style={styles.tableHeaderCell}>Totalt</Text>
                <Text style={styles.tableHeaderCell}>SEO</Text>
                <Text style={styles.tableHeaderCell}>Innhold</Text>
                <Text style={styles.tableHeaderCell}>Sikkerhet</Text>
                {hasPerf && <Text style={styles.tableHeaderCell}>Hastighet</Text>}
              </View>
              <View style={styles.tableRowAlt}>
                <Text style={styles.tableCellWide}>{companyName || companyUrl}</Text>
                <Text style={styles.tableCell}>{result.overallScore}</Text>
                <Text style={styles.tableCell}>{result.seoResults.score}</Text>
                <Text style={styles.tableCell}>{result.contentResults.score}</Text>
                <Text style={styles.tableCell}>{result.securityResults.score}</Text>
                {hasPerf && <Text style={styles.tableCell}>{perfScore}</Text>}
              </View>
              {result.competitors.map((c, i) => (
                <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={styles.tableCellWide}>{c.url}</Text>
                  <Text style={styles.tableCell}>{c.results.overallScore}</Text>
                  <Text style={styles.tableCell}>{c.results.seoResults.score}</Text>
                  <Text style={styles.tableCell}>{c.results.contentResults.score}</Text>
                  <Text style={styles.tableCell}>{c.results.securityResults.score}</Text>
                  {hasPerf && (
                    <Text style={styles.tableCell}>
                      {c.results.pageSpeedResults?.performance ?? '-'}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Nøkkelord */}
        {result.keywordResearch && result.keywordResearch.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Nøkkelord</Text>
            <Text style={styles.sectionSubtitle}>Nøkkelordsanalyse fra rapporten</Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={styles.tableHeaderCellWide}>Nøkkelord</Text>
                <Text style={styles.tableHeaderCell}>Volum</Text>
                <Text style={styles.tableHeaderCell}>CPC</Text>
                <Text style={styles.tableHeaderCell}>Konkurranse</Text>
                <Text style={styles.tableHeaderCell}>Intensjon</Text>
              </View>
              {result.keywordResearch.slice(0, 15).map((kw, i) => (
                <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={styles.tableCellWide}>{kw.keyword}</Text>
                  <Text style={styles.tableCell}>{kw.searchVolume}</Text>
                  <Text style={styles.tableCell}>{kw.cpc}</Text>
                  <Text style={styles.tableCell}>{kw.competition}</Text>
                  <Text style={styles.tableCell}>{kw.intent}</Text>
                </View>
              ))}
            </View>
            {result.keywordResearch.length > 15 && (
              <Text style={[styles.sectionSubtitle, { marginTop: 8 }]}>
                … og {result.keywordResearch.length - 15} nøkkelord til i analysen.
              </Text>
            )}
          </View>
        )}
      </Page>

      {/* Side 2: AI-analyse */}
      <Page size="A4" style={styles.page}>
        {result.aiSummary && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>AI-analyse</Text>
            <Text style={styles.sectionSubtitle}>AI-vurdering og anbefalinger</Text>

            <Text style={[styles.recTitle, { marginBottom: 8 }]}>Vurdering</Text>
            <Text style={[styles.recDesc, { marginBottom: 14 }]}>{result.aiSummary.overallAssessment}</Text>

            <Text style={[styles.recTitle, { marginBottom: 6 }]}>Viktigste funn</Text>
            {result.aiSummary.keyFindings.slice(0, 8).map((finding, i) => {
              const text =
                typeof finding === 'object' && finding !== null
                  ? (finding as { text: string }).text
                  : String(finding);
              return (
                <View key={i} style={styles.bulletItem}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{text}</Text>
                </View>
              );
            })}

            <Text style={[styles.recTitle, { marginTop: 14, marginBottom: 8 }]}>Anbefalinger</Text>
            {result.aiSummary.recommendations.slice(0, 6).map((rec, i) => {
              const badgeColor =
                rec.priority === 'high' ? colors.red : rec.priority === 'medium' ? colors.amber : colors.green;
              return (
                <View key={i} style={styles.recBlock}>
                  <Text style={[styles.recBadge, { color: badgeColor.text }]}>
                    {rec.priority === 'high' ? 'Høy' : rec.priority === 'medium' ? 'Medium' : 'Lav'} prioritet
                  </Text>
                  <Text style={styles.recTitle}>{rec.title}</Text>
                  <Text style={styles.recDesc}>{rec.description}</Text>
                </View>
              );
            })}
          </View>
        )}

        {result.aiVisibility && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>AI-synlighet</Text>
            <Text style={styles.sectionSubtitle}>Score: {result.aiVisibility.score}</Text>
            <Text style={[styles.recDesc, { marginBottom: 8 }]}>{result.aiVisibility.description}</Text>
            {result.aiVisibility.details && (
              <Text style={styles.recDesc}>
                Sjekket {result.aiVisibility.details.queriesTested} spørringer, nevnt{' '}
                {result.aiVisibility.details.timesMentioned} ganger.
              </Text>
            )}
          </View>
        )}

        <Text style={styles.footer}>
          Generert av Analyseverktøy · {dateStr} · {companyUrl}
        </Text>
      </Page>
    </Document>
  );
}

/**
 * Generate and download the analysis report as PDF. Call from dashboard when user clicks "Last ned rapport".
 */
export async function downloadAnalysisReportPdf(props: AnalysisReportPdfProps): Promise<void> {
  const blob = await pdf(<AnalysisReportPdf {...props} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analyserapport-${new Date().toISOString().slice(0, 10)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
