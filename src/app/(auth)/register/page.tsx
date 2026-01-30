'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import { Loader2, AlertCircle, CheckCircle2, Sparkles, BarChart3, Shield, Eye } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation
    if (!formData.email.trim()) {
      setError('E-post er påkrevd');
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

      // Sign up with redirect to auth callback
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: formData.name.trim() || undefined,
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

      // Check if user already exists (signUp returns user but no session for existing users)
      if (authData.user && !authData.session && authData.user.identities?.length === 0) {
        setError('Denne e-postadressen er allerede registrert. Prøv å logge inn.');
        setLoading(false);
        return;
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
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Opprett gratis konto</CardTitle>
        <CardDescription>
          Analyser hvilken som helst nettside på sekunder
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
            <Label htmlFor="name">Navn (valgfritt)</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Ola Nordmann"
              value={formData.name}
              onChange={handleChange}
            />
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

        {/* Feature highlights */}
        <div className="mt-6 pt-6 border-t">
          <p className="text-xs text-muted-foreground text-center mb-3">Med en gratis konto får du:</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <BarChart3 className="h-3.5 w-3.5 text-blue-500" />
              <span>3 analyser/mnd</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
              <span>AI-anbefalinger</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-green-500" />
              <span>Sikkerhetssjekk</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Eye className="h-3.5 w-3.5 text-cyan-500" />
              <span>AI-synlighet</span>
            </div>
          </div>
        </div>
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
