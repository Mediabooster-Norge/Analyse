'use client';

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, LayoutDashboard, Check } from "lucide-react";
import { HERO_BADGES, HERO_SUBTITLES, CTA_TEXTS } from "@/lib/brand/content";
import type { User } from "@supabase/supabase-js";
import { useAnalyzeUrlModal } from "./analyze-url-dialog";
import { HeroRotatingHeadline } from "./hero-rotating-headline";
import { landingHeroBadge, landingHeroLead, landingHeroTrust, landingSectionHero } from "./landing-typography";

interface LandingHeroProps {
  user: User | null;
}

const subtitle = HERO_SUBTITLES[1];
const badge = HERO_BADGES[0];
const primaryCta = CTA_TEXTS[0];
const loggedInCta = CTA_TEXTS[1];
const secondaryCta = CTA_TEXTS[2];

const TRUST_POINTS = ["Gratis", "Ingen konto nødvendig", "Resultat på minutter"] as const;

export function LandingHero({ user }: LandingHeroProps) {
  const { openModal } = useAnalyzeUrlModal();
  const [url, setUrl] = useState("");

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    openModal(trimmed);
  };

  return (
    <section className={`relative pt-24 sm:pt-28 pb-12 sm:pb-16 ${landingSectionHero}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <Badge variant="outline" className={`mb-4 ${landingHeroBadge}`}>
          {badge}
        </Badge>
        <HeroRotatingHeadline />
        <p className={landingHeroLead}>{subtitle.text}</p>

        {user ? (
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/dashboard">
                <LayoutDashboard className="mr-2 w-4 h-4" />
                {loggedInCta.text}
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
              <a href="#slik-fungerer-det">{secondaryCta.text}</a>
            </Button>
          </div>
        ) : (
          <div className="mt-8 max-w-xl mx-auto space-y-4">
            <form
              onSubmit={handleAnalyze}
              className="flex flex-col sm:flex-row gap-2 p-1.5 rounded-xl border border-border bg-card shadow-md"
            >
              <Input
                type="text"
                placeholder="dinbedrift.no"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 border-0 shadow-none focus-visible:ring-0 text-base"
                autoComplete="url"
              />
              <Button type="submit" size="lg" className="shrink-0 w-full sm:w-auto">
                {primaryCta.text}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>
            <ul className={`flex flex-wrap justify-center gap-x-4 gap-y-1.5 ${landingHeroTrust}`}>
              {TRUST_POINTS.map((point) => (
                <li key={point} className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-primary" />
                  {point}
                </li>
              ))}
            </ul>
            <Button size="sm" variant="ghost" asChild>
              <a href="#slik-fungerer-det">{secondaryCta.text}</a>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
