import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

export interface EraEvent {
  year: string;
  title: string;
  description?: string;
}

export interface EraItem {
  id: string;
  title: string;
  range: string;
  description: string;
  /** small map/illustration glyph shown when the era reveals */
  glyph: string;
  events: EraEvent[];
  /** geographic marker label travelling with the era */
  coordinates: string;
}

export interface InteractiveTimelineProps {
  eras: EraItem[];
  className?: string;
}

/**
 * Interactive historical timeline — scroll drives everything:
 * the route line grows, a geographic marker travels along it,
 * years become prominent, events and map glyphs reveal, subtle parallax.
 * Educational first, decorative second.
 */
export function InteractiveTimeline({ eras, className = '' }: InteractiveTimelineProps) {
  const reduced = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.78', 'end 0.45'] });

  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const markerY = useTransform(scrollYProgress, [0, 1], ['0%', '98%']);
  const fade = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Route line */}
      <div className="absolute inset-y-0 start-4 w-[3px] overflow-hidden rounded-full bg-border-subtle sm:start-1/2">
        <motion.div
          className="h-full w-full origin-top rounded-full bg-gradient-to-b from-gold via-gold to-gold-bright"
          style={{ scaleY: lineScale, boxShadow: '0 0 14px var(--gold-glow)' }}
        />
        {/* Travelling geographic marker */}
        <motion.div className="absolute start-1/2 h-full w-0" style={{ top: markerY }}>
          <div className="absolute start-0 top-0 -translate-x-1/2 -translate-y-1/2">
            <span className="block h-3.5 w-3.5 rounded-full border-2 border-gold bg-background shadow-[0_0_10px_var(--gold-glow)]">
              <span className="absolute inset-[3px] rounded-full bg-gold" />
            </span>
          </div>
        </motion.div>
      </div>

      {/* Start marker */}
      <motion.div
        className="absolute start-4 top-0 -translate-x-1/2 sm:start-1/2"
        style={{ opacity: fade }}
      >
        <span className="font-plex text-[9px] tracking-[0.3em] text-gold" dir="ltr">
          ROUTE 3100 BC
        </span>
      </motion.div>

      <div className="flex flex-col gap-14 pt-10 sm:gap-20">
        {eras.map((era, i) => (
          <EraRow key={era.id} era={era} index={i} reduced={reduced} />
        ))}
      </div>
    </div>
  );
}

function EraRow({ era, index, reduced }: { era: EraItem; index: number; reduced: boolean }) {
  const side = index % 2 === 0 ? 'start' : 'end';

  return (
    <div className={`relative flex flex-col gap-4 ps-10 sm:ps-0 ${side === 'end' ? 'sm:flex-row-reverse' : 'sm:flex-row'}`}>
      {/* Node on the line */}
      <motion.div
        className="absolute start-4 top-2 z-10 -translate-x-1/2 sm:start-1/2"
        initial={reduced ? undefined : { scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: '-120px' }}
        transition={{ type: 'spring', stiffness: 260, damping: 15 }}
      >
        <span className="relative flex h-5 w-5 items-center justify-center rounded-full border-2 border-gold bg-background shadow-[0_0_12px_var(--gold-glow)]">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
        </span>
      </motion.div>

      <div className="sm:w-1/2 sm:ps-0" style={side === 'end' ? { marginInlineStart: 'auto' } : undefined}>
        <div className={side === 'start' ? 'sm:pe-12' : 'sm:ps-12'}>
          {/* Prominent year */}
          <motion.p
            className="display-serif bg-gradient-to-b from-gold-bright to-gold/50 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl"
            initial={reduced ? undefined : { scale: 0.86, opacity: 0.4 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, margin: '-140px' }}
            transition={{ type: 'spring', stiffness: 150, damping: 16 }}
            dir="rtl"
          >
            {era.title}
          </motion.p>
          <p className="font-plex mt-1 text-[10px] tracking-[0.3em] text-text-muted" dir="ltr">
            {era.range}
          </p>

          {/* Map glyph + description */}
          <div className="mt-5 flex items-start gap-4">
            <motion.div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-gold/30 bg-surface-sunken text-3xl"
              initial={reduced ? undefined : { scale: 0.7, opacity: 0, rotate: -12 }}
              whileInView={{ scale: 1, opacity: 1, rotate: 0 }}
              viewport={{ once: true, margin: '-120px' }}
              transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.15 }}
            >
              {era.glyph}
            </motion.div>
            <motion.div
              initial={reduced ? undefined : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-120px' }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <p className="text-sm leading-relaxed text-text-secondary">{era.description}</p>
              <p className="mt-2 font-plex text-[9px] tracking-[0.2em] text-gold opacity-70" dir="ltr">
                {era.coordinates}
              </p>
            </motion.div>
          </div>

          {/* Events reveal */}
          <div className="mt-5 flex flex-col gap-2.5">
            {era.events.map((ev, ei) => (
              <motion.div
                key={ev.year}
                className="rounded-md border border-border-soft bg-surface px-4 py-2.5"
                initial={reduced ? undefined : { opacity: 0, x: side === 'start' ? -26 : 26 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.55, delay: 0.25 + ei * 0.16, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-plex text-[11px] font-bold text-gold" dir="ltr">
                    {ev.year}
                  </span>
                  <span className="text-sm font-semibold text-text-primary">{ev.title}</span>
                </div>
                {ev.description && <p className="mt-1 text-xs leading-relaxed text-text-muted">{ev.description}</p>}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default InteractiveTimeline;
