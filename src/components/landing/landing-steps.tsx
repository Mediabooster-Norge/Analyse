import { Link2, Gauge, Lightbulb } from "lucide-react";
import { LANDING_STEPS, LANDING_STEPS_SECTION } from "@/lib/brand/content";
import {
  landingAccentMono,
  landingCardBody,
  landingCardTitle,
  landingSectionEyebrow,
  landingSectionHeaderMb,
  landingSectionHeroReverse,
  landingSectionLead,
  landingSectionPad,
  landingSectionTitle,
} from "./landing-typography";

const STEP_ICONS = [Link2, Gauge, Lightbulb] as const;

export function LandingSteps() {
  return (
    <section
      id="slik-fungerer-det"
      className={`${landingSectionPad} scroll-mt-20 ${landingSectionHeroReverse}`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className={`max-w-2xl mx-auto text-center ${landingSectionHeaderMb}`}>
          <p className={landingSectionEyebrow}>{LANDING_STEPS_SECTION.eyebrow}</p>
          <h2 className={landingSectionTitle}>{LANDING_STEPS_SECTION.title}</h2>
          <p className={landingSectionLead}>{LANDING_STEPS_SECTION.lead}</p>
        </div>

        <ol className="relative grid gap-4 sm:gap-5 md:grid-cols-3">
          <div
            className="hidden md:block absolute inset-x-[16%] top-[3.625rem] h-px bg-gradient-to-r from-transparent via-border to-transparent"
            aria-hidden
          />
          {LANDING_STEPS.map(({ step, title, text }, i) => {
            const Icon = STEP_ICONS[i] ?? Link2;
            return (
              <li
                key={step}
                className="relative rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span className={landingAccentMono}>{step.padStart(2, "0")}</span>
                </div>
                <h3 className={landingCardTitle}>{title}</h3>
                <p className={landingCardBody}>{text}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
