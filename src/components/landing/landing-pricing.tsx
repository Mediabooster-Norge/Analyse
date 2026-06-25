"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import {
  PAID_PLAN_FEATURES,
  PRICING_SECTION,
  PRICING_TIERS,
} from "@/lib/brand/content";
import { AnalyzeUrlDialog } from "./analyze-url-dialog";
import {
  landingBadgeText,
  landingPriceAmount,
  landingPriceEyebrow,
  landingPriceHighlight,
  landingPriceList,
  landingPriceNote,
  landingPricePeriod,
  landingSectionLead,
  landingSectionPad,
  landingSectionSandFade,
  landingSectionTitle,
  landingSectionTitleMuted,
} from "./landing-typography";

const CONTACT_URL = "https://mediabooster.no/kontakt";

function PaidPlanCard({
  tier,
}: {
  tier: typeof PRICING_TIERS.plus | typeof PRICING_TIERS.premium;
}) {
  const isRecommended = tier.recommended;

  return (
    <div
      className={`rounded-2xl bg-card p-5 sm:p-6 flex flex-col relative ${
        isRecommended
          ? "border-2 border-primary shadow-lg shadow-primary/10"
          : "border border-border"
      }`}
    >
      {isRecommended && (
        <span
          className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground ${landingBadgeText}`}
        >
          Anbefalt
        </span>
      )}
      <p className={`${landingPriceEyebrow} ${isRecommended ? "mt-2" : ""}`}>{tier.name}</p>
      <p className={`${landingPriceAmount} mt-0.5`}>{tier.price}</p>
      <p className={landingPricePeriod}>per måned</p>
      <p className={`${landingPriceHighlight} mt-4 mb-3`}>Alt i Gratis, pluss:</p>
      <ul className={`space-y-2 flex-1 ${landingPriceList}`}>
        {[
          `${tier.analysesPerMonth} analyser per måned`,
          `${tier.articlesPerMonth} AI-genererte artikler per måned`,
          `${tier.aiVisibilityPerMonth} AI-synlighetssjekker per måned`,
          ...PAID_PLAN_FEATURES,
        ].map((item) => (
          <li key={item} className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <Button className="mt-6 w-full" size="lg" variant={isRecommended ? "default" : "outline"} asChild>
        <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer">
          {tier.cta}
          <ArrowRight className="ml-2 w-4 h-4" />
        </a>
      </Button>
    </div>
  );
}

export function LandingPricing() {
  const free = PRICING_TIERS.free;

  return (
    <section id="priser" className={`${landingSectionPad} scroll-mt-20 ${landingSectionSandFade}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-10 sm:mb-12">
          <h2 className={landingSectionTitle}>
            {PRICING_SECTION.title}
            <br />
            <span className={landingSectionTitleMuted}>{PRICING_SECTION.titleMuted}</span>
          </h2>
          <p className={landingSectionLead}>{PRICING_SECTION.lead}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col">
            <p className={landingPriceEyebrow}>{free.name}</p>
            <p className={`${landingPriceAmount} mt-0.5`}>{free.price}</p>
            <p className={landingPricePeriod}>per måned</p>
            <ul className={`mt-5 space-y-2 flex-1 ${landingPriceList}`}>
              {free.features.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className={`mt-4 pt-4 border-t border-border ${landingPriceNote}`}>{free.note}</p>
            <AnalyzeUrlDialog buttonText="Prøv på din egen nettside" className="mt-6 w-full" />
            <Button variant="ghost" className="mt-2 w-full" size="sm" asChild>
              <Link href="/register">Eller opprett gratis konto</Link>
            </Button>
          </div>

          <PaidPlanCard tier={PRICING_TIERS.plus} />
          <PaidPlanCard tier={PRICING_TIERS.premium} />
        </div>
      </div>
    </section>
  );
}
