import { motion, useReducedMotion } from 'motion/react';
import { useMemo } from 'react';
import { Compass } from '../Compass';

export type JourneyStationState = 'reached' | 'current' | 'locked';

export interface JourneyStation {
  id: string;
  title: string;
  /** 0..100 position along the route */
  position: number;
  state: JourneyStationState;
  icon?: string;
}

export interface JourneySeal {
  id: string;
  /** 0..100 position along the route */
  position: number;
  label: string;
}

export interface JourneyAchievementMarker {
  id: string;
  /** 0..100 position along the route */
  position: number;
  title: string;
  icon?: string;
}

export interface JourneyMapProps {
  stations: JourneyStation[];
  /** 0..100 overall journey progress — the route itself is the progress */
  progress: number;
  /** golden seals placed along the route (passed exams) */
  seals?: JourneySeal[];
  /** achievement markers planted on the map */
  achievements?: JourneyAchievementMarker[];
  /** the travelling student mark */
  travelerName?: string;
  className?: string;
}

const ROUTE = 'M 8 76 C 22 76, 20 24, 38 24 S 62 76, 80 76 S 90 30, 94 14';

/** Deterministic points along the journey route (SVG geometry, GPU-friendly) */
function pointsAt(fractions: number[]): { x: number; y: number }[] {
  if (typeof document === 'undefined') return fractions.map(() => ({ x: 50, y: 50 }));
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', ROUTE);
  const len = p.getTotalLength();
  return fractions.map((f) => p.getPointAtLength((Math.min(100, Math.max(0, f)) / 100) * len));
}

/**
 * The student's learning journey drawn as a historical map:
 * an animated route connects the stations, the traveler moves along it,
 * passed exams become golden seals and achievements are planted on the map.
 * The route itself IS the progress indicator.
 */
