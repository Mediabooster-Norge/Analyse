import { Search, Lightbulb, Rocket } from "lucide-react";
import { VALUE_PILLARS, PILLARS_SECTION } from "@/lib/brand/content";
import {
  landingAccentMono,
  landingPillarStepLabel,
  landingCardBody,
  landingCardListItem,
  landingCardTagline,
  landingCardTitle,
  landingSectionWash,
  landingSectionEyebrow,
  landingSectionLead,
  landingSectionPad,
  landingSectionTitle,
} from "./landing-typography";

const PILLAR_ICONS = [Search, Lightbulb, Rocket] as const;

export function LandingPillars() {
  return (
    <section className={`${landingSectionPad} ${landingSectionWash}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-10 md:gap-12">
          <div>
            <div className="md:sticky md:top-28">
              <p className={landingSectionEyebrow}>Arbeidsflyt</p>
              <h2 className={landingSectionTitle}>{PILLARS_SECTION.title}</h2>
              <p className={landingSectionLead}>{PILLARS_SECTION.lead}</p>

              <ol className="mt-8 space-y-3">
                {VALUE_PILLARS.map(({ step, subtitle }) => (
                  <li key={step} className={`flex items-center gap-3 ${landingCardListItem}`}>
                    <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium tabular-nums">
                      {step}
                    </span>
                    <span>{subtitle}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <ol className="flex flex-col gap-4">
            {VALUE_PILLARS.map(({ step, title, subtitle, text, tagline }, i) => {
              const Icon = PILLAR_ICONS[i] ?? Search;
              return (
                <li
                  key={step}
                  className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className={landingPillarStepLabel}>
                        <span className={landingAccentMono}>
                          {step.padStart(2, "0")}
                        </span>
                        <span className="mx-2 text-border">·</span>
                        <span className="text-muted-foreground normal-case">{subtitle}</span>
                      </p>
                      <h3 className={`${landingCardTitle} mt-1.5`}>{title}</h3>
                      <p className={landingCardBody}>{text}</p>
                      <p className={landingCardTagline}>{tagline}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
