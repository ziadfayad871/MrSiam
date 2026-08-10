import { motion } from 'motion/react';
import { useId } from 'react';
import { usePrefersReducedMotion } from '../../motion/hooks';
import { EGYPT_PATH, GRATICULE, WORLD_PATH } from './mapPaths';

export type MapStyle = 'world' | 'egypt';

export interface MapMarker {
  id: string;
  /** x/y in map viewBox coords (world 0-100x0-50, egypt 0-100) */
  x: number;
  y: number;
  label?: string;
  state?: 'discovered' | 'current' | 'locked';
}

export interface MapRoute {
  id: string;
  points: [number, number][];
}

export interface HistoricalMapProps {
  style?: MapStyle;
  markers?: MapMarker[];
  routes?: MapRoute[];
  animated?: boolean;
  className?: string;
  showGraticule?: boolean;
  highlightRegion?: 'none' | 'delta' | 'valley' | 'world';
}

/** The atlas map — consistent world/Egypt language, optional markers & routes */
export function HistoricalMap({
  style = 'world',
  markers = [],
  routes = [],
  animated = true,
  className = '',
  showGraticule = true,
}: HistoricalMapProps) {
  const reduced = usePrefersReducedMotion();
  const gradId = useId();
  const lineColor = 'var(--map-line)';
  const gold = 'var(--gold-accent)';

  const viewBox = style === 'egypt' ? '0 0 100 100' : '0 0 100 50';

  return (
    <svg viewBox={viewBox} className={`h-full w-full ${className}`} role="img" aria-label="خريطة">
      <defs>
        <radialGradient id={gradId} cx="50%" cy="35%" r="80%">
          <stop offset="0%" stopColor="var(--surface-elevated)" />
          <stop offset="100%" stopColor="var(--surface-sunken)" />
        </radialGradient>
      </defs>

      <rect width="100" height={style === 'egypt' ? 100 : 50} rx="3" fill={`url(#${gradId})`} stroke="var(--border-subtle)" strokeWidth="0.5" />

      {/* Graticule */}
      {showGraticule && (
        <g stroke="var(--grid-line)" strokeWidth="0.4" opacity="0.9">
          {GRATICULE.vertical.map((x) => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2={style === 'egypt' ? 100 : 50} />
          ))}
          {GRATICULE.horizontal.map((y) => (
            <line key={`h${y}`} x1="0" y1={y} x2="100" y2={y} />
          ))}
        </g>
      )}

      {/* Land */}
      <g fill="var(--map-line)" stroke="var(--border-soft)" strokeWidth="0.6">
        {(style === 'world' ? WORLD_PATH : EGYPT_PATH).map((d, i) => (
          <motion.path
            key={`land-${i}`}
            d={d}
            initial={reduced || !animated ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, delay: 0.15 + i * 0.06, ease: 'easeOut' }}
            fill="var(--map-line)"
          />
        ))}
      </g>

      {/* Routes */}
      {routes.map((route, ri) => {
        const path = route.points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
        return (
          <motion.path
            key={route.id}
            d={path}
            fill="none"
            stroke={gold}
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeDasharray="1.6 2.2"
            initial={reduced || !animated ? undefined : { pathLength: 0 }}
            whileInView={reduced || !animated ? undefined : { pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.8, delay: 0.2 + ri * 0.3, ease: 'easeInOut' }}
            opacity="0.85"
          />
        );
      })}

      {/* Markers */}
      {markers.map((marker) => (
        <motion.g
          key={marker.id}
          initial={reduced || !animated ? undefined : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 + marker.x * 0.01, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: `${marker.x}px ${marker.y}px` }}
        >
          {marker.state !== 'locked' && (
            <motion.circle
              cx={marker.x}
              cy={marker.y}
              r={marker.state === 'current' ? 3.4 : 2.4}
              fill="none"
              stroke={gold}
              strokeWidth="0.6"
              animate={reduced ? undefined : { opacity: [0.7, 0, 0.7], scale: [1, 2.6, 1] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
          <circle
            cx={marker.x}
            cy={marker.y}
            r={marker.state === 'current' ? 2.4 : 1.8}
            fill={marker.state === 'locked' ? 'var(--text-muted)' : gold}
            stroke="var(--surface)"
            strokeWidth="0.7"
          />
          {marker.label && (
            <text
              x={marker.x}
              y={marker.y - 5}
              textAnchor="middle"
              fontSize="2.6"
              fontWeight={marker.state === 'current' ? 700 : 500}
              fill={marker.state === 'current' ? 'var(--gold-accent)' : 'var(--text-muted)'}
            >
              {marker.label}
            </text>
          )}
        </motion.g>
      ))}
    </svg>
  );
}

export default HistoricalMap;
