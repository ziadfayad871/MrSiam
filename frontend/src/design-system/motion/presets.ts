import type { Transition } from 'motion/react';
import { durations, easings } from './tokens';

/** Shared animation presets — one motion language, everywhere. */

export const transitions = {
  standard: (duration: number = durations.normal): Transition => ({
    duration,
    ease: easings.standard,
  }),
  emphasized: (duration: number = durations.slow): Transition => ({
    duration,
    ease: easings.emphasized,
  }),
  enter: (duration: number = durations.normal): Transition => ({
    duration,
    ease: easings.enter,
  }),
  exit: (duration: number = durations.fast): Transition => ({
    duration,
    ease: easings.exit,
  }),
};

/** Fade + rise used for content reveals */
export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0): Transition => ({
    opacity: 1,
    y: 0,
    transition: { ...transitions.enter(0.55), delay: i * 0.09 },
  }),
} as const;

/** Subtle fade for overlays and backgrounds */
export const fade = {
  hidden: { opacity: 0 },
  visible: (delay = 0): Transition => ({
    opacity: 1,
    transition: transitions.standard(durations.slow),
    delay,
  }),
} as const;

/** Scale reveal for cards and badges */
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (delay = 0): Transition => ({
    opacity: 1,
    scale: 1,
    transition: { ...transitions.enter(), delay },
  }),
} as const;

/** Card hover: subtle rise + gold border accent */
export const cardHover = {
  whileHover: { y: -6 },
  transition: { type: 'spring', stiffness: 380, damping: 26 },
} as const;

/** Route line draws itself (pathLength animation) */
export const routeDraw = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (delay = 0): Transition => ({
    pathLength: 1,
    opacity: 1,
    transition: { duration: 1.6, ease: 'easeInOut', delay },
  }),
} as const;

/** Page-level container stagger */
export const staggerContainer = {
  hidden: {},
  visible: (delay = 0): Transition => ({
    transition: { staggerChildren: 0.08, delayChildren: delay },
  }),
} as const;

export const motionPresets = { fadeUp, fade, scaleIn, cardHover, routeDraw, staggerContainer, transitions };
