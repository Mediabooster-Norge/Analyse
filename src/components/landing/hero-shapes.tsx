'use client';

/* Sterke farger – brukes i SectionShapes og dark mode */
const COLORS = {
  green: 'rgb(34 197 94)',    // green-500
  teal: 'rgb(20 184 166)',    // teal-500
  violet: 'rgb(139 92 246)',  // violet-500
  amber: 'rgb(245 158 11)',   // amber-500
  sky: 'rgb(56 189 248)',     // sky-400
};

/* Svakere farger som i Bento Grid (green-200, purple-200, sky-200, violet-200, amber-200) */
const BENTO_COLORS = {
  green: 'rgb(187 247 208)',   // green-200
  teal: 'rgb(153 246 228)',    // teal-200
  violet: 'rgb(221 214 254)',  // violet-200
  amber: 'rgb(253 230 138)',  // amber-200
  sky: 'rgb(186 230 253)',    // sky-200
  purple: 'rgb(233 213 255)',  // purple-200
  blue: 'rgb(191 219 254)',   // blue-200
};

/* Frankli-inspirert pastellpalett for hero på mørk teal bakgrunn */
const HERO_DARK_PASTELS = {
  purple: '#c4a7e7',
  orange: '#f7b282',
  green: '#a7e7c4',
  rose: '#e7a7c4',
  aqua: '#82f7e7',
};

/**
 * Dekorative abstrakte former i hero. Bruker samme fargepalett som Bento Grid, litt svakere.
 */
export function HeroShapes() {
  return (
    <div className="decorative-shape absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Starburst – grønn (SEO) */}
      <div className="absolute top-8 left-4 sm:top-12 sm:left-8 w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60">
        <svg viewBox="0 0 120 120" className="w-full h-full" fill={BENTO_COLORS.green}>
          <path d="M60 8 L65 45 L102 50 L67 55 L60 92 L53 55 L18 50 L55 45 Z" opacity="0.95" />
          <path d="M60 18 L72 48 L102 60 L72 72 L60 102 L48 72 L18 60 L48 48 Z" opacity="0.85" />
        </svg>
      </div>

      {/* Rotert firkant – sky (Konkurrenter-bento); flyttet lengre opp */}
      <div className="absolute top-2 right-[4%] sm:top-4 sm:right-[6%] md:top-6 md:right-[8%] w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44">
        <svg viewBox="0 0 100 100" className="w-full h-full" fill={BENTO_COLORS.sky}>
          <rect x="15" y="15" width="70" height="70" rx="8" transform="rotate(15 50 50)" opacity="0.9" />
        </svg>
      </div>

      {/* Diamant (firkant 45°) – violet; til høyre for knappene */}
      <div className="absolute top-[45%] left-[62%] -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 sm:left-[65%] md:left-[68%]">
        <svg viewBox="0 0 100 100" className="w-full h-full" fill={BENTO_COLORS.violet}>
          <rect x="30" y="30" width="40" height="40" rx="5" transform="rotate(45 50 50)" opacity="0.9" />
        </svg>
      </div>
    </div>
  );
}

/**
 * Hero-former for mørk teal bakgrunn – Frankli-inspirert pastellpalett (buer, sirkler, blobs).
 */
export function HeroShapesDark() {
  return (
    <div className="decorative-shape absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Stor bue – lilla */}
      <div className="absolute -top-10 left-[10%] w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96">
        <svg viewBox="0 0 200 200" className="w-full h-full" fill={HERO_DARK_PASTELS.purple}>
          <path d="M20 100 A90 90 0 0 1 180 100" opacity="0.85" />
          <path d="M30 100 A80 80 0 0 1 170 100" opacity="0.6" />
        </svg>
      </div>
      {/* Bue – myk oransje */}
      <div className="absolute top-12 right-[5%] w-40 h-40 sm:w-52 sm:h-52 md:w-60 md:h-60">
        <svg viewBox="0 0 200 200" className="w-full h-full" fill={HERO_DARK_PASTELS.orange}>
          <path d="M10 120 A100 100 0 0 1 190 100" opacity="0.9" />
        </svg>
      </div>
      {/* Rektangel avrundet – lys grønn */}
      <div className="absolute top-[35%] left-[3%] w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40">
        <svg viewBox="0 0 100 100" className="w-full h-full" fill={HERO_DARK_PASTELS.green}>
          <rect x="10" y="10" width="80" height="80" rx="16" opacity="0.9" />
        </svg>
      </div>
      {/* Sirkel – aqua/teal */}
      <div className="absolute top-[20%] right-[18%] w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36">
        <svg viewBox="0 0 100 100" className="w-full h-full" fill={HERO_DARK_PASTELS.aqua}>
          <circle cx="50" cy="50" r="45" opacity="0.85" />
        </svg>
      </div>
      {/* Blob – dusty rose */}
      <div className="absolute bottom-[25%] right-[8%] w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52">
        <svg viewBox="0 0 120 120" className="w-full h-full" fill={HERO_DARK_PASTELS.rose}>
          <path d="M60 15 C90 20 105 45 100 70 C95 95 70 108 50 105 C25 100 10 75 15 50 C20 25 45 10 60 15 Z" opacity="0.85" />
        </svg>
      </div>
      {/* Ekstra bue – grønn, nederst venstre */}
      <div className="absolute bottom-[5%] left-[15%] w-32 h-32 sm:w-40 sm:h-40 opacity-80">
        <svg viewBox="0 0 200 200" className="w-full h-full" fill={HERO_DARK_PASTELS.green}>
          <path d="M20 180 A100 100 0 0 0 180 160" opacity="0.8" />
        </svg>
      </div>
    </div>
  );
}

