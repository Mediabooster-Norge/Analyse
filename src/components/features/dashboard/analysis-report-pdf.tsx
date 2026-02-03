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

const styles = StyleSheet.create({
  page: { padding: 32, fontFamily: 'Helvetica', fontSize: 10 },
  title: { fontSize: 18, marginBottom: 4, fontWeight: 'bold' },
  subtitle: { fontSize: 10, color: '#666', marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  sectionSubtitle: { fontSize: 9, color: '#666', marginBottom: 8 },
  row: { flexDirection: 'row', marginBottom: 4 },
  cell: { padding: 4, flex: 1 },
  cellHeader: { padding: 4, flex: 1, fontWeight: 'bold', backgroundColor: '#f5f5f5' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee' },
  bullet: { marginBottom: 4, paddingLeft: 8 },
  scoreBox: { padding: 8, marginRight: 8, marginBottom: 8, backgroundColor: '#f9f9f9', width: '18%' },
  scoreValue: { fontSize: 14, fontWeight: 'bold' },
  scoreLabel: { fontSize: 8, color: '#666', marginTop: 2 },
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Analyserapport</Text>
        <Text style={styles.subtitle}>
          {companyName || companyUrl} · {dateStr}
        </Text>
        <Text style={styles.subtitle}>{companyUrl}</Text>

        {/* Oversikt – poeng */}
        <Text style={styles.sectionTitle}>1. Oversikt – poeng</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreValue}>{result.overallScore}</Text>
            <Text style={styles.scoreLabel}>Totalt</Text>
            <Text style={styles.sectionSubtitle}>{getScoreLabel(result.overallScore)}</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreValue}>{result.seoResults.score}</Text>
            <Text style={styles.scoreLabel}>SEO</Text>
            <Text style={styles.sectionSubtitle}>{getScoreLabel(result.seoResults.score)}</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreValue}>{result.contentResults.score}</Text>
            <Text style={styles.scoreLabel}>Innhold</Text>
            <Text style={styles.sectionSubtitle}>{getScoreLabel(result.contentResults.score)}</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreValue}>{result.securityResults.score}</Text>
            <Text style={styles.scoreLabel}>Sikkerhet</Text>
            <Text style={styles.sectionSubtitle}>{getScoreLabel(result.securityResults.score)}</Text>
          </View>
          {hasPerf && (
            <View style={styles.scoreBox}>
              <Text style={styles.scoreValue}>{perfScore}</Text>
              <Text style={styles.scoreLabel}>Hastighet</Text>
              <Text style={styles.sectionSubtitle}>{getScoreLabel(perfScore)}</Text>
            </View>
          )}
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
            <>
              <Text style={styles.sectionTitle}>Forbedringer (utvalg)</Text>
              {issues.map((issue, i) => (
                <Text key={i} style={styles.bullet}>• {issue}</Text>
              ))}
            </>
          );
        })()}

        {/* Konkurrenter */}
        {result.competitors && result.competitors.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>2. Konkurrenter</Text>
            <View style={[styles.tableRow, styles.cellHeader]}>
              <Text style={[styles.cellHeader, { flex: 2 }]}>Nettside</Text>
              <Text style={styles.cellHeader}>Totalt</Text>
              <Text style={styles.cellHeader}>SEO</Text>
              <Text style={styles.cellHeader}>Innhold</Text>
              <Text style={styles.cellHeader}>Sikkerhet</Text>
              {hasPerf && <Text style={styles.cellHeader}>Hastighet</Text>}
            </View>
            <View style={[styles.tableRow, { backgroundColor: '#fafafa' }]}>
              <Text style={[styles.cell, { flex: 2, fontSize: 9 }]}>{companyName || companyUrl}</Text>
              <Text style={styles.cell}>{result.overallScore}</Text>
              <Text style={styles.cell}>{result.seoResults.score}</Text>
              <Text style={styles.cell}>{result.contentResults.score}</Text>
              <Text style={styles.cell}>{result.securityResults.score}</Text>
              {hasPerf && <Text style={styles.cell}>{perfScore}</Text>}
            </View>
            {result.competitors.map((c, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.cell, { flex: 2, fontSize: 9 }]}>{c.url}</Text>
                <Text style={styles.cell}>{c.results.overallScore}</Text>
                <Text style={styles.cell}>{c.results.seoResults.score}</Text>
                <Text style={styles.cell}>{c.results.contentResults.score}</Text>
                <Text style={styles.cell}>{c.results.securityResults.score}</Text>
                {hasPerf && (
                  <Text style={styles.cell}>
                    {c.results.pageSpeedResults?.performance ?? '-'}
                  </Text>
                )}
              </View>
            ))}
          </>
        )}

        {/* Nøkkelord */}
        {result.keywordResearch && result.keywordResearch.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>3. Nøkkelord</Text>
            <View style={[styles.tableRow, styles.cellHeader]}>
              <Text style={[styles.cellHeader, { flex: 2 }]}>Nøkkelord</Text>
              <Text style={styles.cellHeader}>Volum</Text>
              <Text style={styles.cellHeader}>CPC</Text>
              <Text style={styles.cellHeader}>Konkurranse</Text>
              <Text style={styles.cellHeader}>Intensjon</Text>
            </View>
            {result.keywordResearch.slice(0, 15).map((kw, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.cell, { flex: 2 }]}>{kw.keyword}</Text>
                <Text style={styles.cell}>{kw.searchVolume}</Text>
                <Text style={styles.cell}>{kw.cpc}</Text>
                <Text style={styles.cell}>{kw.competition}</Text>
                <Text style={styles.cell}>{kw.intent}</Text>
              </View>
            ))}
            {result.keywordResearch.length > 15 && (
              <Text style={styles.sectionSubtitle}>
                … og {result.keywordResearch.length - 15} nøkkelord til i analysen.
              </Text>
            )}
          </>
        )}
      </Page>

      {/* Side 2: AI-analyse (+ ev. AI-synlighet) */}
      <Page size="A4" style={styles.page}>
        {result.aiSummary && (
          <>
            <Text style={styles.sectionTitle}>4. AI-analyse</Text>
            <Text style={styles.sectionSubtitle}>AI-vurdering</Text>
            <Text style={styles.bullet}>{result.aiSummary.overallAssessment}</Text>

            <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Viktigste funn</Text>
            {result.aiSummary.keyFindings.slice(0, 8).map((finding, i) => {
              const text = typeof finding === 'object' && finding !== null
                ? (finding as { text: string }).text
                : String(finding);
              return <Text key={i} style={styles.bullet}>• {text}</Text>;
            })}

            <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Anbefalinger</Text>
            {result.aiSummary.recommendations.slice(0, 6).map((rec, i) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 10 }}>
                  [{rec.priority}] {rec.title}
                </Text>
                <Text style={styles.bullet}>{rec.description}</Text>
              </View>
            ))}
          </>
        )}

        {result.aiVisibility && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>5. AI-synlighet</Text>
            <Text style={styles.sectionSubtitle}>Score: {result.aiVisibility.score}</Text>
            <Text style={styles.bullet}>{result.aiVisibility.description}</Text>
            {result.aiVisibility.details && (
              <Text style={styles.bullet}>
                Sjekket {result.aiVisibility.details.queriesTested} spørringer, nevnt {result.aiVisibility.details.timesMentioned} ganger.
              </Text>
            )}
          </>
        )}

        <Text style={{ position: 'absolute', bottom: 20, left: 32, right: 32, fontSize: 8, color: '#999' }}>
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
