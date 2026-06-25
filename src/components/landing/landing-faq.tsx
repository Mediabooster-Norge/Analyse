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
  landingSectionEyebrow,
  landingSectionLead,
  landingSectionPad,
  landingSectionTitle,
  landingSectionTitleMuted,
  landingSectionWash,
} from "./landing-typography";

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: {
      "@type": "Answer",
      text: a,
    },
  })),
};

export function LandingFaq() {
  return (
    <section id="faq" className={`${landingSectionPad} scroll-mt-20 ${landingSectionWash}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          <div>
            <div className="md:sticky md:top-28">
              <p className={landingSectionEyebrow}>Hjelp</p>
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
