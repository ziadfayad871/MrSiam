import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Compass } from '../components/Compass';

export type ParchmentMotif = 'default' | 'map' | 'exams' | 'achievements' | 'hall' | 'history' | 'geography';

export interface ParchmentTransitionProps {
  children: ReactNode;
  /** section motif — one visual language, tuned per section */
  motif?: ParchmentMotif;
}

const TOTAL_MS = 700;

/**
 * Historical parchment page transition (400–800ms):
 * 1. current page deepens (parchment tone)
 * 2. parchment texture appears + coordinate lines draw themselves
 * 3. compass needle moves toward the destination
 * 4. the parchment layer slides open, revealing the next page
 * 5. the parchment dissolves
 * Motifs: lessons=route · exams=compass+grid · achievements=golden seal ·
 * hall=golden light · history=timeline · geography=globe.
 */
export function ParchmentTransition({ children, motif = 'default' }: ParchmentTransitionProps) {
  const location = useLocation();
  const reduced = useReducedMotion();
  const [renderedPath, setRenderedPath] = useState(location.pathname);
  const [phase, setPhase] = useState<'idle' | 'exit'>('idle');

  useEffect(() => {
    setPhase('exit');
    const t = setTimeout(() => {
      setRenderedPath(location.pathname);
      setPhase('idle');
    }, TOTAL_MS);
    return () => clearTimeout(t);
  }, [location.pathname]);

  const key = `${renderedPath}-${phase}`;

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.995 }}
          transition={{ duration: reduced ? 0.2 : 0.24, ease: [0.7, 0, 0.84, 0] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'exit' && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-[90] overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.15 : 0.3 }}
          >
            {/* 1. parchment tone deepening */}
            <motion.div
              className="absolute inset-0"
              style={{ background: 'var(--parchment-soft)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.97 }}
              transition={{ duration: reduced ? 0.1 : 0.28 }}
            />

            {/* 2. parchment texture + coordinate lines drawing */}
            <div className="parchment-texture absolute inset-0 opacity-40" />

            <motion.div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(var(--map-line) 1px, transparent 1px), linear-gradient(90deg, var(--map-line) 1px, transparent 1px)',
                backgroundSize: '56px 56px',
                opacity: 0.5,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: reduced ? 0 : 0.15, duration: 0.4 }}
            >
              <svg className="h-full w-full opacity-70">
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.line
                    key={`h${i}`}
                    x1="0"
                    y1={20 + i * 48}
                    x2="100%"
                    y2={20 + i * 48}
                    stroke="var(--gold-accent)"
                    strokeWidth="0.8"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.5, ease: 'easeInOut' }}
                  />
                ))}
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.line
                    key={`v${i}`}
                    x1={30 + i * 60}
                    y1="0"
                    x2={30 + i * 60}
                    y2="100%"
                    stroke="var(--gold-accent)"
                    strokeWidth="0.8"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.5, ease: 'easeInOut' }}
                  />
                ))}
              </svg>
            </motion.div>

            {/* 3+4. motif mark in the middle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <MotifMark motif={motif} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MotifMark({ motif }: { motif: ParchmentMotif }) {
  const reduced = useReducedMotion();

  if (motif === 'map') {
    return (
      <motion.svg width="120" height="80" viewBox="0 0 100 60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <motion.path
          d="M 10 45 C 25 45, 20 15, 38 15 S 60 45, 80 45 S 92 12, 95 5"
          fill="none"
          stroke="var(--gold-accent)"
          strokeWidth="1.4"
          strokeDasharray="5 4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        />
        <circle cx="10" cy="45" r="3" fill="var(--gold-accent)" opacity="0.9" />
        <circle cx="95" cy="5" r="3" fill="var(--gold-accent)" opacity="0.9" />
      </motion.svg>
    );
  }

  if (motif === 'exams') {
    return <Compass size="navigation" direction="ne" navigate route />;
  }

  if (motif === 'achievements') {
    return (
      <motion.svg width="110" height="110" viewBox="0 0 100 100">
        <motion.g initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.3 }}>
          <circle cx="50" cy="50" r="42" fill="none" stroke="var(--gold-accent)" strokeWidth="3" strokeDasharray="4 3" />
          <motion.path
            d="M 50 22 L 58 42 L 79 42 L 62 55 L 68 76 L 50 63 L 32 76 L 38 55 L 21 42 L 42 42 Z"
            fill="var(--gold-accent)"
            initial={{ scale: 0, rotate: -60 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.45, type: 'spring', stiffness: 190, damping: 13 }}
          />
        </motion.g>
      </motion.svg>
    );
  }

  if (motif === 'hall') {
    return (
      <motion.div
        className="h-24 w-24 rounded-full"
        style={{ background: 'radial-gradient(circle, var(--gold-glow), transparent 70%)' }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0.4, 1, 0.4], scale: 1 }}
        transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
      />
    );
  }

  if (motif === 'history') {
    return (
      <motion.svg width="90" height="120" viewBox="0 0 40 120">
        <motion.line
          x1="20"
          y1="6"
          x2="20"
          y2="114"
          stroke="var(--gold-accent)"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        />
        {[12, 36, 60, 84, 108].map((y, i) => (
          <motion.circle
            key={y}
            cx="20"
            cy={y}
            r={i === 2 ? 5 : 3.5}
            fill="var(--parchment-soft)"
            stroke="var(--gold-accent)"
            strokeWidth="1.6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.35 + i * 0.09, type: 'spring', stiffness: 240, damping: 14 }}
          />
        ))}
      </motion.svg>
    );
  }

  if (motif === 'geography') {
    return (
      <motion.svg width="110" height="110" viewBox="0 0 100 100">
        <motion.g
          animate={reduced ? undefined : { rotate: 360 }}
          transition={{ duration: 9, ease: 'linear', repeat: Infinity }}
          style={{ transformOrigin: '50px 50px' }}
        >
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--gold-accent)" strokeWidth="1.2" />
          <ellipse cx="50" cy="50" rx="40" ry="14" fill="none" stroke="var(--gold-accent)" strokeWidth="0.9" opacity="0.7" />
          <ellipse cx="50" cy="50" rx="14" ry="40" fill="none" stroke="var(--gold-accent)" strokeWidth="0.9" opacity="0.7" />
          <line x1="10" y1="50" x2="90" y2="50" stroke="var(--gold-accent)" strokeWidth="0.9" opacity="0.7" />
        </motion.g>
        <circle cx="62" cy="38" r="4" fill="var(--gold-accent)" />
      </motion.svg>
    );
  }

  return <Compass size="navigation" direction="ne" navigate route />;
}

export default ParchmentTransition;
