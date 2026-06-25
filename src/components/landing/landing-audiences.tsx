import type { LucideIcon } from "lucide-react";
import { Building2, Megaphone, Rocket, Users, Code2 } from "lucide-react";
import { AUDIENCES_DETAILED, AUDIENCES_SECTION } from "@/lib/brand/content";
import {
  landingCardBody,
  landingCardLabel,
  landingCardTitle,
  landingSectionCard,
  landingSectionEyebrow,
  landingSectionHeaderMb,
  landingSectionLead,
  landingSectionPad,
  landingSectionTitle,
} from "./landing-typography";
import { Reveal } from "./reveal";

const AUDIENCE_ICONS: Record<string, LucideIcon> = {
  Bedriftseier: Building2,
  Markedsfører: Megaphone,
  Gründer: Rocket,
  "Byrå / frilanser": Users,
  Utvikler: Code2,
};

export function LandingAudiences() {
  return (
    <section className={`${landingSectionPad} ${landingSectionCard}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Reveal>
          <div className={`max-w-2xl ${landingSectionHeaderMb}`}>
            <p className={landingSectionEyebrow}>Målgrupper</p>
            <h2 className={landingSectionTitle}>{AUDIENCES_SECTION.title}</h2>
            <p className={landingSectionLead}>{AUDIENCES_SECTION.lead}</p>
          </div>
        </Reveal>

        <Reveal className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {AUDIENCES_DETAILED.map(({ group, headline, text }) => {
            const Icon = AUDIENCE_ICONS[group] ?? Users;
            return (
              <div
                key={group}
                className="rounded-2xl border border-border bg-background/50 p-5 sm:p-6 transition-shadow hover:shadow-md"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <p className={`mt-4 ${landingCardLabel}`}>{group}</p>
                <h3 className={`mt-1 ${landingCardTitle}`}>{headline}</h3>
                <p className={landingCardBody}>{text}</p>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
