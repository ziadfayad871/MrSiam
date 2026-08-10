import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { usePrefersReducedMotion } from '../motion/hooks';

export interface DiscoveryMarkerProps {
  label?: string;
  children?: ReactNode;
  className?: string;
  /** Show the pulse ring */
  pulse?: boolean;
}

/** Pulsing marker for new lessons, new achievements, important events */
export function DiscoveryMarker({ label, children, className = '', pulse = true }: DiscoveryMarkerProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <span className={`relative inline-flex items-center gap-2 ${className}`}>
      <span className="relative flex h-2.5 w-2.5">
        {pulse && !reduced && (
          <motion.span
            className="absolute inline-flex h-full w-full rounded-full bg-gold"
            animate={{ scale: [1, 2.4], opacity: [0.55, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold-bright" />
      </span>
      {label && <span className="text-xs font-semibold text-gold">{label}</span>}
      {children}
    </span>
  );
}

export default DiscoveryMarker;
