'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import { Loader2, AlertCircle, CheckCircle2, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;

      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (authError) {
        const msg = authError.message;
        setError(
          msg.toLowerCase().includes('recovery email')
            ? `${msg} Sjekk at e-post er registrert med passord (ikke bare GitHub), og at prosjektet har SMTP konfigurert under Authentication → SMTP i Supabase-dashboardet (standard er begrenset til 2 e-poster/time).`
            : msg
        );
        setLoading(false);
        return;
      }

      setSent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'En feil oppstod. Prøv igjen senere.';
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Sjekk e-posten din</CardTitle>
          <CardDescription>
            Vi har sendt en lenke for å tilbakestille passord til <strong className="text-neutral-700">{email}</strong>. Klikk på lenken i e-posten for å velge nytt passord.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-amber-200 bg-amber-50">
            <Mail className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Finner du ikke e-posten? Sjekk søppelpost eller spam-mappen.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/login">
            <Button variant="outline" className="border-neutral-300">
              Tilbake til innlogging
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Glemt passord?</CardTitle>
        <CardDescription>
          Skriv inn e-postadressen din, så sender vi deg en lenke for å tilbakestille passordet.
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
            <Label htmlFor="email">E-post</Label>
            <Input
              id="email"
              type="email"
              placeholder="din@epost.no"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full bg-neutral-900 hover:bg-neutral-800 text-white" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sender...
              </>
            ) : (
              'Send tilbakestillingslenke'
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          <Link href="/login" className="text-neutral-900 font-medium hover:underline">
            Tilbake til innlogging
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
