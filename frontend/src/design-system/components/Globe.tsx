import { motion, useReducedMotion } from 'motion/react';
import { useRef, useState } from 'react';
import { Compass } from './Compass';

export interface GlobeMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  note?: string;
  /** screen position on the globe (0..1 of diameter), front hemisphere */
  x: number;
  y: number;
}

export interface GlobeProps {
  markers: GlobeMarker[];
  className?: string;
  title?: string;
}

/**
 * Pseudo-3D educational globe — "اكتشف العالم مع أبو كيان".
 * Slow idle rotation, latitude/longitude graticule, markers with pulse rings,
 * touch/swipe to rotate, click a marker to open its coordinates card.
 * SVG + CSS only — light on low/mid-range devices.
 */
export function Globe({ markers, className = '', title }: GlobeProps) {
  const reduced = useReducedMotion();
  const [selected, setSelected] = useState<GlobeMarker | null>(null);
  const [drag, setDrag] = useState(0);
  const dragRef = useRef<{ active: boolean; x: number }>({ active: false, x: 0 });
  const idle = reduced ? 0 : 360;

  function onPointerDown(e: React.PointerEvent) {
    dragRef.current = { active: true, x: e.clientX };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current.active) return;
    const delta = e.clientX - dragRef.current.x;
    dragRef.current.x = e.clientX;
    setDrag((d) => d + delta * 0.4);
  }
  function onPointerUp() {
    dragRef.current.active = false;
  }

  const rotation = drag + (selected ? selected.longitude / 3 : 0);

  return (
    <div
      className={`relative select-none ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      style={{ touchAction: 'pan-y' }}
      role="img"
      aria-label={title ?? 'الكرة الأرضية التفاعلية'}
    >
      {/* Globe */}
      <div className="relative mx-auto aspect-square w-full max-w-[420px]">
        {/* Atmosphere glow */}
        <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, var(--gold-glow), transparent 72%)', opacity: 0.4 }} />

        <svg viewBox="0 0 200 200" className="relative h-full w-full drop-shadow-2xl">
          <defs>
            <radialGradient id="globe-ocean" cx="38%" cy="32%" r="80%">
              <stop offset="0%" stopColor="var(--surface-elevated)" />
              <stop offset="55%" stopColor="var(--surface)" />
              <stop offset="100%" stopColor="var(--surface-sunken)" />
            </radialGradient>
            <clipPath id="globe-clip">
              <circle cx="100" cy="100" r="88" />
            </clipPath>
            <filter id="globe-soft">
              <feGaussianBlur stdDeviation="1" />
            </filter>
          </defs>

          {/* Ocean */}
          <circle cx="100" cy="100" r="88" fill="url(#globe-ocean)" stroke="var(--border-soft)" strokeWidth="1.4" />

          <g clipPath="url(#globe-clip)">
            {/* Rotating graticule + continents */}
            <motion.g
              animate={{ rotate: idle + rotation }}
              transition={{ duration: reduced ? 0 : 60, ease: 'linear', repeat: Infinity }}
              style={{ transformOrigin: '100px 100px' }}
            >
              {/* Continents — stylized front hemisphere */}
              <g fill="var(--surface)" stroke="var(--map-line)" strokeWidth="0.8" opacity="0.85">
                <path d="M 58 66 q 10 -6 20 -2 q 8 4 6 14 q -2 10 -12 12 q -10 2 -14 -6 q -4 -8 0 -18 Z" />
                <path d="M 92 58 q 12 -8 24 -2 q 10 5 8 16 q -2 12 -14 14 q -12 2 -18 -8 q -4 -10 0 -20 Z" />
                <path d="M 48 112 q 12 -4 22 2 q 8 6 4 16 q -4 10 -16 10 q -10 0 -14 -10 q -2 -10 4 -18 Z" />
                <path d="M 108 118 q 14 -6 26 0 q 10 6 6 18 q -4 12 -18 12 q -12 0 -16 -12 q -2 -10 2 -18 Z" />
                <path d="M 66 132 q 10 -6 18 -2 q 8 4 6 12 q -2 8 -12 10 q -10 2 -14 -6 q -2 -8 2 -14 Z" />
              </g>

              {/* Longitude meridians */}
              {[0, 30, 60, 90, 120, 150, 180].map((lon) => (
                <ellipse
                  key={`m${lon}`}
                  cx="100"
                  cy="100"
                  rx={88 * Math.abs(Math.cos((lon * Math.PI) / 180))}
                  ry="88"
                  fill="none"
                  stroke="var(--map-line)"
                  strokeWidth="0.5"
                  opacity="0.55"
                />
              ))}
              {/* Latitude parallels */}
              {[-60, -30, 0, 30, 60].map((lat) => (
                <ellipse
                  key={`p${lat}`}
                  cx="100"
                  cy="100"
                  rx="88"
                  ry={88 * Math.abs(Math.cos((lat * Math.PI) / 180))}
                  fill="none"
                  stroke="var(--map-line)"
                  strokeWidth="0.5"
                  opacity="0.55"
                />
              ))}
            </motion.g>
          </g>

          {/* Equator highlight */}
          <ellipse cx="100" cy="100" rx="88" ry="14" fill="none" stroke="var(--gold-accent)" strokeWidth="0.7" opacity="0.45" strokeDasharray="3 3" />
        </svg>

        {/* Markers */}
        {markers.map((m, i) => {
          const left = m.x * 100;
          const top = m.y * 100;
          const isSelected = selected?.id === m.id;
          return (
            <button
              key={m.id}
              className="group absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${left}%`, top: `${top}%` }}
              onClick={() => setSelected(isSelected ? null : m)}
              aria-label={m.name}
            >
              <span className="relative flex h-3.5 w-3.5 items-center justify-center">
                <motion.span
                  className="absolute inset-0 rounded-full bg-gold/40"
                  animate={reduced ? undefined : { scale: [1, 2.6], opacity: [0.7, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.4 }}
                />
                <span
                  className={`relative block h-2.5 w-2.5 rounded-full border transition-all duration-300 ${
                    isSelected ? 'border-gold bg-gold' : 'border-gold/70 bg-gold/30 group-hover:bg-gold'
                  }`}
                  style={{ boxShadow: isSelected ? '0 0 12px var(--gold-glow)' : undefined }}
                />
              </span>
              <span className="absolute start-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap font-plex text-[9px] tracking-[0.14em] text-text-muted opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {m.name}
              </span>
            </button>
          );
        })}

        {/* Compass */}
        <div className="absolute -bottom-3 start-2">
          <Compass size="medium" animated />
        </div>
      </div>

      {/* Coordinates / info card */}
      <div className="mt-8 min-h-[96px]">
        {selected ? (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="mx-auto max-w-sm rounded-lg border border-gold/35 bg-parchment-soft p-5 text-center shadow-floating"
          >
            <p className="font-plex text-[9px] uppercase tracking-[0.35em] text-gold" dir="ltr">
              {selected.latitude.toFixed(1)}°N / {selected.longitude.toFixed(1)}°E
            </p>
            <h3 className="display-serif mt-2 text-xl font-bold text-text-primary">{selected.name}</h3>
            {selected.note && <p className="mt-2 text-sm leading-relaxed text-text-secondary">{selected.note}</p>}
            <button
              onClick={() => setSelected(null)}
              className="mt-3 text-xs font-semibold text-gold hover:underline"
            >
              إغلاق المحطة
            </button>
          </motion.div>
        ) : (
          <p className="text-center text-xs text-text-muted">
            🖱️ دوس على أي محطة — 🖐️ أو اسحب بإصبعك عشان تدوّر الكرة
          </p>
        )}
      </div>
    </div>
  );
}

export default Globe;
