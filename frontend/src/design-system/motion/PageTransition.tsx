import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Compass } from '../components/Compass';
import { durations } from './tokens';

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Signature page transition:
 * 1. Current page fades slightly
 * 2. Compass appears, needle rotates toward the new destination
 * 3. A geographic route draws
 * 4. New page reveals
 */
export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [renderedPath, setRenderedPath] = useState(location.pathname);
  const [phase, setPhase] = useState<'idle' | 'exit'>('idle');

  useEffect(() => {
    setPhase('exit');
    const t = setTimeout(() => {
      setRenderedPath(location.pathname);
      setPhase('idle');
    }, 620);
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
          exit={{ opacity: 0, y: -10 }}
          transition={{
            duration: phase === 'exit' ? 0.28 : durations.slow,
            ease: phase === 'exit' ? [0.7, 0, 0.84, 0] : [0.16, 1, 0.3, 1],
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Compass transition overlay */}
      <AnimatePresence>
        {phase === 'exit' && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <motion.div
              className="absolute inset-0"
              style={{ background: 'var(--background)', opacity: 0.55 }}
            />
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              <Compass size="navigation" direction="ne" navigate route />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PageTransition;
