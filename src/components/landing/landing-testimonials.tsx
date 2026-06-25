"use client";

import type { CSSProperties } from "react";
import { TESTIMONIALS, TESTIMONIALS_SECTION } from "@/lib/brand/content";
import { cn } from "@/lib/utils";
import {
  landingQuote,
  landingQuoteMeta,
  landingSectionHeaderMb,
  landingSectionLead,
  landingSectionPad,
  landingSectionSandFade,
  landingSectionTitle,
} from "./landing-typography";

type Testimonial = (typeof TESTIMONIALS)[number];

const MARQUEE_COPIES = 3;
const CARD_CLASS =
  "testimonial-card w-[260px] sm:w-[288px] shrink-0 h-[156px] sm:h-[164px] flex flex-col rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-sm";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function TestimonialCard({ quote, name, role }: Testimonial) {
  return (
    <blockquote className={CARD_CLASS}>
      <p className={landingQuote}>«{quote}»</p>
      <footer className="mt-auto shrink-0 pt-3 border-t border-border/50 flex items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
          {getInitials(name)}
        </span>
        <span className={`min-w-0 ${landingQuoteMeta} truncate`}>
          <cite className="not-italic font-medium text-foreground block truncate">{name}</cite>
          {role}
        </span>
      </footer>
    </blockquote>
  );
}

function buildMarqueeLoop(items: readonly Testimonial[]) {
  return Array.from({ length: MARQUEE_COPIES }, () => items).flat();
}

function MarqueeRow({
  items,
  direction,
}: {
  items: readonly Testimonial[];
  direction: "left" | "right";
}) {
  const loop = buildMarqueeLoop(items);

  return (
    <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
      <div
        className={cn(
          "testimonial-marquee-track flex w-max items-stretch gap-3 py-0.5 will-change-transform",
          direction === "left" ? "testimonial-marquee-left" : "testimonial-marquee-right"
        )}
        style={{ "--marquee-copies": MARQUEE_COPIES } as CSSProperties}
      >
        {loop.map((item, i) => (
          <TestimonialCard key={`${item.name}-${i}`} {...item} />
        ))}
      </div>
    </div>
  );
}

const rowTop = TESTIMONIALS;
const rowBottom = [...TESTIMONIALS].reverse();

export function LandingTestimonials() {
  return (
    <section className={`${landingSectionPad} overflow-hidden ${landingSectionSandFade}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className={`text-center max-w-2xl mx-auto ${landingSectionHeaderMb}`}>
          <h2 className={landingSectionTitle}>{TESTIMONIALS_SECTION.title}</h2>
          <p className={landingSectionLead}>{TESTIMONIALS_SECTION.lead}</p>
        </div>
      </div>

      <div className="space-y-3">
        <MarqueeRow items={rowTop} direction="left" />
        <MarqueeRow items={rowBottom} direction="right" />
      </div>

      <p className="sr-only">
        {TESTIMONIALS.map(({ quote, name, role }) => `${name}, ${role}: ${quote}`).join(". ")}
      </p>
    </section>
  );
}
