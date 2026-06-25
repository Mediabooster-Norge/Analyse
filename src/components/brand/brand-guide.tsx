"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Copy,
  Sparkles,
  ChevronRight,
  Eye,
  Type,
  MessageSquare,
  Palette,
  Users,
  ClipboardList,
  HelpCircle,
  FileText,
  Download,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { BRAND_CORE, LOGO_ASSETS, SELIA_COLORS } from "@/lib/brand/tokens";
import {
  AUDIENCES_DETAILED,
  CONCRETE_COMPARISON,
  CTA_TEXTS,
  FAQ_ITEMS,
  FEATURES,
  HERO_BADGES,
  HERO_HEADLINES,
  HERO_SUBTITLES,
  MESSAGE_HIERARCHY,
  SHORT_COPY,
  TESTIMONIALS,
  VALUE_PILLARS,
  WORD_LIST,
} from "@/lib/brand/content";

const SECTIONS = [
  { id: "kjerne", label: "Kjerne", icon: Eye },
  { id: "posisjonering", label: "Posisjonering", icon: ChevronRight },
  { id: "innhold", label: "Innhold", icon: FileText },
  { id: "tone", label: "Tone of voice", icon: MessageSquare },
  { id: "visuelt", label: "Visuelt", icon: Palette },
  { id: "typografi", label: "Typografi", icon: Type },
  { id: "navn", label: "Navnebruk", icon: ClipboardList },
  { id: "metadata", label: "Metadata", icon: Copy },
  { id: "malgrupper", label: "Målgrupper", icon: Users },
  { id: "implementering", label: "Implementering", icon: Check },
  { id: "beslutninger", label: "Åpne beslutninger", icon: HelpCircle },
] as const;

const TONE_EXAMPLES = [
  { avoid: "Leverer omfattende SEO-innsikt", use: "Viser nøyaktig hva som må fikses – og hvordan" },
  { avoid: "AI-drevet disruptiv plattform", use: "Får ferdig meta-tekst du kan lime inn" },
  { avoid: "Optimaliser din digitale tilstedeværelse", use: "Bli lettere å finne – i Google og i AI-søk" },
] as const;

const COMPARISON_ROWS = [
  ["Viser røde flagg", "Viser røde flagg og grønne løsninger"],
  ["Krever SEO-kompetanse", "Forklarer på norsk, klart språk"],
  ["Gir rapporter", "Gir rapporter og ferdig tekst"],
  ["Fokus på Google", "Fokus på Google og AI-synlighet"],
  ["Dyrt abonnement", "Gratis å starte, Pluss fra 399 kr/mnd"],
] as const;

const IMPLEMENTATION_PHASES = [
  {
    phase: "Fase 1 – Synlig rebranding",
    items: [
      "Deploy logo fra /brand/ (Selia-logo-primary.svg)",
      "Oppdater layout.tsx metadata",
      "Bytt alt-tekst og footer på forsiden",
      "Primærfarge på CTA-knapper",
    ],
  },
  {
    phase: "Fase 2 – Innhold",
    items: [
      "Hero og seksjonstekster",
      "Testimonials og FAQ",
      "Auth-sider (login/register)",
      "Dashboard header",
    ],
  },
  {
    phase: "Fase 3 – Dypere",
    items: [
      "personvern/page.tsx",
      "E-postmaler og PDF-rapporter",
      "Open Graph-bilde",
      "Favicon",
    ],
  },
] as const;

const OPEN_DECISIONS = [
  { question: "Serif-font", alternatives: "Instrument Serif vs. Lora", recommendation: "Start med Lora" },
  { question: "Primærfarge", alternatives: "Teal vs. dyp blå vs. grønt", recommendation: "Teal" },
  { question: "Tagline i logo", alternatives: "Med/uten .io", recommendation: "Vis .io i logo" },
  { question: "Support-kontakt", alternatives: "mediabooster.no vs. selia.io", recommendation: "Egen kontaktside" },
] as const;

function CopyButton({ value, label }: { value: string; label?: string }) {
  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(value);
    toast.success(label ? `Kopiert: ${label}` : "Kopiert!");
  }, [value, label]);

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-[#78716C] hover:bg-[#E8F4F4] hover:text-[#1A5C5C] transition-colors"
      aria-label={`Kopier ${value}`}
    >
      <Copy className="size-3" />
      {value}
    </button>
  );
}

