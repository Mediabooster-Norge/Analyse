'use client';

import { useState, useCallback, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import { CompanySearch } from '@/components/company-search';
import type { BregSearchResult } from '@/lib/services/breg';
import {
  isValidNorwegianPhone,
  normalizeNorwegianPhone,
} from '@/lib/utils/phone';
import { Loader2, AlertCircle, CheckCircle2, Globe } from 'lucide-react';

async function claimPreviewAnalysis(token: string): Promise<string | null> {
  const res = await fetch('/api/analyze/preview/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  const data = await res.json();
  if (!res.ok) return null;
  return (data.analysisId as string) ?? null;
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const previewToken = searchParams.get('preview')?.trim() || '';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
  });
  const [selectedCompany, setSelectedCompany] = useState<BregSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [previewWebsite, setPreviewWebsite] = useState<string | null>(null);

  useEffect(() => {
    if (!previewToken) return;
    fetch(`/api/analyze/preview/${previewToken}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.preview?.websiteName || data.preview?.websiteUrl) {
          const name =
            data.preview.websiteName ||
            data.preview.websiteUrl?.replace(/^https?:\/\//, '');
          setPreviewWebsite(name);
        }
      })
      .catch(() => {});
  }, [previewToken]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCompanySelect = useCallback((company: BregSearchResult | null) => {
    setSelectedCompany(company);
    if (company) setError(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!formData.name.trim()) {
      setError('Navn er påkrevd');
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError('E-post er påkrevd');
      setLoading(false);
      return;
    }

    if (!formData.phone.trim()) {
      setError('Telefonnummer er påkrevd');
      setLoading(false);
      return;
    }

    if (!isValidNorwegianPhone(formData.phone)) {
      setError('Oppgi et gyldig norsk telefonnummer (8 siffer)');
      setLoading(false);
      return;
    }

    if (!selectedCompany) {
      setError('Velg bedrift fra Brønnøysundregistrene');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passordene stemmer ikke overens');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Passordet må være minst 6 tegn');
      setLoading(false);
      return;
    }

    const normalizedPhone = normalizeNorwegianPhone(formData.phone);

    try {
      const validateResponse = await fetch('/api/breg/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgNumber: selectedCompany.orgNumber,
          companyName: selectedCompany.name,
        }),
      });

      const validateResult = (await validateResponse.json()) as {
        valid?: boolean;
        error?: string;
      };

      if (!validateResponse.ok || !validateResult.valid) {
        setError(validateResult.error || 'Kunne ikke verifisere bedriften');
        setLoading(false);
        return;
      }

      const supabase = createClient();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: formData.name.trim(),
            phone: normalizedPhone,
            company_name: selectedCompany.name,
            org_number: selectedCompany.orgNumber,
            company_address: selectedCompany.address || null,
            company_postal_code: selectedCompany.postalCode || null,
            company_city: selectedCompany.city || null,
            company_verified: true,
          },
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Denne e-postadressen er allerede registrert. Prøv å logge inn.');
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      if (authData.user && !authData.session && authData.user.identities?.length === 0) {
        setError('Denne e-postadressen er allerede registrert. Prøv å logge inn.');
        setLoading(false);
        return;
      }

      if (!authData.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email.trim(),
          password: formData.password,
        });

        if (signInError) {
          setNeedsEmailConfirmation(true);
          setSuccess(true);
          setLoading(false);
          return;
        }
      }

      setSuccess(true);

      let redirectPath = '/dashboard';
      if (previewToken) {
        const analysisId = await claimPreviewAnalysis(previewToken);
        if (analysisId) {
          redirectPath = `/dashboard?analysisId=${analysisId}`;
        }
      }

      setTimeout(() => {
        router.push(redirectPath);
      }, 1500);
    } catch (err) {
      setError('En feil oppstod. Prøv igjen senere.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-lg">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Velkommen!</h2>
            {needsEmailConfirmation ? (
              <>
                <p className="text-muted-foreground mb-4">
                  Vi har sendt en bekreftelseslenke til <strong>{formData.email}</strong>
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Klikk på lenken i e-posten for å aktivere kontoen din, så kan du logge inn.
                </p>
                <Link href="/login">
                  <Button variant="outline">Gå til innlogging</Button>
                </Link>
              </>
            ) : (
              <p className="text-muted-foreground">
                Kontoen din er opprettet. Du blir sendt til dashboardet...
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Opprett konto</CardTitle>
        <CardDescription>
          {previewWebsite
            ? `Lås opp full analyse av ${previewWebsite} med AI-forslag`
            : 'Få tilgang til din nettside-analyse og anbefalinger'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {previewWebsite && (
          <Alert className="mb-4 border-primary/20 bg-primary/5">
            <Globe className="h-4 w-4" />
            <AlertDescription>
              Analysen av <strong>{previewWebsite}</strong> venter – opprett konto for å se detaljer og AI-forslag.
            </AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Navn *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Ola Nordmann"
              value={formData.name}
              onChange={handleChange}
              required
              autoComplete="name"
            />
          </div>

          <CompanySearch
            onSelect={handleCompanySelect}
            requireBregSelection
            disabled={loading}
          />

          <div className="space-y-2">
            <Label htmlFor="phone">Telefon *</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="912 34 567"
              value={formData.phone}
              onChange={handleChange}
              required
              autoComplete="tel"
            />
            <p className="text-xs text-muted-foreground">Norsk nummer, 8 siffer</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-post *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="din@epost.no"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Passord *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Bekreft passord *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Oppretter konto...
              </>
            ) : (
              'Opprett konto'
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Har du allerede en konto?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Logg inn
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<Card className="w-full max-w-md"><CardContent className="pt-6 text-center text-muted-foreground">Laster…</CardContent></Card>}>
      <RegisterPageContent />
    </Suspense>
  );
}
