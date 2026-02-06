import type { SecurityResults, SecurityHeadersAnalysis } from '@/types';
import { analyzeSSLDirect, getSSLGradeScore } from '@/lib/services/ssl-labs';
import { analyzeSecurityHeadersSimple } from '@/lib/services/observatory';

export async function analyzeSecurity(
  url: string,
  headers: Record<string, string>
): Promise<SecurityResults> {
  // Run direct SSL check and headers analysis in parallel
  // Direct SSL check is fast (<1s) and gives us cert details, grade, and expiry
  const [ssl, headersAnalysis] = await Promise.all([
    analyzeSSLDirect(url),
    analyzeSecurityHeadersSimple(headers),
  ]);

  // Calculate overall security score
  const sslScore = getSSLGradeScore(ssl.grade);
  const headersScore = headersAnalysis.score;

  // Weighted average: SSL 55%, Headers 45%
  const score = Math.round(sslScore * 0.55 + headersScore * 0.45);

  return {
    ssl,
    headers: headersAnalysis,
    observatory: { grade: 'N/A', score: 0, tests: [] }, // Deprecated - kept for backwards compatibility
    score,
  };
}

export async function analyzeSecurityQuick(
  url: string,
  headers: Record<string, string>
): Promise<SecurityResults> {
  // Quick analysis without external APIs (for faster results)
  const headersAnalysis = await analyzeSecurityHeadersSimple(headers);

  const isHttps = url.startsWith('https://');

  // Basic SSL check
  const ssl = {
    grade: isHttps ? 'A (antatt)' : 'F',
    certificate: {
      issuer: null,
      validFrom: null,
      validTo: null,
      daysUntilExpiry: null,
    },
    protocols: [],
    vulnerabilities: [],
  };

  // Quick score: If HTTPS, assume decent SSL (70) + headers contribution
  const sslScore = isHttps ? 70 : 0;
  const score = Math.round(sslScore * 0.55 + headersAnalysis.score * 0.45);

  return {
    ssl,
    headers: headersAnalysis,
    observatory: { grade: 'N/A', score: 0, tests: [] }, // Deprecated
    score,
  };
}

export function getSecurityRecommendations(results: SecurityResults): string[] {
  const recommendations: string[] = [];

  // SSL recommendations
  if (!results.ssl.grade.startsWith('A')) {
    recommendations.push('Forbedre SSL-konfigurasjonen for bedre sikkerhet');
  }

  if (results.ssl.certificate.daysUntilExpiry !== null && results.ssl.certificate.daysUntilExpiry < 30) {
    recommendations.push(`SSL-sertifikatet utløper om ${results.ssl.certificate.daysUntilExpiry} dager - forny snart!`);
  }

  if (results.ssl.vulnerabilities.length > 0) {
    recommendations.push(`Fiks sikkerhetssårbarheter: ${results.ssl.vulnerabilities.join(', ')}`);
  }

  // Header recommendations
  if (!results.headers.contentSecurityPolicy) {
    recommendations.push('Legg til Content-Security-Policy header for å forhindre XSS-angrep');
  }

  if (!results.headers.strictTransportSecurity) {
    recommendations.push('Aktiver HSTS (Strict-Transport-Security) for å tvinge HTTPS');
  }

  if (!results.headers.xFrameOptions) {
    recommendations.push('Legg til X-Frame-Options header for å forhindre clickjacking');
  }

  if (!results.headers.xContentTypeOptions) {
    recommendations.push('Legg til X-Content-Type-Options: nosniff');
  }

  if (!results.headers.referrerPolicy) {
    recommendations.push('Definer en Referrer-Policy for å kontrollere hva som sendes i Referer-headeren');
  }

  return recommendations;
}

export function getSecurityGradeDescription(score: number): string {
  if (score >= 90) return 'Utmerket sikkerhet - nettsiden følger beste praksis';
  if (score >= 70) return 'God sikkerhet - noen forbedringer kan gjøres';
  if (score >= 50) return 'Middels sikkerhet - flere viktige forbedringer anbefales';
  if (score >= 30) return 'Svak sikkerhet - kritiske forbedringer nødvendig';
  return 'Dårlig sikkerhet - umiddelbar handling kreves';
}
