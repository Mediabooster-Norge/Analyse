/** Delte typografi- og layout-klasser for landingssiden.
 *
 * Skala (mobil → desktop):
 * - H1 hero:     3xl → 6xl (serif)
 * - H2 seksjon: 2xl → 4xl (serif)
 * - H3 kort:     base → lg
 * - Hero lead:   lg → xl
 * - Seksjon lead: base → lg
 * - Brødtekst:   sm → base
 * - Meta:        xs → sm
 */

export const landingSectionDefault = "bg-section-pass";
export const landingSectionHero = "bg-section-hero";
export const landingSectionHeroReverse = "bg-section-card";
export const landingSectionWash = "bg-section-wash";
export const landingSectionStage = "bg-section-stage";
export const landingSectionSandFade = "bg-section-sand";
export const landingSectionTealFade = "bg-section-card";
export const landingSectionPass = "bg-section-pass";
export const landingSectionCard = "bg-section-card";
export const landingSectionCtaFade = "bg-section-pass";
export const landingSectionFooterFade = "bg-section-footer-fade";

export const landingSectionPad = "py-14 sm:py-20";
export const landingSectionPadCompact = "py-12 sm:py-16";
export const landingSectionHeaderMb = "mb-10 sm:mb-12";

/** H1 – kun hero */
export const landingHeroTitle =
  "font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight max-w-3xl mx-auto";

export const landingHeroTitleLine = "block text-foreground";
export const landingHighlightText = "text-primary";

export const landingHeroBadge =
  "text-xs sm:text-sm text-muted-foreground border-border/60 bg-card/60";

export const landingHeroLead =
  "mt-4 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed";

export const landingHeroTrust = "text-sm text-muted-foreground";

/** H2 – seksjonstitler */
export const landingSectionTitle =
  "font-serif text-2xl sm:text-3xl md:text-4xl tracking-tight text-foreground";

export const landingSectionTitleMuted = "text-muted-foreground";

/** Seksjonsingress */
export const landingSectionLead =
  "mt-3 text-base sm:text-lg text-muted-foreground leading-relaxed";

/** Gull etikett over seksjonstittel */
export const landingSectionEyebrow =
  "text-xs sm:text-sm uppercase tracking-wide text-[#D4A574] font-medium mb-3";

/** H3 – korttitler */
export const landingCardTitle = "text-base sm:text-lg font-medium text-foreground";

/** Kort brødtekst */
export const landingCardBody =
  "mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed";

/** Kort callout / tagline */
export const landingCardTagline = "mt-4 text-sm font-medium text-primary";

/** Liten etikett på kort (f.eks. målgruppe) */
export const landingCardLabel =
  "text-xs sm:text-sm font-medium uppercase tracking-wide text-primary";

/** Steg-etikett på pillar-kort */
export const landingPillarStepLabel =
  "text-xs sm:text-sm font-medium uppercase tracking-wide";

/** Stegnummer / accent mono */
export const landingAccentMono =
  "font-mono text-sm font-medium text-[#D4A574] tabular-nums";

/** Sidebar-liste i pillars */
export const landingCardListItem = "text-sm text-muted-foreground";

/** Pill / badge tekst */
export const landingBadgeText = "text-xs sm:text-sm font-medium";

/** Meta, bildetekst, tabellhoder i demo */
export const landingMeta = "text-xs text-muted-foreground";

export const landingMetaSm = "text-xs sm:text-sm text-muted-foreground";

/** Demo-widget (innhold i forhåndsvisning) */
export const landingDemoPanelTitle = "font-medium text-base sm:text-lg";
export const landingDemoTitle = "text-sm font-medium";
export const landingDemoBody = "text-sm text-muted-foreground leading-relaxed";
export const landingDemoTable = "text-sm";
export const landingDemoTableHeader = "text-xs font-medium text-muted-foreground";
export const landingDemoMicro = "text-xs";

/** Marquee feature-kort – kompakt */
export const landingFeatureCardTitle = "text-sm sm:text-base font-medium text-foreground";
export const landingFeatureCardBody =
  "mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed";

export const landingFeaturePremiumBadge =
  "rounded-full bg-[#FDF6EE] px-2 py-0.5 text-[10px] sm:text-xs font-medium text-[#D4A574]";

/** Testimonials */
export const landingQuote =
  "flex-1 min-h-0 text-sm sm:text-base leading-snug text-foreground/90 font-serif line-clamp-3";

export const landingQuoteMeta = "text-xs text-muted-foreground";

/** Prising */
export const landingPriceEyebrow =
  "text-xs sm:text-sm font-medium uppercase tracking-wide text-muted-foreground";

export const landingPriceAmount = "text-3xl sm:text-4xl font-semibold tracking-tight text-foreground";

export const landingPricePeriod = "text-sm text-muted-foreground";

export const landingPriceList = "text-sm sm:text-base";

export const landingPriceNote = "text-sm sm:text-base text-muted-foreground";

export const landingPriceHighlight =
  "text-sm sm:text-base font-medium text-foreground";

/** FAQ */
export const landingFaqQuestion =
  "text-base sm:text-lg font-medium text-left hover:no-underline";

export const landingFaqAnswer =
  "text-sm sm:text-base text-muted-foreground leading-relaxed";

/** Footer */
export const landingFooterText = "text-sm text-muted-foreground";

/** @deprecated Bruk landingPriceEyebrow */
export const landingMutedEyebrow = landingPriceEyebrow;

/** @deprecated Bruk landingSectionEyebrow */
export const landingCardEyebrow = landingSectionEyebrow;
