/** Stylized atlas paths — "the world as an explorer's map", not cartographic accuracy */

export const WORLD_PATH = [
  // Greenland
  'M 20 2 L 24 1 L 28 3 L 29 7 L 25 9 L 21 8 Z',
  // North America
  'M 9 8 L 16 4 L 24 5 L 30 9 L 31 14 L 27 18 L 25 24 L 22 29 L 17 28 L 14 24 L 10 21 L 8 16 L 6 12 Z',
  // Central America
  'M 22 29 L 25 24 L 27 28 L 25 33 L 22 36 L 20 33 L 21 30 Z',
  // South America
  'M 23 36 L 28 34 L 32 39 L 34 45 L 30 49 L 25 47 L 21 43 L 21 38 Z',
  // Iceland
  'M 33 6 L 35 5 L 36 8 L 34 9 Z',
  // Africa
  'M 34 20 L 42 17 L 50 18 L 53 22 L 55 27 L 52 32 L 49 37 L 45 40 L 41 44 L 37 42 L 33 37 L 30 31 L 30 25 Z',
  // Europe
  'M 40 8 L 45 6 L 50 8 L 54 12 L 52 16 L 47 20 L 43 19 L 39 14 Z',
  // Scandinavia
  'M 45 3 L 49 4 L 50 8 L 45 9 Z',
  // Asia
  'M 52 10 L 60 7 L 70 6 L 80 9 L 84 13 L 81 18 L 74 20 L 70 18 L 68 22 L 64 24 L 60 22 L 57 25 L 54 21 Z',
  // India
  'M 60 23 L 66 23 L 69 28 L 64 33 L 58 29 L 58 25 Z',
  // Arabia
  'M 53 22 L 57 24 L 58 29 L 55 31 L 51 27 Z',
  // SE Asia / Indonesia
  'M 76 26 L 82 27 L 85 30 L 82 33 L 78 31 L 75 29 Z',
  'M 74 31 L 78 33 L 80 36 L 77 38 L 74 36 Z',
  'M 82 34 L 86 35 L 87 38 L 84 40 L 81 37 Z',
  // Japan
  'M 85 13 L 88 15 L 87 19 L 85 17 Z',
  // Australia
  'M 78 35 L 84 33 L 90 35 L 92 40 L 88 45 L 81 44 L 76 40 Z',
  // New Zealand
  'M 95 42 L 97 44 L 96 47 L 94 45 Z',
] as const;

/** Approximate Egypt outline (viewBox 0 0 100 100) — delta + valley */
export const EGYPT_PATH = [
  'M 33 4 L 38 2 L 45 5 L 50 4 L 57 9 L 60 13 L 59 20 L 56 28 L 55 38 L 53 48 L 52 58 L 50 70 L 48 82 L 45 92 L 38 94 L 32 84 L 28 72 L 25 60 L 21 50 L 20 40 L 23 30 L 27 20 L 29 12 L 30 7 Z',
  // Delta wedge
  'M 33 4 L 40 26 L 46 8 Z',
] as const;

/** Graticule for world map */
export const GRATICULE = {
  horizontal: [10, 20, 30, 40],
  vertical: [10, 20, 30, 40, 50, 60, 70, 80, 90],
} as const;

export const CAIRO_COORDINATES = { degrees: 30, minutes: 3, hemisphere: 'N' as const };
export const ALEXANDRIA_COORDINATES = { degrees: 31, minutes: 12, hemisphere: 'N' as const };
