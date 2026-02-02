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
  Zap,
  FileText,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Star,
  Globe,
  Tag,
  Sparkles,
  BarChart3,
  Link2,
  LayoutDashboard,
  ChevronRight,
  ChevronDown,
  Eye,
  Lightbulb,
  Clock,
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
  const [demoTab, setDemoTab] = useState<'oversikt' | 'konkurrenter' | 'nokkelord' | 'ai' | 'ai-sok'>('oversikt');
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
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          <Link href="/" className="flex flex-col gap-0.5 min-w-0 flex-shrink">
            <img
              src="/mediabooster-logo-darkgrey.avif"
              alt="Mediabooster"
              className="h-4 sm:h-5 w-auto"
            />
            <span className="text-neutral-500 text-[10px] sm:text-xs hidden sm:inline truncate">Din digitale CMO</span>
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
              <>
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3" asChild>
                  <Link href="/login">Logg inn</Link>
                </Button>
                <Button size="sm" className="bg-neutral-900 hover:bg-neutral-800 text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4" asChild>
                  <Link href="/register">Kom i gang</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section - Centered with Dashboard Demo */}
      <section className="pt-20 pb-6 sm:pt-24 sm:pb-8 md:pt-32 md:pb-12 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full bg-gradient-to-br from-purple-100/40 via-transparent to-transparent blur-[80px] sm:blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-gradient-to-br from-cyan-100/30 via-transparent to-transparent blur-[60px] sm:blur-[80px]" />
        </div>

        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6">
          {/* Hero Text - Centered */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-8 sm:mb-12"
            >
              <Badge variant="outline" className="mb-4 sm:mb-6 text-xs sm:text-sm text-neutral-600 border-neutral-300">
              AI-drevet nettside-analyse
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight mb-4 sm:mb-6">
              Din digitale CMO<br />
              <span className="text-neutral-400">- og AI-kollega.</span>
              </h1>
            <p className="text-base sm:text-lg text-neutral-500 mb-6 sm:mb-8 max-w-xl mx-auto px-1">
                Få en fullstendig helsesjekk av nettsiden med SEO, sikkerhet, innhold og AI-anbefalinger – alt i én rapport.
              </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
                {user ? (
                  <Button size="lg" className="h-10 sm:h-12 px-6 sm:px-8 w-full sm:w-auto bg-neutral-900 hover:bg-neutral-800 text-sm sm:text-base" asChild>
                    <Link href="/dashboard">
                      <LayoutDashboard className="mr-2 w-4 h-4" />
                      Gå til Dashboard
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button size="lg" className="h-10 sm:h-12 px-6 sm:px-8 w-full sm:w-auto bg-neutral-900 hover:bg-neutral-800 text-sm sm:text-base" asChild>
                      <Link href="/register">
                        Kom i gang gratis
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="h-10 sm:h-12 px-6 sm:px-8 w-full sm:w-auto text-sm sm:text-base" asChild>
                      <Link href="/login">Logg inn</Link>
                    </Button>
                  </>
                )}
              </div>
            </motion.div>

          {/* Dashboard Demo */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative overflow-hidden"
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
                    { id: 'nokkelord', label: 'Nøkkelord', icon: Tag },
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
                  {/* AI-synlighet - Coming soon, not clickable */}
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-neutral-400 cursor-not-allowed shrink-0">
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    AI-synlighet
                    <span className="text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600 font-medium">Snart</span>
                  </div>
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
              
              {/* Oversikt Tab */}
              {demoTab === 'oversikt' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Summary Card */}
                  <div className="rounded-xl sm:rounded-2xl p-3 sm:p-5 bg-amber-50 border border-amber-200">
                    <div className="flex items-start gap-2 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 bg-amber-100">
                        <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold text-amber-900">
                          Nettsiden har forbedringspotensial
                        </h3>
                        <p className="text-xs sm:text-sm text-amber-700 mt-0.5 line-clamp-2">
                          Vi har funnet noen områder som kan forbedres for bedre synlighet i Google.
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-2xl sm:text-3xl font-bold text-amber-600">78</div>
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
                            <ScoreRing score={78} label="Totalt" size="sm" />
                            <p className="text-[10px] text-neutral-500 mt-1">Samlet</p>
                          </div>
                          <div className="text-center">
                            <ScoreRing score={72} label="SEO" size="sm" />
                            <p className="text-[10px] text-neutral-500 mt-1">Søkemotor</p>
                          </div>
                          <div className="text-center">
                            <ScoreRing score={58} label="Innhold" size="sm" />
                            <p className="text-[10px] text-neutral-500 mt-1">Tekst</p>
                          </div>
                          <div className="text-center">
                            <ScoreRing score={95} label="Sikkerhet" size="sm" />
                            <p className="text-[10px] text-neutral-500 mt-1">Trygghet</p>
                          </div>
                          <div className="text-center">
                            <ScoreRing score={72} label="AI" size="sm" />
                            <p className="text-[10px] text-neutral-500 mt-1">AI-synlighet</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Priority Improvements */}
                    <div className="rounded-xl sm:rounded-2xl border border-neutral-200 bg-white p-2 sm:p-4 min-w-0">
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <h3 className="font-semibold text-neutral-900 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                          <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
                          Forbedringer
                        </h3>
                        <span className="text-[10px] sm:text-xs text-neutral-400">4 funn</span>
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
                            <ChevronRight className="w-3 h-3 text-neutral-400 group-hover:text-neutral-600 shrink-0" />
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
                      Konkurrentsammenligning (2 konkurrenter)
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

              {/* Nøkkelord Tab */}
              {demoTab === 'nokkelord' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="overflow-x-auto rounded-xl border border-neutral-200 -mx-1 sm:mx-0">
                    <table className="w-full min-w-[320px]">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold text-neutral-500">Nøkkelord</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-500">Volum</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-500">CPC</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-neutral-500">Konkurranse</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { kw: 'digital markedsføring', vol: '2.4K', cpc: '45 kr', comp: 'høy' },
                          { kw: 'seo tjenester oslo', vol: '1.8K', cpc: '62 kr', comp: 'medium' },
                          { kw: 'nettside analyse', vol: '890', cpc: '28 kr', comp: 'lav' },
                          { kw: 'webdesign byrå', vol: '720', cpc: '38 kr', comp: 'medium' },
                        ].map((item, i) => (
                          <tr key={i} className="border-t border-neutral-100">
                            <td className="py-3 px-4 text-sm font-medium text-neutral-900">{item.kw}</td>
                            <td className="py-3 px-4 text-sm text-right">{item.vol}</td>
                            <td className="py-3 px-4 text-sm text-right text-green-600 font-medium">{item.cpc}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                item.comp === 'høy' ? 'bg-red-100 text-red-700' :
                                item.comp === 'medium' ? 'bg-amber-100 text-amber-700' :
                                'bg-green-100 text-green-700'
                              }`}>{item.comp}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    <div className="p-2 sm:p-3 rounded-xl bg-neutral-50">
                      <p className="text-[10px] sm:text-xs text-neutral-500 font-medium">Total volum</p>
                      <p className="text-base sm:text-lg font-bold text-neutral-900">~5.8K</p>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-50">
                      <p className="text-xs text-neutral-500 font-medium">Snitt CPC</p>
                      <p className="text-lg font-bold text-green-600">43 kr</p>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-50">
                      <p className="text-xs text-neutral-500 font-medium">Vanskelighet</p>
                      <p className="text-lg font-bold text-amber-600">52</p>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-50">
                      <p className="text-xs text-neutral-500 font-medium">Trend</p>
                      <p className="text-lg font-bold text-green-600 flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" /> Opp
                      </p>
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
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trusted by - Scrolling Logo Carousel */}
      <section className="py-8 sm:py-12 overflow-hidden relative">
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-[10px] sm:text-xs uppercase tracking-widest text-neutral-400 mb-4 sm:mb-8 px-4"
        >
          Brukes av innovative bedrifter
        </motion.p>
        
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
        
        {/* Row 1 - scrolling left */}
        <div className="relative mb-4">
          <div className="flex animate-scroll-left">
            {[...Array(3)].map((_, setIndex) => (
              <div key={setIndex} className="flex shrink-0 items-center gap-16 px-8">
                {[
                  { name: 'Acme Corp', icon: '◆' },
                  { name: 'TechFlow', icon: '●' },
                  { name: 'Quantum', icon: '◈' },
                  { name: 'Synapse', icon: '◎' },
                  { name: 'Vertex', icon: '▲' },
                  { name: 'Nebula', icon: '★' },
                ].map((logo, i) => (
                  <div key={`${setIndex}-${i}`} className="flex items-center gap-2 opacity-40 hover:opacity-70 transition-opacity">
                    <span className="text-2xl text-neutral-600">{logo.icon}</span>
                    <span className="text-lg font-semibold text-neutral-600 tracking-tight">{logo.name}</span>
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
              <div key={setIndex} className="flex shrink-0 items-center gap-16 px-8">
                {[
                  { name: 'Horizon', icon: '◐' },
                  { name: 'Pulse', icon: '◉' },
                  { name: 'Atlas', icon: '⬡' },
                  { name: 'Spark', icon: '✦' },
                  { name: 'Nova', icon: '✧' },
                  { name: 'Prism', icon: '◇' },
                ].map((logo, i) => (
                  <div key={`${setIndex}-${i}`} className="flex items-center gap-2 opacity-40 hover:opacity-70 transition-opacity">
                    <span className="text-2xl text-neutral-600">{logo.icon}</span>
                    <span className="text-lg font-semibold text-neutral-600 tracking-tight">{logo.name}</span>
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
            animation: scroll-left 30s linear infinite;
          }
          .animate-scroll-right {
            animation: scroll-right 30s linear infinite;
          }
        `}</style>
      </section>

      {/* Bento Grid Features */}
      <section className="py-12 sm:py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12 md:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-medium tracking-tight mb-3 sm:mb-4">
              Komplett analyse<br />
              <span className="text-neutral-400">av hele nettsiden.</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-neutral-500 max-w-xl mx-auto px-2">
              SEO, sikkerhet, innhold og nøkkelord – med AI-anbefalinger.
            </p>
          </motion.div>

          {/* Bento Grid */}
          <motion.div 
            className="grid md:grid-cols-3 gap-3 sm:gap-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {/* SEO - Large card with hover reveal */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="md:col-span-2 relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 overflow-hidden group"
            >
              {/* Animated background */}
              <motion.div 
                className="absolute inset-0 bg-neutral-50 group-hover:bg-neutral-100 transition-colors duration-300"
                initial={{ opacity: 0, scale: 1.1 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 1.8, ease: "easeOut" }}
              />
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
              <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0 z-10">
                <ScoreRing score={92} label="SEO" size="lg" />
              </div>
            </motion.div>

            {/* Security - Small card with hover animation */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 group overflow-hidden"
            >
              {/* Animated gradient background */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 group-hover:from-green-100 group-hover:to-emerald-100 transition-colors duration-300"
                initial={{ opacity: 0, scale: 1.1 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 1.8, ease: "easeOut" }}
              />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:shadow-md group-hover:scale-110 transition-all">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">Sikkerhet</h3>
                <p className="text-neutral-500 mb-6">
                  SSL-sertifikat og sikkerhetsheaders
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center group-hover:scale-110 group-hover:bg-green-200 transition-all">
                    <span className="text-xl font-bold text-green-600">A+</span>
                  </div>
                  <div className="text-sm text-neutral-500 group-hover:text-neutral-600 transition-colors">
                    SSL Grade
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Content - Small card with animated counters */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 group overflow-hidden"
            >
              {/* Animated gradient background */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 group-hover:from-purple-100 group-hover:to-pink-100 transition-colors duration-300"
                initial={{ opacity: 0, scale: 1.1 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 1.8, ease: "easeOut", delay: 0.1 }}
              />
              <div className="relative z-10">
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
              </div>
            </motion.div>

            {/* Keywords - Medium card with hover table highlight */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="md:col-span-2 relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 group overflow-hidden"
            >
              {/* Animated gradient background */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 group-hover:from-blue-100 group-hover:to-cyan-100 transition-colors duration-300"
                initial={{ opacity: 0, scale: 1.1 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 1.8, ease: "easeOut", delay: 0.2 }}
              />
              <div className="relative z-10">
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
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-100">
                        <th className="text-left py-2 px-2 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Nøkkelord</th>
                        <th className="text-right py-2 px-2 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Volum</th>
                        <th className="text-right py-2 px-2 text-xs font-semibold text-neutral-500 uppercase tracking-wide">CPC</th>
                        <th className="text-center py-2 px-2 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Konkurranse</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { word: 'digital markedsføring', vol: '2.4K', cpc: '45 kr', comp: 'høy' },
                        { word: 'seo tjenester oslo', vol: '1.8K', cpc: '62 kr', comp: 'medium' },
                        { word: 'nettside analyse', vol: '890', cpc: '28 kr', comp: 'lav' },
                ].map((kw, i) => (
                        <tr key={i} className="border-t border-neutral-50 hover:bg-blue-50 transition-colors">
                          <td className="py-2.5 px-2 text-neutral-700">{kw.word}</td>
                          <td className="py-2.5 px-2 text-right text-neutral-600">{kw.vol}</td>
                          <td className="py-2.5 px-2 text-right text-green-600 font-medium">{kw.cpc}</td>
                          <td className="py-2.5 px-2 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              kw.comp === 'høy' ? 'bg-red-100 text-red-700' :
                              kw.comp === 'medium' ? 'bg-amber-100 text-amber-700' :
                              'bg-green-100 text-green-700'
                            }`}>{kw.comp}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>

            {/* AI Articles - Full width card */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="md:col-span-3 relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 group overflow-hidden"
            >
              {/* Animated gradient background */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 group-hover:from-violet-100 group-hover:via-purple-100 group-hover:to-fuchsia-100 transition-colors duration-300"
                initial={{ opacity: 0, scale: 1.1 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 1.8, ease: "easeOut", delay: 0.3 }}
              />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:shadow-md group-hover:scale-110 transition-all">
                      <Sparkles className="w-6 h-6 text-violet-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">AI-genererte artikler</h3>
                    <p className="text-neutral-500 max-w-md">
                      Få artikkelideer basert på analysen og generer fullstendige artikler med ett klikk
                    </p>
                  </div>
                  <Badge className="bg-violet-100 text-violet-700 group-hover:bg-violet-200 transition-colors">Ny</Badge>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Left - Article suggestions */}
                  <div className="bg-white rounded-2xl p-4 group-hover:shadow-md transition-all">
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">Artikkelideer</p>
                    <div className="space-y-2">
                      {[
                        { title: '10 strategier for digital markedsføring i 2026', priority: 'høy' },
                        { title: 'Hvordan velge riktig SEO-byrå', priority: 'høy' },
                        { title: 'AI og automatisering: En komplett guide', priority: 'medium' },
                      ].map((article, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-violet-50 transition-colors">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 mt-0.5 ${
                            article.priority === 'høy' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>{article.priority}</span>
                          <span className="text-sm text-neutral-700 line-clamp-1">{article.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Right - Generated article preview */}
                  <div className="bg-white rounded-2xl p-4 group-hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Generert artikkel</p>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-[10px] text-neutral-400">600-1200 ord</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-5 bg-neutral-100 rounded w-3/4 group-hover:bg-violet-100 transition-colors" />
                      <div className="h-3 bg-neutral-50 rounded w-full" />
                      <div className="h-3 bg-neutral-50 rounded w-full" />
                      <div className="h-3 bg-neutral-50 rounded w-5/6" />
                      <div className="h-4 bg-neutral-100 rounded w-1/2 mt-3 group-hover:bg-violet-100 transition-colors" />
                      <div className="h-3 bg-neutral-50 rounded w-full" />
                      <div className="h-3 bg-neutral-50 rounded w-4/5" />
                    </div>
                    <div className="flex gap-2 mt-4">
                      <div className="px-3 py-1.5 rounded-lg bg-violet-100 text-violet-700 text-xs font-medium group-hover:bg-violet-200 transition-colors">
                        Kopier artikkel
                      </div>
                      <div className="px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-600 text-xs font-medium">
                        Lagret i Mine artikler
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            </motion.div>
        </div>
      </section>

      {/* AI Suggestions Interactive Section */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-medium tracking-tight mb-2 sm:mb-3">
              Fra problem<br />
              <span className="text-neutral-400">til løsning.</span>
              </h2>
            <p className="text-sm sm:text-base md:text-lg text-neutral-500 max-w-xl mx-auto px-2">
              AI analyserer funnene og gir deg konkrete forslag du kan implementere med én gang.
            </p>
            </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
            {/* Problem cards - narrower */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2 space-y-2"
            >
              {[
                { 
                  id: 'meta', 
                  title: 'Meta description', 
                  severity: 'høy',
                  icon: FileText,
                },
                { 
                  id: 'h1', 
                  title: 'H1-struktur', 
                  severity: 'medium',
                  icon: AlertCircle,
                },
                { 
                  id: 'images', 
                  title: 'Alt-tekst på bilder', 
                  severity: 'medium',
                  icon: FileText,
                },
                { 
                  id: 'content', 
                  title: 'Innholdsmengde', 
                  severity: 'lav',
                  icon: FileText,
                },
              ].map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => setSelectedIssue(issue.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    selectedIssue === issue.id
                      ? 'border-neutral-300 bg-neutral-50'
                      : 'border-transparent bg-neutral-50/50 hover:bg-neutral-50 hover:border-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      selectedIssue === issue.id ? 'bg-neutral-200' : 'bg-neutral-100'
                    }`}>
                      <issue.icon className={`w-4 h-4 ${
                        selectedIssue === issue.id ? 'text-neutral-700' : 'text-neutral-500'
                      }`} />
                  </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-medium ${
                        selectedIssue === issue.id ? 'text-neutral-900' : 'text-neutral-600'
                      }`}>{issue.title}</h4>
                </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      issue.severity === 'høy' 
                        ? 'bg-red-100 text-red-600'
                        : issue.severity === 'medium'
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {issue.severity}
                        </span>
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
              <div className="bg-neutral-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 min-h-[280px] sm:min-h-[320px]">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm font-medium text-neutral-600">AI-forslag</span>
                </div>
                
                {selectedIssue === 'meta' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="p-4 bg-white rounded-xl border border-neutral-200">
                      <p className="text-xs font-medium text-neutral-500 mb-2">Foreslått meta description:</p>
                      <p className="text-sm text-neutral-700">
                        "Spesialist på rørleggerarbeid i Bergen. Over 15 års erfaring med bad, 
                        kjøkken og VVS. Rask respons og konkurransedyktige priser. Ring for tilbud."
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
                        <p>"Hjem"</p>
                        <p>"Vi fikser alt av rør"</p>
                </div>
                      </div>
                    <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                      <p className="text-xs font-medium text-green-600 mb-2">Foreslått H1:</p>
                      <p className="text-sm text-neutral-700 font-medium">
                        "Rørlegger i Bergen - Rask hjelp til bad og VVS"
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
                      Foreslåtte alt-tekster
                    </p>
                    {[
                      { file: 'hero-image.jpg', alt: 'Team som jobber med digital markedsføring' },
                      { file: 'services.png', alt: 'Illustrasjon av SEO og annonsering' },
                      { file: 'logo.svg', alt: 'Firmanavn logo' },
                    ].map((img, i) => (
                      <div key={i} className="p-3 bg-white rounded-lg border border-neutral-200">
                        <p className="text-xs text-neutral-500 mb-1">{img.file}</p>
                        <p className="text-sm text-neutral-700">"{img.alt}"</p>
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
        </div>
      </section>

      {/* How it works - Two column layout */}
      <section className="py-20 bg-neutral-50 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight mb-3">
              Tre enkle steg<br />
              <span className="text-neutral-400">til bedre resultater.</span>
            </h2>
            <p className="text-lg text-neutral-500 max-w-xl">Ingen installasjon, ingen ventetid. Bare resultater.</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left - Steps */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-3"
            >
              {[
                { 
                  step: 1, 
                  title: 'Opprett konto', 
                  desc: 'Registrer deg gratis med e-post. Ingen kredittkort, ingen forpliktelser.',
                },
                { 
                  step: 2, 
                title: 'Start analysen',
                  desc: 'Legg inn nettadressen din og klikk "Analyser". Vi sjekker SEO, sikkerhet, innhold og AI-synlighet.',
                },
                { 
                  step: 3, 
                  title: 'Se resultater', 
                  desc: 'Få en komplett rapport med scores, konkrete funn og AI-genererte anbefalinger.',
                },
              ].map((item) => (
                <button
                  key={item.step}
                  onClick={() => setSelectedStep(item.step)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    selectedStep === item.step
                      ? 'border-neutral-300 bg-white'
                      : 'border-transparent bg-white/50 hover:bg-white hover:border-neutral-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className={`text-3xl font-light transition-colors ${
                      selectedStep === item.step ? 'text-neutral-900' : 'text-neutral-300'
                    }`}>{item.step}</span>
                    <div className="pt-1">
                      <h3 className={`font-semibold text-lg mb-1 transition-colors ${
                        selectedStep === item.step ? 'text-neutral-900' : 'text-neutral-600'
                      }`}>{item.title}</h3>
                      <p className={`text-sm transition-colors ${
                        selectedStep === item.step ? 'text-neutral-600' : 'text-neutral-400'
                      }`}>{item.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
              
              <div className="pt-4">
                <Button className="bg-neutral-900 hover:bg-neutral-800" asChild>
                  <Link href="/register">
                    Kom i gang gratis
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
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
                className="bg-white border-l border-r border-neutral-200 max-h-[380px] overflow-hidden"
                style={{ 
                  maskImage: 'linear-gradient(to bottom, black 65%, transparent 100%)', 
                  WebkitMaskImage: 'linear-gradient(to bottom, black 65%, transparent 100%)' 
                }}
              >
                {/* Step 1 Visual - Registration (matching actual register page) */}
                {selectedStep === 1 && (
                      <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6"
                  >
                    <div className="text-center mb-5">
                      <h4 className="font-semibold text-xl">Opprett gratis konto</h4>
                      <p className="text-sm text-neutral-500">Analyser hvilken som helst nettside på sekunder</p>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-neutral-700">Navn (valgfritt)</label>
                        <div className="p-2.5 rounded-md border border-neutral-200 bg-white">
                          <span className="text-sm text-neutral-400">Ola Nordmann</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-neutral-700">E-post *</label>
                        <div className="p-2.5 rounded-md border border-neutral-200 bg-white">
                          <span className="text-sm text-neutral-400">din@epost.no</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-neutral-700">Passord *</label>
                          <div className="p-2.5 rounded-md border border-neutral-200 bg-white">
                            <span className="text-sm text-neutral-400">••••••••</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-neutral-700">Bekreft *</label>
                          <div className="p-2.5 rounded-md border border-neutral-200 bg-white">
                            <span className="text-sm text-neutral-400">••••••••</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-md bg-neutral-900 text-white text-sm font-medium text-center">
                        Opprett konto
                      </div>
                      <div className="pt-3 border-t border-neutral-100">
                        <p className="text-xs text-neutral-500 text-center mb-2">Med en gratis konto får du:</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                            <div className="w-1 h-1 rounded-full bg-blue-500" />
                            3 analyser/mnd
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                            <div className="w-1 h-1 rounded-full bg-violet-500" />
                            AI-anbefalinger
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                            <div className="w-1 h-1 rounded-full bg-green-500" />
                            Sikkerhetssjekk
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                            <div className="w-1 h-1 rounded-full bg-cyan-500" />
                            AI-synlighet
                          </div>
                        </div>
                      </div>
                  </div>
                </motion.div>
                )}

                {/* Step 2 Visual - Analysis (matching actual dashboard) */}
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
                            <p className="text-xs text-neutral-500">Dette tar vanligvis under ett minutt</p>
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

                {/* Step 3 Visual - Results (matching actual dashboard) */}
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
              </div>
              </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials - Hidden for now */}
      {/* TODO: Add real testimonials when available */}

      {/* FAQ - Two column layout */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
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
              <p className="text-neutral-500 mb-6">Alt du lurer på før du kommer i gang.</p>
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
                  a: 'Ja, verktøyet er helt gratis å bruke. Du kan kjøre analyser, se resultater og få AI-anbefalinger uten å betale noe.',
                },
                {
                  q: 'Hva analyserer dere?',
                  a: 'Vi sjekker SEO (tittel, meta description, H1-struktur, bilder), sikkerhet (SSL-sertifikat, sikkerhetsheaders), innhold (ordantall, lesbarhet), AI-synlighet og gir deg AI-genererte forbedringsforslag.',
                },
                {
                  q: 'Hva er AI-søk synlighet?',
                  a: 'Vi sjekker om AI-modeller som ChatGPT og Claude kjenner til bedriften din og kan anbefale den til brukere. Dette blir stadig viktigere ettersom flere bruker AI-assistenter for å finne tjenester.',
                },
                {
                  q: 'Hva er nøkkelordanalysen?',
                  a: 'Vi bruker AI til å estimere søkevolum, CPC og konkurranse for relevante nøkkelord. Dette hjelper deg å forstå hvilke søkeord du bør satse på.',
                },
                {
                  q: 'Kan jeg sammenligne med konkurrenter?',
                  a: 'Ja! Du kan legge til konkurrenters nettsider og se hvordan du ligger an på SEO, sikkerhet og innhold sammenlignet med dem.',
                },
                {
                  q: 'Hvor lang tid tar en analyse?',
                  a: 'En analyse tar vanligvis under ett minutt. Du får resultater med én gang analysen er ferdig.',
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
      </section>

      {/* Final CTA - Inline style */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-neutral-900 rounded-2xl relative overflow-hidden min-h-[320px]"
          >
            {/* Content grid */}
            <div className="relative z-10 grid md:grid-cols-2 h-full">
              {/* Left column - Text and CTA */}
              <div className="p-10 md:p-12 flex flex-col justify-center">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight text-white mb-4 leading-tight">
                  Prøv det selv<br />
                  <span className="text-neutral-400">- helt gratis.</span>
                </h2>
                <p className="text-neutral-400 mb-8 max-w-sm">
                  Full analyse av nettsiden din på under ett minutt. SEO, sikkerhet, innhold og AI-anbefalinger.
                </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button className="bg-white text-neutral-900 hover:bg-neutral-100 h-12 px-6" asChild>
                  <Link href="/register">
                    Kom i gang gratis
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </motion.div>
              </div>
              
              {/* Right column - Dashboard mockup */}
              <div className="relative hidden md:block overflow-hidden">
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
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer - Modern minimal */}
      <footer className="py-6 sm:py-8">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 sm:py-6 border-t border-neutral-100">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <Link href="/" className="flex flex-col gap-0.5 group">
                <motion.img
                  whileHover={{ rotate: 5 }}
                  src="/mediabooster-logo-darkgrey.avif"
                  alt="Mediabooster"
                  className="h-5 w-auto"
                />
                <span className="text-neutral-500 text-xs">Din digitale CMO - og AI-kollega!</span>
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
