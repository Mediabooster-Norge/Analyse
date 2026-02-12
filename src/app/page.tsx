'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Animation variants for staggered children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import {
  Search,
  Shield,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Globe,
  Sparkles,
  BarChart3,
  LayoutDashboard,
  ChevronRight,
  ChevronDown,
  Copy,
  User as UserIcon,
} from 'lucide-react';
import { HeroShapes, SectionShapes, IllustrationShape } from '@/components/landing/hero-shapes';


// Score Ring Component (same as dashboard)
function ScoreRing({ score, label, size = 'md' }: { score: number; label: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizes = {
    sm: { ring: 48, stroke: 3, text: 'text-sm', label: 'text-xs' },
    md: { ring: 64, stroke: 4, text: 'text-lg', label: 'text-xs' },
    lg: { ring: 80, stroke: 5, text: 'text-xl', label: 'text-sm' },
    xl: { ring: 100, stroke: 6, text: 'text-2xl', label: 'text-sm' },
  };
  const s = sizes[size];
  const radius = (s.ring - s.stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const getColor = () => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: s.ring, height: s.ring }}>
        <svg className="-rotate-90" style={{ width: s.ring, height: s.ring }} viewBox={`0 0 ${s.ring} ${s.ring}`}>
          <circle
            cx={s.ring / 2}
            cy={s.ring / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={s.stroke}
            className="text-neutral-100"
          />
          <circle
            cx={s.ring / 2}
            cy={s.ring / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={s.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`${getColor()} transition-all duration-1000`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${s.text} font-bold text-neutral-900`}>{score}</span>
        </div>
      </div>
      {label && <span className={`${s.label} text-neutral-500 font-medium`}>{label}</span>}
    </div>
  );
}

export default function LandingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoTab, setDemoTab] = useState<'oversikt' | 'konkurrenter' | 'ai'>('oversikt');
  const [selectedIssue, setSelectedIssue] = useState<string | null>('meta');
  const [selectedStep, setSelectedStep] = useState<number>(1);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden hide-decorative-shapes">
      {/* Fjern "hide-decorative-shapes" for å vise dekorative former igjen */}
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-neutral-200/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center min-w-0 flex-shrink">
            <img src="/logo.svg" alt="Booster" className="h-5 sm:h-6 w-auto brightness-0" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {loading ? (
              <div className="w-20 sm:w-24 h-8 sm:h-9 bg-neutral-100 rounded-lg animate-pulse" />
            ) : user ? (
              <Button size="sm" className="bg-neutral-900 hover:bg-neutral-800 text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4" asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Dashboard
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3" asChild>
                <Link href="/login">Logg inn</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section - Centered with Dashboard Demo */}
      <section className="pt-20 sm:pt-24 md:pt-28 relative overflow-hidden">
        {/* Dekorative former – direkte i seksjonen, bak innholdet */}
        <div
          className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
          style={{
            maskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 80%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 80%)',
          }}
        >
          <HeroShapes />
        </div>

        {/* Hero tekst + dashboard – bakgrunn stopper midt i dashboard-fremvisningen */}
        <div className="relative z-10">
          {/* Gradient-blur bakgrunn (med mask) */}
          <div
            className="absolute inset-0 -z-10 overflow-hidden rounded-b-2xl sm:rounded-b-3xl pointer-events-none"
            style={{
              maskImage: 'linear-gradient(to bottom, black 0%, black 45%, transparent 75%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 45%, transparent 75%)',
            }}
          >
            <div className="absolute top-0 right-0 w-[400px] sm:w-[500px] h-[400px] sm:h-[500px] rounded-full bg-gradient-to-br from-neutral-200/30 via-transparent to-transparent blur-[100px] sm:blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-[280px] sm:w-[400px] h-[280px] sm:h-[400px] rounded-full bg-gradient-to-tr from-neutral-100/25 via-transparent to-transparent blur-[80px] sm:blur-[100px]" />
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 relative">
            {/* Hero Text – strekene er her og går helt opp til header og ned til horisontallinjen */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative text-center max-w-6xl mx-auto px-4 sm:px-6 md:px-8 -mt-20 sm:-mt-24 md:-mt-28 pt-20 sm:pt-24 md:pt-28 pb-6 sm:pb-8"
            >
              {/* Vertikale linjer – helt opp til header, helt ned til neste seksjon */}
              <div className="absolute left-0 top-0 bottom-0 w-px bg-neutral-200/40 pointer-events-none" aria-hidden />
              <div className="absolute right-0 top-0 bottom-0 w-px bg-neutral-200/40 pointer-events-none" aria-hidden />
              <Badge variant="outline" className="mb-3 sm:mb-4 text-xs sm:text-sm text-neutral-600 border-neutral-300">
              Digitale analyser – helt gratis!
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight mb-3 sm:mb-4 max-w-2xl mx-auto leading-none">
              Din digitale markedssjef<br />
              <span className="text-neutral-400">– og AI kollega.</span>
              </h1>
            <p className="text-base sm:text-lg text-neutral-500 mb-4 sm:mb-6 max-w-xl mx-auto px-1 leading-relaxed">
                Spar tusenvis på dyre verktøy og byråtimer – få samme innsikt gratis på minutter.
              </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center sm:ml-2 md:ml-3">
                {user ? (
                  <Button size="lg" className="h-10 sm:h-12 px-6 sm:px-8 w-full sm:w-auto bg-neutral-900 hover:bg-neutral-800 text-sm sm:text-base" asChild>
                    <Link href="/dashboard">
                      <LayoutDashboard className="mr-2 w-4 h-4" />
                      Gå til Dashboard
                    </Link>
                  </Button>
                ) : (
                  <Button size="lg" className="h-10 sm:h-12 px-6 sm:px-8 w-full sm:w-auto bg-neutral-900 hover:bg-neutral-800 text-sm sm:text-base" asChild>
                    <Link href="/register">
                      Kom i gang gratis
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                )}
              </div>
              {/* Horisontal linje – nederst i hero, full bredde ut til sidene */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-screen h-px bg-neutral-200/40 pointer-events-none" aria-hidden />
            </motion.div>
          </div>

          {/* Dashboard Demo – bakgrunn stopper midt i denne */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative z-10 overflow-hidden max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-0"
          >
            {/* Top part with border and shadow */}
            <div className="rounded-t-2xl sm:rounded-t-3xl border border-b-0 border-neutral-200 shadow-xl sm:shadow-2xl shadow-neutral-200/50 overflow-hidden bg-white min-w-0">
              {/* Dashboard Header */}
              <div className="border-b border-neutral-100 p-3 sm:p-4 flex items-center justify-between gap-2 bg-neutral-50 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="flex gap-1 sm:gap-1.5 shrink-0">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs sm:text-sm text-neutral-500 font-medium truncate">eksempel.no - Analyse</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] sm:text-xs text-neutral-400 hidden sm:inline">Oppdatert i dag</span>
                </div>
              </div>

              {/* Tabs - scrollable on mobile */}
              <div className="border-b border-neutral-100 px-3 sm:px-6 pt-2 sm:pt-3 bg-white overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-green-600 mb-1.5 sm:mb-2">
                  <span>Klikk for å utforske</span>
                  <ChevronDown className="w-3 h-3 animate-bounce" />
                </div>
                <div className="flex gap-0.5 sm:gap-1 w-max pb-px">
                  {[
                    { id: 'oversikt', label: 'Oversikt', icon: BarChart3 },
                    { id: 'konkurrenter', label: 'Konkurrenter', icon: Globe },
                    { id: 'ai', label: 'AI-analyse', icon: Sparkles },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setDemoTab(tab.id as typeof demoTab)}
                      className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-t-lg transition-all cursor-pointer shrink-0 ${
                        demoTab === tab.id
                          ? 'bg-white text-neutral-900 border-t border-l border-r border-neutral-200 -mb-px'
                          : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
        
            {/* Tab Content - fades out at bottom */}
            <div 
              className="p-3 sm:p-4 md:p-6 max-h-[320px] sm:max-h-[380px] md:max-h-[440px] overflow-hidden relative border-l border-r border-neutral-200 bg-white min-w-0" 
              style={{ 
                maskImage: 'linear-gradient(to bottom, black 65%, transparent 100%)', 
                WebkitMaskImage: 'linear-gradient(to bottom, black 65%, transparent 100%)' 
              }}
            >
              
              {/* Oversikt Tab (also shown for Hastighet) */}
              {demoTab === 'oversikt' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Summary Card – positiv framing */}
                  <div className="rounded-xl sm:rounded-2xl p-3 sm:p-5 bg-green-50 border border-green-200">
                    <div className="flex items-start gap-2 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 bg-green-100">
                        <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold text-green-900">
                          Solid resultat
                        </h3>
                        <p className="text-xs sm:text-sm text-green-700 mt-0.5 line-clamp-2">
                          82 poeng – vi viser deg hvordan du blir enda bedre i Google.
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-2xl sm:text-3xl font-bold text-green-600">82</div>
                        <p className="text-[10px] sm:text-xs text-neutral-500">av 100</p>
                      </div>
                    </div>
                  </div>

                  {/* Score Grid + Improvements Side by Side */}
                  <div className="grid lg:grid-cols-3 gap-2 sm:gap-4">
                    {/* Score Grid Section */}
                    <div className="lg:col-span-2 rounded-xl sm:rounded-2xl border border-neutral-200 bg-white overflow-hidden min-w-0">
                      <div className="p-2 sm:p-4 border-b border-neutral-100">
                        <h3 className="font-semibold text-neutral-900 text-xs sm:text-sm">Poengoversikt</h3>
                        <p className="text-[10px] sm:text-xs text-neutral-500">Høyere poeng = bedre synlighet</p>
                      </div>
                      <div className="p-2 sm:p-4">
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 sm:gap-3">
                          <div className="text-center">
                            <ScoreRing score={82} label="Totalt" size="sm" />
                            <p className="text-[10px] text-neutral-500 mt-1">Samlet</p>
                          </div>
                          <div className="text-center">
                            <ScoreRing score={78} label="SEO" size="sm" />
                            <p className="text-[10px] text-neutral-500 mt-1">Søkemotor</p>
                          </div>
                          <div className="text-center">
                            <ScoreRing score={68} label="Innhold" size="sm" />
                            <p className="text-[10px] text-neutral-500 mt-1">Tekst</p>
                          </div>
                          <div className="text-center">
                            <ScoreRing score={95} label="Sikkerhet" size="sm" />
                            <p className="text-[10px] text-neutral-500 mt-1">Trygghet</p>
                          </div>
                          <div className="text-center">
                            <ScoreRing score={88} label="Speed" size="sm" />
                            <p className="text-[10px] text-neutral-500 mt-1">Hastighet</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Muligheter – positiv formulering */}
                    <div className="rounded-xl sm:rounded-2xl border border-neutral-200 bg-white p-2 sm:p-4 min-w-0">
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <h3 className="font-semibold text-neutral-900 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                          <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                          Tips for å bli enda bedre
                        </h3>
                        <span className="text-[10px] sm:text-xs text-neutral-400">4 muligheter</span>
                      </div>
                      <div className="space-y-1 sm:space-y-1.5">
                        {[
                          { label: 'Meta-beskrivelse', desc: 'Mangler beskrivelse', priority: 'high' },
                          { label: 'Innhold', desc: 'For lite tekst', priority: 'medium' },
                          { label: 'H2-overskrifter', desc: 'Mangler underoverskrifter', priority: 'low' },
                          { label: 'Open Graph', desc: 'Mangler OG-tags', priority: 'low' },
                        ].map((issue, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer group">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              issue.priority === 'high' ? 'bg-red-500' :
                              issue.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-xs text-neutral-900">{issue.label}</span>
                              <span className="text-neutral-400 mx-1">·</span>
                              <span className="text-xs text-neutral-500">{issue.desc}</span>
                            </div>
                            <ChevronRight className="w-3 h-3 text-neutral-400 md:group-hover:text-neutral-600 shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Konkurrenter Tab */}
              {demoTab === 'konkurrenter' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Header */}
                  <div>
                    <h3 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-900 text-sm font-medium mb-2">
                      <BarChart3 className="h-4 w-4 text-neutral-600" />
                      Konkurrentsammenligning (1 konkurrent)
                    </h3>
                    <p className="text-sm text-neutral-600">Sammenlign din nettside med konkurrentene dine</p>
                  </div>

                  {/* Score Comparison Table */}
                  <div className="overflow-x-auto rounded-xl border border-neutral-200 -mx-1 sm:mx-0">
                    <table className="w-full text-sm min-w-[400px]">
                      <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-200">
                          <th className="text-left py-2.5 px-3 font-medium text-neutral-600 text-xs">Nettside</th>
                          <th className="text-center py-2.5 px-2 font-medium text-neutral-600 text-xs">Total</th>
                          <th className="text-center py-2.5 px-2 font-medium text-neutral-600 text-xs">SEO</th>
                          <th className="text-center py-2.5 px-2 font-medium text-neutral-600 text-xs">Innhold</th>
                          <th className="text-center py-2.5 px-2 font-medium text-neutral-600 text-xs">Sikkerhet</th>
                          <th className="text-center py-2.5 px-2 font-medium text-neutral-600 text-xs">Hastighet</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* User row */}
                        <tr className="border-b border-neutral-100 bg-green-50/50">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                                <Globe className="h-3.5 w-3.5 text-green-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-neutral-900 text-xs">Du</p>
                                <p className="text-[10px] text-neutral-500">eksempel.no</p>
                              </div>
                            </div>
                          </td>
                          <td className="text-center py-2.5 px-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-bold text-xs">78</span>
                          </td>
                          <td className="text-center py-2.5 px-2">
                            <span className="font-semibold text-green-600 text-xs">72</span>
                          </td>
                          <td className="text-center py-2.5 px-2">
                            <span className="font-semibold text-red-600 text-xs">58</span>
                          </td>
                          <td className="text-center py-2.5 px-2">
                            <span className="font-semibold text-green-600 text-xs">95</span>
                          </td>
                          <td className="text-center py-2.5 px-2">
                            <span className="font-semibold text-green-600 text-xs">88</span>
                          </td>
                        </tr>
                        {/* Competitor 1 */}
                        <tr className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold text-neutral-500">#1</span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-neutral-700 text-xs">konkurrent.no</p>
                              </div>
                            </div>
                          </td>
                          <td className="text-center py-2.5 px-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 text-neutral-600 font-bold text-xs">65</span>
                          </td>
                          <td className="text-center py-2.5 px-2">
                            <span className="font-semibold text-neutral-600 text-xs">68</span>
                          </td>
                          <td className="text-center py-2.5 px-2">
                            <span className="font-semibold text-neutral-600 text-xs">62</span>
                          </td>
                          <td className="text-center py-2.5 px-2">
                            <span className="font-semibold text-neutral-600 text-xs">72</span>
                          </td>
                          <td className="text-center py-2.5 px-2">
                            <span className="font-semibold text-neutral-600 text-xs">64</span>
                          </td>
                        </tr>
                        {/* Competitor 2 */}
                        <tr className="hover:bg-neutral-50 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold text-neutral-500">#2</span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-neutral-700 text-xs">annen.no</p>
                              </div>
                            </div>
                          </td>
                          <td className="text-center py-2.5 px-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700 font-bold text-xs">71</span>
                          </td>
                          <td className="text-center py-2.5 px-2">
                            <span className="font-semibold text-red-600 text-xs">74</span>
                          </td>
                          <td className="text-center py-2.5 px-2">
                            <span className="font-semibold text-red-600 text-xs">68</span>
                          </td>
                          <td className="text-center py-2.5 px-2">
                            <span className="font-semibold text-neutral-600 text-xs">70</span>
                          </td>
                          <td className="text-center py-2.5 px-2">
                            <span className="font-semibold text-red-600 text-xs">91</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* AI Summary */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-white border border-neutral-200">
                      <h5 className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-100 text-neutral-900 text-[10px] font-medium mb-2">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        Dine styrker
                      </h5>
                      <p className="text-xs text-neutral-600">Sikkerhet, Total score</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-neutral-200">
                      <h5 className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-100 text-neutral-900 text-[10px] font-medium mb-2">
                        <AlertCircle className="h-3 w-3 text-red-600" />
                        Konkurrentens styrker
                      </h5>
                      <p className="text-xs text-neutral-600">SEO, Innhold</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* AI-analyse Tab */}
              {demoTab === 'ai' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Header */}
                  <div>
                    <h3 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-900 text-sm font-medium mb-2">
                      <Sparkles className="h-4 w-4 text-neutral-600" />
                      AI-analyse
                    </h3>
                    <p className="text-sm text-neutral-600">AI-genererte innsikter og anbefalinger basert på analysen</p>
                  </div>

                  {/* Content Grid */}
                  <div className="grid md:grid-cols-2 gap-5">
                    {/* Left - AI Summary & Findings */}
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-700 mb-2">AI-vurdering</h4>
                      <p className="text-sm text-neutral-600 leading-relaxed mb-4">
                        Nettsiden har solid sikkerhet (SSL A+), men mangler viktige SEO-elementer som meta description.
                      </p>
                      <h5 className="text-xs font-medium text-neutral-500 mb-2">Viktigste funn</h5>
                      <div className="space-y-1.5">
                        {[
                          { text: 'SSL A+ - utmerket sikkerhet', type: 'success' },
                          { text: 'Meta description mangler', type: 'warning' },
                          { text: 'For lite innhold (847 ord)', type: 'warning' },
                          { text: 'God sidetittel (58 tegn)', type: 'success' },
                        ].map((item, i) => (
                          <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                            item.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {item.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                            {item.text}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right - Recommendations & Action Plan */}
                    <div>
                      <h5 className="text-xs font-medium text-neutral-500 mb-2">Anbefalinger</h5>
                      <div className="space-y-1.5 mb-4">
                        {[
                          { priority: 'høy', title: 'Legg til meta description', desc: 'Viktig for CTR' },
                          { priority: 'høy', title: 'Øk innholdsmengden', desc: 'Minst 1500 ord' },
                          { priority: 'medium', title: 'Legg til alt-tekst', desc: '3 bilder mangler' },
                        ].map((rec, i) => (
                          <div key={i} className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-100">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                rec.priority === 'høy' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                              }`}>{rec.priority}</span>
                              <span className="text-xs font-medium text-neutral-800">{rec.title}</span>
                            </div>
                            <p className="text-[11px] text-neutral-500 ml-10">{rec.desc}</p>
                          </div>
                        ))}
                      </div>
                      <h5 className="text-xs font-medium text-neutral-500 mb-2">Handlingsplan</h5>
                      <div className="grid grid-cols-3 gap-1.5">
                        <div className="p-2 rounded-lg bg-red-50 border border-red-100">
                          <div className="text-[10px] font-medium text-red-700 mb-0.5">Nå</div>
                          <p className="text-[11px] text-neutral-600">Meta desc</p>
                        </div>
                        <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
                          <div className="text-[10px] font-medium text-amber-700 mb-0.5">Kort sikt</div>
                          <p className="text-[11px] text-neutral-600">Innhold</p>
                        </div>
                        <div className="p-2 rounded-lg bg-green-50 border border-green-100">
                          <div className="text-[10px] font-medium text-green-700 mb-0.5">Lang sikt</div>
                          <p className="text-[11px] text-neutral-600">Schema</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

            </div>

            {/* CTA inside demo container */}
            <div className="flex justify-center py-4 sm:py-5 border-t border-neutral-100 bg-neutral-50/50 rounded-b-2xl sm:rounded-b-3xl border-l border-r border-b border-neutral-200 shadow-xl sm:shadow-2xl shadow-neutral-200/50">
              <Button size="lg" className="h-10 sm:h-12 px-6 sm:px-8 bg-neutral-900 hover:bg-neutral-800 text-sm sm:text-base" asChild>
                <Link href="/register">
                  Prøv gratis på din nettside
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
            </div>
          </motion.div>
        </div>

      </section>

      <div className="relative">
      {/* Testimonials - Scrolling Cards */}
      <section className="relative z-10 bg-white py-10 sm:py-12 md:py-16 overflow-hidden section-separator-top">
        {/* Title */}
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm sm:text-base text-neutral-500 mb-6 sm:mb-8 px-4"
        >
          Brukt av markedsførere, utviklere og gründere over hele Norge
        </motion.p>

        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
        
        {/* Row 1 - scrolling left */}
        <div className="relative mb-2 sm:mb-4">
          <div className="flex animate-scroll-left testimonial-scroll">
            {[...Array(2)].map((_, setIndex) => (
              <div key={setIndex} className="flex shrink-0 items-center gap-2 sm:gap-4 px-1 sm:px-2">
                {[
                  { quote: "Fant 12 SEO-feil vi ikke visste om – fikset alt samme dag.", name: "Martin H.", role: "Daglig leder", color: "bg-blue-100 text-blue-500" },
                  { quote: "Endelig en analyse jeg faktisk forstår uten SEO-bakgrunn.", name: "Lise K.", role: "Markedsfører", color: "bg-violet-100 text-violet-500" },
                  { quote: "Erstatter verktøy vi betalte 2000 kr/mnd for.", name: "Erik S.", role: "Gründer", color: "bg-emerald-100 text-emerald-500" },
                  { quote: "AI-forslagene ga oss 3 blogginnlegg klar til publisering.", name: "Camilla B.", role: "Markedssjef", color: "bg-amber-100 text-amber-500" },
                  { quote: "Ga meg konkrete ting å fikse – ikke bare scores.", name: "Jonas R.", role: "Utvikler", color: "bg-rose-100 text-rose-500" },
                ].map((t, i) => (
                  <div key={`${setIndex}-${i}`} className="flex items-center gap-2 sm:gap-3 px-2 py-1.5 sm:px-4 sm:py-2.5 rounded-md sm:rounded-lg border border-neutral-200 bg-white hover:border-neutral-300 transition-colors whitespace-nowrap">
                    <div className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 ${t.color.split(' ')[0]}`}>
                      <UserIcon className={`w-3 h-3 sm:w-4 sm:h-4 ${t.color.split(' ')[1]}`} />
                    </div>
                    <span className="text-xs sm:text-sm text-neutral-600">&ldquo;{t.quote}&rdquo;</span>
                    <span className="text-[10px] sm:text-xs text-neutral-400 border-l border-neutral-200 pl-2 sm:pl-3">{t.name}, {t.role}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Row 2 - scrolling right */}
        <div className="relative mb-2 sm:mb-4">
          <div className="flex animate-scroll-right testimonial-scroll">
            {[...Array(2)].map((_, setIndex) => (
              <div key={setIndex} className="flex shrink-0 items-center gap-2 sm:gap-4 px-1 sm:px-2">
                {[
                  { quote: "Konkurrentrapporten viste nøyaktig hva de gjør bedre enn oss.", name: "Sofie L.", role: "CEO", color: "bg-cyan-100 text-cyan-500" },
                  { quote: "Tok 3 minutter å få en rapport vi brukte en hel uke på.", name: "Anders M.", role: "Konsulent", color: "bg-orange-100 text-orange-500" },
                  { quote: "Gratis-planen dekker alt en liten bedrift trenger.", name: "Nina T.", role: "Innehaver", color: "bg-pink-100 text-pink-500" },
                  { quote: "Sikkerhetssjekken fant utdaterte plugins vi hadde glemt.", name: "Thomas A.", role: "Webdesigner", color: "bg-indigo-100 text-indigo-500" },
                  { quote: "Sender Booster-rapporten til alle nye kunder nå.", name: "Maria E.", role: "Frilanser", color: "bg-teal-100 text-teal-500" },
                ].map((t, i) => (
                  <div key={`${setIndex}-${i}`} className="flex items-center gap-2 sm:gap-3 px-2 py-1.5 sm:px-4 sm:py-2.5 rounded-md sm:rounded-lg border border-neutral-200 bg-white hover:border-neutral-300 transition-colors whitespace-nowrap">
                    <div className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 ${t.color.split(' ')[0]}`}>
                      <UserIcon className={`w-3 h-3 sm:w-4 sm:h-4 ${t.color.split(' ')[1]}`} />
                    </div>
                    <span className="text-xs sm:text-sm text-neutral-600">&ldquo;{t.quote}&rdquo;</span>
                    <span className="text-[10px] sm:text-xs text-neutral-400 border-l border-neutral-200 pl-2 sm:pl-3">{t.name}, {t.role}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Row 3 - scrolling left (slower) */}
        <div className="relative">
          <div className="flex animate-scroll-left-slow testimonial-scroll">
            {[...Array(2)].map((_, setIndex) => (
              <div key={setIndex} className="flex shrink-0 items-center gap-2 sm:gap-4 px-1 sm:px-2">
                {[
                  { quote: "Nøkkelord-forslag jeg ikke fant i Ahrefs eller Semrush.", name: "Henrik O.", role: "SEO-spesialist", color: "bg-lime-100 text-lime-600" },
                  { quote: "Satte hele teamet i gang med handlingsplanen på 10 min.", name: "Ingrid V.", role: "Prosjektleder", color: "bg-purple-100 text-purple-500" },
                  { quote: "Mer nyttig innsikt enn verktøy til 10x prisen.", name: "Ole J.", role: "Digital rådgiver", color: "bg-sky-100 text-sky-500" },
                  { quote: "Artikkel-generatoren sparte meg en hel arbeidsdag.", name: "Kari N.", role: "Blogger", color: "bg-fuchsia-100 text-fuchsia-500" },
                  { quote: "Oppdaget at SSL-sertifikatet var feilkonfigurert.", name: "Per G.", role: "IT-ansvarlig", color: "bg-red-100 text-red-500" },
                ].map((t, i) => (
                  <div key={`${setIndex}-${i}`} className="flex items-center gap-2 sm:gap-3 px-2 py-1.5 sm:px-4 sm:py-2.5 rounded-md sm:rounded-lg border border-neutral-200 bg-white hover:border-neutral-300 transition-colors whitespace-nowrap">
                    <div className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 ${t.color.split(' ')[0]}`}>
                      <UserIcon className={`w-3 h-3 sm:w-4 sm:h-4 ${t.color.split(' ')[1]}`} />
                    </div>
                    <span className="text-xs sm:text-sm text-neutral-600">&ldquo;{t.quote}&rdquo;</span>
                    <span className="text-[10px] sm:text-xs text-neutral-400 border-l border-neutral-200 pl-2 sm:pl-3">{t.name}, {t.role}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <style jsx>{`
          @keyframes scroll-left {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes scroll-right {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0); }
          }
          @keyframes scroll-left-slow {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-scroll-left {
            animation: scroll-left 35s linear infinite;
          }
          .animate-scroll-right {
            animation: scroll-right 40s linear infinite;
          }
          .animate-scroll-left-slow {
            animation: scroll-left-slow 45s linear infinite;
          }
          section:hover .testimonial-scroll {
            animation-play-state: paused;
          }
          @media (max-width: 767px) {
            .animate-scroll-left {
              animation-duration: 18s;
            }
            .animate-scroll-right {
              animation-duration: 20s;
            }
            .animate-scroll-left-slow {
              animation-duration: 22s;
            }
          }
        `}</style>
      </section>

      {/* AI Suggestions Interactive Section */}
      <section className="relative z-10 py-12 sm:py-16 md:py-20 section-separator-top">
        <IllustrationShape
          shape="star"
          bentoColor="violet"
          className="top-0 left-[8%] sm:left-[10%] md:left-[12%] w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 -translate-y-2 sm:-translate-y-4"
        />
        <IllustrationShape
          shape="blob"
          bentoColor="sky"
          className="bottom-[50%] right-[8%] sm:right-[10%] md:right-[12%] w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48"
        />
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative text-center mb-8 sm:mb-12 pb-6 sm:pb-8"
            >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight mb-2 sm:mb-3">
              Ferdigskrevne forslag<br />
              <span className="text-neutral-400">du kan bruke med én gang.</span>
              </h2>
            <p className="text-sm sm:text-base md:text-lg text-neutral-500 max-w-xl mx-auto px-2">
              AI analyserer nettsiden din og gir deg konkrete forbedringsforslag – klare til å implementere.
            </p>
            {/* Horisontal strek under overskriften – full bredde ut til kantene */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-screen h-px bg-neutral-200/40 pointer-events-none" aria-hidden />
            </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 relative -mt-60 sm:-mt-72 md:-mt-80 pt-60 sm:pt-72 md:pt-80 -mb-12 sm:-mb-16 md:-mb-20 pb-12 sm:pb-16 md:pb-20">
            {/* Vertikale linjer – helt opp (over overskrift) og helt ned (til seksjonens bunn) */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-neutral-200/40 pointer-events-none" aria-hidden />
            <div className="absolute right-0 top-0 bottom-0 w-px bg-neutral-200/40 pointer-events-none" aria-hidden />
            {/* Problem cards - narrower */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2 space-y-1 sm:space-y-2"
            >
              {[
                { id: 'meta', title: 'Meta description', desc: 'Mangler eller for kort', severity: 'high' as const },
                { id: 'h1', title: 'H1-struktur', desc: 'Flere H1 eller svak formulering', severity: 'high' as const },
                { id: 'images', title: 'Alt-tekst på bilder', desc: 'Bilder uten beskrivende tekst', severity: 'medium' as const },
                { id: 'content', title: 'Innholdsmengde', desc: 'For lite tekst på siden', severity: 'medium' as const },
              ].map((issue, index) => (
                <button
                  key={issue.id}
                  onClick={() => setSelectedIssue(issue.id)}
                  className={`w-full text-left p-2.5 sm:p-3 rounded-lg sm:rounded-xl border transition-all duration-200 cursor-pointer ${
                    selectedIssue === issue.id
                      ? 'border-neutral-300 bg-white shadow-sm'
                      : 'border-transparent bg-white/50 hover:bg-white hover:border-neutral-200'
                  }`}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      issue.severity === 'high'
                        ? 'bg-red-50 text-red-500'
                        : 'bg-amber-50 text-amber-500'
                    }`}>
                      <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className={`font-semibold text-sm transition-colors ${
                          selectedIssue === issue.id ? 'text-neutral-900' : 'text-neutral-600'
                        }`}>{issue.title}</h3>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
                          issue.severity === 'high'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}>
                          {issue.severity === 'high' ? 'Høy' : 'Medium'}
                        </span>
                      </div>
                      <p className={`text-xs sm:text-sm transition-colors leading-snug ${
                        selectedIssue === issue.id ? 'text-neutral-600' : 'text-neutral-400'
                      }`}>{issue.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
              </motion.div>

            {/* AI Suggestion panel - wider */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-3"
            >
              <div className="bg-neutral-50 rounded-xl sm:rounded-2xl border border-neutral-100 p-4 sm:p-6 min-h-[280px] sm:min-h-[320px]">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold text-neutral-900">AI-forslag</span>
                </div>
                <p className="text-xs text-neutral-500 mb-4">Konkrete forslag du kan ta i bruk med én gang</p>

                {selectedIssue === 'meta' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="p-4 bg-white rounded-xl border border-neutral-200 group/copy relative">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-neutral-500">Foreslått meta description:</p>
                        <button className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-neutral-600 transition-colors px-1.5 py-0.5 rounded hover:bg-neutral-50">
                          <Copy className="w-3 h-3" />
                          <span>Kopier</span>
                        </button>
                      </div>
                      <p className="text-sm text-neutral-700">
                        &ldquo;Spesialist på rørleggerarbeid i Bergen. Over 15 års erfaring med bad, 
                        kjøkken og VVS. Rask respons og konkurransedyktige priser. Ring for tilbud.&rdquo;
                      </p>
                      <p className="text-xs text-neutral-400 mt-2">152 tegn · Optimal lengde</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Hvorfor dette fungerer</p>
                      <ul className="space-y-2 text-sm text-neutral-600">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          Lokal relevans (Bergen)
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          Bygger tillit (erfaring)
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          Klar handling (ring for tilbud)
                        </li>
                      </ul>
                    </div>
                  </motion.div>
                )}

                {selectedIssue === 'h1' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                      <p className="text-xs font-medium text-red-600 mb-2">Nåværende (2 H1-tags)</p>
                      <div className="space-y-1 text-sm text-neutral-500 line-through">
                        <p>&ldquo;Hjem&rdquo;</p>
                        <p>&ldquo;Vi fikser alt av rør&rdquo;</p>
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-green-600">Foreslått H1:</p>
                        <button className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-neutral-600 transition-colors px-1.5 py-0.5 rounded hover:bg-green-100/50">
                          <Copy className="w-3 h-3" />
                          <span>Kopier</span>
                        </button>
                      </div>
                      <p className="text-sm text-neutral-700 font-medium">
                        &ldquo;Rørlegger i Bergen – Rask hjelp til bad og VVS&rdquo;
                      </p>
                    </div>
                    <p className="text-xs text-neutral-500">
                      Én H1 per side. Inkluder tjeneste + lokasjon.
                    </p>
                  </motion.div>
                )}

                {selectedIssue === 'images' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
                      3 bilder mangler alt-tekst
                    </p>
                    {[
                      { file: 'hero-image.jpg', before: 'alt=""', after: 'Rørlegger monterer nytt badekar i moderne bad' },
                      { file: 'services.png', before: 'alt="bilde1"', after: 'Oversikt over VVS-tjenester – bad, kjøkken og rør' },
                      { file: 'logo.png', before: 'Mangler alt-attributt', after: 'Bergen Rør AS logo' },
                    ].map((img, i) => (
                      <div key={i} className="p-3 bg-white rounded-lg border border-neutral-200">
                        <p className="text-[10px] font-mono text-neutral-400 mb-2">{img.file}</p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2 py-1 bg-red-50 text-red-500 rounded font-mono line-through">{img.before}</span>
                          <ArrowRight className="w-3 h-3 text-neutral-300 shrink-0" />
                          <span className="px-2 py-1 bg-green-50 text-green-700 rounded flex items-center gap-1">
                            &ldquo;{img.after}&rdquo;
                            <button className="ml-1 text-neutral-400 hover:text-neutral-600 transition-colors">
                              <Copy className="w-3 h-3" />
                            </button>
                          </span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {selectedIssue === 'content' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="p-4 bg-white rounded-xl border border-neutral-200">
                      <p className="text-xs font-medium text-neutral-500 mb-2">Forslag til nytt innhold</p>
                      <ul className="space-y-1.5 text-sm text-neutral-700">
                        <li>• FAQ-seksjon (ca. 300 ord)</li>
                        <li>• Prosessbeskrivelse (ca. 200 ord)</li>
                        <li>• Kundecase (ca. 150 ord)</li>
              </ul>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs text-neutral-500 mb-1">
                          <span>Nå</span>
                          <span>847</span>
                        </div>
                        <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: '56%' }} />
                        </div>
                      </div>
                      <ArrowRight className="w-3 h-3 text-neutral-400" />
                      <div className="flex-1">
                        <div className="flex justify-between text-xs text-neutral-500 mb-1">
                          <span>Mål</span>
                          <span>1500+</span>
                        </div>
                        <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-400 rounded-full" style={{ width: '100%' }} />
                        </div>
                      </div>
                    </div>
            </motion.div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Inline CTA after AI suggestions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-8 sm:mt-10 relative z-10"
          >
            <Button size="lg" className="h-10 sm:h-12 px-6 sm:px-8 bg-neutral-900 hover:bg-neutral-800 text-sm sm:text-base" asChild>
              <Link href="/register">
                Se hva AI anbefaler for din side
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* How it works - Two column layout */}
      <section className="relative z-10 py-12 sm:py-16 md:py-20 bg-neutral-50 overflow-hidden section-separator-top">
        <IllustrationShape
          shape="blob"
          bentoColor="teal"
          className="top-[15%] left-[8%] sm:left-[12%] md:left-[16%] w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 -z-10"
        />
        <IllustrationShape
          shape="square"
          bentoColor="sky"
          className="top-8 right-[10%] sm:right-[14%] md:right-[18%] w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 -z-10"
        />
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight mb-2 sm:mb-3">
              Slik fungerer det<br />
              <span className="text-neutral-400">i praksis.</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-neutral-500 max-w-xl mx-auto">Fra URL til handlingsplan – uten teknisk kompetanse.</p>
          </motion.div>

          {/* Wrapper for vertikale linjer – helt opp og ned som resten av nettsiden */}
          <div className="relative -mt-60 sm:-mt-72 md:-mt-80 pt-60 sm:pt-72 md:pt-80 -mb-12 sm:-mb-16 md:-mb-20 pb-12 sm:pb-16 md:pb-20">
            {/* Vertikale linjer – venstre og høyre */}
            <div className="absolute inset-0 pointer-events-none w-full" aria-hidden>
              <div className="absolute left-0 top-0 bottom-0 w-px bg-neutral-200/40" />
              <div className="absolute -right-px top-0 bottom-0 w-px bg-neutral-200/40" />
            </div>
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-start relative">
            {/* Horisontal linje på toppen – helt ut */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-screen h-px bg-neutral-200/40 pointer-events-none" aria-hidden />
            {/* Left - Steps */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
              {[
                { 
                  step: 1, 
                  title: 'Opprett gratis konto', 
                  desc: 'Registrer deg på sekunder med e-post. Ingen kredittkort, ingen forpliktelser.',
                },
                { 
                  step: 2, 
                title: 'Lim inn nettadressen',
                  desc: 'Skriv inn URL-en du vil analysere. Vi sjekker SEO, sikkerhet, innhold og hastighet på minutter.',
                },
                { 
                  step: 3, 
                  title: 'Få konkrete forslag', 
                  desc: 'Se scores, AI-anbefalinger, konkurrentsammenligning og nøkkelordanalyse – alt i én rapport.',
                },
              ].map((item) => (
                <button
                  key={item.step}
                  onClick={() => setSelectedStep(item.step)}
                  className={`w-full text-left p-2.5 sm:p-3 rounded-lg sm:rounded-xl border transition-all duration-200 cursor-pointer ${
                    selectedStep === item.step
                      ? 'border-neutral-300 bg-white'
                      : 'border-transparent bg-white/50 hover:bg-white hover:border-neutral-200'
                  }`}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className={`text-lg sm:text-xl font-light transition-colors ${
                      selectedStep === item.step ? 'text-neutral-900' : 'text-neutral-300'
                    }`}>{item.step}</span>
                    <div className="pt-0.5">
                      <h3 className={`font-semibold text-sm mb-0.5 transition-colors ${
                        selectedStep === item.step ? 'text-neutral-900' : 'text-neutral-600'
                      }`}>{item.title}</h3>
                      <p className={`text-xs sm:text-sm transition-colors leading-snug ${
                        selectedStep === item.step ? 'text-neutral-600' : 'text-neutral-400'
                      }`}>{item.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
              
              <div className="pt-3 sm:pt-4 pb-2 sm:pb-0">
                <Button className="bg-neutral-900 hover:bg-neutral-800 w-full sm:w-auto h-11 sm:h-10" asChild>
                  <Link href="/register">
                    Kom i gang gratis
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>
              </div>
            </motion.div>

            {/* Right - Visual */}
              <motion.div 
              initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              className="relative"
            >
              {/* Top header bar */}
              <div className="bg-neutral-50 rounded-t-2xl border border-b-0 border-neutral-200 shadow-xl p-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-neutral-400 ml-1">
                  {selectedStep === 1 ? 'Registrering' : selectedStep === 2 ? 'Dashboard' : 'Resultater'}
                </span>
              </div>
              
              {/* Content with fade effect */}
              <div 
                className="relative bg-white border-l border-r border-neutral-200 max-h-[380px] overflow-hidden"
                style={{ 
                  maskImage: 'linear-gradient(to bottom, black 65%, transparent 100%)', 
                  WebkitMaskImage: 'linear-gradient(to bottom, black 65%, transparent 100%)' 
                }}
              >
                {/* Step 2 Visual - URL input & Analysis */}
                {selectedStep === 2 && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6"
                  >
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h4 className="font-semibold text-lg">Dashboard</h4>
                        <p className="text-sm text-neutral-500">Start en ny analyse</p>
          </div>
                      <Badge variant="outline" className="text-xs">Gratis</Badge>
        </div>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-neutral-700">Nettside URL</label>
                        <div className="flex gap-2">
                          <div className="flex-1 p-2.5 rounded-md border border-neutral-200 bg-white flex items-center gap-2">
                            <Globe className="w-4 h-4 text-neutral-400" />
                            <span className="text-sm text-neutral-600">https://eksempel.no</span>
                          </div>
                          <div className="px-4 py-2.5 rounded-md bg-neutral-900 text-white text-sm font-medium flex items-center gap-2">
                            <Search className="w-4 h-4" />
                            Analyser
                          </div>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                          </div>
            <div>
                            <p className="text-sm font-semibold">Analyserer eksempel.no</p>
                            <p className="text-xs text-neutral-500">Dette tar vanligvis noen minutter</p>
            </div>
                        </div>
                        <div className="space-y-2">
                          {[
                            { label: 'SEO-analyse', done: true },
                            { label: 'Sikkerhetssjekk', done: true },
                            { label: 'AI-synlighet', done: true },
                            { label: 'Innholdsanalyse', done: true },
                            { label: 'AI-anbefalinger', done: false },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              {item.done ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <div className="w-4 h-4 border-2 border-neutral-300 border-t-transparent rounded-full animate-spin" />
                              )}
                              <span className={item.done ? 'text-neutral-600' : 'text-neutral-400'}>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
            </div>
          </motion.div>
                )}

                {/* Step 3 Visual - Results */}
                {selectedStep === 3 && (
              <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-lg">eksempel.no</h4>
                        <p className="text-xs text-neutral-500">Analyse fullført</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-xs text-neutral-500">Oppdatert i dag</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      {[
                        { score: 78, label: 'Totalt' },
                        { score: 72, label: 'SEO' },
                        { score: 58, label: 'Innhold' },
                        { score: 95, label: 'Sikkerhet' },
                      ].map((item, i) => (
                        <div key={i} className="text-center p-3 bg-neutral-50 rounded-xl">
                          <ScoreRing score={item.score} label={item.label} size="sm" />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <div className="p-3 rounded-xl bg-green-50 border border-green-100">
                        <div className="flex items-center gap-2 mb-0.5">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Bra</span>
                        </div>
                        <p className="text-xs text-green-700 ml-6">SSL A+ - utmerket sikkerhet</p>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                        <div className="flex items-center gap-2 mb-0.5">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-800">Forbedre</span>
                        </div>
                        <p className="text-xs text-amber-700 ml-6">Meta description mangler</p>
                      </div>
                      <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                        <div className="flex items-center gap-2 mb-0.5">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-red-800">Viktig</span>
                        </div>
                        <p className="text-xs text-red-700 ml-6">For lite innhold (847 ord)</p>
                    </div>
                  </div>
                </motion.div>
                )}

                {/* Step 1 Visual - Registration */}
                {selectedStep === 1 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6"
                  >
                    <div className="text-center mb-5">
                      <h4 className="font-semibold text-xl">Opprett gratis konto</h4>
                      <p className="text-sm text-neutral-500">Lagre analysen og følg utviklingen</p>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-neutral-700">E-post *</label>
                        <div className="p-2.5 rounded-md border border-neutral-200 bg-white">
                          <span className="text-sm text-neutral-400">din@epost.no</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-neutral-700">Passord *</label>
                        <div className="p-2.5 rounded-md border border-neutral-200 bg-white">
                          <span className="text-sm text-neutral-400">••••••••</span>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-md bg-neutral-900 text-white text-sm font-medium text-center">
                        Opprett konto
                      </div>
                      <div className="pt-3 border-t border-neutral-100">
                        <p className="text-xs text-neutral-500 text-center mb-2">Med en gratis konto får du:</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            5 analyser/mnd
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            AI-anbefalinger
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            Konkurrentanalyse
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            5 AI-artikler/mnd
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
              </motion.div>
          </div>
          </div>
        </div>
      </section>

      {/* Hva du får – Gratis vs Premium. 3-kolonne layout. */}
      <section className="relative z-10 py-12 sm:py-16 md:py-20 bg-neutral-50 section-separator-top border-t border-neutral-200">
        <IllustrationShape
          shape="star"
          bentoColor="amber"
          className="top-8 left-[8%] sm:left-[12%] md:left-[16%] w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 -z-10"
        />
        <IllustrationShape
          shape="circle"
          bentoColor="green"
          className="top-8 right-[8%] sm:right-[12%] md:right-[16%] w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 -z-10"
        />
        {/* Bakgrunnstekstur i mellomrommet – stopper ved vertikale linjene */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-full max-w-6xl px-3 sm:px-4 md:px-6 h-20 pointer-events-none" aria-hidden>
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: 'url(/bg-texture.png)',
              backgroundRepeat: 'repeat-x',
              backgroundPosition: 'top center',
              backgroundSize: 'auto 100px',
              opacity: 0.03,
              filter: 'invert(1)',
            }}
          />
        </div>
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 relative z-10">
          {/* Wrapper for vertikale linjer – helt opp og ned */}
          <div className="relative -mt-60 sm:-mt-72 md:-mt-80 pt-60 sm:pt-72 md:pt-80 -mb-12 sm:-mb-16 md:-mb-20 pb-12 sm:pb-16 md:pb-20">
            {/* Vertikale linjer – venstre og høyre */}
            <div className="absolute inset-0 pointer-events-none w-full" aria-hidden>
              <div className="absolute left-0 top-0 bottom-0 w-px bg-neutral-200/40" />
              <div className="absolute -right-px top-0 bottom-0 w-px bg-neutral-200/40" />
            </div>
            {/* Horisontale linjer og grid i wrapper */}
            <div className="relative">
              {/* Horisontale linjer – helt ut til kantene */}
              <div className="absolute inset-0 pointer-events-none" aria-hidden>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-screen h-px bg-neutral-200/40" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-screen h-px bg-neutral-200/40" />
              </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative z-10 grid md:grid-cols-3 gap-4 sm:gap-6 items-stretch"
            >
            {/* Tittel og beskrivelse – venstre kolonne */}
            <div className="md:pr-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight mb-2 sm:mb-3">
                Velg plan<br />
                <span className="text-neutral-400">som passer deg.</span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-neutral-500">
                Start gratis med full analyse. Oppgrader når du trenger mer.
              </p>
            </div>
            {/* Gratis */}
            <div className="relative z-10 rounded-2xl border border-neutral-200 bg-white shadow-sm p-5 sm:p-6 flex flex-col transition-all duration-200 hover:shadow-md hover:border-neutral-300">
              <div className="mb-4">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Gratis</p>
                <p className="text-2xl sm:text-3xl font-semibold text-neutral-900 mt-0.5">0 kr</p>
                <p className="text-xs text-neutral-500 mt-0.5">per måned</p>
              </div>
              <ul className="space-y-2 flex-1 text-sm text-neutral-700">
                {[
                  'Full SEO-, sikkerhets- og innholdsanalyse',
                  'AI-anbefalinger og forbedringsforslag',
                  'Sammenligning med konkurrenter',
                  'Nøkkelordanalyse (AI-estimater)',
                  'Rapport som PDF',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-neutral-100 space-y-1.5">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Grenser</p>
                <p className="text-sm text-neutral-700">5 analyser og 5 AI-artikler per måned</p>
              </div>
              <Button variant="outline" className="mt-6 w-full border-neutral-300 text-neutral-700 hover:bg-neutral-100 hover:border-neutral-400" size="lg" asChild>
                <Link href="/register">
                  Kom i gang gratis
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>

            {/* Premium */}
            <div className="relative z-10 rounded-2xl border-2 border-neutral-900 bg-gradient-to-b from-white to-neutral-50 shadow-lg p-5 sm:p-6 flex flex-col transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 rounded-full bg-neutral-900 text-white text-[10px] sm:text-xs font-medium shadow-sm">
                  Anbefalt
                </span>
              </div>
              <div className="mb-4 mt-2">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Premium</p>
                <p className="text-2xl sm:text-3xl font-semibold text-neutral-900 mt-0.5">69 kr</p>
                <p className="text-xs text-neutral-500 mt-0.5">per måned</p>
              </div>
              <p className="text-sm font-medium text-neutral-800 mb-3">Alt i Gratis, pluss:</p>
              <ul className="space-y-2 flex-1 text-sm text-neutral-700">
                {[
                  'Ubegrenset analyser per måned',
                  '30 AI-genererte artikler per måned',
                  'Forslag til undersider',
                  'Prioritert support',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-6 w-full bg-neutral-900 hover:bg-neutral-800 shadow-sm" size="lg" asChild>
                <a href="https://mediabooster.no/kontakt" target="_blank" rel="noopener noreferrer">
                  Kom i gang med Premium
                  <ArrowRight className="ml-2 w-4 h-4" />
                </a>
              </Button>
            </div>
            </motion.div>
            </div>
          </div>
        </div>
        {/* Bakgrunnstekstur i mellomrommet nederst – stopper ved vertikale linjene */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-full max-w-6xl px-3 sm:px-4 md:px-6 h-20 pointer-events-none" aria-hidden>
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: 'url(/bg-texture.png)',
              backgroundRepeat: 'repeat-x',
              backgroundPosition: 'bottom center',
              backgroundSize: 'auto 100px',
              opacity: 0.03,
              filter: 'invert(1)',
            }}
          />
        </div>
      </section>

      {/* FAQ - Two column layout */}
      <section className="relative z-10 py-12 sm:py-16 md:py-20 overflow-hidden section-separator-top">
        <IllustrationShape
          shape="circle"
          bentoColor="teal"
          className="top-[20%] left-[6%] sm:left-[8%] md:left-[10%] w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 -z-10"
        />
        <IllustrationShape
          shape="square"
          bentoColor="sky"
          className="bottom-6 right-[6%] sm:right-[8%] md:right-[10%] w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 -z-10"
        />
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 relative z-10">
          {/* Wrapper for vertikale linjer – helt opp og ned */}
          <div className="relative -mt-60 sm:-mt-72 md:-mt-80 pt-60 sm:pt-72 md:pt-80 -mb-12 sm:-mb-16 md:-mb-20 pb-12 sm:pb-16 md:pb-20">
            {/* Vertikale linjer – venstre og høyre */}
            <div className="absolute inset-0 pointer-events-none w-full" aria-hidden>
              <div className="absolute left-0 top-0 bottom-0 w-px bg-neutral-200/40" />
              <div className="absolute -right-px top-0 bottom-0 w-px bg-neutral-200/40" />
            </div>
            {/* Horisontale linjer – topp og bunn */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-screen h-px bg-neutral-200/40" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-screen h-px bg-neutral-200/40" />
            </div>
            <div className="grid md:grid-cols-5 gap-8 items-start">
            {/* Left side - Title */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="md:col-span-2 md:sticky md:top-24"
            >
              <h2 className="text-4xl md:text-5xl font-medium tracking-tight mb-3">
                Spørsmål<br />
                <span className="text-neutral-400">og svar.</span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-neutral-500 mb-6">Alt du lurer på om analysen og tilbudet.</p>
              <motion.div whileHover={{ x: 4 }}>
                <Link 
                  href="https://mediabooster.no/kontakt" 
                  target="_blank"
                  className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  Har du andre spørsmål?
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </motion.div>

            {/* Right side - Questions */}
            <motion.div 
              className="md:col-span-3 space-y-3"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              {[
                {
                  q: 'Er dette virkelig gratis?',
                  a: 'Ja. Med gratis konto får du 5 analyser og 5 AI-genererte artikler per måned, samt full tilgang til SEO-, sikkerhets-, innholds- og hastighetsanalyse med AI-anbefalinger. Premium (69 kr/mnd) gir ubegrenset analyser og 30 AI-artikler per måned.',
                },
                {
                  q: 'Hva analyserer dere?',
                  a: 'Vi sjekker SEO (sidetittel, meta-beskrivelse, H1/H2, bilder med alt-tekst, Open Graph), sikkerhet (SSL, HSTS, CSP m.m.), innhold (ordtelling, lesbarhet LIX) og hastighet (PageSpeed, LCP, CLS). Du får konkrete forbedringsforslag og kan sammenligne med konkurrenter og se AI-estimerte nøkkelord.',
                },
                {
                  q: 'Hva er grensen for gratis?',
                  a: 'Gratis: 5 analyser og 5 AI-artikler per måned. Premium: ubegrenset analyser og 30 AI-artikler per måned for 69 kr/mnd.',
                },
                {
                  q: 'Hva er nøkkelordanalysen?',
                  a: 'Vi bruker AI til å estimere søkevolum, CPC og konkurranse for nøkkelord som passer til nettsiden din. Det hjelper deg å prioritere hvilke søkeord du bør satse på.',
                },
                {
                  q: 'Kan jeg sammenligne med konkurrenter?',
                  a: 'Ja. Du legger inn URL-er til konkurrentene, og vi sammenligner score på SEO, innhold, sikkerhet og hastighet så du ser hvordan du ligger an.',
                },
                {
                  q: 'Hva er AI-genererte artikler?',
                  a: 'Basert på analysen kan du få forslag til artikkelideer og la AI generere full artikkeltekst (med forslag til meta og bilde). Gratis har 5 artikler per måned, Premium har 30.',
                },
                {
                  q: 'Hvor lang tid tar en analyse?',
                  a: 'Vanligvis noen få minutter. Du limer inn URL, klikker Analyser, og får rapport med én gang.',
                },
              ].map((faq, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  whileHover={{ x: 4 }}
                >
                  <Accordion type="single" collapsible>
                    <AccordionItem value={`item-${i}`} className="border-0">
                      <motion.div whileHover={{ x: 4 }} className="bg-neutral-50 rounded-xl overflow-hidden hover:bg-neutral-100 transition-colors cursor-pointer">
                        <AccordionTrigger className="text-left px-5 py-4 hover:no-underline text-sm font-medium">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-neutral-500 text-sm px-5 pb-4">
                          {faq.a}
                        </AccordionContent>
                      </motion.div>
                    </AccordionItem>
                  </Accordion>
                </motion.div>
              ))}
            </motion.div>
          </div>
          </div>
        </div>
      </section>

      </div>

      {/* CTA Banner – after all content, before footer */}
      <section className="relative z-10 py-8 sm:py-10 md:py-12">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-neutral-900 rounded-xl sm:rounded-2xl relative overflow-hidden"
          >
            <SectionShapes variant="bottomRight" color="green" shape="star" dark />
            {/* Content grid */}
            <div className="relative z-10 grid md:grid-cols-2 h-full min-h-[280px] sm:min-h-[320px]">
              {/* Left column - Text and CTA */}
              <div className="p-6 sm:p-10 md:p-12 flex flex-col justify-center relative z-20">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight text-white mb-3 sm:mb-4 leading-tight">
                  Klar til å analysere<br />
                  <span className="text-neutral-400">nettsiden din?</span>
                </h2>
                <p className="text-sm sm:text-base text-neutral-400 mb-6 sm:mb-8 max-w-sm">
                  SEO, sikkerhet, innhold og AI-anbefalinger – alt på minutter, helt gratis.
                </p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button className="bg-white text-neutral-900 hover:bg-neutral-100 h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base" asChild>
                    <Link href="/register">
                      Kom i gang gratis
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </motion.div>
              </div>
              
              {/* Right column - Dashboard mockup */}
              <div className="absolute md:relative inset-0 md:inset-auto overflow-hidden opacity-40 md:opacity-100">
                {/* Gradient fade from left */}
                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-neutral-900 to-transparent z-10" />
                
                {/* Dashboard mockup - dark theme, tilted */}
                <div className="absolute inset-0 flex items-center">
                  <div 
                    className="absolute -right-8 w-[500px] bg-neutral-800/90 rounded-xl overflow-hidden border border-neutral-700/50"
                    style={{ transform: 'perspective(1200px) rotateY(-15deg) rotateX(2deg)' }}
                  >
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-neutral-700/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-neutral-400" />
                          <span className="text-sm font-medium text-white">Sammenligning</span>
                          <span className="text-xs text-neutral-500">· Konkurrenter</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-neutral-500">
                          <span>Synlighet</span>
                          <span>Score</span>
                        </div>
                      </div>
                    </div>
                    {/* Rankings list */}
                    <div className="p-2">
                      {[
                        { rank: 1, name: 'Din bedrift', score: 89, visibility: '95%', isYou: true, trend: 'up' },
                        { rank: 2, name: 'Konkurrent A', score: 82, visibility: '80%', isYou: false, trend: 'down' },
                        { rank: 3, name: 'Konkurrent B', score: 76, visibility: '72%', isYou: false, trend: 'up' },
                        { rank: 4, name: 'Konkurrent C', score: 71, visibility: '65%', isYou: false, trend: 'neutral' },
                        { rank: 5, name: 'Konkurrent D', score: 58, visibility: '50%', isYou: false, trend: 'down' },
                        { rank: 6, name: 'Konkurrent E', score: 45, visibility: '38%', isYou: false, trend: 'down' },
                      ].map((item) => (
                        <div 
                          key={item.rank} 
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 ${
                            item.isYou ? 'bg-green-500/20 border border-green-500/30' : 'bg-neutral-700/30 hover:bg-neutral-700/50'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-medium ${
                            item.isYou ? 'bg-green-500 text-white' : 'bg-neutral-600 text-neutral-300'
                          }`}>
                            {item.rank}
                          </span>
                          <span className={`flex-1 text-sm ${item.isYou ? 'text-white font-medium' : 'text-neutral-300'}`}>
                            {item.name}
                          </span>
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-neutral-400 w-12 text-right">{item.visibility}</span>
                            <div className="flex items-center gap-1">
                              <span className={`text-sm font-medium w-8 text-right ${
                                item.isYou ? 'text-green-400' : 'text-neutral-400'
                              }`}>
                                {item.score}
                              </span>
                              {item.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-400" />}
                              {item.trend === 'down' && <TrendingUp className="w-3 h-3 text-red-400 rotate-180" />}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Gradient fades for smooth blending */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-neutral-900 via-neutral-900/80 to-transparent z-10" />
                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-neutral-900 via-neutral-900/50 to-transparent z-10" />
                {/* Extra left gradient on mobile for text readability */}
                <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-neutral-900 via-neutral-900/70 to-transparent z-10 md:hidden" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer - Modern minimal */}
      <footer className="py-10 sm:py-12 relative">
        {/* Horisontal linje som går helt ut til kantene */}
        <div className="absolute top-0 left-0 right-0 h-px bg-neutral-200/40" aria-hidden />
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 sm:py-6">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <Link href="/" className="flex items-center group">
                <motion.img
                  whileHover={{ rotate: 5 }}
                  src="/logo.svg"
                  alt="Booster"
                  className="h-6 w-auto brightness-0"
                />
              </Link>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[10px] sm:text-xs text-neutral-400"
            >
              {[
                { href: 'https://mediabooster.no', label: 'Mediabooster' },
                { href: 'https://mediabooster.no/kontakt', label: 'Kontakt' },
                { href: 'https://mediabooster.no/personvern', label: 'Personvern' },
              ].map((link, i) => (
                <motion.a 
                  key={i}
                  href={link.href} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-neutral-600 transition-colors"
                  whileHover={{ y: -1 }}
                >
                  {link.label}
                </motion.a>
              ))}
              <span className="text-neutral-300">·</span>
              <span>&copy; {new Date().getFullYear()}</span>
            </motion.div>
          </div>
        </div>
      </footer>
    </div>
  );
}
