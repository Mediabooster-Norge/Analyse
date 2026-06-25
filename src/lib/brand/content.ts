export const MESSAGE_HIERARCHY = [
  { rank: 1, message: "Løsning, ikke bare problemer", maps: "Differensiering" },
  { rank: 2, message: "Fra analyse til gjennomføring", maps: "Løfte" },
  { rank: 3, message: "Ferdig tekst du kan bruke", maps: "Konkret verdi" },
  { rank: 4, message: "Alt i én rapport", maps: "Helhet" },
  { rank: 5, message: "Gratis å starte", maps: "Lav terskel" },
] as const;

export const HERO_BADGES = [
  "Fra analyse til ferdig løsning på minutter",
  "Vi viser problemene. Og gir deg forslag til forbedringer.",
  "Gratis å prøve · Ingen konto nødvendig",
] as const;

export const HERO_H1_PREFIX = "Nettsideanalyse" as const;

export const HERO_ROTATING_WORDS = [
  "som viser hva du må fikse",
  "med ferdige forslag",
  "med konkurrentsjekk",
  "med klar handlingsplan",
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
    lines: ["Ikke bare hva som er galt,", "men hva du skal gjøre med det."],
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
    text: "Enten du driver egen bedrift, jobber i byrå eller med marked: Selia finner hva som må fikses på nettsiden, og gir deg konkrete forslag du kan ta i bruk med én gang.",
  },
  {
    id: "kort",
    label: "Kort variant",
    text: "Lim inn nettadressen din. Selia sjekker nettsiden og viser hva som må fikses. Du får forslag til forbedringer på minutter.",
  },
  {
    id: "diff",
    label: "Med differensiering",
    text: "Andre verktøy stopper ved feillista. Selia går videre med ferdig tekst du kan kopiere, artikler du kan publisere, og en plan for hva du bør gjøre først.",
  },
] as const;

export const CTA_TEXTS = [
  { type: "Primær", text: "Analyser nettsiden din gratis" },
  { type: "Primær (innlogget)", text: "Gå til dashboard" },
  { type: "Sekundær", text: "Se hvordan det fungerer" },
  { type: "Differensiering", text: "Opplev forskjellen, analyser gratis" },
  { type: "Demo / prising", text: "Prøv gratis" },
  { type: "Avslutning", text: "Analyser gratis nå" },
] as const;

export const PILLARS_SECTION = {
  title: "Fra funn til ferdig tekst",
  lead: "Selia stopper ikke ved en rapport. Du får hjelp hele veien, fra analyse til tekst du faktisk kan publisere på nettsiden din.",
} as const;

export const DEMO_SECTION = {
  eyebrow: "Rapporten",
  title: "Alt du trenger i én rapport",
  lead: "Analyse, konkurrenter, nøkkelord, AI-forslag og ferdig innhold samlet på ett sted.",
} as const;

export const VALUE_PILLARS = [
  {
    step: "1",
    title: "Finn hva som må fikses",
    subtitle: "Analyser",
    text: "Selia sjekker SEO, sikkerhet, innhold, hastighet og tilgjengelighet. Du får en tydelig score og en oversikt over hva som bør forbedres, med enkle forklaringer for hvert funn.",
    tagline: "På minutter, ikke dager.",
  },
  {
    step: "2",
    title: "Få ferdige forslag",
    subtitle: "AI-hjelp",
    text: "For hvert funn får du konkrete forslag: meta-beskrivelser, overskrifter, alt-tekst og innholdstips. Mye av det er ferdig tekst du kan kopiere rett inn.",
    tagline: "Ikke bare råd, ferdig tekst.",
  },
  {
    step: "3",
    title: "Gjør det på nettsiden",
    subtitle: "Gjennomfør",
    text: "Lim forslagene inn på siden din og følg en prioritert plan som viser hva du bør gjøre først. Da får du størst effekt for minst innsats.",
    tagline: "Fra innsikt til handling.",
  },
] as const;

