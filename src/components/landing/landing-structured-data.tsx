import { PRICING_TIERS } from "@/lib/brand/content";

const SITE_URL = "https://selia.io";
const LOGO_URL = `${SITE_URL}/brand/Selia-logo-primary.svg`;
const SITE_DESCRIPTION =
  "Selia analyserer nettsiden din og produserer konkrete forbedringer – meta-tekst, artikler og handlingsplaner du kan bruke med én gang. Gratis å starte.";

/** Trekker ut tallverdien fra prisstrenger som «399 kr» → «399». */
function priceToNumber(price: string): string {
  const match = price.match(/\d+/);
  return match ? match[0] : "0";
}

const PLAN_OFFERS = [
  { name: PRICING_TIERS.free.name, price: priceToNumber(PRICING_TIERS.free.price) },
  { name: PRICING_TIERS.plus.name, price: priceToNumber(PRICING_TIERS.plus.price) },
  { name: PRICING_TIERS.premium.name, price: priceToNumber(PRICING_TIERS.premium.price) },
];

const PRICES = PLAN_OFFERS.map((o) => Number(o.price));

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Selia",
      url: SITE_URL,
      logo: LOGO_URL,
      description: SITE_DESCRIPTION,
      sameAs: ["https://mediabooster.no"],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "Selia",
      url: SITE_URL,
      inLanguage: "nb-NO",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: "Selia",
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "nb-NO",
      publisher: { "@id": `${SITE_URL}/#organization` },
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "NOK",
        lowPrice: String(Math.min(...PRICES)),
        highPrice: String(Math.max(...PRICES)),
        offerCount: PLAN_OFFERS.length,
        offers: PLAN_OFFERS.map((plan) => ({
          "@type": "Offer",
          name: plan.name,
          price: plan.price,
          priceCurrency: "NOK",
          url: SITE_URL,
        })),
      },
    },
  ],
};

/** Strukturert data (JSON-LD) for forsiden: Organization, WebSite og SoftwareApplication. */
export function LandingStructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
    />
  );
}
