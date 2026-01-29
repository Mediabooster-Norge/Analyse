'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  User,
  Building2,
  Globe,
  Mail,
  MapPin,
  CheckCircle2,
  Loader2,
  Save,
  LogOut,
  AlertCircle,
  Crown,
  ArrowRight,
  Lock,
  BarChart3,
  FileText,
  Layers,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserData {
  id: string;
  email: string;
}

interface CompanyData {
  id: string;
  name: string;
  website_url: string;
  org_number: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  phone: string | null;
  contact_person: string | null;
  industry: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [formData, setFormData] = useState({
    contactPerson: '',
    phone: '',
  });

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      
      // Get user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/login');
        return;
      }
      
      setUser({
        id: authUser.id,
        email: authUser.email || '',
      });

      // Get company - try direct query first, then RPC as fallback
      let companyData = null;
      
      console.log('Fetching company for user:', authUser.id);
      
      // Try direct query first
      const { data: directData, error: directError } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();
      
      console.log('Direct query result:', directData, 'Error:', directError);
      
      if (directError && directError.code !== 'PGRST116') {
        console.log('Direct query failed, trying RPC:', directError.message);
        
        // Try RPC function as fallback
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_user_company', { p_user_id: authUser.id });
        
        console.log('RPC result:', rpcData, 'Error:', rpcError);
        
        if (!rpcError && rpcData) {
          companyData = Array.isArray(rpcData) ? rpcData[0] : rpcData;
        }
      } else {
        companyData = directData;
      }

      console.log('Final company data:', companyData);

      if (companyData) {
        setCompany(companyData);
        setFormData({
          contactPerson: companyData.contact_person || '',
          phone: companyData.phone || '',
        });
      }
      
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
    if (!company) return;
    
    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('companies')
      .update({
        contact_person: formData.contactPerson || null,
        phone: formData.phone || null,
      })
      .eq('id', company.id);

    if (error) {
      toast.error('Kunne ikke lagre endringene');
      console.error('Error updating company:', error);
    } else {
      toast.success('Endringene er lagret');
      setCompany(prev => prev ? {
        ...prev,
        contact_person: formData.contactPerson || null,
        phone: formData.phone || null,
      } : null);
    }
    
    setSaving(false);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Innstillinger</h1>
          <p className="text-neutral-500">Administrer kontoen din og bedriftsinformasjon</p>
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
        <p className="text-neutral-500">Administrer kontoen din og bedriftsinformasjon</p>
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
        <div className="p-6">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-50">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-neutral-200">
              <Mail className="h-5 w-5 text-neutral-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium">E-post</p>
              <p className="font-medium text-neutral-900">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Company Info - Missing Company Notice */}
      {!company && !loading && (
        <Card className="border-neutral-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-neutral-500" />
              <CardTitle className="text-neutral-900">Bedriftsinformasjon mangler</CardTitle>
            </div>
            <CardDescription className="text-neutral-500">
              Det oppstod en feil under registreringen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                <Building2 className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Ingen bedrift tilknyttet</h3>
              <p className="text-neutral-500 max-w-md mb-6">
                Det ser ut som bedriften din ikke ble opprettet under registreringen. 
                Kontakt oss så hjelper vi deg.
              </p>
              <Button className="bg-neutral-900 hover:bg-neutral-800 text-white" asChild>
                <a href="https://mediabooster.no/kontakt" target="_blank" rel="noopener noreferrer">
                  Kontakt Mediabooster
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {company && (
        <Card className="border-neutral-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-neutral-500" />
              <CardTitle className="text-neutral-900">Bedriftsinformasjon</CardTitle>
            </div>
            <CardDescription className="text-neutral-500">Informasjon om din bedrift</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Company Details - Read Only */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-neutral-500">Bedriftsnavn</Label>
                <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                  <Building2 className="h-4 w-4 text-neutral-400" />
                  <span className="font-medium text-neutral-900">{company.name}</span>
                  {company.org_number && (
                    <Badge variant="outline" className="ml-auto border-green-200 bg-green-50 text-green-700">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verifisert
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-neutral-500">Nettside</Label>
                <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                  <Globe className="h-4 w-4 text-neutral-400" />
                  <a 
                    href={company.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium text-neutral-900 hover:underline"
                  >
                    {company.website_url}
                  </a>
                </div>
              </div>

              {company.org_number && (
                <div className="space-y-2">
                  <Label className="text-neutral-500">Org.nummer</Label>
                  <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                    <span className="font-medium text-neutral-900">{company.org_number}</span>
                  </div>
                </div>
              )}

              {company.industry && (
                <div className="space-y-2">
                  <Label className="text-neutral-500">Bransje</Label>
                  <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                    <span className="font-medium text-neutral-900">{company.industry}</span>
                  </div>
                </div>
              )}

              {(company.address || company.city) && (
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-neutral-500">Adresse</Label>
                  <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                    <MapPin className="h-4 w-4 text-neutral-400" />
                    <span className="font-medium text-neutral-900">
                      {[company.address, company.postal_code, company.city].filter(Boolean).join(', ')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <Separator className="bg-neutral-200" />

            {/* Editable Fields */}
            <div className="space-y-4">
              <h4 className="font-medium text-neutral-900">Kontaktinformasjon</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson" className="text-neutral-700">Kontaktperson</Label>
                  <Input
                    id="contactPerson"
                    name="contactPerson"
                    placeholder="Ola Nordmann"
                    value={formData.contactPerson}
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
          </CardContent>
        </Card>
      )}

      {/* Premium Features */}
      {company && (
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
                  Sammenlign din nettside med opptil 10 konkurrenter samtidig (3 inkludert gratis).
                </p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-5 w-5 text-neutral-700" />
                  <h4 className="font-medium text-neutral-900">Flere nettsider</h4>
                </div>
                <p className="text-sm text-neutral-500">
                  Legg til og analyser ubegrenset antall nettsider fra én konto.
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
                  <h4 className="font-medium text-neutral-900">Multi-side crawling</h4>
                </div>
                <p className="text-sm text-neutral-500">
                  Analyser flere undersider automatisk for en komplett oversikt.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-neutral-900 rounded-lg text-white">
              <div>
                <h3 className="font-semibold">Interessert i Premium?</h3>
                <p className="text-sm text-neutral-300">
                  Kontakt oss for en skreddersydd løsning for din bedrift
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

      {/* Danger Zone */}
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