export const COMPARISON_SECTION = {
  eyebrow: "Derfor Selia",
  title: "Funn er bare starten",
  lead: "Mange verktøy stopper ved feillista. Selia gir deg teksten ferdig – klar til å lime inn.",
} as const;

export const COMPARISON_HIGHLIGHT = {
  problem: {
    label: "Vanlig SEO-rapport",
    finding: "Meta description mangler",
    outcome: "Du får feilen. Teksten må du skrive selv.",
  },
  solution: {
    label: "Selia rapport",
    finding: "Meta description mangler",
    copy: "Oslo Rør AS tilbyr døgnåpen rørleggertjeneste i Oslo og Akershus. Fast pris på bad, VVS og akuttutrykning.",
    note: "158 tegn · klar til å lime inn",
  },
} as const;

export const CONCRETE_COMPARISON = [
  { other: "Feilmelding uten forslag", selia: "Ferdig tekst du kan kopiere" },
  { other: "SEO-sjargong du må tolke", selia: "Forklaringer du forstår" },
  { other: "Rapport du må eksportere selv", selia: "Del analyse med én lenke" },
  { other: "Byråtime for meta og innhold", selia: "AI-forslag per funn" },
  { other: "Flere verktøy for analyse og innhold", selia: "Alt samlet i én flyt" },
] as const;

export const AUDIENCES_SECTION = {
  title: "Bygget for deg som vil gjøre noe med innsikten",
  lead: "Du får ikke bare tall og feilmeldinger. Du får forslag du faktisk kan bruke på nettsiden din.",
} as const;

export const AUDIENCES_DETAILED = [
  {
    group: "Bedriftseier",
    headline: "Forstå og fiks",
    short: "Få vite hva som må fikses, og få teksten ferdig",
    text: "Få en tydelig oversikt over hva som må endres på nettsiden, og få forslag til tekst du kan bruke med én gang. Uten å leie byrå eller tolke tunge rapporter.",
  },
  {
    group: "Markedsfører",
    headline: "Fra rapport til publisering",
    short: "Fra analyse til ferdig innhold på minutter",
    text: "Analyser nettsiden, finn muligheter og lag artikler og SoMe-innlegg i samme verktøy. Mindre tid på research, mer tid på det som faktisk publiseres.",
  },
  {
    group: "Gründer",
    headline: "Kom i gang gratis",
    short: "Gratis innsikt uten å leie byrå",
    text: "Alt du trenger for å forstå og forbedre nettsiden din, uten å betale tusenlapper i måneden. Start med en gratis analyse og se hva som bør prioriteres først.",
  },
  {
    group: "Byrå / frilanser",
    headline: "Spar timer per kunde",
    short: "Spar timer på første kundevurdering",
    text: "Kjør en full analyse på minutter og lever en rapport med konkrete forbedringer. Kunden får mer enn en feilliste, og du sparer tid på oppfølging.",
  },
  {
    group: "Utvikler",
    headline: "Teknisk sjekk på sekunder",
    short: "Teknisk SEO- og sikkerhetssjekk på sekunder",
    text: "SEO, sikkerhet og hastighet med tydelige forklaringer du kan sende rett videre til kunden. Teknisk innsikt uten ekstra dokumentasjon.",
  },
] as const;

export const FEATURES_SECTION = {
  title: "Alt for å forbedre nettsiden i ett verktøy",
  lead: "Teknisk analyse, AI-forslag og innholdsproduksjon på ett sted. Du slipper å hoppe mellom flere tjenester for å finne ut hva som må gjøres, og hva du faktisk skal skrive.",
} as const;

export const TESTIMONIALS_SECTION = {
  title: "Hva brukerne sier",
  lead: "Bedriftseiere, markedsførere og byråer som har gått fra analyse til handling med Selia.",
} as const;

export const PRICING_SECTION = {
  title: "Start gratis.",
  titleMuted: "Oppgrader når du trenger mer.",
  lead: "Prøv uten konto og se hva som må fikses. Opprett gratis konto for full rapport, AI-forslag og lagring av analysene dine.",
} as const;

