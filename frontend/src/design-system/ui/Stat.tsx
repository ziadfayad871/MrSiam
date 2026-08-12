import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { usePrefersReducedMotion } from '../motion/hooks';
import { Reveal } from '../motion/Reveal';

export interface StatProps {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  hint?: string;
  trend?: number;
  className?: string;
}

/** Statistics card — numbers have strong presence, dates feel historical */
export function Stat({ icon, label, value, hint, trend, className = '' }: StatProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <Reveal>
      <div className={`platform-stat relative overflow-hidden rounded-xl border border-border-gold/55 bg-surface/90 p-5 shadow-sm ${className}`}>
        {/* faint coordinates backdrop */}
        <span className="pointer-events-none absolute -top-2 -left-2 font-plex text-[9px] tracking-widest text-map-line" dir="ltr">
          30°02′N / 31°14′E
        </span>

        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-text-muted">{label}</p>
            <p className="font-historical mt-1.5 text-3xl font-bold leading-none text-text-primary">{value}</p>
            {hint && <p className="mt-1.5 text-[11px] text-text-muted">{hint}</p>}
          </div>
          {icon && <span className="text-gold">{icon}</span>}
        </div>

        {typeof trend === 'number' && trend !== 0 && (
          <motion.span
            className={`mt-3 inline-flex items-center gap-1 text-[11px] font-semibold ${trend > 0 ? 'text-success' : 'text-error'}`}
            initial={reduced ? undefined : { opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}% هذا الشهر
          </motion.span>
        )}
      </div>
    </Reveal>
  );
}

export default Stat;
