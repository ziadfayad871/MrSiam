/** Motion design tokens — mirrored from CSS (index.css) for JS animations */

export const durations = {
  fast: 0.18,
  normal: 0.32,
  slow: 0.6,
  page: 0.7,
  hero: 1.1,
} as const;

export const easings = {
  standard: [0.4, 0, 0.2, 1] as const,
  emphasized: [0.2, 0.8, 0.2, 1] as const,
  enter: [0.16, 1, 0.3, 1] as const,
  exit: [0.7, 0, 0.84, 0] as const,
} as const;

export type Easing = readonly number[];

export const motionTokens = { durations, easings } as const;