/** Felles funksjonsliste for Pluss og Premium (kun kvoter skiller) */
export const PAID_PLAN_FEATURES = [
  "Tilgjengelighetsanalyse (WCAG)",
  "Forslag til undersider",
  "Prioritert support",
] as const;

export const PRICING_TIERS = {
  free: {
    id: "free" as const,
    name: "Gratis",
    price: "0 kr",
    note: "5 analyser og 5 AI-artikler per måned",
    features: [
      "Full SEO-, sikkerhets- og innholdsanalyse",
      "Ferdige AI-forslag du kan kopiere",
      "Konkurrentsammenligning",
      "Nøkkelordanalyse (AI-estimater)",
    ],
  },
  plus: {
    id: "plus" as const,
    name: "Pluss",
    price: "399 kr",
    recommended: true,
    cta: "Kom i gang med Pluss",
    analysesPerMonth: 30,
    articlesPerMonth: 30,
    aiVisibilityPerMonth: 10,
  },
  premium: {
    id: "premium" as const,
    name: "Premium",
    price: "799 kr",
    recommended: false,
    cta: "Kom i gang med Premium",
    analysesPerMonth: 80,
    articlesPerMonth: 60,
    aiVisibilityPerMonth: 40,
  },
} as const;

export const FINAL_CTA_SECTION = {
  title: "Klar for å gå fra analyse til gjennomføring?",
  lead: "Lim inn nettadressen din og få forslag til forbedringer, ikke bare en liste med feil.",
} as const;

export const WORD_LIST = [
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
      "De fleste SEO-verktøy viser deg problemene. Selia gir deg forslag til forbedringer.\nMeta-tekst, artikler og handlingsplan på minutter. Gratis å starte.\nselia.io",
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
      "Selia finner hva som må fikses og gir deg forslag til forbedringer. Prøv gratis på selia.io.",
  },
  {
    label: "E-post emne",
    value: "Velkommen til Selia. Analyser nettsiden din nå",
  },
  {
    label: "E-post ingress",
    value:
      "Du er klar. Lim inn en nettadresse og få en komplett rapport med forslag til forbedringer på minutter.",
  },
  {
    label: "Footer-tagline",
    value: "Selia. Fra analyse til gjennomføring på minutter.",
  },
] as const;

export const TESTIMONIALS = [
  {
    quote: "Fikk ikke bare en liste med feil. Jeg fikk meta-teksten ferdig skrevet.",
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
    quote: "Sender Selia-rapporten til alle nye kunder nå, med konkrete forbedringer inkludert.",
    name: "Maria E.",
    role: "Frilanser",
  },
] as const;

export const FAQ_ITEMS = [
  {
    q: "Kan jeg analysere uten å lage konto?",
    a: "Ja. Lim inn nettadressen og få en gratis smakebit med score, hastighet, tilgjengelighet og de viktigste funnene. Opprett gratis konto for AI-forslag, lagring og full rapport.",
  },
  {
    q: "Er Selia virkelig gratis?",
    a: "Ja. Smakebiten koster ingenting og krever ingen konto. Med gratis konto får du 5 fulle analyser og 5 AI-artikler i måneden, inkludert ferdige forslag. Pluss (399 kr/mnd) og Premium (799 kr/mnd) gir mer volum og alle betalte funksjoner, inkludert AI-synlighet.",
  },
  {
    q: "Hva skiller Selia fra andre SEO-verktøy?",
    a: "De fleste verktøy viser deg hva som er galt. Selia går videre og gir deg forslag til forbedringer: ferdig tekst du kan kopiere, artikler du kan publisere og en plan for hva du bør gjøre først.",
  },
  {
    q: "Hva sjekker Selia?",
    a: "SEO (tittel, meta, overskrifter, bilder, Open Graph), sikkerhet (SSL, HSTS, CSP), innhold (ordtelling og lesbarhet), hastighet (PageSpeed, LCP, CLS) og tilgjengelighet. Med konto får du i tillegg AI-forslag for hvert funn, konkurrentanalyse og nøkkelordanalyse. Med Pluss eller Premium får du full WCAG-gjennomgang, AI-synlighet og flere konkurrenter.",
  },
  {
    q: "Må jeg kunne SEO fra før?",
    a: "Nei. Selia forklarer hvert funn tydelig og gir deg forslag du kan bruke. Du trenger ikke tolke rapporter eller leie noen som kan SEO.",
  },
  {
    q: "Hvor lang tid tar en analyse?",
    a: "Som regel noen få minutter. Du får en komplett rapport med scorer, forslag og en handlingsplan du kan følge steg for steg.",
  },
] as const;

