import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQ_ITEMS } from "@/lib/brand/content";
import {
  landingFaqAnswer,
  landingFaqQuestion,
  landingSectionCard,
  landingSectionLead,
  landingSectionPad,
  landingSectionTitle,
  landingSectionTitleMuted,
} from "./landing-typography";

export function LandingFaq() {
  return (
    <section className={`${landingSectionPad} ${landingSectionCard}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          <div>
            <div className="md:sticky md:top-28">
              <h2 className={landingSectionTitle}>
                Ofte stilte
                <br />
                <span className={landingSectionTitleMuted}>spørsmål</span>
              </h2>
              <p className={landingSectionLead}>
                Finner du ikke svar?{" "}
                <a
                  href="https://mediabooster.no/kontakt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Ta kontakt
                </a>
              </p>
            </div>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map(({ q, a }, i) => (
              <AccordionItem key={q} value={`faq-${i}`}>
                <AccordionTrigger className={landingFaqQuestion}>
                  {q}
                </AccordionTrigger>
                <AccordionContent className={landingFaqAnswer}>
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
