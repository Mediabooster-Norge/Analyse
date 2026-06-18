export const MESSAGE_HIERARCHY = [
  { rank: 1, message: "Løsning, ikke bare problemer", maps: "Differensiering" },
  { rank: 2, message: "Fra analyse til gjennomføring", maps: "Løfte" },
  { rank: 3, message: "Ferdig tekst du kan bruke", maps: "Konkret verdi" },
  { rank: 4, message: "Alt i én rapport", maps: "Helhet" },
  { rank: 5, message: "Gratis å starte", maps: "Lav terskel" },
] as const;

export const HERO_BADGES = [
  "Fra analyse til gjennomføring – på minutter",
  "Viser problemene. Produserer løsningene.",
  "Gratis nettsideanalyse · Ingen kredittkort",
] as const;

export const HERO_HEADLINES = [
  {
    id: "anbefalt",
    label: "Anbefalt",
    lines: ["Problemet er funnet.", "Løsningen er klar."],
  },
  {
    id: "a",
    label: "Alternativ A",
    lines: ["Fra analyse", "til gjennomføring på minutter."],
  },
  {
    id: "b",
    label: "Alternativ B",
    lines: ["Ikke bare hva som er galt –", "men hva du skal gjøre med det."],
  },
  {
    id: "c",
    label: "Alternativ C",
    lines: ["Nettsideanalyse", "som produserer resultatene for deg."],
  },
] as const;

export const HERO_SUBTITLES = [
  {
    id: "anbefalt",
    label: "Anbefalt",
    text: "De fleste verktøy viser deg røde flagg. Selia analyserer nettsiden din og gir deg ferdige forbedringer – meta-tekst, overskrifter, artikler og en handlingsplan du kan ta i bruk med én gang.",
  },
  {
    id: "kort",
    label: "Kort variant",
    text: "Selia finner hva som holder nettsiden din tilbake – og skriver løsningene for deg. På norsk. På minutter.",
  },
  {
    id: "diff",
    label: "Med differensiering",
    text: "Andre verktøy stopper ved problemet. Selia går videre: konkrete forslag du kan kopiere, artikler du kan publisere, og en prioritert plan for hva du bør gjøre først.",
  },
] as const;

export const CTA_TEXTS = [
  { type: "Primær", text: "Analyser nettsiden din gratis" },
  { type: "Primær (innlogget)", text: "Gå til dashboard" },
  { type: "Sekundær", text: "Se hvordan det fungerer" },
  { type: "Differensiering", text: "Opplev forskjellen – analyser gratis" },
  { type: "Slik fungerer det", text: "Kom i gang gratis" },
  { type: "Avslutning", text: "Analyser gratis nå" },
] as const;

export const VALUE_PILLARS = [
  {
    step: "1",
    title: "Finn problemene",
    subtitle: "Analyser",
    text: "Selia sjekker SEO, sikkerhet, innhold og hastighet – og gir deg en tydelig score og oversikt over hva som må forbedres.",
    tagline: "På minutter, ikke dager.",
  },
  {
    step: "2",
    title: "Få løsningene",
    subtitle: "Løs",
    text: "For hvert funn får du ferdigskrevne forslag – meta-beskrivelser, overskrifter, alt-tekst og innholdstips du kan kopiere direkte inn på nettsiden.",
    tagline: "Ikke bare råd – ferdig tekst.",
  },
  {
    step: "3",
    title: "Produser innholdet",
    subtitle: "Produser",
    text: "La AI generere artikler og SoMe-innlegg basert på analysen. Fra idé til publiserbar tekst – uten å starte fra blankt ark.",
    tagline: "Fra analyse til artikkel.",
  },
] as const;

export const CONCRETE_COMPARISON = [
  ["«Meta description mangler»", "Ferdig meta-tekst du kan lime inn"],
  ["«For lite innhold»", "Forslag til nye seksjoner med ordtelling"],
  ["«Konkurrenten scorer høyere»", "Konkret plan for å ta igjen"],
  ["«Dårlig AI-synlighet»", "Tips for å bli anbefalt av AI-modeller"],
  ["Rapport du må tolke selv", "Handlingsplan sortert etter prioritet"],
] as const;

