import { motion } from 'motion/react';
import { usePrefersReducedMotion } from '../motion/hooks';

export interface ProgressProps {
  value: number;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
  label?: string;
}

const SIZES = { xs: 'h-1', sm: 'h-1.5', md: 'h-2' } as const;

/** Progress with the gold route treatment */
export function Progress({ value, className = '', size = 'sm', showLabel = false, label }: ProgressProps) {
  const reduced = usePrefersReducedMotion();
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full overflow-hidden rounded-full bg-surface-sunken ${SIZES[size]}`}>
        <motion.div
          className="h-full rounded-full bg-gradient-to-l from-gold to-gold-bright"
          style={{ boxShadow: '0 0 10px var(--gold-glow)' }}
          initial={reduced ? { width: `${clamped}%` } : { width: 0 }}
          whileInView={{ width: `${clamped}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      {showLabel && (
        <div className="mt-1.5 flex justify-between text-[11px] text-text-muted">
          <span>{label}</span>
          <span className="font-plex text-gold tabular-nums" dir="ltr">
            {clamped}%
          </span>
        </div>
      )}
    </div>
  );
}

export default Progress;
