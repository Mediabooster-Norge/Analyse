import type { SSLAnalysis } from '@/types';
import https from 'https';

interface SSLLabsResponse {
  status: string;
  endpoints?: Array<{
    grade: string;
    details?: {
      cert?: {
        issuerSubject: string;
        notBefore: number;
        notAfter: number;
      };
      protocols?: Array<{
        name: string;
        version: string;
      }>;
      vulnBeast?: boolean;
      poodle?: boolean;
      heartbleed?: boolean;
    };
  }>;
}

export async function analyzeSSL(url: string): Promise<SSLAnalysis> {
  const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;

  try {
    console.log(`[SSL] Starting analysis for ${hostname}...`);
    
    // Start assessment (use cache if available within 72 hours)
    const startUrl = `https://api.ssllabs.com/api/v3/analyze?host=${hostname}&startNew=off&fromCache=on&maxAge=72`;
    let response = await fetch(startUrl);
    let data = (await response.json()) as SSLLabsResponse;
    
    console.log(`[SSL] Initial status: ${data.status}`);

    // Poll until complete (max 120 seconds = 24 attempts * 5 seconds)
    let attempts = 0;
    const maxAttempts = 24;
    
    while (data.status !== 'READY' && data.status !== 'ERROR' && attempts < maxAttempts) {
      console.log(`[SSL] Polling attempt ${attempts + 1}/${maxAttempts}, status: ${data.status}`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const pollUrl = `https://api.ssllabs.com/api/v3/analyze?host=${hostname}`;
      response = await fetch(pollUrl);
      data = (await response.json()) as SSLLabsResponse;
      attempts++;
    }

    console.log(`[SSL] Final status: ${data.status}, endpoints: ${data.endpoints?.length || 0}`);

    if (data.status === 'ERROR') {
      console.error('[SSL] API returned ERROR status');
      return getDefaultSSLResults('Error');
    }
    
    if (!data.endpoints || data.endpoints.length === 0) {
      console.warn('[SSL] No endpoints found');
      return getDefaultSSLResults('No data');
    }

    const endpoint = data.endpoints[0];
    const cert = endpoint.details?.cert;
    const protocols = endpoint.details?.protocols || [];

    // Calculate days until expiry
    let daysUntilExpiry: number | null = null;
    if (cert?.notAfter) {
      const expiryDate = new Date(cert.notAfter);
      const now = new Date();
      daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Collect vulnerabilities
    const vulnerabilities: string[] = [];
    if (endpoint.details?.vulnBeast) vulnerabilities.push('BEAST');
    if (endpoint.details?.poodle) vulnerabilities.push('POODLE');
    if (endpoint.details?.heartbleed) vulnerabilities.push('Heartbleed');

    return {
      grade: endpoint.grade || 'Unknown',
      certificate: {
        issuer: cert?.issuerSubject || null,
        validFrom: cert?.notBefore ? new Date(cert.notBefore).toISOString() : null,
        validTo: cert?.notAfter ? new Date(cert.notAfter).toISOString() : null,
        daysUntilExpiry,
      },
      protocols: protocols.map((p) => `${p.name} ${p.version}`),
      vulnerabilities,
    };
  } catch (error) {
    console.error('[SSL] API error:', error);
    return getDefaultSSLResults('API feil');
  }
}

function getDefaultSSLResults(reason: string = 'Unknown'): SSLAnalysis {
  return {
    grade: `Ukjent (${reason})`,
    certificate: {
      issuer: null,
      validFrom: null,
      validTo: null,
      daysUntilExpiry: null,
    },
    protocols: [],
    vulnerabilities: [],
  };
}

// Fast direct SSL check (fallback when SSL Labs is slow)
export async function analyzeSSLDirect(url: string): Promise<SSLAnalysis> {
  const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;

  return new Promise((resolve) => {
    let resolved = false;
    // Guard against multiple resolve calls (timeout + error after destroy)
    const done = (result: SSLAnalysis) => {
      if (!resolved) {
        resolved = true;
        console.log(`[SSL Direct] ${hostname} → grade: ${result.grade}, issuer: ${result.certificate.issuer ?? 'n/a'}, days: ${result.certificate.daysUntilExpiry ?? 'n/a'}`);
        resolve(result);
      }
    };

    // Cert is captured in secureConnect – before HTTP response arrives.
    // This is critical for slow servers: the TLS handshake completes quickly
    // even when the server takes several seconds to send the HTTP response.
    let earlyCert: SSLAnalysis | null = null;

    const options = {
      hostname,
      port: 443,
      method: 'HEAD',
      rejectUnauthorized: false, // Allow self-signed for analysis
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      res.resume(); // consume and discard the body so the socket can close
      if (earlyCert) {
        done(earlyCert);
        return;
      }
      // Fallback: try reading cert from the response socket
      const socket = res.socket as import('tls').TLSSocket;
      const cert = socket.getPeerCertificate(true);
      if (!cert || Object.keys(cert).length === 0) {
        done(getDefaultSSLResults('Ingen sertifikat'));
        return;
      }
      done(buildSSLResult(cert, socket));
    });

    // secureConnect fires as soon as the TLS handshake completes,
    // well before the HTTP response – reliable even on slow servers.
    req.on('socket', (rawSocket) => {
      const socket = rawSocket as import('tls').TLSSocket;
      socket.on('secureConnect', () => {
        const cert = socket.getPeerCertificate(true);
        if (cert && Object.keys(cert).length > 0) {
          earlyCert = buildSSLResult(cert, socket);
        }
      });
    });

    req.on('error', (error) => {
      console.error('[SSL Direct] Error:', error.message);
      // If we already have the cert (e.g. destroy() was called after timeout),
      // prefer that over a generic error result.
      done(earlyCert ?? getDefaultSSLResults('Tilkobling feilet'));
    });

    req.on('timeout', () => {
      req.destroy(); // triggers 'error' event; done() guard handles it
      done(earlyCert ?? getDefaultSSLResults('Timeout'));
    });

    req.end();
  });
}

function buildSSLResult(
  cert: import('tls').PeerCertificate,
  socket: import('tls').TLSSocket
): SSLAnalysis {
  const validTo = new Date(cert.valid_to);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  let grade = 'B';
  if (daysUntilExpiry < 0) {
    grade = 'F';
  } else if (daysUntilExpiry < 7) {
    grade = 'C';
  } else if (daysUntilExpiry < 30) {
    grade = 'B-';
  } else if (socket.authorized) {
    grade = 'A';
  }

  const issuer = (cert.issuer as unknown as Record<string, string>);

  return {
    grade,
    certificate: {
      issuer: issuer?.O || issuer?.CN || null,
      validFrom: cert.valid_from ? new Date(cert.valid_from).toISOString() : null,
      validTo: validTo.toISOString(),
      daysUntilExpiry,
    },
    protocols: [socket.getProtocol() || 'TLS'],
    vulnerabilities: [],
  };
}

export function getSSLGradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'text-green-600';
  if (grade.startsWith('B')) return 'text-yellow-600';
  if (grade.startsWith('C')) return 'text-orange-600';
  return 'text-red-600';
}

export function getSSLGradeScore(grade: string): number {
  // Handle grades that start with the letter
  if (grade.startsWith('A+')) return 100;
  if (grade.startsWith('A-')) return 90;
  if (grade.startsWith('A')) return 95;
  if (grade.startsWith('B+')) return 85;
  if (grade.startsWith('B-')) return 75;
  if (grade.startsWith('B')) return 80;
  if (grade.startsWith('C+')) return 70;
  if (grade.startsWith('C-')) return 60;
  if (grade.startsWith('C')) return 65;
  if (grade.startsWith('D')) return 50;
  if (grade.startsWith('E')) return 40;
  if (grade.startsWith('F')) return 20;
  if (grade.startsWith('T')) return 10;
  
  // Unknown/error cases
  return 50; // Give benefit of doubt for unknown
}