function ColorSwatch({ hex, label, usage }: { hex: string; label: string; usage: string }) {
  const isLight = ["#FAFAF8", "#FFFFFF", "#E8F4F4", "#FDF6EE"].includes(hex);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(hex);
        toast.success(`Kopiert ${hex}`);
      }}
      className="group text-left rounded-xl border border-[#E7E5E4] overflow-hidden bg-white hover:border-[#1A5C5C]/40 hover:shadow-sm transition-all"
    >
      <div className="h-16 w-full" style={{ backgroundColor: hex }} />
      <div className="p-3 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-[#1C1917]">{label}</span>
          <span
            className={cn(
              "font-mono text-xs px-1.5 py-0.5 rounded",
              isLight ? "bg-[#E7E5E4] text-[#1C1917]" : "bg-[#1C1917] text-white"
            )}
          >
            {hex}
          </span>
        </div>
        <p className="text-xs text-[#78716C] leading-snug">{usage}</p>
      </div>
    </button>
  );
}

function LogoAssetCard({
  label,
  file,
  format,
  background,
  usage,
  fullWidth,
  selected,
  onSelect,
}: {
  label: string;
  file: string;
  format: string;
  background: string;
  usage: string;
  fullWidth?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-xl border overflow-hidden text-left transition-all hover:shadow-sm",
        fullWidth ? "sm:col-span-2" : "",
        selected
          ? "border-[#1A5C5C] ring-2 ring-[#1A5C5C]/20"
          : "border-[#E7E5E4] hover:border-[#1A5C5C]/40"
      )}
    >
      <div
        className={cn("flex items-center justify-center p-6 min-h-[120px]", fullWidth && "p-4")}
        style={{ backgroundColor: background }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={file}
          alt={label}
          className={cn(
            "max-h-16 w-auto object-contain",
            fullWidth && "max-h-48 w-full max-w-2xl"
          )}
        />
      </div>
      <div className="bg-white p-3 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{label}</span>
          <span className="font-mono text-[10px] text-[#78716C] bg-[#FAFAF8] px-1.5 py-0.5 rounded">
            {format}
          </span>
        </div>
        <p className="text-xs text-[#78716C] leading-snug line-clamp-2">{usage}</p>
        <p className="font-mono text-[10px] text-[#78716C] truncate">{file}</p>
      </div>
    </button>
  );
}

function LogoPreviewPanel({ asset }: { asset: (typeof LOGO_ASSETS)[number] }) {
  return (
    <div className="rounded-xl border border-[#E7E5E4] bg-white overflow-hidden">
      <div
        className="flex items-center justify-center p-10 sm:p-14 min-h-[200px]"
        style={{ backgroundColor: asset.background }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset.file}
          alt={asset.label}
          className={cn(
            "max-h-24 w-auto object-contain",
            asset.id === "system" && "max-h-64 w-full max-w-xl",
            (asset.id === "app-icon" || asset.id === "icon-512") && "max-h-32"
          )}
        />
      </div>
      <div className="p-4 sm:p-5 border-t border-[#E7E5E4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{asset.label}</p>
          <p className="text-xs text-[#78716C] mt-0.5">{asset.usage}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <CopyButton value={asset.file} label="filbane" />
          <a
            href={asset.file}
            download
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1A5C5C] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0D4F4F] transition-colors"
          >
            <Download className="size-3" />
            Last ned
          </a>
        </div>
      </div>
    </div>
  );
}