export const AUDIENCES_DETAILED = [
  {
    group: "Bedriftseier",
    headline: "Forstå – og fiks",
    short: "Få vite hva som må fikses – og få teksten ferdig",
    text: "Få vite hva som må endres, og få teksten ferdig skrevet. Uten å leie byrå.",
  },
  {
    group: "Markedsfører",
    headline: "Fra rapport til publisering",
    short: "Fra analyse til publiserbart innhold på minutter",
    text: "Analyser, finn muligheter, generer artikler og SoMe-innlegg – alt i samme verktøy.",
  },
  {
    group: "Gründer",
    headline: "Kom i gang gratis",
    short: "Gratis innsikt uten å leie byrå",
    text: "Alt du trenger for å forstå og forbedre nettsiden din – uten månedlige tusenlapper.",
  },
  {
    group: "Byrå / frilanser",
    headline: "Spar timer per kunde",
    short: "Spar timer på første kundevurdering",
    text: "Kjør en full analyse på minutter og lever rapport med konkrete forbedringer.",
  },
  {
    group: "Utvikler",
    headline: "Teknisk sjekk på sekunder",
    short: "Teknisk SEO- og sikkerhetssjekk på sekunder",
    text: "SEO, sikkerhet og ytelse – med AI-forklaringer du kan sende videre til kunden.",
  },
] as const;

export const WORD_LIST = [
  { use: "Selia", avoid: "Booster, Nettsjekk, Analyseverktøy" },
  { use: "Analyse", avoid: "Scan, audit (uten forklaring)" },
  { use: "Forslag / forbedringer", avoid: "Recommendations" },
  { use: "Handlingsplan", avoid: "Action items" },
  { use: "Ferdig tekst", avoid: "Output" },
  { use: "Gjennomføring", avoid: "Implementering (for tungt)" },
  { use: "Nettside", avoid: "Website" },
  { use: "Gratis", avoid: "Free tier" },
] as const;

export const SHORT_COPY = [
  {
    label: "LinkedIn",
    value:
      "De fleste SEO-verktøy viser deg problemene. Selia produserer løsningene.\nMeta-tekst, artikler og handlingsplan – på minutter. Gratis å starte.\nselia.io",
  },
  {
    label: "Google Ads – Headline 1",
    value: "Nettsideanalyse med løsninger",
  },
  {
    label: "Google Ads – Headline 2",
    value: "Fra analyse til gjennomføring",
  },
  {
    label: "Google Ads – Headline 3",
    value: "Gratis SEO-analyse",
  },
  {
    label: "Google Ads – Description",
    value:
      "Selia finner hva som må fikses – og skriver forbedringene for deg. Prøv gratis på selia.io.",
  },
  {
    label: "E-post emne",
    value: "Velkommen til Selia – analyser nettsiden din nå",
  },
  {
    label: "E-post ingress",
    value:
      "Du er klar. Lim inn en URL og få en komplett rapport med ferdige forbedringsforslag – på minutter.",
  },
  {
    label: "Footer-tagline",
    value: "Selia – Fra analyse til gjennomføring på minutter.",
  },
] as const;

export const TESTIMONIALS = [
  {
    quote: "Fikk ikke bare en liste med feil – jeg fikk meta-teksten ferdig skrevet.",
    name: "Martin H.",
    role: "Daglig leder",
  },
  {
    quote: "Endelig et verktøy som går fra analyse til noe jeg faktisk kan bruke.",
    name: "Lise K.",
    role: "Markedsfører",
  },
  {
    quote: "Genererte tre artikler fra én analyse. Sparer meg en hel arbeidsdag.",
    name: "Camilla B.",
    role: "Markedssjef",
  },
  {
    quote: "Sender Selia-rapporten til alle nye kunder nå – med konkrete forbedringer inkludert.",
    name: "Maria E.",
    role: "Frilanser",
  },
] as const;