/** Posisjon for én form */
type Position = 'topRight' | 'topLeft' | 'bottomRight' | 'bottomLeft';
/** To former (f.eks. topp høyre + bunn venstre) */
type DualPosition = 'topRightBottomLeft' | 'topLeftBottomRight';

type ColorKey = keyof typeof COLORS;
export type BentoColorKey = keyof typeof BENTO_COLORS;

const POSITIONS: Record<Position, string> = {
  topRight: 'top-4 right-4 sm:right-6',
  topLeft: 'top-4 left-4 sm:left-6',
  bottomRight: 'bottom-4 right-4 sm:right-6',
  bottomLeft: 'bottom-4 left-4 sm:left-6',
};

/** Én form: stjerne, sirkel, firkant eller blob */
function ShapeSvg({ type, fill, opacity = 0.85 }: { type: 'star' | 'circle' | 'square' | 'blob'; fill: string; opacity?: number }) {
  const common = { className: 'w-full h-full', fill, opacity };
  if (type === 'star') {
    return (
      <svg viewBox="0 0 100 100" {...common}>
        <path d="M50 5 L53 45 L93 48 L55 51 L50 93 L45 51 L7 48 L47 45 Z" />
      </svg>
    );
  }
  if (type === 'circle') {
    return (
      <svg viewBox="0 0 100 100" {...common}>
        <circle cx="50" cy="50" r="42" />
      </svg>
    );
  }
  if (type === 'square') {
    return (
      <svg viewBox="0 0 100 100" {...common}>
        <rect x="15" y="15" width="70" height="70" rx="8" transform="rotate(15 50 50)" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 120" {...common}>
      <path d="M60 15 C90 20 105 45 100 70 C95 95 70 108 50 105 C25 100 10 75 15 50 C20 25 45 10 60 15 Z" />
    </svg>
  );
}

/**
 * Ett dekorativt illustrasjons-SVG i Bento-fargepalett – samme stil som hero-formene.
 * Brukes f.eks. i AI-seksjonen nærmere heading, større.
 */
export function IllustrationShape({
  shape,
  bentoColor = 'violet',
  className,
}: {
  shape: 'star' | 'square' | 'circle' | 'blob';
  bentoColor?: BentoColorKey;
  className?: string;
}) {
  const fill = BENTO_COLORS[bentoColor];
  const base = 'decorative-shape absolute overflow-hidden pointer-events-none z-0';
  const opacity = 0.9;

  if (shape === 'star') {
    return (
      <div className={`${base} ${className ?? ''}`} aria-hidden>
        <svg viewBox="0 0 120 120" className="w-full h-full" fill={fill}>
          <path d="M60 8 L65 45 L102 50 L67 55 L60 92 L53 55 L18 50 L55 45 Z" opacity={opacity} />
          <path d="M60 18 L72 48 L102 60 L72 72 L60 102 L48 72 L18 60 L48 48 Z" opacity={0.8} />
        </svg>
      </div>
    );
  }
  if (shape === 'square') {
    return (
      <div className={`${base} ${className ?? ''}`} aria-hidden>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill={fill}>
          <rect x="15" y="15" width="70" height="70" rx="8" transform="rotate(15 50 50)" opacity={opacity} />
        </svg>
      </div>
    );
  }
  if (shape === 'circle') {
    return (
      <div className={`${base} ${className ?? ''}`} aria-hidden>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill={fill}>
          <circle cx="50" cy="50" r="42" opacity={opacity} />
        </svg>
      </div>
    );
  }
  return (
    <div className={`${base} ${className ?? ''}`} aria-hidden>
      <svg viewBox="0 0 120 120" className="w-full h-full" fill={fill}>
        <path d="M60 15 C90 20 105 45 100 70 C95 95 70 108 50 105 C25 100 10 75 15 50 C20 25 45 10 60 15 Z" opacity={opacity} />
      </svg>
    </div>
  );
}

/**
 * 1–2 dekorative former i andre seksjoner. Mindre og diskré.
 * variant: hvor formen(e) skal plasseres.
 * color / colorSecond: farge fra COLORS (green, teal, violet, sky, amber).
 * dark: true på mørk bakgrunn (f.eks. CTA) – bruker lysere, lav opacity.
 */
export function SectionShapes({
  variant = 'topRight',
  color = 'green',
  colorSecond,
  shape = 'star',
  shapeSecond,
  dark = false,
}: {
  variant?: Position | DualPosition;
  color?: ColorKey;
  colorSecond?: ColorKey;
  shape?: 'star' | 'circle' | 'square' | 'blob';
  shapeSecond?: 'star' | 'circle' | 'square' | 'blob';
  dark?: boolean;
}) {
  const base = 'absolute w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 overflow-hidden pointer-events-none z-0';
  const fill1 = dark ? 'rgba(255,255,255,0.12)' : COLORS[color];
  const fill2 = colorSecond ? (dark ? 'rgba(255,255,255,0.08)' : COLORS[colorSecond]) : fill1;
  const isDual = variant === 'topRightBottomLeft' || variant === 'topLeftBottomRight';
  const pos1 = isDual ? (variant === 'topRightBottomLeft' ? POSITIONS.topRight : POSITIONS.topLeft) : POSITIONS[variant as Position];
  const pos2 = variant === 'topRightBottomLeft' ? POSITIONS.bottomLeft : POSITIONS.bottomRight;

  return (
    <div className="decorative-shape absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div className={`${base} ${pos1}`}>
        <ShapeSvg type={shape} fill={fill1} opacity={dark ? 0.2 : 0.85} />
      </div>
      {isDual && (
        <div className={`${base} ${pos2}`}>
          <ShapeSvg type={shapeSecond ?? 'circle'} fill={fill2} opacity={dark ? 0.15 : 0.8} />
        </div>
      )}
    </div>
  );
}
