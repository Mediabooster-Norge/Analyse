'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { HERO_H1_PREFIX, HERO_ROTATING_WORDS } from '@/lib/brand/content';
import { landingHeroTitle, landingHeroTitleLine, landingHighlightText } from './landing-typography';

const ROTATION_MS = 2400;

export function HeroRotatingHeadline() {
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % HERO_ROTATING_WORDS.length);
    }, ROTATION_MS);
    return () => window.clearInterval(id);
  }, [prefersReducedMotion]);

  const activeWord = HERO_ROTATING_WORDS[index];
  const fullHeadline = `${HERO_H1_PREFIX} ${activeWord}`;

  return (
    <h1 className={landingHeroTitle}>
      <span className={landingHeroTitleLine}>{HERO_H1_PREFIX}</span>
      <span className="block">
        <span
          className={`inline-grid justify-items-center ${landingHighlightText}`}
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="sr-only">{fullHeadline}</span>
          {HERO_ROTATING_WORDS.map((word) => (
            <span
              key={word}
              className="col-start-1 row-start-1 invisible pointer-events-none"
              aria-hidden
            >
              {word}
            </span>
          ))}
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={activeWord}
              className="col-start-1 row-start-1"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              aria-hidden
            >
              {activeWord}
            </motion.span>
          </AnimatePresence>
        </span>
      </span>
    </h1>
  );
}
