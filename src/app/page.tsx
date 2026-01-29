'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import {
  Search,
  Shield,
  Zap,
  FileText,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Star,
  Globe,
  Tag,
  Sparkles,
  BarChart3,
  Link2,
  LayoutDashboard,
} from 'lucide-react';


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

// Floating UI Card - SEO Metrics
function FloatingSEOCard() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      whileHover={{ y: -8, scale: 1.02, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}
      className="bg-white rounded-2xl shadow-2xl shadow-neutral-200/50 border border-neutral-100 p-5 w-72"
    >
      <div className="flex items-center gap-2 mb-4">
        <motion.div 
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
          className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center"
        >
          <Search className="w-4 h-4 text-green-600" />
        </motion.div>
        <span className="font-medium text-sm">SEO</span>
      </div>
      <div className="space-y-3">
        {[
          { icon: CheckCircle2, label: 'Title Tag', value: '58 tegn', color: 'green' },
          { icon: CheckCircle2, label: 'Meta Desc', value: '142 tegn', color: 'green' },
          { icon: TrendingUp, label: 'H1 Tags', value: '2 stk', color: 'yellow' },
        ].map((item, i) => (
          <motion.div 
            key={i}
            whileHover={{ x: 4, backgroundColor: '#f9fafb' }}
            className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-md bg-${item.color}-100 flex items-center justify-center`}>
                <item.icon className={`w-3 h-3 text-${item.color}-600`} />
              </div>
              <span className="text-sm text-neutral-600">{item.label}</span>
            </div>
            <span className={`text-sm font-medium text-${item.color}-600`}>{item.value}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// Floating UI Card - Security
function FloatingSecurityCard() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      whileHover={{ y: -8, scale: 1.02, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}
      className="bg-white rounded-2xl shadow-2xl shadow-neutral-200/50 border border-neutral-100 p-5 w-64"
    >
      <div className="flex items-center gap-2 mb-4">
        <motion.div 
          whileHover={{ rotate: 15 }}
          className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center"
        >
          <Shield className="w-4 h-4 text-green-600" />
        </motion.div>
        <span className="font-medium text-sm">Sikkerhet</span>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <motion.div 
          whileHover={{ scale: 1.1 }}
          className="w-16 h-16 rounded-xl bg-green-50 flex items-center justify-center"
        >
          <span className="text-2xl font-bold text-green-600">A+</span>
        </motion.div>
        <div>
          <div className="font-medium text-sm">SSL Grade</div>
          <div className="text-xs text-neutral-500">Utmerket</div>
        </div>
      </div>
      <div className="space-y-2">
        {['HTTPS', 'HSTS', 'X-Frame'].map((item, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + i * 0.1 }}
            whileHover={{ x: 4 }}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-neutral-500">{item}</span>
            <motion.div whileHover={{ scale: 1.2 }}>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </motion.div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// Floating UI Card - Scores
function FloatingScoresCard() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.6 }}
      whileHover={{ y: -8, scale: 1.02, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}
      className="bg-white rounded-2xl shadow-2xl shadow-neutral-200/50 border border-neutral-100 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-green-500" 
            />
            <span className="text-xs text-neutral-500">Analyse fullført</span>
          </div>
          <span className="font-semibold">eksempel.no</span>
        </div>
        <span className="text-xs text-neutral-400">I dag</span>
      </div>
      <div className="flex items-center justify-center gap-6">
        <motion.div whileHover={{ scale: 1.1 }}>
          <ScoreRing score={78} label="Total" size="lg" />
        </motion.div>
        <div className="space-y-3">
          {[
            { score: 92, label: 'SEO' },
            { score: 65, label: 'Innhold' },
            { score: 85, label: 'Sikkerhet' },
          ].map((item, i) => (
            <motion.div 
              key={i}
              whileHover={{ x: 4 }}
              className="flex items-center gap-3"
            >
              <ScoreRing score={item.score} label="" size="sm" />
              <span className="text-sm text-neutral-600">{item.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Floating UI Card - Keywords
function FloatingKeywordsCard() {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.7, duration: 0.6 }}
      className="bg-white rounded-2xl shadow-2xl shadow-neutral-200/50 border border-neutral-100 p-5 w-80"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
          <Tag className="w-4 h-4 text-purple-600" />
        </div>
        <span className="font-medium text-sm">Nøkkelord</span>
        <Badge className="ml-auto bg-amber-100 text-amber-700 text-xs">AI-estimater</Badge>
      </div>
      <div className="overflow-hidden rounded-xl border border-neutral-100">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="text-left p-2 font-medium text-neutral-500">Søkeord</th>
              <th className="text-right p-2 font-medium text-neutral-500">Vol.</th>
              <th className="text-right p-2 font-medium text-neutral-500">CPC</th>
            </tr>
          </thead>
          <tbody>
            {[
              { word: 'digital markedsføring', vol: '2.4K', cpc: '45kr' },
              { word: 'seo byrå', vol: '1.8K', cpc: '62kr' },
              { word: 'nettside analyse', vol: '890', cpc: '28kr' },
            ].map((kw, i) => (
              <tr key={i} className="border-t border-neutral-100">
                <td className="p-2 text-neutral-700">{kw.word}</td>
                <td className="p-2 text-right text-neutral-600">{kw.vol}</td>
                <td className="p-2 text-right text-green-600">{kw.cpc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// Floating AI Recommendations
function FloatingAICard() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.6 }}
      className="bg-white rounded-2xl shadow-2xl shadow-neutral-200/50 border border-neutral-100 p-5 w-72"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-neutral-600" />
        </div>
        <span className="font-medium text-sm">AI-anbefalinger</span>
      </div>
      <div className="space-y-2">
        {[
          { priority: 'høy', text: 'Legg til meta description' },
          { priority: 'medium', text: 'Optimaliser bilder' },
          { priority: 'lav', text: 'Legg til strukturerte data' },
        ].map((rec, i) => (
          <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-neutral-50">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              rec.priority === 'høy' ? 'bg-red-100 text-red-700' :
              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {rec.priority}
            </span>
            <span className="text-sm text-neutral-600">{rec.text}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/mediabooster-logo-darkgrey.avif"
              alt="Mediabooster"
              className="h-6 w-auto"
            />
            <span className="text-neutral-500 text-sm hidden sm:inline">Din digitale CMO - og AI-kollega!</span>
          </Link>
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-24 h-9 bg-neutral-100 rounded-lg animate-pulse" />
            ) : user ? (
              <Button size="sm" className="bg-neutral-900 hover:bg-neutral-800" asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Logg inn</Link>
                </Button>
                <Button size="sm" className="bg-neutral-900 hover:bg-neutral-800" asChild>
                  <Link href="/register">Kom i gang</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section - Creative floating UI */}
      <section className="pt-28 pb-8 md:pt-36 md:pb-12 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="outline" className="mb-6 text-neutral-600 border-neutral-300">
                Gratis for norske bedrifter
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight mb-6">
                Din digitale CMO - og AI-kollega.
              </h1>
              <p className="text-lg text-neutral-500 mb-10 max-w-lg">
                Få en fullstendig helsesjekk av nettsiden med SEO, sikkerhet, innhold og 
                AI-anbefalinger - alt i én rapport.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {user ? (
                  <Button size="lg" className="h-12 px-8 bg-neutral-900 hover:bg-neutral-800" asChild>
                    <Link href="/dashboard">
                      <LayoutDashboard className="mr-2 w-4 h-4" />
                      Gå til Dashboard
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button size="lg" className="h-12 px-8 bg-neutral-900 hover:bg-neutral-800" asChild>
                      <Link href="/register">
                        Kom i gang gratis
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="h-12 px-8" asChild>
                      <Link href="/login">Logg inn</Link>
                    </Button>
                  </>
                )}
              </div>
            </motion.div>

            {/* Floating UI composition */}
            <div className="relative h-[500px] hidden lg:block">
              <div className="absolute top-0 left-0">
                <FloatingScoresCard />
              </div>
              <div className="absolute top-4 right-0">
                <FloatingSEOCard />
              </div>
              <div className="absolute bottom-0 left-8">
                <FloatingSecurityCard />
              </div>
            </div>
          </div>
        </div>
        
        {/* Background gradient */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-neutral-50 to-transparent -z-10" />
      </section>

      {/* Trusted by - Scrolling Logo Carousel */}
      <section className="py-8 overflow-hidden relative">
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-xs uppercase tracking-widest text-neutral-400 mb-6"
        >
          Brukes av innovative bedrifter
        </motion.p>
        
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
        
        {/* Row 1 - scrolling left */}
        <div className="relative mb-3">
          <div className="flex animate-scroll-left">
            {[...Array(3)].map((_, setIndex) => (
              <div key={setIndex} className="flex shrink-0 gap-3">
                {['TechStart', 'Grønn Handel', 'Digital Vekst', 'Nordic Solutions', 'Smartbedrift', 'WebExperts'].map((name, i) => (
                  <div key={`${setIndex}-${i}`} className="px-5 py-2.5 bg-neutral-50 rounded-lg text-sm text-neutral-400 whitespace-nowrap hover:text-neutral-600 hover:bg-neutral-100 transition-colors">
                    {name}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Row 2 - scrolling right */}
        <div className="relative">
          <div className="flex animate-scroll-right">
            {[...Array(3)].map((_, setIndex) => (
              <div key={setIndex} className="flex shrink-0 gap-3">
                {['StartupHub', 'NordicTech', 'DigiMarketing', 'Konsulent AS', 'EcomNorge', 'SaaS Norge'].map((name, i) => (
                  <div key={`${setIndex}-${i}`} className="px-5 py-2.5 bg-neutral-50 rounded-lg text-sm text-neutral-400 whitespace-nowrap hover:text-neutral-600 hover:bg-neutral-100 transition-colors">
                    {name}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <style jsx>{`
          @keyframes scroll-left {
            0% { transform: translateX(0); }
            100% { transform: translateX(-33.33%); }
          }
          @keyframes scroll-right {
            0% { transform: translateX(-33.33%); }
            100% { transform: translateX(0); }
          }
          .animate-scroll-left {
            animation: scroll-left 25s linear infinite;
          }
          .animate-scroll-right {
            animation: scroll-right 25s linear infinite;
          }
        `}</style>
      </section>

      {/* Bento Grid Features */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-medium mb-4">
              Alt du trenger for å forbedre nettsiden
            </h2>
            <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
              Vi analyserer over 50 faktorer og gir deg konkrete anbefalinger
            </p>
          </motion.div>

          {/* Bento Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* SEO - Large card with hover reveal */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="md:col-span-2 bg-neutral-50 rounded-3xl p-8 relative overflow-hidden group hover:bg-neutral-100 transition-all duration-300"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Search className="w-6 h-6 text-neutral-700" />
                </div>
                <h3 className="text-xl font-semibold mb-2">SEO-analyse</h3>
                <p className="text-neutral-500 mb-6 max-w-sm">
                  Sjekk meta tags, overskrifter, bilder, lenker og teknisk SEO
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Title', 'Description', 'H1-H6', 'Bilder', 'Lenker', 'Open Graph'].map((tag, i) => (
                    <span 
                      key={tag} 
                      className="px-3 py-1 bg-white rounded-full text-sm text-neutral-600 transition-all duration-300 group-hover:bg-neutral-900 group-hover:text-white"
                      style={{ transitionDelay: `${i * 50}ms` }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                <ScoreRing score={92} label="SEO" size="lg" />
              </div>
            </motion.div>

            {/* Security - Small card with hover animation */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-neutral-900 rounded-3xl p-8 text-white group hover:bg-neutral-800 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6 group-hover:bg-white/20 transition-colors">
                  <Shield className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Sikkerhet</h3>
                <p className="text-neutral-400 mb-6">
                  SSL-sertifikat og sikkerhetsheaders
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-green-500/30 transition-all">
                    <span className="text-xl font-bold text-green-400">A+</span>
                  </div>
                  <div className="text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors">
                    SSL Grade
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Content - Small card with animated counters */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 group hover:from-purple-100 hover:to-pink-100 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:shadow-md group-hover:scale-110 transition-all">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Innhold</h3>
              <p className="text-neutral-500 mb-6">
                Ordtelling, lesbarhet og struktur
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3 text-center group-hover:shadow-md transition-all">
                  <div className="text-2xl font-bold group-hover:text-purple-600 transition-colors">847</div>
                  <div className="text-xs text-neutral-500">Ord</div>
                </div>
                <div className="bg-white rounded-xl p-3 text-center group-hover:shadow-md transition-all">
                  <div className="text-2xl font-bold group-hover:text-purple-600 transition-colors">38</div>
                  <div className="text-xs text-neutral-500">LIX</div>
                </div>
              </div>
            </motion.div>

            {/* Keywords - Medium card with hover table highlight */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="md:col-span-2 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-8 group hover:from-blue-100 hover:to-cyan-100 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:shadow-md group-hover:scale-110 transition-all">
                    <Tag className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Nøkkelordanalyse</h3>
                  <p className="text-neutral-500">
                    AI-estimert søkevolum, CPC og konkurranse
                  </p>
                </div>
                <Badge className="bg-amber-100 text-amber-700 group-hover:bg-amber-200 transition-colors">AI-drevet</Badge>
              </div>
              <div className="bg-white rounded-2xl p-4 overflow-hidden group-hover:shadow-md transition-all">
                <div className="flex items-center justify-between py-2 border-b border-neutral-100 text-sm">
                  <span className="text-neutral-500 font-medium">Nøkkelord</span>
                  <div className="flex gap-8">
                    <span className="text-neutral-500 font-medium w-16 text-right">Volum</span>
                    <span className="text-neutral-500 font-medium w-16 text-right">CPC</span>
                  </div>
                </div>
                {[
                  { word: 'digital markedsføring oslo', vol: '2.4K', cpc: '45 kr' },
                  { word: 'seo tjenester', vol: '1.8K', cpc: '62 kr' },
                  { word: 'nettside analyse', vol: '890', cpc: '28 kr' },
                ].map((kw, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between py-3 text-sm hover:bg-blue-50 -mx-4 px-4 transition-colors rounded-lg"
                  >
                    <span className="text-neutral-700">{kw.word}</span>
                    <div className="flex gap-8">
                      <span className="text-neutral-600 w-16 text-right">{kw.vol}</span>
                      <span className="text-green-600 font-medium w-16 text-right">{kw.cpc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* AI Section - Full width with floating cards */}
      <section className="py-24 bg-neutral-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.05 }}
            viewport={{ once: true }}
            className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 blur-3xl"
          />
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.03 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-gradient-to-br from-green-500 to-cyan-500 blur-3xl"
          />
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="inline-block"
              >
                <Badge className="mb-6 bg-white/10 text-white border-0">
                  AI-drevet
                </Badge>
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-medium text-white mb-6">
                Prioriterte anbefalinger fra AI
              </h2>
              <p className="text-lg text-neutral-400 mb-8">
                Vår AI analyserer alle resultater og gir deg en prioritert liste med konkrete tiltak 
                som vil ha størst effekt på nettsiden din.
              </p>
              <ul className="space-y-4">
                {[
                  'Prioritert etter forventet effekt',
                  'Konkrete handlingsanbefalinger',
                  'Tilpasset din bransje',
                  'Handlingsplan: nå, kort sikt, lang sikt',
                ].map((item, i) => (
                  <motion.li 
                    key={i} 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ x: 8 }}
                    className="flex items-center gap-3 text-neutral-300"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <motion.div 
                whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="bg-white rounded-2xl p-6"
              >
                <div className="flex items-center gap-2 mb-6">
                  <motion.div 
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.5 }}
                    className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center"
                  >
                    <Sparkles className="w-5 h-5 text-neutral-600" />
                  </motion.div>
                  <div>
                    <div className="font-medium">AI-analyse</div>
                    <div className="text-xs text-neutral-500">3 prioriterte tiltak</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { priority: 'høy', title: 'Legg til meta description', desc: 'Viktig for klikk i søkeresultater' },
                    { priority: 'høy', title: 'Fiks 2 H1-overskrifter', desc: 'Kun én H1 per side anbefalt' },
                    { priority: 'medium', title: 'Optimaliser bilder', desc: '3 bilder mangler alt-tekst' },
                  ].map((rec, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 hover:border-neutral-200 hover:bg-white transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                          rec.priority === 'høy' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {rec.priority}
                        </span>
                        <div>
                          <div className="font-medium text-sm">{rec.title}</div>
                          <div className="text-xs text-neutral-500 mt-0.5">{rec.desc}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Competitor Analysis */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <motion.div 
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="bg-neutral-50 rounded-3xl p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-neutral-500">Sammenligning</span>
                  <motion.span 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-xs text-neutral-400"
                  >
                    vs. konkurrent.no
                  </motion.span>
                </div>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <motion.div 
                    whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                    className="bg-white rounded-2xl p-5 text-center transition-shadow"
                  >
                    <div className="text-xs text-neutral-500 mb-2">Din nettside</div>
                    <ScoreRing score={78} label="" size="lg" />
                  </motion.div>
                  <motion.div 
                    whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                    className="bg-white rounded-2xl p-5 text-center transition-shadow"
                  >
                    <div className="text-xs text-neutral-500 mb-2">Konkurrent</div>
                    <ScoreRing score={65} label="" size="lg" />
                  </motion.div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'SEO', you: 92, them: 78, youWins: true },
                    { label: 'Innhold', you: 50, them: 62, youWins: false },
                    { label: 'Sikkerhet', you: 85, them: 72, youWins: true },
                  ].map((item, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ x: 4, backgroundColor: '#fff' }}
                      className="flex items-center justify-between p-3 bg-white rounded-xl transition-all"
                    >
                      <span className="text-sm">{item.label}</span>
                      <div className="flex items-center gap-4">
                        <motion.span 
                          whileHover={{ scale: 1.1 }}
                          className={`text-sm font-medium ${item.youWins ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {item.you}
                        </motion.span>
                        <span className="text-sm text-neutral-400">vs</span>
                        <motion.span 
                          whileHover={{ scale: 1.1 }}
                          className={`text-sm font-medium ${!item.youWins ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {item.them}
                        </motion.span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <motion.div whileHover={{ scale: 1.05 }} className="inline-block">
                <Badge variant="outline" className="mb-4 text-neutral-600 border-neutral-300">
                  Inkludert gratis
                </Badge>
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-medium mb-6">
                Sammenlign med konkurrenten
              </h2>
              <p className="text-lg text-neutral-500 mb-8">
                Se hvordan nettsiden din presterer sammenlignet med en konkurrent. 
                Finn dine styrker og muligheter for forbedring.
              </p>
              <ul className="space-y-4">
                {[
                  'Side-ved-side sammenligning',
                  'Dine styrker vs konkurrentens',
                  'Identifiser muligheter',
                  'AI-genererte forbedringspunkter',
                ].map((item, i) => (
                  <motion.li 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ x: 8 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-neutral-400" />
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works - Creative timeline layout */}
      <section className="py-16 overflow-hidden relative">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-medium mb-3">Slik fungerer det</h2>
            <p className="text-neutral-500">Tre enkle steg til en bedre nettside</p>
          </motion.div>

          {/* Timeline container */}
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-200 hidden md:block" />

            {[
              {
                step: '01',
                title: 'Registrer bedriften',
                description: 'Opprett en gratis konto med bedriftsinformasjon og nettadressen din.',
                icon: Globe,
                color: 'bg-blue-500',
              },
              {
                step: '02',
                title: 'Start analysen',
                description: 'Klikk på "Ny analyse" og vent mens vi sjekker over 50 faktorer.',
                icon: BarChart3,
                color: 'bg-purple-500',
              },
              {
                step: '03',
                title: 'Få rapporten',
                description: 'Motta en komplett rapport med scores og prioriterte anbefalinger.',
                icon: Sparkles,
                color: 'bg-amber-500',
              },
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className={`relative flex items-center gap-8 mb-8 last:mb-0 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
              >
                {/* Content card */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className={`flex-1 ${i % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}
                >
                  <div className="inline-block bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow group">
                    <div className={`flex items-center gap-3 mb-3 ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                      <motion.div 
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                        className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center`}
                      >
                        <item.icon className="w-5 h-5 text-white" />
                      </motion.div>
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                    </div>
                    <p className="text-neutral-500 text-sm">{item.description}</p>
                  </div>
                </motion.div>

                {/* Center circle */}
                <motion.div 
                  whileHover={{ scale: 1.2 }}
                  className="hidden md:flex w-12 h-12 rounded-full bg-white border-4 border-neutral-100 items-center justify-center font-bold text-neutral-400 z-10 shrink-0"
                >
                  {item.step}
                </motion.div>

                {/* Spacer for alternating layout */}
                <div className="flex-1 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Stacked cards */}
      <section className="py-16 bg-neutral-50 overflow-hidden">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-10"
          >
            <div>
              <h2 className="text-2xl md:text-3xl font-medium">Hva bedrifter sier</h2>
              <p className="text-neutral-500 text-sm mt-1">Over 500+ fornøyde brukere</p>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
          </motion.div>

          {/* Stacked testimonials */}
          <div className="space-y-4">
            {[
              {
                quote: 'Fantastisk verktøy! Vi fant flere tekniske feil vi aldri hadde oppdaget selv. Anbefalingene var konkrete og enkle å følge.',
                name: 'Kari Hansen',
                title: 'Daglig leder',
                company: 'TechStart AS',
                avatar: 'KH',
                highlight: true,
              },
              {
                quote: 'Rapporten var så detaljert og enkel å forstå. Anbefalingene sparte oss for timer med feilsøking.',
                name: 'Ole Berg',
                title: 'Markedssjef',
                company: 'Grønn Handel',
                avatar: 'OB',
                highlight: false,
              },
              {
                quote: 'Sikkerhetssjekken avslørte sårbarheter vi ikke visste om. Viktig for enhver bedrift!',
                name: 'Lisa Nordli',
                title: 'CEO',
                company: 'Digital Vekst',
                avatar: 'LN',
                highlight: false,
              },
            ].map((testimonial, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <motion.div
                  whileHover={{ scale: 1.01, x: 8 }}
                  className={`flex gap-4 p-5 rounded-2xl transition-all ${
                    testimonial.highlight 
                      ? 'bg-white shadow-lg border border-neutral-100' 
                      : 'bg-white/50 hover:bg-white hover:shadow-md'
                  }`}
                >
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                      testimonial.highlight ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {testimonial.avatar}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className={`mb-3 ${testimonial.highlight ? 'text-neutral-700' : 'text-neutral-600 text-sm'}`}>
                      "{testimonial.quote}"
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-neutral-900">{testimonial.name}</span>
                      <span className="text-neutral-300">·</span>
                      <span className="text-neutral-500">{testimonial.title}, {testimonial.company}</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ - Two column layout */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-5 gap-8 items-start">
            {/* Left side - Title */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="md:col-span-2 md:sticky md:top-24"
            >
              <h2 className="text-2xl md:text-3xl font-medium mb-3">Ofte stilte spørsmål</h2>
              <p className="text-neutral-500 text-sm mb-6">Alt du trenger å vite før du starter.</p>
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
            <div className="md:col-span-3 space-y-3">
              {[
                {
                  q: 'Er dette virkelig gratis?',
                  a: 'Ja! Du får 2 gratis analyser per måned. Ønsker du flere analyser eller oppfølging, kan du kontakte Mediabooster.',
                },
                {
                  q: 'Hva analyseres i rapporten?',
                  a: 'Vi analyserer SEO (meta tags, struktur, bilder), sikkerhet (SSL, sikkerhetsheaders), innholdskvalitet, nøkkelord, og genererer AI-anbefalinger.',
                },
                {
                  q: 'Hvor lang tid tar en analyse?',
                  a: 'En full analyse tar vanligvis 30-60 sekunder, avhengig av nettsidens størrelse og kompleksitet.',
                },
                {
                  q: 'Kan jeg sammenligne med konkurrenter?',
                  a: 'Ja! I gratis-versjonen kan du sammenligne med én konkurrent. Premium gir deg mulighet til å legge til flere.',
                },
              ].map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
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
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Inline style */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-neutral-900 rounded-2xl p-8 md:p-10 relative overflow-hidden"
          >
            {/* Subtle gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h2 className="text-xl md:text-2xl font-medium text-white mb-2">
                  Klar for en helsesjekk av nettsiden?
                </h2>
                <p className="text-neutral-400 text-sm">
                  Gratis analyse på under ett minutt
                </p>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Button className="bg-white text-neutral-900 hover:bg-neutral-100" asChild>
                  <Link href="/register">
                    Kom i gang gratis
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer - Modern minimal */}
      <footer className="py-8">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-6 border-t border-neutral-100">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex items-center gap-6"
            >
              <Link href="/" className="flex items-center gap-2 group">
                <motion.img
                  whileHover={{ rotate: 5 }}
                  src="/mediabooster-logo-darkgrey.avif"
                  alt="Mediabooster"
                  className="h-5 w-auto"
                />
              </Link>
              <span className="text-neutral-400 text-xs">Din digitale CMO</span>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex items-center gap-6 text-xs text-neutral-400"
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
