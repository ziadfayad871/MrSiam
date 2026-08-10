import { motion } from 'motion/react';
import { usePrefersReducedMotion } from '../motion/hooks';

export interface Coordinate {
  degrees: number;
  minutes: number;
  hemisphere: 'N' | 'S' | 'E' | 'W';
}

export interface CoordinateLabelProps {
  latitude: Coordinate;
  longitude: Coordinate;
  /** Fades in/out continuously (hero use) */
  ambient?: boolean;
  className?: string;
}

function formatCoordinate(c: Coordinate) {
  return `${c.degrees}°${String(c.minutes).padStart(2, '0')}′${c.hemisphere}`;
}

/** Geographic coordinate signature — e.g. 31°15′N / 32°18′E */
export function CoordinateLabel({ latitude, longitude, ambient = false, className = '' }: CoordinateLabelProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.span
      className={`font-plex inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.14em] text-text-muted tabular-nums ${className}`}
      animate={ambient && !reduced ? { opacity: [0.3, 0.75, 0.3] } : undefined}
      transition={ambient && !reduced ? { duration: 6, ease: 'easeInOut', repeat: Infinity } : undefined}
      dir="ltr"
    >
      <span className="text-gold">{formatCoordinate(latitude)}</span>
      <span className="opacity-50">/</span>
      <span className="text-gold">{formatCoordinate(longitude)}</span>
    </motion.span>
  );
}

export default CoordinateLabel;