export function JourneyMap({
  stations,
  progress: rawProgress,
  seals = [],
  achievements = [],
  travelerName,
  className = '',
}: JourneyMapProps) {
  const reduced = useReducedMotion();
  const progress = Math.min(100, Math.max(0, rawProgress));

  const points = useMemo(() => {
    const targets = [
      0,
      ...stations.map((s) => s.position),
      ...seals.map((s) => s.position),
      ...achievements.map((a) => a.position),
      progress,
    ];
    const pts = pointsAt(targets);
    return {
      start: pts[0],
      station: Object.fromEntries(stations.map((s, i) => [s.id, pts[1 + i]])),
      seal: Object.fromEntries(seals.map((s, i) => [s.id, pts[1 + stations.length + i]])),
      achievement: Object.fromEntries(achievements.map((a, i) => [a.id, pts[1 + stations.length + seals.length + i]])),
      traveler: pts[pts.length - 1],
    };
  }, [stations, seals, achievements, progress]);

  const reached = stations.filter((s) => s.state === 'reached').length;

  return (
    <div className={`relative ${className}`}>
      {/* Parchment base */}
      <div className="relative overflow-hidden rounded-lg border border-gold/25 bg-parchment-soft shadow-floating">
        <svg viewBox="0 0 100 100" className="h-full w-full" role="img" aria-label="خريطة رحلة الطالب التعليمية" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="journey-sea" cx="40%" cy="30%" r="90%">
              <stop offset="0%" stopColor="var(--surface-elevated)" />
              <stop offset="100%" stopColor="var(--surface-sunken)" />
            </radialGradient>
            <pattern id="journey-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="var(--map-line)" strokeWidth="0.18" />
            </pattern>
            <filter id="journey-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="1.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="100" height="100" fill="url(#journey-sea)" />
          <rect width="100" height="100" fill="url(#journey-grid)" />

          {/* Contour islands — ambient drift */}
          <motion.path
            d="M 62 60 q 8 -2 12 -9 q 6 -1 9 4 q -2 8 -10 9 q -8 2 -11 -4 Z"
            fill="var(--surface)"
            opacity="0.55"
            animate={reduced ? undefined : { y: [0, -1.2, 0], x: [0, 0.8, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.path
            d="M 14 44 q 6 -3 9 1 q 2 5 -3 7 q -6 1 -8 -3 Z"
            fill="var(--surface)"
            opacity="0.5"
            animate={reduced ? undefined : { y: [0, 1, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Route base */}
          <path d={ROUTE} fill="none" stroke="var(--border-soft)" strokeWidth="0.9" strokeDasharray="2 1.6" />

          {/* Route progress — the route IS the progress */}
          <motion.path
            d={ROUTE}
            fill="none"
            stroke="var(--gold-accent)"
            strokeWidth="1.1"
            strokeLinecap="round"
            initial={reduced ? { pathLength: progress / 100 } : { pathLength: 0 }}
            whileInView={{ pathLength: progress / 100 }}
            viewport={{ once: true }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ filter: 'url(#journey-glow)' }}
          />

          {/* Stations */}
          {stations.map((s, i) => {
            const pt = points.station[s.id];
            return (
              <motion.g
                key={s.id}
                initial={reduced ? undefined : { scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 240, damping: 15, delay: 0.4 + i * 0.14 }}
              >
                <g transform={`translate(${pt.x} ${pt.y})`}>
                  {s.state === 'current' && (
                    <circle r="3.4" fill="var(--gold-accent)" opacity="0.3">
                      <animate attributeName="r" values="2.6;4;2.6" dur="2.2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle
                    r="2.6"
                    fill={
                      s.state === 'reached'
                        ? 'var(--gold-accent)'
                        : s.state === 'current'
                          ? 'var(--surface-elevated)'
                          : 'var(--surface)'
                    }
                    stroke={
                      s.state === 'reached'
                        ? 'var(--surface)'
                        : s.state === 'current'
                          ? 'var(--gold-accent)'
                          : 'var(--border-soft)'
                    }
                    strokeWidth="0.7"
                  />
                  {s.state === 'reached' && <path d="M -0.8 0.1 L -0.15 0.7 L 1 -0.7" fill="none" stroke="var(--surface)" strokeWidth="0.5" strokeLinecap="round" />}
                  {s.state === 'current' && <circle r="0.9" fill="var(--gold-accent)" />}
                  <title>{s.title}</title>
                </g>
              </motion.g>
            );
          })}

          {/* Golden seals — passed exams */}
          {seals.map((seal, i) => {
            const pt = points.seal[seal.id];
            return (
              <motion.g
                key={seal.id}
                initial={reduced ? undefined : { scale: 0, rotate: -90, opacity: 0 }}
                whileInView={{ scale: 1, rotate: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 210, damping: 14, delay: 1 + i * 0.15 }}
              >
                <g transform={`translate(${pt.x} ${pt.y})`}>
                  <circle r="2.3" fill="var(--gold-accent)" opacity="0.22">
                    <animate attributeName="opacity" values="0.15;0.5;0.15" dur="2.4s" repeatCount="indefinite" />
                  </circle>
                  <circle r="1.9" fill="var(--gold-accent)" stroke="var(--surface)" strokeWidth="0.5" />
                  <circle r="0.7" fill="var(--surface)" />
                  <title>{seal.label}</title>
                </g>
              </motion.g>
            );
          })}

          {/* Achievement markers planted on the map */}
          {achievements.map((ach, i) => {
            const pt = points.achievement[ach.id];
            return (
              <motion.g
                key={ach.id}
                initial={reduced ? undefined : { scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 220, damping: 15, delay: 1.1 + i * 0.12 }}
              >
                <g transform={`translate(${pt.x} ${pt.y})`}>
                  <path d="M 0 -2.8 L 1.6 0 L 0 2.8 L -1.6 0 Z" fill="var(--gold-bright)" stroke="var(--surface)" strokeWidth="0.4" />
                  <circle r="0.9" fill="var(--surface)" />
                  <title>{ach.title}</title>
                </g>
              </motion.g>
            );
          })}

          {/* Traveler — moves along the route as the journey advances */}
          <motion.g
            key={`traveler-${Math.round(progress)}`}
            initial={reduced ? { translateX: points.traveler.x, translateY: points.traveler.y } : { translateX: points.start.x, translateY: points.start.y, opacity: 0 }}
            animate={{ translateX: points.traveler.x, translateY: points.traveler.y, opacity: 1 }}
            transition={{ duration: reduced ? 0 : 2.2, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <circle cx="0" cy="0" r="2.9" fill="var(--surface-elevated)" stroke="var(--gold-accent)" strokeWidth="0.8" style={{ filter: 'url(#journey-glow)' }} />
            <path d="M 0 -1.1 L 0.5 0.3 L 0 0.9 L -0.5 0.3 Z" fill="var(--gold-accent)" transform="translate(0 -0.2)" />
          </motion.g>
        </svg>

        {/* Compass corner */}
        <div className="absolute bottom-2 start-2 opacity-70">
          <Compass size="small" animated />
        </div>

        {/* Traveler name */}
        {travelerName && (
          <motion.div
            className="absolute bottom-2 end-2 rounded-full border border-gold/40 bg-background/70 px-2.5 py-1 font-plex text-[9px] tracking-[0.14em] text-gold backdrop-blur-sm"
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 1.9 }}
            dir="ltr"
          >
            ✦ {travelerName}
          </motion.div>
        )}

        {/* Progress stamp */}
        <motion.div
          className="absolute top-2 end-2 flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-gold/50 bg-background/60 backdrop-blur-sm"
          initial={{ opacity: 0, scale: 0.7 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 2, duration: 0.5 }}
        >
          <div className="text-center leading-none">
            <p className="display-serif text-base font-bold text-gold" dir="ltr">{Math.round(progress)}%</p>
            <p className="mt-0.5 text-[7px] text-text-muted">من الرحلة</p>
          </div>
        </motion.div>
      </div>

      {/* Station legend */}
      <div className="mt-3 grid grid-cols-5 gap-1.5">
        {stations.map((s) => (
          <div key={s.id} className="flex flex-col items-center gap-1 text-center">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] transition-colors ${
                s.state === 'reached'
                  ? 'border-gold bg-gold text-navy-deep'
                  : s.state === 'current'
                    ? 'border-gold/60 bg-gold/10 text-gold'
                    : 'border-border-soft bg-surface text-text-muted'
              }`}
            >
              {s.state === 'reached' ? '✓' : s.state === 'current' ? '🧭' : s.icon ?? ''}
            </span>
            <p className={`text-[9px] leading-tight ${s.state === 'locked' ? 'text-text-muted' : 'font-semibold text-text-primary'}`}>
              {s.title}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-2 text-center font-plex text-[9px] tracking-[0.24em] text-text-muted" dir="ltr">
        {reached}/{stations.length} STATIONS REACHED
      </p>
    </div>
  );
}

export default JourneyMap;