export const LANDING_STEPS_SECTION = {
  eyebrow: "Kom i gang",
  title: "Fra URL til første innsikt på minutter",
  lead: "Ingen registrering for å starte. Lim inn adressen og se med én gang hva som bremser siden din.",
} as const;

export const LANDING_STEPS = [
  {
    step: "1",
    title: "Lim inn nettsiden",
    text: "Skriv inn nettadressen til siden du vil sjekke. Analysen starter med én gang.",
  },
  {
    step: "2",
    title: "Se score og funn gratis",
    text: "Få en tydelig score og de viktigste funnene uten å opprette konto.",
  },
  {
    step: "3",
    title: "Opprett konto når du vil ha mer",
    text: "Vil du ha full rapport, AI-forslag og handlingsplan? Da oppretter du gratis konto – når det passer deg.",
  },
] as const;

export const FEATURES = [
  {
    name: "SEO-analyse",
    text: "Sjekker sidetittel, meta-beskrivelse, overskrifter, bilder, lenker, Open Graph og teknisk SEO. For hvert funn får du forslag til hva som bør endres.",
  },
  {
    name: "Sikkerhet",
    text: "Går gjennom SSL, HSTS, CSP og andre sikkerhetshoder. Finn svakheter før noen andre gjør det, med forklaringer du forstår.",
  },
  {
    name: "Innhold",
    text: "Måler ordtelling, lesbarhet og nøkkelordbruk. Få forslag til nytt innhold som fyller hullene og gjør siden lettere å finne.",
  },
  {
    name: "Hastighet",
    text: "Tester med Google PageSpeed og Core Web Vitals. Se hva som bremser siden din og hva som bør prioriteres først.",
  },
  {
    name: "Tilgjengelighet",
    text: "Sjekker om nettsiden fungerer for alle etter WCAG-krav. Du får konkrete funn og en score som viser hvor du står.",
    premium: true,
  },
  {
    name: "Konkurrentanalyse",
    text: "Sammenlign score side om side på SEO, innhold, sikkerhet og hastighet. Se hvor du leder og hva du bør gjøre for å ta igjen.",
  },
  {
    name: "Nøkkelordanalyse",
    text: "Få estimert søkevolum, CPC og konkurranse for relevante nøkkelord. Nyttig når du skal velge hva du vil rangere på.",
  },
  {
    name: "AI-anbefalinger",
    text: "Prioritert handlingsplan med forslag du kan kopiere: meta-tekst, overskrifter, alt-tekst og innholdstips for hvert funn.",
  },
  {
    name: "AI-synlighet",
    text: "Se om ChatGPT og andre AI-tjenester kjenner og anbefaler bedriften din. Viktig når flere søker svar hos AI i stedet for Google.",
    premium: true,
  },
  {
    name: "Artikkelgenerator",
    text: "Lag publiserbare artikler basert på analysen, med forslag til meta-tekst og bilde. Spar tid på innholdsproduksjon.",
  },
  {
    name: "SoMe-post generator",
    text: "Generer innlegg for LinkedIn, Instagram og X basert på funnene i analysen. Klar tekst du kan tilpasse og publisere.",
  },
  {
    name: "Forslag til undersider",
    text: "Få forslag til nye undersider med SEO- og innholdsanalyse for hver. Se hvilke sider som kan styrke synligheten din.",
    premium: true,
  },
  {
    name: "Deling av analyse",
    text: "Del en lesevisning av rapporten via lenke, uten at mottaker trenger konto. Enkelt for byråer og team.",
  },
] as const;
