/**
 * Brønnøysundregistrene (BREG) API Service
 * 
 * Gratis API for å søke opp norske bedrifter
 * Dokumentasjon: https://data.brreg.no/enhetsregisteret/api/docs/index.html
 */

// ============================================================================
// Types
// ============================================================================

export interface BregCompany {
  organisasjonsnummer: string;
  navn: string;
  organisasjonsform?: {
    kode: string;
    beskrivelse: string;
  };
  hjemmeside?: string;
  registreringsdatoEnhetsregisteret?: string;
  registrertIMvaregisteret?: boolean;
  naeringskode1?: {
    kode: string;
    beskrivelse: string;
  };
  antallAnsatte?: number;
  forretningsadresse?: {
    adresse?: string[];
    postnummer?: string;
    poststed?: string;
    kommunenummer?: string;
    kommune?: string;
    landkode?: string;
    land?: string;
  };
  postadresse?: {
    adresse?: string[];
    postnummer?: string;
    poststed?: string;
    kommunenummer?: string;
    kommune?: string;
    landkode?: string;
    land?: string;
  };
}

export interface BregSearchResponse {
  _embedded?: {
    enheter: BregCompany[];
  };
  _links?: {
    self: { href: string };
    first?: { href: string };
    next?: { href: string };
  };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export interface BregSearchResult {
  orgNumber: string;
  name: string;
  organizationType: string;
  address: string;
  postalCode: string;
  city: string;
  industry: string;
  employeeCount: number;
  website: string | null;
}

// ============================================================================
// API Functions
// ============================================================================

const BREG_API_BASE = 'https://data.brreg.no/enhetsregisteret/api';

/**
 * Søk etter bedrifter i Brønnøysundregistrene
 * @param query - Søkestreng (bedriftsnavn)
 * @param size - Antall resultater (default 10)
 */
export async function searchCompanies(query: string, size: number = 10): Promise<BregSearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      navn: query.trim(),
      size: size.toString(),
    });

    const response = await fetch(`${BREG_API_BASE}/enheter?${params}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('BREG API error:', response.status, response.statusText);
      return [];
    }

    const data: BregSearchResponse = await response.json();

    if (!data._embedded?.enheter) {
      return [];
    }

    return data._embedded.enheter.map(mapBregCompanyToResult);
  } catch (error) {
    console.error('BREG search error:', error);
    return [];
  }
}

/**
 * Hent en spesifikk bedrift basert på organisasjonsnummer
 * @param orgNumber - 9-sifret organisasjonsnummer
 */
export async function getCompanyByOrgNumber(orgNumber: string): Promise<BregSearchResult | null> {
  // Fjern mellomrom og valider
  const cleanOrgNumber = orgNumber.replace(/\s/g, '');
  
  if (!/^\d{9}$/.test(cleanOrgNumber)) {
    return null;
  }

  try {
    const response = await fetch(`${BREG_API_BASE}/enheter/${cleanOrgNumber}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      console.error('BREG API error:', response.status, response.statusText);
      return null;
    }

    const data: BregCompany = await response.json();
    return mapBregCompanyToResult(data);
  } catch (error) {
    console.error('BREG lookup error:', error);
    return null;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapBregCompanyToResult(company: BregCompany): BregSearchResult {
  const address = company.forretningsadresse || company.postadresse;
  
  return {
    orgNumber: company.organisasjonsnummer,
    name: company.navn,
    organizationType: company.organisasjonsform?.beskrivelse || '',
    address: address?.adresse?.join(', ') || '',
    postalCode: address?.postnummer || '',
    city: address?.poststed || '',
    industry: company.naeringskode1?.beskrivelse || '',
    employeeCount: company.antallAnsatte || 0,
    website: company.hjemmeside || null,
  };
}

/**
 * Formater organisasjonsnummer med mellomrom (123 456 789)
 */
export function formatOrgNumber(orgNumber: string): string {
  const clean = orgNumber.replace(/\s/g, '');
  if (clean.length !== 9) return orgNumber;
  return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)}`;
}

/**
 * Valider organisasjonsnummer (9 siffer)
 */
export function isValidOrgNumber(orgNumber: string): boolean {
  const clean = orgNumber.replace(/\s/g, '');
  return /^\d{9}$/.test(clean);
}
