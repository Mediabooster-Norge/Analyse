import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Search,
  ShieldCheck,
  FileText,
  Gauge,
  Accessibility,
  TrendingUp,
  Tag,
  Sparkles,
  Eye,
  Newspaper,
  Share2,
  Layers,
  Link2,
} from "lucide-react";
import { FEATURES, FEATURES_SECTION } from "@/lib/brand/content";
import {
  landingFeatureCardBody,
  landingFeatureCardTitle,
  landingFeaturePremiumBadge,
  landingSectionEyebrow,
  landingSectionHeaderMb,
  landingSectionLead,
  landingSectionPad,
  landingSectionSandFade,
  landingSectionTitle,
} from "./landing-typography";
import { Reveal } from "./reveal";

type Feature = (typeof FEATURES)[number];

const FEATURE_ICONS: Record<string, LucideIcon> = {
  "SEO-analyse": Search,
  Sikkerhet: ShieldCheck,
  Innhold: FileText,
  Hastighet: Gauge,
  Tilgjengelighet: Accessibility,
  Konkurrentanalyse: TrendingUp,
  Nøkkelordanalyse: Tag,
  "AI-anbefalinger": Sparkles,
  "AI-synlighet": Eye,
  Artikkelgenerator: Newspaper,
  "SoMe-post generator": Share2,
  "Forslag til undersider": Layers,
  "Deling av analyse": Link2,
};

const MARQUEE_COPIES = 3;

const midpoint = Math.ceil(FEATURES.length / 2);
const ROW_TOP = FEATURES.slice(0, midpoint);
const ROW_BOTTOM = [...FEATURES.slice(midpoint)].reverse();

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = FEATURE_ICONS[feature.name] ?? Sparkles;
  const isPremium = "premium" in feature && feature.premium;
  return (
    <div className="w-[260px] sm:w-[290px] shrink-0 flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex items-center gap-2 flex-wrap">
          <h3 className={landingFeatureCardTitle}>{feature.name}</h3>
          {isPremium && (
            <span className={landingFeaturePremiumBadge}>Pluss</span>
          )}
        </div>
      </div>
      <p className={`${landingFeatureCardBody} line-clamp-3`}>
        {feature.text}
      </p>
    </div>
  );
}

function MarqueeRow({
  items,
  direction,
}: {
  items: readonly Feature[];
  direction: "left" | "right";
}) {
  const loop = Array.from({ length: MARQUEE_COPIES }, () => items).flat();
  return (
    <div
      aria-hidden
      className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_24%,black_76%,transparent)]"
    >
      <div
        className={`${
          direction === "left" ? "marquee-track" : "marquee-track-right"
        } flex w-max items-stretch gap-3 sm:gap-4 px-4 py-0.5 will-change-transform`}
        style={{ "--marquee-copies": MARQUEE_COPIES } as CSSProperties}
      >
        {loop.map((feature, i) => (
          <FeatureCard key={`${feature.name}-${i}`} feature={feature} />
        ))}
      </div>
    </div>
  );
}

export function LandingFeatures() {
  return (
    <section className={`${landingSectionPad} overflow-hidden ${landingSectionSandFade}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Reveal>
          <div className={`max-w-2xl ${landingSectionHeaderMb}`}>
            <p className={landingSectionEyebrow}>Funksjoner</p>
            <h2 className={landingSectionTitle}>{FEATURES_SECTION.title}</h2>
            <p className={landingSectionLead}>{FEATURES_SECTION.lead}</p>
          </div>
        </Reveal>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <MarqueeRow items={ROW_TOP} direction="left" />
        <MarqueeRow items={ROW_BOTTOM} direction="right" />
      </div>

      <p className="sr-only">
        {FEATURES.map((f) => `${f.name}: ${f.text}`).join(". ")}
      </p>
    </section>
  );
}
