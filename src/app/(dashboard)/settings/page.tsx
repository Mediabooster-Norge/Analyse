'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  User,
  Globe,
  Mail,
  Phone,
  Crown,
  ArrowRight,
  BarChart3,
  FileText,
  Layers,
  Sparkles,
  LogOut,
  Save,
  Loader2,
  CheckCircle2,
  Zap,
  RefreshCw,
  Users,
  TrendingUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePremium, getPremiumLimits } from '@/hooks/usePremium';

interface UserData {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
  });
  
  // Premium status
  const { isPremium, loading: premiumLoading } = usePremium();
  const limits = getPremiumLimits(isPremium);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      
      // Get user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/login');
        return;
      }
      
      const fullName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || '';
      const phone = authUser.user_metadata?.phone || '';
      
      setUser({
        id: authUser.id,
        email: authUser.email || '',
        fullName,
        phone,
      });
      
      setFormData({
        fullName,
        phone,
      });

      // Get analysis count for this month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const { data: analyses } = await supabase
        .from('analyses')
        .select('id')
        .eq('user_id', authUser.id)
        .gte('created_at', firstDayOfMonth);
      
      setAnalysisCount(analyses?.length || 0);
      setLoading(false);
    }

    fetchData();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();

    // Update both auth.users metadata AND user_profiles table
    const [authResult, profileResult] = await Promise.all([
      // Update auth metadata (for session)
      supabase.auth.updateUser({
        data: {
          full_name: formData.fullName || null,
          phone: formData.phone || null,
        },
      }),
      // Update user_profiles table (for lead generation)
      supabase.rpc('update_user_profile', {
        p_full_name: formData.fullName || null,
        p_phone: formData.phone || null,
      }),
    ]);

    if (authResult.error || profileResult.error) {
      toast.error('Kunne ikke lagre endringene');
      console.error('Error updating user:', authResult.error || profileResult.error);
    } else {
      toast.success('Endringene er lagret');
      setUser(prev => prev ? {
        ...prev,
        fullName: formData.fullName || undefined,
        phone: formData.phone || undefined,
      } : null);
    }
    
    setSaving(false);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    // Clear session storage cache
    sessionStorage.clear();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Innstillinger</h1>
          <p className="text-neutral-500">Administrer kontoen din</p>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48 mb-6" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Innstillinger</h1>
        <p className="text-neutral-500">Administrer kontoen din</p>
      </div>

      {/* Account Info */}
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        <div className="p-6 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
              <User className="h-5 w-5 text-neutral-700" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900">Konto</h3>
              <p className="text-sm text-neutral-500">Din kontoinformasjon</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Email - Read only */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-50">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-neutral-200">
              <Mail className="h-5 w-5 text-neutral-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium">E-post</p>
              <p className="font-medium text-neutral-900">{user?.email}</p>
            </div>
          </div>

          <Separator className="bg-neutral-100" />

          {/* Editable fields */}
          <div className="space-y-4">
            <h4 className="font-medium text-neutral-900">Profilinformasjon</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-neutral-700">Navn</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Ola Nordmann"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="border-neutral-200 focus:border-neutral-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-neutral-700">Telefon</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+47 123 45 678"
                  value={formData.phone}
                  onChange={handleChange}
                  className="border-neutral-200 focus:border-neutral-400"
                />
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="bg-neutral-900 hover:bg-neutral-800 text-white">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Lagrer...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Lagre endringer
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Premium Status */}
      <div className={`rounded-2xl border overflow-hidden ${isPremium ? 'border-neutral-200 bg-neutral-50/50' : 'border-neutral-200 bg-white'}`}>
        <div className={`p-6 border-b ${isPremium ? 'border-neutral-100' : 'border-neutral-100'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isPremium ? 'bg-neutral-900 text-white' : 'bg-neutral-100'}`}>
                <Crown className={`h-6 w-6 ${isPremium ? 'text-white' : 'text-neutral-700'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">{isPremium ? 'Premium-abonnement' : 'Gratis-plan'}</h3>
                <p className="text-sm text-neutral-500">
                  {isPremium ? 'Full tilgang til alle funksjoner' : 'Begrenset tilgang'}
                </p>
              </div>
            </div>
            {isPremium && (
              <Badge className="bg-neutral-800 text-white border-0 px-3 py-1">
                <Sparkles className="h-3 w-3 mr-1" />
                Aktiv
              </Badge>
            )}
          </div>
        </div>
        <div className="p-6">
          {premiumLoading ? (
            <Skeleton className="h-24 w-full rounded-xl" />
          ) : isPremium ? (
            // Premium user view
            <div className="space-y-6">
              {/* Usage stats */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white border border-neutral-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-neutral-600" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500">Analyser denne måneden</p>
                      <p className="text-2xl font-bold text-neutral-900">{analysisCount}</p>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-600 font-medium">Ubegrenset tilgang</p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-neutral-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-neutral-600" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500">Plan</p>
                      <p className="text-2xl font-bold text-neutral-900">Premium</p>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-600 font-medium">Alle funksjoner inkludert</p>
                </div>
              </div>

              {/* Premium-fordeler (AI-synlighet bruker GPT-4o og er derfor begrenset til Premium) */}
              <div>
                <h4 className="text-sm font-semibold text-neutral-700 mb-3">Dine Premium-fordeler</h4>
                <div className="grid md:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-neutral-200">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span className="text-sm text-neutral-700">Ubegrenset analyser</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-neutral-200">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span className="text-sm text-neutral-700">Opptil 5 konkurrenter</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-neutral-200">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span className="text-sm text-neutral-700">Opptil 50 nøkkelord</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-neutral-200">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span className="text-sm text-neutral-700">Ubegrenset oppdateringer</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-neutral-200">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span className="text-sm text-neutral-700">Analyser flere nettsider</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-neutral-200">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span className="text-sm text-neutral-700">Prioritert support</span>
                  </div>
                </div>
              </div>

              {/* Contact for support */}
              <div className="p-4 rounded-xl bg-white border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-neutral-600" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">Trenger du hjelp?</p>
                      <p className="text-sm text-neutral-500">Vi er her for deg som Premium-kunde</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild className="border-neutral-200">
                    <a href="mailto:support@mediabooster.no">
                      Kontakt oss
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Free user view
            <div className="space-y-4">
              {/* Usage This Month */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-600">Analyser brukt denne måneden</span>
                  <span className="text-sm font-bold text-neutral-900">
                    {analysisCount} / {limits.monthlyAnalyses}
                  </span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${analysisCount >= limits.monthlyAnalyses ? 'bg-red-500' : 'bg-neutral-900'}`}
                    style={{ width: `${Math.min((analysisCount / limits.monthlyAnalyses) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Limits */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="h-4 w-4 text-neutral-500" />
                    <span className="text-xs font-medium text-neutral-600">Analyser/mnd</span>
                  </div>
                  <p className="text-lg font-bold text-neutral-900">{limits.monthlyAnalyses}</p>
                </div>
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Layers className="h-4 w-4 text-neutral-500" />
                    <span className="text-xs font-medium text-neutral-600">Konkurrenter</span>
                  </div>
                  <p className="text-lg font-bold text-neutral-900">{limits.competitors}</p>
                </div>
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-neutral-500" />
                    <span className="text-xs font-medium text-neutral-600">Nøkkelord</span>
                  </div>
                  <p className="text-lg font-bold text-neutral-900">{limits.keywords}</p>
                </div>
              </div>

              {/* Upgrade CTA */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-neutral-900 to-neutral-800 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold mb-1">Oppgrader til Premium</h4>
                    <p className="text-sm text-neutral-300">Ubegrenset analyser, konkurrenter og mer</p>
                  </div>
                  <Button variant="secondary" className="bg-white text-neutral-900 hover:bg-neutral-100" asChild>
                    <a href="https://mediabooster.no/kontakt" target="_blank" rel="noopener noreferrer">
                      Kom i gang
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Premium Features - Only show for free users */}
      {!isPremium && (
        <Card className="border-neutral-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-neutral-500" />
              <CardTitle className="text-neutral-900">Premium-funksjoner</CardTitle>
            </div>
            <CardDescription className="text-neutral-500">
              Få mer ut av analyseverktøyet med Premium
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Premium Benefits */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-neutral-700" />
                  <h4 className="font-medium text-neutral-900">Flere konkurrenter</h4>
                </div>
                <p className="text-sm text-neutral-500">
                  Sammenlign din nettside med opptil 5 konkurrenter samtidig.
                </p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-5 w-5 text-neutral-700" />
                  <h4 className="font-medium text-neutral-900">Analyser flere nettsider</h4>
                </div>
                <p className="text-sm text-neutral-500">
                  Analyser så mange nettsider du vil fra én konto.
                </p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-neutral-700" />
                  <h4 className="font-medium text-neutral-900">Ubegrensede analyser</h4>
                </div>
                <p className="text-sm text-neutral-500">
                  Kjør så mange analyser du vil og følg utviklingen over tid.
                </p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="h-5 w-5 text-neutral-700" />
                  <h4 className="font-medium text-neutral-900">Foreslåtte undersider</h4>
                  <Badge variant="secondary" className="text-xs bg-neutral-200 text-neutral-600 border-0">
                    Kommer snart
                  </Badge>
                </div>
                <p className="text-sm text-neutral-500">
                  Etter at et domene er analysert, får du automatisk forslag på andre viktige sider på samme domene å sjekke – f.eks. tjenester, kontakt og produktsider.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-neutral-900 rounded-lg text-white">
              <div>
                <h3 className="font-semibold">Interessert i Premium?</h3>
                <p className="text-sm text-neutral-300">
                  Kontakt oss for en skreddersydd løsning
                </p>
              </div>
              <Button className="bg-white text-neutral-900 hover:bg-neutral-100" asChild>
                <a href="https://mediabooster.no/kontakt" target="_blank" rel="noopener noreferrer">
                  Kontakt oss
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logout */}
      <Card className="border-neutral-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-neutral-500" />
            <CardTitle className="text-neutral-900">Logg ut</CardTitle>
          </div>
          <CardDescription className="text-neutral-500">Avslutt økten din</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
            <div>
              <p className="font-medium text-neutral-900">Logg ut av kontoen</p>
              <p className="text-sm text-neutral-500">
                Du vil bli logget ut og sendt til forsiden
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="border-neutral-300 hover:bg-neutral-100">
              <LogOut className="mr-2 h-4 w-4" />
              Logg ut
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
