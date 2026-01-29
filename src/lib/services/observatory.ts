import type { ObservatoryAnalysis } from '@/types';

interface ObservatoryResponse {
  scan?: {
    grade: string;
    score: number;
  };
  tests?: Record<
    string,
    {
      pass: boolean;
      score_description: string;
    }
  >;
}

export async function analyzeSecurityHeaders(url: string): Promise<ObservatoryAnalysis> {
  const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;

  try {
    // Start scan
    const scanUrl = `https://http-observatory.security.mozilla.org/api/v1/analyze?host=${hostname}`;
    const scanResponse = await fetch(scanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'hidden=true&rescan=false',
    });

    if (!scanResponse.ok) {
      return getDefaultObservatoryResults();
    }

    const scanData = (await scanResponse.json()) as { state: string; scan_id?: number; grade?: string; score?: number };

    // Poll until complete (max 30 seconds)
    let attempts = 0;
    let grade = scanData.grade || 'Unknown';
    let score = scanData.score || 0;

    while (scanData.state !== 'FINISHED' && scanData.state !== 'FAILED' && attempts < 6) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const pollResponse = await fetch(scanUrl);
      const pollData = (await pollResponse.json()) as { state: string; grade?: string; score?: number };

      if (pollData.state === 'FINISHED') {
        grade = pollData.grade || 'Unknown';
        score = pollData.score || 0;
        break;
      }
      attempts++;
    }

    // Get test results
    const testsUrl = `https://http-observatory.security.mozilla.org/api/v1/getScanResults?scan=${scanData.scan_id}`;
    const testsResponse = await fetch(testsUrl);
    const testsData = (await testsResponse.json()) as ObservatoryResponse['tests'];

    const tests = testsData
      ? Object.entries(testsData).map(([name, result]) => ({
          name: formatTestName(name),
          pass: result.pass,
          description: result.score_description,
        }))
      : [];

    return {
      grade,
      score,
      tests,
    };
  } catch (error) {
    console.error('Observatory API error:', error);
    return getDefaultObservatoryResults();
  }
}

function getDefaultObservatoryResults(): ObservatoryAnalysis {
  return {
    grade: 'Unknown',
    score: 0,
    tests: [],
  };
}

function formatTestName(name: string): string {
  const nameMap: Record<string, string> = {
    'content-security-policy': 'Content Security Policy',
    'cookies': 'Secure Cookies',
    'cross-origin-resource-sharing': 'CORS',
    'public-key-pinning': 'Public Key Pinning',
    'redirection': 'Redirection',
    'referrer-policy': 'Referrer Policy',
    'strict-transport-security': 'HSTS',
    'subresource-integrity': 'Subresource Integrity',
    'x-content-type-options': 'X-Content-Type-Options',
    'x-frame-options': 'X-Frame-Options',
    'x-xss-protection': 'X-XSS-Protection',
  };
  return nameMap[name] || name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function analyzeSecurityHeadersSimple(
  headers: Record<string, string>
): Promise<{
  contentSecurityPolicy: boolean;
  strictTransportSecurity: boolean;
  xFrameOptions: boolean;
  xContentTypeOptions: boolean;
  referrerPolicy: boolean;
  permissionsPolicy: boolean;
  score: number;
}> {
  const checks = {
    contentSecurityPolicy: !!headers['content-security-policy'],
    strictTransportSecurity: !!headers['strict-transport-security'],
    xFrameOptions: !!headers['x-frame-options'],
    xContentTypeOptions: !!headers['x-content-type-options'],
    referrerPolicy: !!headers['referrer-policy'],
    permissionsPolicy: !!headers['permissions-policy'] || !!headers['feature-policy'],
  };

  const totalChecks = Object.keys(checks).length;
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedChecks / totalChecks) * 100);

  return { ...checks, score };
}

export function getObservatoryGradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'text-green-600';
  if (grade.startsWith('B')) return 'text-yellow-600';
  if (grade.startsWith('C')) return 'text-orange-600';
  return 'text-red-600';
}
