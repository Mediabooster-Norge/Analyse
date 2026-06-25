'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { CTA_TEXTS, FINAL_CTA_SECTION, SHORT_COPY } from "@/lib/brand/content";
import type { User } from "@supabase/supabase-js";
import {
  landingFooterText,
  landingSectionDefault,
  landingSectionFooterFade,
  landingSectionLead,
  landingSectionPadCompact,
  landingSectionTitle,
} from "./landing-typography";
import { useAnalyzeUrlModal } from "./analyze-url-dialog";

const footerTagline = SHORT_COPY.find((item) => item.label === "Footer-tagline")?.value;

interface LandingFinalCtaProps {
  user: User | null;
}

export function LandingFinalCta({ user }: LandingFinalCtaProps) {
  const { openModal } = useAnalyzeUrlModal();

  return (
    <section className={`${landingSectionPadCompact} ${landingSectionDefault}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="rounded-2xl bg-primary px-6 py-10 sm:px-10 sm:py-12 text-center text-primary-foreground">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-foreground/70 mb-3">
            Kom i gang på minutter
          </p>
          <h2 className={`${landingSectionTitle} text-primary-foreground`}>
            {FINAL_CTA_SECTION.title}
          </h2>
          <p className={`${landingSectionLead} text-primary-foreground/80 max-w-lg mx-auto`}>
            {FINAL_CTA_SECTION.lead}
          </p>
          {user ? (
            <Button
              size="lg"
              variant="secondary"
              className="mt-6 bg-card text-foreground hover:bg-card/90"
              asChild
            >
              <Link href="/dashboard">
                <LayoutDashboard className="mr-2 w-4 h-4" />
                {CTA_TEXTS[1].text}
              </Link>
            </Button>
          ) : (
            <Button
              size="lg"
              variant="secondary"
              className="mt-6 bg-card text-foreground hover:bg-card/90"
              onClick={() => openModal()}
            >
              {CTA_TEXTS[5].text}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className={`py-8 ${landingSectionFooterFade}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center md:items-start gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/Selia-logo-primary.svg" alt="Selia" className="h-8 sm:h-10 w-auto" />
            <a
              href="https://mediabooster.no"
              target="_blank"
              rel="noopener noreferrer"
              className={`${landingFooterText} text-muted-foreground hover:text-foreground transition-colors`}
            >
              Powered by MediaBooster Norge
            </a>
          </div>
          <div className={`flex flex-wrap items-center justify-center gap-4 ${landingFooterText}`}>
            <a
              href="https://mediabooster.no/kontakt"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Kontakt
            </a>
            <Link href="/personvern" className="hover:text-foreground transition-colors">
              Personvern
            </Link>
            <span>·</span>
            <span>&copy; {new Date().getFullYear()} Selia</span>
          </div>
        </div>
        {footerTagline && (
          <p className={`text-center ${landingFooterText} mt-4`}>{footerTagline}</p>
        )}
      </div>
    </footer>
  );
}
