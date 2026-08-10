import { motion } from 'motion/react';
import { Compass } from './Compass';

export interface Stop {
  /** Progress 0..100 where the stop sits on the route */
  position: number;
  label: string;
  state: 'start' | 'passed' | 'current' | 'locked' | 'goal';
}

export interface RouteProgressProps {
  /** 0..100 */
  value: number;
  stops?: Stop[];
  labelStart?: string;
  labelEnd?: string;
  className?: string;
}

/**
 * Progress as a geographic route rather than a generic bar:
 * start ─────●────────────●────── goal
 *                    ↑
 *                 current
 */
export function RouteProgress({
  value,
  stops = [],
  labelStart = 'البداية',
  labelEnd = 'الهدف',
  className = '',
}: RouteProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full ${className}`} dir="rtl">
      <div className="relative h-6">
        {/* Route line */}
        <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-border-subtle" />

        {/* Progress portion */}
        <motion.div
          className="absolute top-1/2 end-0 h-[2px] -translate-y-1/2 rounded-full bg-gradient-to-l from-gold to-gold-bright"
          initial={{ width: 0 }}
          whileInView={{ width: `${clamped}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ boxShadow: '0 0 12px var(--gold-glow)' }}
        />

        {/* Stops */}
        {stops.map((stop, i) => (
          <div
            key={`${stop.label}-${i}`}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
            style={{ [stop.state === 'current' ? 'left' : 'right']: `${stop.position}%` } as React.CSSProperties}
          >
            {stop.state === 'current' ? (
              <div className="relative -translate-y-1/2" style={{ translate: '0 -12px' }}>
                <span className="absolute inset-0 rounded-full bg-gold/40" style={{ animation: 'pulse-ring 2.4s ease-out infinite' }} />
                <Compass size="small" direction="ne" animated className="relative z-10" />
              </div>
            ) : (
              <span
                className={`block h-3 w-3 rounded-full border-2 ${
                  stop.state === 'passed'
                    ? 'border-gold bg-gold'
                    : stop.state === 'goal'
                      ? 'border-gold bg-gold-bright'
                      : 'border-border-soft bg-surface'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Labels */}
      <div className="mt-1 flex items-center justify-between text-[11px] font-medium text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          {labelStart}
        </span>
        <span className="font-plex text-gold tabular-nums" dir="ltr">
          {clamped}%
        </span>
        <span className="flex items-center gap-1.5">
          {labelEnd}
          <span className="h-1.5 w-1.5 rounded-full bg-gold-bright" />
        </span>
      </div>

      {stops.length > 0 && (
        <div className="mt-2 grid grid-cols-[auto_1fr_auto] items-center gap-2 text-[11px] text-text-secondary">
          {stops.map((stop, i) => (
            <span key={i} className={stop.state === 'current' ? 'font-semibold text-gold' : ''}>
              {stop.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default RouteProgress;