export const FAQ_ITEMS = [
  {
    q: "Er Selia virkelig gratis?",
    a: "Ja. Med gratis konto får du 5 analyser og 5 AI-genererte artikler per måned – inkludert full SEO-, sikkerhets-, innholds- og hastighetsanalyse med ferdige forbedringsforslag. Premium (69 kr/mnd) gir mer volum, AI-synlighet og flere konkurrenter.",
  },
  {
    q: "Hva skiller Selia fra andre SEO-verktøy?",
    a: "De fleste verktøy viser deg hva som er galt. Selia går videre: du får ferdigskrevne forbedringer du kan kopiere, artikler du kan publisere, og en prioritert handlingsplan – alt på norsk.",
  },
  {
    q: "Hva analyserer Selia?",
    a: "SEO (tittel, meta, overskrifter, bilder, Open Graph), sikkerhet (SSL, HSTS, CSP), innhold (ordtelling, lesbarhet), hastighet (PageSpeed, LCP, CLS) og – med Premium – detaljert WCAG-tilgjengelighet. Du får konkrete forslag for hvert funn, pluss konkurrentsammenligning og nøkkelordanalyse.",
  },
  {
    q: "Trenger jeg SEO-kunnskap?",
    a: "Nei. Selia forklarer funnene på norsk og gir deg ferdig tekst du kan bruke – du trenger ikke tolke rapporter selv.",
  },
  {
    q: "Hvor lang tid tar en analyse?",
    a: "Vanligvis noen minutter. Du får en komplett rapport med scores, forslag og handlingsplan.",
  },
] as const;

export const FEATURES = [
  {
    name: "SEO-analyse",
    text: "Sjekker sidetittel, meta-beskrivelse, H1/H2, bilder med alt-tekst, lenker, Open Graph og teknisk SEO. Gir ferdige forslag for hvert element.",
  },
  {
    name: "Sikkerhet",
    text: "SSL, HSTS, CSP og andre sikkerhetshoder. Finn sårbarheter før noen andre gjør det.",
  },
  {
    name: "Innhold",
    text: "Ordtelling, lesbarhet (LIX) og nøkkelord. Få forslag til nytt innhold som fyller hullene.",
  },
  {
    name: "Hastighet",
    text: "Google PageSpeed og Core Web Vitals (LCP, CLS). Se hva som bremser siden din.",
  },
  {
    name: "Tilgjengelighet",
    text: "Lighthouse WCAG-analyse med konkrete funn og score. Identifiser barrierer for alle brukere.",
    premium: true,
  },
  {
    name: "Konkurrentanalyse",
    text: "Sammenlign score side om side på SEO, innhold, sikkerhet og hastighet. Se hvor du leder – og hva du bør gjøre for å ta igjen.",
  },
  {
    name: "Nøkkelordanalyse",
    text: "AI-estimert søkevolum, CPC og konkurranse for det norske markedet.",
  },
  {
    name: "AI-anbefalinger",
    text: "Prioritert handlingsplan med ferdigskrevne forbedringer du kan kopiere – meta, overskrifter, alt-tekst og innholdstips.",
  },
  {
    name: "AI-synlighet",
    text: "Sjekk om og hvordan AI-modeller kjenner og anbefaler bedriften din.",
    premium: true,
  },
  {
    name: "Artikkelgenerator",
    text: "Fra analyse til publiserbar artikkel – med forslag til meta og bilde.",
  },
  {
    name: "SoMe-post generator",
    text: "Generer innlegg for LinkedIn, Instagram og X basert på analysen.",
  },
  {
    name: "Forslag til undersider",
    text: "Få forslag til nye undersider med SEO- og innholdsanalyse for hver.",
    premium: true,
  },
  {
    name: "PDF-rapport",
    text: "Last ned komplett analyse som PDF – klar til å dele med kunde eller team.",
  },
  {
    name: "Deling av analyse",
    text: "Del en lesevisning av rapporten via lenke – uten at mottaker trenger konto.",
  },
] as const;
