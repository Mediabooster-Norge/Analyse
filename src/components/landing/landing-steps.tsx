import { Link2, Gauge, UserPlus, ChevronRight } from "lucide-react";
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

const STEP_ICONS = [Link2, Gauge, UserPlus] as const;

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

        <ol className="flex flex-col md:flex-row md:items-stretch gap-3 md:gap-0">
          {LANDING_STEPS.map(({ step, title, text }, i) => {
            const Icon = STEP_ICONS[i] ?? Link2;
            const isLast = i === LANDING_STEPS.length - 1;
            return (
              <li key={step} className="flex flex-col md:flex-row md:flex-1 md:min-w-0 items-stretch">
                <div className="flex-1 rounded-xl border border-border/60 bg-background/60 px-5 py-4 sm:px-6 sm:py-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </span>
                    <span className={landingAccentMono}>{step.padStart(2, "0")}</span>
                  </div>
                  <h3 className={`${landingCardTitle} text-base`}>{title}</h3>
                  <p className={`${landingCardBody} text-sm`}>{text}</p>
                </div>
                {!isLast && (
                  <div
                    className="flex items-center justify-center py-2 md:py-0 md:px-3 text-muted-foreground/50 shrink-0"
                    aria-hidden
                  >
                    <ChevronRight className="size-5 rotate-90 md:rotate-0" />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
