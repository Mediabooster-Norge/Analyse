'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import { CompanySearch } from '@/components/company-search';
import { type BregSearchResult } from '@/lib/services/breg';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  orgNumber: string | null;
  websiteUrl: string;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  industry: string | null;
  employeeCount: string | null;
  phone: string;
  contactPerson: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlFromQuery = searchParams.get('url') || '';

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    orgNumber: null,
    websiteUrl: urlFromQuery,
    address: null,
    postalCode: null,
    city: null,
    industry: null,
    employeeCount: null,
    phone: '',
    contactPerson: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Handle company selection from BREG search
  const handleCompanySelect = useCallback((company: BregSearchResult | null) => {
    if (company) {
      setFormData((prev) => ({
        ...prev,
        companyName: company.name,
        orgNumber: company.orgNumber,
        address: company.address || null,
        postalCode: company.postalCode || null,
        city: company.city || null,
        industry: company.industry || null,
        employeeCount: company.employeeCount > 0 ? String(company.employeeCount) : null,
        // Auto-fill website if available from BREG
        websiteUrl: company.website || prev.websiteUrl,
      }));
    } else {
      // Clear BREG-specific fields when deselected
      setFormData((prev) => ({
        ...prev,
        orgNumber: null,
        address: null,
        postalCode: null,
        city: null,
        industry: null,
        employeeCount: null,
      }));
    }
  }, []);

  // Handle manual company name input
  const handleManualCompanyInput = useCallback((name: string) => {
    setFormData((prev) => ({
      ...prev,
      companyName: name,
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation - Required fields
    if (!formData.email.trim()) {
      setError('E-post er påkrevd');
      setLoading(false);
      return;
    }

    if (!formData.companyName.trim()) {
      setError('Bedriftsnavn er påkrevd');
      setLoading(false);
      return;
    }

    if (!formData.websiteUrl.trim()) {
      setError('Nettside URL er påkrevd');
      setLoading(false);
      return;
    }

    // Validate URL format
    try {
      const url = new URL(formData.websiteUrl.startsWith('http') ? formData.websiteUrl : `https://${formData.websiteUrl}`);
      if (!url.hostname.includes('.')) {
        throw new Error('Invalid domain');
      }
    } catch {
      setError('Ugyldig nettside URL. Eksempel: https://dinbedrift.no');
      setLoading(false);
      return;
    }

    // Password validation
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

    try {
      const supabase = createClient();

      // Normalize URL
      let normalizedUrl = formData.websiteUrl.trim();
      if (!normalizedUrl.startsWith('http')) {
        normalizedUrl = `https://${normalizedUrl}`;
      }

      // Sign up with redirect to auth callback
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      console.log('SignUp result - User ID:', authData?.user?.id, 'Session:', !!authData?.session);

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Denne e-postadressen er allerede registrert. Prøv å logge inn.');
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      // Check if user already exists (signUp returns user but no session for existing users)
      if (authData.user && !authData.session && authData.user.identities?.length === 0) {
        setError('Denne e-postadressen er allerede registrert. Prøv å logge inn.');
        setLoading(false);
        return;
      }

      if (authData.user) {
        // Create company with retry logic (auth.users replication can be slow)
        let companyError = null;
        const maxRetries = 3;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          // Wait before attempt (longer each time)
          await new Promise(resolve => setTimeout(resolve, attempt * 500));
          
          const { error } = await supabase.rpc('create_company', {
            p_user_id: authData.user.id,
            p_name: formData.companyName.trim(),
            p_website_url: normalizedUrl,
            p_org_number: formData.orgNumber || null,
            p_address: formData.address || null,
            p_postal_code: formData.postalCode || null,
            p_city: formData.city || null,
            p_industry: formData.industry || null,
            p_employee_count: formData.employeeCount || null,
            p_phone: formData.phone.trim() || null,
            p_contact_person: formData.contactPerson.trim() || null,
          });
          
          if (!error) {
            companyError = null;
            break;
          }
          
          // If it's a foreign key error, retry (user not replicated yet)
          if (error.code === '23503' && attempt < maxRetries) {
            console.log(`Retry ${attempt}/${maxRetries} - waiting for user replication...`);
            continue;
          }
          
          companyError = error;
          break;
        }

        if (companyError) {
          console.error('Company creation error:', JSON.stringify(companyError, null, 2));
          
          // Parse custom error messages from database function
          const errorMessage = companyError.message || '';
          if (errorMessage.includes('COMPANY_EXISTS_ORG')) {
            setError('Bedriften med dette organisasjonsnummeret er allerede registrert. Prøv å logge inn.');
          } else if (errorMessage.includes('COMPANY_EXISTS_URL')) {
            setError('En bedrift med denne nettsiden er allerede registrert. Prøv å logge inn.');
          } else if (companyError.code === 'PGRST202' || errorMessage.includes('function') || errorMessage.includes('does not exist')) {
            setError('Database-funksjonen mangler. Kjør SQL-scriptet i Supabase.');
          } else if (companyError.code === '23503') {
            setError('Brukeropprettelse tok for lang tid. Bekreft e-posten din og logg inn for å fullføre registreringen.');
          } else {
            setError(`Feil: ${errorMessage || companyError.code || 'Ukjent feil'}`);
          }
          setLoading(false);
          return;
        }
      }

      // If email confirmation is enabled, session will be null
      // Sign in the user automatically so they can access dashboard
      if (!authData.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email.trim(),
          password: formData.password,
        });
        
        if (signInError) {
          // Sign in failed - email confirmation is required
          setNeedsEmailConfirmation(true);
          setSuccess(true);
          setLoading(false);
          return;
        }
      }

      // Successfully signed in - redirect to dashboard
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
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
      <Card className="w-full max-w-md">
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
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Registrer bedriften din</CardTitle>
        <CardDescription>
          Opprett en gratis konto for å få din komplette nettside-analyse
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

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
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-4">Bedriftsinformasjon</p>

            <div className="space-y-4">
              {/* Company Search with BREG integration */}
              <CompanySearch
                onSelect={handleCompanySelect}
                onManualInput={handleManualCompanyInput}
                disabled={loading}
              />

              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Nettside URL *</Label>
                <Input
                  id="websiteUrl"
                  name="websiteUrl"
                  placeholder="https://dinbedrift.no"
                  value={formData.websiteUrl}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Kontaktperson</Label>
                  <Input
                    id="contactPerson"
                    name="contactPerson"
                    placeholder="Ola Nordmann"
                    value={formData.contactPerson}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+47 123 45 678"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
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
