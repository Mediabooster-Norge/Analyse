'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { searchCompanies, formatOrgNumber, type BregSearchResult } from '@/lib/services/breg';
import { Building2, Loader2, Search, MapPin, Users, X } from 'lucide-react';

interface CompanySearchProps {
  onSelect: (company: BregSearchResult | null) => void;
  onManualInput?: (name: string) => void;
  initialValue?: string;
  disabled?: boolean;
  /** Krever valg fra Brønnøysundregistrene (ingen manuell registrering). */
  requireBregSelection?: boolean;
}

export function CompanySearch({
  onSelect,
  onManualInput,
  initialValue = '',
  disabled = false,
  requireBregSelection = false,
}: CompanySearchProps) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<BregSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<BregSearchResult | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (selectedCompany) return; // Don't search if a company is selected

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const searchResults = await searchCompanies(query, 8);
        setResults(searchResults);
        setIsOpen(searchResults.length > 0);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, selectedCompany]);

  // Notify parent of manual input (skipped when BREG selection is required)
  useEffect(() => {
    if (requireBregSelection || !onManualInput) return;
    if (!selectedCompany && query.length > 0) {
      onManualInput(query);
    }
  }, [query, selectedCompany, onManualInput, requireBregSelection]);

  const handleSelect = (company: BregSearchResult) => {
    setSelectedCompany(company);
    setQuery(company.name);
    setIsOpen(false);
    onSelect(company);
  };

  const handleClear = () => {
    setSelectedCompany(null);
    setQuery('');
    setResults([]);
    onSelect(null);
    onManualInput?.('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // If user is typing after selecting, clear selection
    if (selectedCompany && value !== selectedCompany.name) {
      setSelectedCompany(null);
      onSelect(null);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Label htmlFor="companySearch">Bedrift *</Label>
      <div className="relative mt-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <Input
          id="companySearch"
          type="text"
          placeholder={
            requireBregSelection
              ? "Søk og velg bedrift fra Brønnøysundregistrene..."
              : "Søk etter bedrift eller skriv inn navn..."
          }
          value={query}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && !selectedCompany && setIsOpen(true)}
          disabled={disabled}
          className="pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 animate-spin" />
        )}
        {selectedCompany && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Selected company badge */}
      {selectedCompany && (
        <div className="mt-2 p-3 bg-[#0f515a]/10 border border-[#0f515a]/30 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-[#0f515a] mt-0.5" />
              <div>
                <div className="font-medium text-[#0f515a]">{selectedCompany.name}</div>
                <div className="text-sm text-[#0f515a]">
                  Org.nr: {formatOrgNumber(selectedCompany.orgNumber)}
                </div>
                {selectedCompany.address && (
                  <div className="text-sm text-[#0f515a]">
                    {selectedCompany.address}, {selectedCompany.postalCode} {selectedCompany.city}
                  </div>
                )}
              </div>
            </div>
            <Badge variant="secondary" className="bg-[#0f515a]/15 text-[#0f515a]">
              Verifisert
            </Badge>
          </div>
        </div>
      )}

      {/* Search results dropdown */}
      {isOpen && results.length > 0 && !selectedCompany && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          <div className="p-2 border-b border-neutral-100">
            <span className="text-xs text-neutral-500">
              Resultater fra Brønnøysundregistrene
            </span>
          </div>
          {results.map((company) => (
            <button
              key={company.orgNumber}
              type="button"
              onClick={() => handleSelect(company)}
              className="w-full text-left px-4 py-3 hover:bg-neutral-50 border-b border-neutral-100 last:border-0 transition-colors"
            >
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-neutral-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-neutral-900 truncate">
                    {company.name}
                  </div>
                  <div className="text-sm text-neutral-500">
                    Org.nr: {formatOrgNumber(company.orgNumber)}
                    {company.organizationType && ` · ${company.organizationType}`}
                  </div>
                  {company.address && (
                    <div className="flex items-center gap-1 text-sm text-neutral-400 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">
                        {company.address}, {company.postalCode} {company.city}
                      </span>
                    </div>
                  )}
                  {company.employeeCount > 0 && (
                    <div className="flex items-center gap-1 text-sm text-neutral-400">
                      <Users className="w-3 h-3" />
                      <span>{company.employeeCount} ansatte</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && results.length === 0 && query.length >= 2 && !isLoading && !selectedCompany && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg p-4">
          <div className="text-sm text-neutral-500 text-center">
            <p>
              {requireBregSelection
                ? "Ingen bedrifter funnet. Prøv et annet søk eller sjekk stavemåten."
                : "Ingen bedrifter funnet i Brønnøysundregistrene"}
            </p>
            {!requireBregSelection && (
              <p className="text-xs mt-2">Du kan fortsatt registrere med bedriftsnavnet du skrev inn</p>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-neutral-500 mt-2">
        {requireBregSelection
          ? "Velg bedriften din fra listen – vi henter og verifiserer data fra Brønnøysundregistrene."
          : "Søk etter bedriften din for å automatisk fylle ut informasjon fra Brønnøysundregistrene"}
      </p>
    </div>
  );
}