export function BrandGuide() {
  const [activeSection, setActiveSection] = useState("kjerne");
  const [selectedLogo, setSelectedLogo] = useState<(typeof LOGO_ASSETS)[number]["id"]>("primary");
  const [heroHeadline, setHeroHeadline] = useState<(typeof HERO_HEADLINES)[number]["id"]>(HERO_HEADLINES[0].id);
  const [heroSubtitle, setHeroSubtitle] = useState<(typeof HERO_SUBTITLES)[number]["id"]>(HERO_SUBTITLES[0].id);
  const [heroBadge, setHeroBadge] = useState(0);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const selectedHeadline = HERO_HEADLINES.find((h) => h.id === heroHeadline) ?? HERO_HEADLINES[0];
  const selectedSubtitle = HERO_SUBTITLES.find((s) => s.id === heroSubtitle) ?? HERO_SUBTITLES[0];
  const selectedLogoAsset = LOGO_ASSETS.find((a) => a.id === selectedLogo) ?? LOGO_ASSETS[0];

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const visible = new Map<string, number>();

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            visible.set(id, entry.intersectionRatio);
          } else {
            visible.delete(id);
          }
          if (visible.size > 0) {
            const best = [...visible.entries()].sort((a, b) => b[1] - a[1])[0];
            if (best) setActiveSection(best[0]);
          }
        },
        { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const toggleCheck = (item: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1C1917]">
      <header className="sticky top-0 z-50 border-b border-[#E7E5E4] bg-[#FAFAF8]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/Selia-logo-primary.svg"
              alt="Selia"
              className="h-8 w-auto"
            />
            <p className="text-xs text-[#78716C] mt-1">Internt · Brand guide · Juni 2025</p>
          </div>
          <span className="hidden sm:inline-flex items-center rounded-full bg-[#E8F4F4] px-3 py-1 text-xs font-medium text-[#1A5C5C]">
            Kun internt bruk
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex gap-10">
        <nav className="hidden lg:block w-48 shrink-0">
          <div className="sticky top-24 space-y-0.5">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                className={cn(
                  "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-left transition-colors",
                  activeSection === id
                    ? "bg-[#E8F4F4] text-[#1A5C5C] font-medium"
                    : "text-[#78716C] hover:text-[#1C1917] hover:bg-white"
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </nav>

        <main className="flex-1 min-w-0 space-y-16 pb-20">
          {/* Kjerne */}
          <section id="kjerne" className="scroll-mt-24">
            <SectionTitle number="01" title="Merkevarekjerne" />
            <div className="mt-6 grid sm:grid-cols-2 gap-3">
              {[
                ["Navn", BRAND_CORE.name],
                ["Domene", BRAND_CORE.domain],
                ["Kategori", BRAND_CORE.category],
                ["Marked", BRAND_CORE.market],
                ["Språk", BRAND_CORE.language],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-[#E7E5E4] bg-white p-4">
                  <p className="text-xs text-[#78716C] uppercase tracking-wide">{k}</p>
                  <p className="mt-1 text-sm font-medium">{v}</p>
                </div>
              ))}
            </div>

            <blockquote className="mt-6 rounded-xl border-l-4 border-[#1A5C5C] bg-white p-6 shadow-sm">
              <p className="text-xs text-[#78716C] uppercase tracking-wide mb-2">Løfte</p>
              <p className="font-serif text-2xl tracking-tight text-[#1A5C5C]">{BRAND_CORE.promise}</p>
            </blockquote>

            <div className="mt-4 rounded-xl bg-[#1A5C5C] p-6 text-white">
              <p className="text-xs text-[#E8F4F4] uppercase tracking-wide mb-2">Differensiering</p>
              <p className="text-lg leading-relaxed">{BRAND_CORE.differentiation}</p>
            </div>

            <p className="mt-6 text-[#78716C] max-w-prose leading-relaxed">{BRAND_CORE.elevatorPitch}</p>

            <div className="mt-6 grid sm:grid-cols-3 gap-3">
              {BRAND_CORE.values.map(({ word, description }) => (
                <div key={word} className="rounded-xl border border-[#E7E5E4] bg-white p-5">
                  <p className="font-serif text-xl text-[#1A5C5C]">{word}</p>
                  <p className="mt-2 text-sm text-[#78716C]">{description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <p className="text-xs font-medium uppercase tracking-wide text-[#78716C] mb-3">
                Budskapshierarki – rekkefølge i all kommunikasjon
              </p>
              <div className="rounded-xl border border-[#E7E5E4] bg-white overflow-hidden">
                {MESSAGE_HIERARCHY.map(({ rank, message, maps }) => (
                  <div
                    key={rank}
                    className="flex items-center gap-4 px-4 py-3 border-b border-[#E7E5E4] last:border-0 text-sm"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#E8F4F4] text-xs font-mono font-medium text-[#1A5C5C]">
                      {rank}
                    </span>
                    <span className="flex-1 font-medium">{message}</span>
                    <span className="text-xs text-[#78716C] hidden sm:inline">{maps}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Posisjonering */}
          <section id="posisjonering" className="scroll-mt-24">
            <SectionTitle number="02" title="Posisjonering" />
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <Card title="Hva Selia er">
                <p className="text-sm text-[#78716C] leading-relaxed">
                  En AI-drevet nettsideanalyseplattform som kombinerer teknisk sjekk (SEO, sikkerhet, innhold,
                  hastighet) med konkrete forslag og innholdsgenerering – alt på norsk.
                </p>
              </Card>
              <Card title="Hva Selia ikke er">
                <ul className="space-y-2 text-sm text-[#78716C]">
                  <li className="flex gap-2">
                    <span className="text-[#EF4444]">×</span> Ikke et tradisjonelt SEO-verktøy som kaster tall på deg
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#EF4444]">×</span> Ikke et byrå som tar uker å levere
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#EF4444]">×</span> Ikke en «score-maskin» uten neste steg
                  </li>
                </ul>
              </Card>
            </div>

            <div className="mt-6 rounded-xl border border-[#E7E5E4] bg-white overflow-hidden">
              <div className="grid grid-cols-2 text-xs font-medium uppercase tracking-wide border-b border-[#E7E5E4]">
                <div className="px-4 py-3 text-[#78716C] bg-[#FAFAF8]">Andre verktøy</div>
                <div className="px-4 py-3 text-[#1A5C5C] bg-[#E8F4F4]">Selia</div>
              </div>
              {COMPARISON_ROWS.map(([other, selia], i) => (
                <div
                  key={i}
                  className="grid grid-cols-2 text-sm border-b border-[#E7E5E4] last:border-0"
                >
                  <div className="px-4 py-3 text-[#78716C]">{other}</div>
                  <div className="px-4 py-3 bg-[#E8F4F4]/50 font-medium">{selia}</div>
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs font-medium uppercase tracking-wide text-[#78716C]">
              Konkrete eksempler (forside)
            </p>
            <div className="mt-3 rounded-xl border border-[#E7E5E4] bg-white overflow-hidden">
              <div className="grid grid-cols-2 text-xs font-medium uppercase tracking-wide border-b border-[#E7E5E4]">
                <div className="px-4 py-3 text-[#78716C] bg-[#FAFAF8]">Andre verktøy</div>
                <div className="px-4 py-3 text-[#1A5C5C] bg-[#E8F4F4]">Selia</div>
              </div>
              {CONCRETE_COMPARISON.map(({ other, selia }, i) => (
                <div key={i} className="grid grid-cols-2 text-sm border-b border-[#E7E5E4] last:border-0">
                  <div className="px-4 py-3 text-[#78716C]">{other}</div>
                  <div className="px-4 py-3 bg-[#E8F4F4]/50 font-medium">{selia}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Innhold */}
          <section id="innhold" className="scroll-mt-24">
            <SectionTitle number="03" title="Innhold og tekster" />
            <p className="mt-4 text-sm text-[#78716C] max-w-prose">
              Tekstforslag til forsiden og markedsføring. Velg varianter og kopier direkte.
            </p>

            {/* Hero preview */}
            <div className="mt-8">
              <p className="text-xs font-medium uppercase tracking-wide text-[#78716C] mb-3">Hero – live forhåndsvisning</p>
              <div className="rounded-xl border border-[#E7E5E4] bg-white p-6 sm:p-10 text-center">
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {HERO_BADGES.map((badge, i) => (
                    <button
                      key={badge}
                      type="button"
                      onClick={() => setHeroBadge(i)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                        heroBadge === i
                          ? "bg-[#E8F4F4] text-[#1A5C5C]"
                          : "bg-[#FAFAF8] text-[#78716C] hover:bg-[#E8F4F4]/50"
                      )}
                    >
                      {badge}
                    </button>
                  ))}
                </div>
                <p className="font-serif text-3xl sm:text-4xl tracking-tight leading-tight">
                  {selectedHeadline.lines[0]}
                  <br />
                  <span className="text-[#78716C]">{selectedHeadline.lines[1]}</span>
                </p>
                <p className="mt-4 text-sm text-[#78716C] max-w-lg mx-auto leading-relaxed">
                  {selectedSubtitle.text}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <span
                    className="rounded-lg px-5 py-2.5 text-sm font-medium text-white"
                    style={{ backgroundColor: SELIA_COLORS.primary.hex }}
                  >
                    Analyser nettsiden din gratis
                  </span>
                  <span
                    className="rounded-lg px-5 py-2.5 text-sm font-medium border-2"
                    style={{ borderColor: SELIA_COLORS.primary.hex, color: SELIA_COLORS.primary.hex }}
                  >
                    Se hvordan det fungerer
                  </span>
                </div>
              </div>

              <div className="mt-4 grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#78716C] mb-2">H1-alternativer</p>
                  <div className="flex flex-wrap gap-2">
                    {HERO_HEADLINES.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => setHeroHeadline(h.id)}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                          heroHeadline === h.id
                            ? "bg-[#1A5C5C] text-white"
                            : "bg-white border border-[#E7E5E4] text-[#78716C]"
                        )}
                      >
                        {h.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[#78716C] mb-2">Undertekst</p>
                  <div className="flex flex-wrap gap-2">
                    {HERO_SUBTITLES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setHeroSubtitle(s.id)}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                          heroSubtitle === s.id
                            ? "bg-[#1A5C5C] text-white"
                            : "bg-white border border-[#E7E5E4] text-[#78716C]"
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Value pillars */}
            <div className="mt-10">
              <p className="text-xs font-medium uppercase tracking-wide text-[#78716C] mb-3">
                Verdiproposisjon – tre søyler
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                {VALUE_PILLARS.map(({ step, title, subtitle, text, tagline }) => (
                  <button
                    key={step}
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(`${title}. ${text}`);
                      toast.success("Kopiert søyletekst");
                    }}
                    className="rounded-xl border border-[#E7E5E4] bg-white p-5 text-left hover:border-[#1A5C5C]/40 transition-colors group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-[#1A5C5C] text-xs font-medium text-white">
                        {step}
                      </span>
                      <span className="text-xs uppercase tracking-wide text-[#D4A574]">{subtitle}</span>
                    </div>
                    <p className="font-medium">{title}</p>
                    <p className="mt-2 text-sm text-[#78716C] leading-relaxed">{text}</p>
                    <p className="mt-3 text-xs italic text-[#1A5C5C]">{tagline}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* CTA texts */}
            <div className="mt-10">
              <p className="text-xs font-medium uppercase tracking-wide text-[#78716C] mb-3">CTA-tekster</p>
              <div className="rounded-xl border border-[#E7E5E4] bg-white overflow-hidden">
                {CTA_TEXTS.map(({ type, text }) => (
                  <div
                    key={type}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 border-b border-[#E7E5E4] last:border-0 text-sm"
                  >
                    <span className="text-[#78716C]">{type}</span>
                    <CopyButton value={text} label={type} />
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="mt-10">
              <p className="text-xs font-medium uppercase tracking-wide text-[#78716C] mb-3">
                Features – Analyse. Løsning. Produksjon.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {FEATURES.map((feature) => (
                  <div key={feature.name} className="rounded-xl border border-[#E7E5E4] bg-white p-4">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{feature.name}</p>
                      {"premium" in feature && feature.premium && (
                        <span className="rounded-full bg-[#FDF6EE] px-2 py-0.5 text-[10px] font-medium text-[#D4A574]">
                          Pluss
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs text-[#78716C] leading-relaxed">{feature.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Testimonials */}
            <div className="mt-10">
              <p className="text-xs font-medium uppercase tracking-wide text-[#78716C] mb-1">Testimonials</p>
              <p className="text-sm text-[#78716C] mb-3">
                Seksjonstittel: «Brukt av dem som vil gjøre noe med innsikten – ikke bare se på den»
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {TESTIMONIALS.map(({ quote, name, role }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(`«${quote}» – ${name}, ${role}`);
                      toast.success("Kopiert testimonial");
                    }}
                    className="rounded-xl border border-[#E7E5E4] bg-white p-4 text-left hover:border-[#1A5C5C]/40 transition-colors"
                  >
                    <p className="text-sm leading-relaxed">«{quote}»</p>
                    <p className="mt-3 text-xs text-[#78716C]">
                      {name} · {role}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div className="mt-10">
              <p className="text-xs font-medium uppercase tracking-wide text-[#78716C] mb-3">FAQ – godkjente svar</p>
              <Accordion type="single" collapsible className="rounded-xl border border-[#E7E5E4] bg-white px-4">
                {FAQ_ITEMS.map(({ q, a }, i) => (
                  <AccordionItem key={q} value={`faq-${i}`}>
                    <AccordionTrigger className="text-sm font-medium hover:no-underline">{q}</AccordionTrigger>
                    <AccordionContent className="text-sm text-[#78716C] leading-relaxed">
                      <div className="flex justify-end mb-2">
                        <button
                          type="button"
                          onClick={async () => {
                            await navigator.clipboard.writeText(a);
                            toast.success("Kopiert svar");
                          }}
                          className="text-xs text-[#1A5C5C] hover:underline flex items-center gap-1"
                        >
                          <Copy className="size-3" /> Kopier svar
                        </button>
                      </div>
                      {a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>

          {/* Tone */}
          <section id="tone" className="scroll-mt-24">
            <SectionTitle number="04" title="Tone of voice" />
            <p className="mt-4 text-sm text-[#78716C] max-w-prose">
              Selia snakker som en <strong className="text-[#1C1917] font-medium">kompetent kollega</strong> – ikke
              som et aggressivt salgsverktøy eller en tørr teknisk rapport.
            </p>

            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <Card title="Vi er">
                <TraitList items={["Tydelige", "Handlingsorienterte", "Tillitsvekkende", "Direkte", "Norske"]} positive />
              </Card>
              <Card title="Vi er ikke">
                <TraitList
                  items={["Overforenklete", "Hype-drevne", "Nedlatende", "Roboteraktige", "Oversatt engelsk"]}
                />
              </Card>
            </div>

            <div className="mt-6 rounded-xl border border-[#E7E5E4] bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-[#78716C] mb-4">Språkregler</p>
              <ul className="grid sm:grid-cols-2 gap-2 text-sm text-[#78716C]">
                {[
                  "Bruk «du» – snakk til brukeren direkte",
                  "Unngå fagsjargong uten forklaring",
                  "Prioriter verb: «Fiks meta-beskrivelsen»",
                  "Vær konkret: «152 tegn», «på 3 minutter»",
                  "Ikke overbruk «AI» som buzzword",
                ].map((rule) => (
                  <li key={rule} className="flex gap-2">
                    <Check className="size-4 text-[#1A5C5C] shrink-0 mt-0.5" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-[#78716C]">Eksempler – klikk for å kopiere</p>
              {TONE_EXAMPLES.map(({ avoid, use }) => (
                <div key={avoid} className="grid md:grid-cols-2 gap-3 rounded-xl border border-[#E7E5E4] overflow-hidden">
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(use);
                      toast.success("Kopiert god formulering");
                    }}
                    className="p-4 text-left bg-[#E8F4F4]/50 hover:bg-[#E8F4F4] transition-colors group"
                  >
                    <p className="text-xs text-[#16A34A] font-medium mb-1 flex items-center gap-1">
                      <Check className="size-3" /> Bruk heller
                    </p>
                    <p className="text-sm">{use}</p>
                    <p className="text-xs text-[#78716C] mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      Klikk for å kopiere
                    </p>
                  </button>
                  <div className="p-4 bg-white">
                    <p className="text-xs text-[#EF4444] font-medium mb-1">Unngå</p>
                    <p className="text-sm text-[#78716C] line-through decoration-[#EF4444]/40">{avoid}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <p className="text-xs font-medium uppercase tracking-wide text-[#78716C] mb-3">
                Ordliste – konsistent språk
              </p>
              <div className="rounded-xl border border-[#E7E5E4] bg-white overflow-hidden">
                <div className="grid grid-cols-2 text-xs font-medium uppercase tracking-wide border-b border-[#E7E5E4] bg-[#FAFAF8]">
                  <div className="px-4 py-3 text-[#16A34A]">Bruk</div>
                  <div className="px-4 py-3 text-[#EF4444]">Ikke bruk</div>
                </div>
                {WORD_LIST.map(({ use, avoid }) => (
                  <div key={use} className="grid grid-cols-2 text-sm border-b border-[#E7E5E4] last:border-0">
                    <div className="px-4 py-3 font-medium">{use}</div>
                    <div className="px-4 py-3 text-[#78716C]">{avoid}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Visuelt */}
          <section id="visuelt" className="scroll-mt-24">
            <SectionTitle number="05" title="Visuell identitet" />

            <p className="mt-4 text-sm text-[#78716C] max-w-prose">
              Logo består av et teal ikon med «S» og wordmark «Selia» med punkt. Bruk alltid filer fra{" "}
              <code className="font-mono text-xs bg-[#E8F4F4] px-1 py-0.5 rounded">/brand/</code> – ikke
              gammel Booster-logo eller tekstbasert placeholder.
            </p>

            <div className="mt-6">
              <LogoPreviewPanel asset={selectedLogoAsset} />
            </div>

            <p className="mt-6 text-xs font-medium uppercase tracking-wide text-[#78716C]">
              Alle logo-varianter – klikk for forhåndsvisning
            </p>
            <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {LOGO_ASSETS.map((asset) => (
                <LogoAssetCard
                  key={asset.id}
                  label={asset.label}
                  file={asset.file}
                  format={asset.format}
                  background={asset.background}
                  usage={asset.usage}
                  fullWidth={"fullWidth" in asset ? asset.fullWidth : undefined}
                  selected={selectedLogo === asset.id}
                  onSelect={() => setSelectedLogo(asset.id)}
                />
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-[#E7E5E4] bg-[#E8F4F4]/50 p-4 text-sm text-[#78716C]">
              <p className="font-medium text-[#1C1917] mb-1">Bruksregler</p>
              <ul className="space-y-1 text-xs">
                <li>· Primær SVG på lys bakgrunn som standard</li>
                <li>· «On dark»-variant på teal eller mørke flater</li>
                <li>· App-ikon alene der merkenavn ikke trengs (favicon, avatar)</li>
                <li>· Wordmark når ikonet allerede er synlig i nærheten</li>
                <li>· Ikke strekk, roter eller endre farger manuelt</li>
              </ul>
            </div>

            <p className="mt-8 text-xs font-medium uppercase tracking-wide text-[#78716C]">
              Fargepalett – klikk for å kopiere hex
            </p>
            <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.values(SELIA_COLORS).map(({ hex, label, usage }) => (
                <ColorSwatch key={hex} hex={hex} label={label} usage={usage} />
              ))}
            </div>

            <p className="mt-4 text-xs text-[#EF4444]">
              Unngå: Booster-rødt (#FF2121), kald ren svart som eneste aksent.
            </p>

            <div className="mt-8">
              <p className="text-xs font-medium uppercase tracking-wide text-[#78716C] mb-4">UI-komponenter</p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors"
                  style={{ backgroundColor: SELIA_COLORS.primary.hex }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = SELIA_COLORS.primaryHover.hex)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = SELIA_COLORS.primary.hex)}
                >
                  Primær CTA
                </button>
                <button
                  type="button"
                  className="rounded-lg px-5 py-2.5 text-sm font-medium border-2 transition-colors"
                  style={{ borderColor: SELIA_COLORS.primary.hex, color: SELIA_COLORS.primary.hex }}
                >
                  Sekundær CTA
                </button>
                <div
                  className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm"
                  style={{ backgroundColor: SELIA_COLORS.accentLight.hex }}
                >
                  <Sparkles className="size-4" style={{ color: SELIA_COLORS.accent.hex }} />
                  <span>AI-generert innhold</span>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                {[
                  { label: "God", color: SELIA_COLORS.success.hex },
                  { label: "Medium", color: SELIA_COLORS.warning.hex },
                  { label: "Kritisk", color: SELIA_COLORS.error.hex },
                ].map(({ label, color }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white"
                    style={{ backgroundColor: color }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Typografi */}
          <section id="typografi" className="scroll-mt-24">
            <SectionTitle number="06" title="Typografi" />
            <div className="mt-6 space-y-6">
              <div className="rounded-xl border border-[#E7E5E4] bg-white p-6">
                <p className="text-xs text-[#78716C] mb-2">Display / H1–H2 · Lora</p>
                <p className="font-serif text-4xl tracking-tight">Fra analyse til gjennomføring</p>
                <p className="font-serif text-2xl tracking-tight text-[#78716C] mt-2">på minutter.</p>
              </div>
              <div className="rounded-xl border border-[#E7E5E4] bg-white p-6">
                <p className="text-xs text-[#78716C] mb-2">UI / brødtekst · Geist Sans</p>
                <p className="max-w-prose leading-relaxed text-[#78716C]">
                  Selia analyserer nettsiden din og produserer konkrete forbedringer – meta-tekst, artikler og
                  handlingsplaner du kan bruke med én gang. Gratis å starte.
                </p>
              </div>
              <div className="rounded-xl border border-[#E7E5E4] bg-white p-6">
                <p className="text-xs text-[#78716C] mb-2">Mono · Geist Mono</p>
                <p className="font-mono text-sm">
                  selia.io/dashboard · 152 tegn · meta-description
                </p>
              </div>
            </div>
          </section>

          {/* Navnebruk */}
          <section id="navn" className="scroll-mt-24">
            <SectionTitle number="07" title="Navnebruk" />
            <div className="mt-6 rounded-xl border border-[#E7E5E4] bg-white overflow-hidden">
              {[
                ["Produktnavn i setninger", "Selia"],
                ["Domene / URL", "selia.io"],
                ["Metadata / title tag", "Selia | [sidetittel]"],
                ["E-post signatur", "Selia – selia.io"],
                ["«Powered by»", "Selia"],
              ].map(([context, format]) => (
                <div
                  key={context}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 border-b border-[#E7E5E4] last:border-0 text-sm"
                >
                  <span className="text-[#78716C]">{context}</span>
                  <CopyButton value={format} label={context} />
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-[#EF4444]">
              Ikke bruk: Booster, Nettsjekk, Analyseverktøy (unntatt internt/legacy).
            </p>
          </section>

          {/* Metadata */}
          <section id="metadata" className="scroll-mt-24">
            <SectionTitle number="08" title="Metadata og kanaler" />
            <div className="mt-6 space-y-4">
              <SnippetBlock
                label="Standard title"
                value="Selia | Fra analyse til gjennomføring på minutter"
              />
              <SnippetBlock
                label="Standard description"
                value="Selia analyserer nettsiden din og produserer konkrete forbedringer – meta-tekst, artikler og handlingsplaner du kan bruke med én gang. Gratis å starte."
              />
              <div className="rounded-xl border border-[#E7E5E4] bg-white p-4">
                <p className="text-xs text-[#78716C] uppercase tracking-wide mb-2">Open Graph</p>
                <dl className="grid sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-[#78716C]">Locale</dt>
                    <dd className="font-mono">nb_NO</dd>
                  </div>
                  <div>
                    <dt className="text-[#78716C]">Type</dt>
                    <dd className="font-mono">website</dd>
                  </div>
                </dl>
              </div>
              <SnippetBlock
                label="Nøkkelord (SEO)"
                value="nettsideanalyse, SEO analyse, AI nettside, gratis SEO verktøy, nettside sjekk, konkurrentanalyse, AI artikkel generator, norsk SEO"
              />

              <p className="text-xs font-medium uppercase tracking-wide text-[#78716C] pt-4">
                Kortform – sosiale medier, annonser og e-post
              </p>
              <div className="space-y-3">
                {SHORT_COPY.map(({ label, value }) => (
                  <SnippetBlock key={label} label={label} value={value} />
                ))}
              </div>
            </div>
          </section>

          {/* Målgrupper */}
          <section id="malgrupper" className="scroll-mt-24">
            <SectionTitle number="09" title="Målgrupper og budskap" />
            <p className="mt-4 text-sm text-[#78716C] max-w-prose">
              Bygget for deg som vil <strong className="text-[#1C1917] font-medium">gjøre</strong> noe med innsikten –
              ikke bare se på den.
            </p>
            <div className="mt-6 grid sm:grid-cols-2 gap-3">
              {AUDIENCES_DETAILED.map(({ group, headline, short, text }) => (
                <button
                  key={group}
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(text);
                    toast.success(`Kopiert budskap for ${group}`);
                  }}
                  className="rounded-xl border border-[#E7E5E4] bg-white p-5 text-left hover:border-[#1A5C5C]/40 hover:shadow-sm transition-all group"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-[#1A5C5C]">{group}</p>
                  <p className="mt-1 text-sm font-medium">{headline}</p>
                  <p className="mt-2 text-sm text-[#78716C] leading-relaxed">{text}</p>
                  <p className="mt-3 text-xs text-[#78716C] italic">Kort: «{short}»</p>
                  <p className="text-xs text-[#78716C] mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Klikk for å kopiere full tekst
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* Implementering */}
          <section id="implementering" className="scroll-mt-24">
            <SectionTitle number="10" title="Implementeringsprioritet" />
            <p className="mt-2 text-sm text-[#78716C]">Lokal sjekkliste – lagres ikke mellom besøk.</p>
            <div className="mt-6 space-y-6">
              {IMPLEMENTATION_PHASES.map(({ phase, items }) => (
                <div key={phase}>
                  <p className="text-sm font-medium text-[#1A5C5C] mb-3">{phase}</p>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <label
                        key={item}
                        className="flex items-center gap-3 rounded-lg border border-[#E7E5E4] bg-white px-4 py-3 cursor-pointer hover:border-[#1A5C5C]/30 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={checkedItems.has(item)}
                          onChange={() => toggleCheck(item)}
                          className="size-4 rounded border-[#E7E5E4] accent-[#1A5C5C]"
                        />
                        <span
                          className={cn(
                            "text-sm",
                            checkedItems.has(item) && "line-through text-[#78716C]"
                          )}
                        >
                          {item}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Åpne beslutninger */}
          <section id="beslutninger" className="scroll-mt-24">
            <SectionTitle number="11" title="Åpne beslutninger" />
            <div className="mt-6 rounded-xl border border-[#E7E5E4] bg-white overflow-hidden">
              <div className="grid grid-cols-3 text-xs font-medium uppercase tracking-wide border-b border-[#E7E5E4] bg-[#FAFAF8]">
                <div className="px-4 py-3">Spørsmål</div>
                <div className="px-4 py-3">Alternativer</div>
                <div className="px-4 py-3 text-[#1A5C5C]">Anbefaling</div>
              </div>
              {OPEN_DECISIONS.map(({ question, alternatives, recommendation }) => (
                <div key={question} className="grid grid-cols-3 text-sm border-b border-[#E7E5E4] last:border-0">
                  <div className="px-4 py-3 font-medium">{question}</div>
                  <div className="px-4 py-3 text-[#78716C]">{alternatives}</div>
                  <div className="px-4 py-3 bg-[#E8F4F4]/50 text-[#1A5C5C] font-medium">{recommendation}</div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function SectionTitle({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="font-mono text-xs text-[#D4A574]">{number}</span>
      <h2 className="font-serif text-2xl tracking-tight">{title}</h2>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#E7E5E4] bg-white p-5">
      <p className="text-sm font-medium mb-3">{title}</p>
      {children}
    </div>
  );
}

function TraitList({ items, positive }: { items: string[]; positive?: boolean }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-2 text-sm text-[#78716C]">
          <span className={positive ? "text-[#16A34A]" : "text-[#EF4444]"}>
            {positive ? "✓" : "×"}
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function SnippetBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E7E5E4] bg-white p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-xs text-[#78716C] uppercase tracking-wide">{label}</p>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(value);
            toast.success(`Kopiert ${label}`);
          }}
          className="text-xs text-[#1A5C5C] hover:underline flex items-center gap-1"
        >
          <Copy className="size-3" /> Kopier
        </button>
      </div>
      <p className="text-sm leading-relaxed">{value}</p>
    </div>
  );
}
