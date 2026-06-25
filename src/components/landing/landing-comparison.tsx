import { ArrowDown, Check } from "lucide-react";
import {
  COMPARISON_HIGHLIGHT,
  COMPARISON_SECTION,
  CONCRETE_COMPARISON,
} from "@/lib/brand/content";
import {
  landingMeta,
  landingSectionEyebrow,
  landingSectionLead,
  landingSectionPad,
  landingSectionSandFade,
  landingSectionTitle,
} from "./landing-typography";

export function LandingComparison() {
  const { problem, solution } = COMPARISON_HIGHLIGHT;

  return (
    <section className={`${landingSectionPad} ${landingSectionSandFade}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-10 md:gap-14 lg:gap-16 items-start">
          <div className="md:sticky md:top-28">
            <p className={landingSectionEyebrow}>{COMPARISON_SECTION.eyebrow}</p>
            <h2 className={landingSectionTitle}>{COMPARISON_SECTION.title}</h2>
            <p className={landingSectionLead}>{COMPARISON_SECTION.lead}</p>

            <ul className="mt-7 space-y-2.5">
              {CONCRETE_COMPARISON.map(({ selia }) => (
                <li key={selia} className="flex items-start gap-2.5">
                  <Check className="size-4 shrink-0 text-primary mt-0.5" strokeWidth={2.5} aria-hidden />
                  <span className="text-sm text-foreground leading-snug">{selia}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0 rounded-2xl border border-border/60 bg-card overflow-hidden">
            <div className="px-5 py-4 sm:px-6">
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                {problem.label}
              </span>
              <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {problem.finding}
              </p>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{problem.outcome}</p>
            </div>

            <div className="flex items-center gap-3 px-5 sm:px-6 text-muted-foreground/40">
              <span className="h-px flex-1 bg-border/60" />
              <ArrowDown className="size-4" aria-hidden />
              <span className="h-px flex-1 bg-border/60" />
            </div>

            <div className="px-5 py-4 sm:px-6 bg-primary/[0.06] border-t border-primary/15">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                <Check className="size-3" strokeWidth={3} aria-hidden />
                {solution.label}
              </span>
              <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-primary/70">
                {solution.finding}
              </p>
              <p className="mt-1 text-sm font-medium text-foreground leading-relaxed">{solution.copy}</p>
              <p className={`${landingMeta} mt-2 text-primary/80`}>{solution.note}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
