import { motion, useReducedMotion } from 'motion/react';
import { useMemo } from 'react';

export type CompassVariant = 'small' | 'medium' | 'large' | 'hero' | 'loading' | 'navigation' | 'achievement';

export interface CompassProps {
  size?: CompassVariant;
  /** Direction in degrees (0 = north), or cardinal key */
  direction?: number | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
  /** Slowly rotates the outer dial */
  animated?: boolean;
  /** Rotates needle slowly toward a direction once (navigation) */
  navigate?: boolean;
  /** Shows a route arc around the compass */
  route?: boolean;
  className?: string;
  title?: string;
}

const SIZES: Record<CompassVariant, number> = {
  small: 28,
  medium: 44,
  large: 72,
  hero: 140,
  loading: 96,
  navigation: 56,
  achievement: 96,
};

const CARDINALS: Record<string, number> = {
  n: 0,
  ne: 45,
  e: 90,
  se: 135,
  s: 180,
  sw: 225,
  w: 270,
  nw: 315,
};

export function Compass({
  size = 'medium',
  direction = 'n',
  animated = false,
  navigate = false,
  route = false,
  className = '',
  title,
}: CompassProps) {
  const prefersReduced = useReducedMotion();
  const px = SIZES[size];

  const targetDegrees = typeof direction === 'number' ? direction : (CARDINALS[direction] ?? 0);

  const roseRotation = useMemo(
    () => ({ rotate: animated ? 360 : targetDegrees }),
    [animated, targetDegrees],
  );

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label={title ?? 'بوصلة'}
    >
      <defs>
        <radialGradient id={`compass-${size}`} cx="50%" cy="42%" r="70%">
          <stop offset="0%" stopColor="var(--surface-elevated)" />
          <stop offset="100%" stopColor="var(--surface)" />
        </radialGradient>
      </defs>

      {/* Outer ring */}
      <circle cx="50" cy="50" r="48" fill={`url(#compass-${size})`} stroke="var(--border-soft)" strokeWidth="1" />

      {/* Degree ticks */}
      {Array.from({ length: 72 }).map((_, i) => {
        const major = i % 6 === 0;
        const angle = (i * 5 * Math.PI) / 180;
        const r1 = major ? 42 : 44.5;
        const r2 = 46.5;
        return (
          <line
            key={i}
            x1={50 + r1 * Math.sin(angle)}
            y1={50 - r1 * Math.cos(angle)}
            x2={50 + r2 * Math.sin(angle)}
            y2={50 - r2 * Math.cos(angle)}
            stroke={major ? 'var(--gold-accent)' : 'var(--border-soft)'}
            strokeWidth={major ? 1.4 : 0.7}
            opacity={major ? 0.85 : 0.6}
          />
        );
      })}

      {/* Inner ring */}
      <circle cx="50" cy="50" r="36" fill="none" stroke="var(--border-subtle)" strokeWidth="0.8" />

      {/* Rotating rose */}
      <motion.g
        animate={prefersReduced ? undefined : roseRotation}
        transition={{ duration: animated ? (size === 'hero' ? 90 : 48) : 1.4, ease: [0.16, 1, 0.3, 1], repeat: animated ? Infinity : 0 }}
        style={{ transformOrigin: '50px 50px' }}
      >
        {/* 8-point star */}
        <path d="M50 18 L53.5 46 L50 50 L46.5 46 Z" fill="var(--gold-accent)" opacity="0.9" />
        <path d="M50 82 L53.5 54 L50 50 L46.5 54 Z" fill="var(--text-muted)" opacity="0.55" />
        <path d="M18 50 L46 46.5 L50 50 L46 53.5 Z" fill="var(--text-muted)" opacity="0.45" />
        <path d="M82 50 L54 46.5 L50 50 L54 53.5 Z" fill="var(--text-muted)" opacity="0.45" />
        <path d="M34 34 L42 45 L50 50 L45 42 Z" fill="var(--text-muted)" opacity="0.35" />
        <path d="M66 34 L58 45 L50 50 L55 42 Z" fill="var(--text-muted)" opacity="0.35" />
        <path d="M34 66 L42 55 L50 50 L45 58 Z" fill="var(--text-muted)" opacity="0.35" />
        <path d="M66 66 L58 55 L50 50 L55 58 Z" fill="var(--text-muted)" opacity="0.35" />
      </motion.g>

      {/* Needle */}
      <motion.g
        animate={
          prefersReduced
            ? undefined
            : navigate
              ? { rotate: [targetDegrees - 220, targetDegrees] }
              : animated
                ? { rotate: 360 }
                : { rotate: targetDegrees }
        }
        transition={
          navigate
            ? { duration: 2, ease: [0.16, 1, 0.3, 1] }
            : animated
              ? { duration: 6, ease: 'linear', repeat: Infinity }
              : { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
        }
        style={{ transformOrigin: '50px 50px' }}
      >
        {/* North needle */}
        <path d="M50 16 L54.5 48 L50 56 L45.5 48 Z" fill="var(--gold-accent)" stroke="var(--surface)" strokeWidth="0.8" />
        {/* South needle */}
        <path d="M50 84 L54.5 52 L50 44 L45.5 52 Z" fill="var(--primary)" stroke="var(--surface)" strokeWidth="0.8" />
      </motion.g>

      {/* Route arc */}
      {route && (
        <motion.path
          d="M 30 74 A 44 44 0 0 1 78 30"
          fill="none"
          stroke="var(--gold-accent)"
          strokeWidth="1.6"
          strokeDasharray="7 9"
          opacity="0.75"
          animate={prefersReduced ? undefined : { strokeDashoffset: [0, -64] }}
          transition={{ duration: 3.2, ease: 'linear', repeat: Infinity }}
        />
      )}

      {/* Center pivot */}
      <circle cx="50" cy="50" r="5.5" fill="var(--surface-elevated)" stroke="var(--border-soft)" strokeWidth="1" />
      <circle cx="50" cy="50" r="2.2" fill="var(--gold-accent)" />
    </svg>
  );
}

export default Compass;
