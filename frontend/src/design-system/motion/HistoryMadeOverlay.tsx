import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';

export interface HistoryMadeOverlayProps {
  open: boolean;
  studentName: string;
  examTitle?: string;
  score?: number;
  percentage?: number;
  achievement?: string;
  onComplete: () => void;
}

/**
 * "التاريخ يتكتب" — full-screen achievement moment.
 * Sequence (non-skippable, minimal duration):
 *  1. dark historical backdrop + stars
 *  2. parchment rises, coordinate lines draw
 *  3. ink inscription draws itself
 *  4. banner unfolds + gold seal stamps (squash & settle)
 *  5. name + tagline "مع أبو كيان .. أوائل في كل مكان"
 *  Auto-completes; reduced-motion users get a fast, simplified version.
 */
export function HistoryMadeOverlay({
  open,
  studentName,
  examTitle,
  score,
  percentage,
  achievement,
  onComplete,
}: HistoryMadeOverlayProps) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<'idle' | 'ink' | 'banner' | 'seal' | 'reveal'>('idle');

  useEffect(() => {
    if (!open) return;
    setPhase('idle');
    if (reduced) {
      const t = setTimeout(() => onComplete(), 900);
      return () => clearTimeout(t);
    }
    const times: Array<[number, typeof phase]> = [
      [120, 'ink'],
      [900, 'banner'],
      [1450, 'seal'],
      [2050, 'reveal'],
    ];
    const timers = times.map(([ms, ph]) => setTimeout(() => setPhase(ph), ms));
    const end = setTimeout(onComplete, 3100);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(end);
    };
  }, [open, reduced, onComplete]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.45 } }}
        >
          {/* Dark historical backdrop */}
          <motion.div
            className="absolute inset-0 bg-navy-deep"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
          {/* Stars */}
          <div
            className="absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                'radial-gradient(1.5px 1.5px at 12% 18%, var(--gold-bright-accent), transparent), radial-gradient(1px 1px at 34% 8%, var(--gold-accent), transparent), radial-gradient(1.5px 1.5px at 58% 24%, var(--gold-bright-accent), transparent), radial-gradient(1px 1px at 76% 12%, var(--gold-accent), transparent), radial-gradient(2px 2px at 90% 32%, var(--gold-bright-accent), transparent), radial-gradient(1px 1px at 22% 74%, var(--gold-accent), transparent), radial-gradient(1.5px 1.5px at 48% 88%, var(--gold-bright-accent), transparent), radial-gradient(1px 1px at 82% 70%, var(--gold-accent), transparent), radial-gradient(1px 1px at 64% 92%, var(--gold-accent), transparent), radial-gradient(1.5px 1.5px at 8% 46%, var(--gold-accent), transparent)',
              backgroundSize: '200px 200px',
            }}
          />
          {/* Sand horizon */}
          <motion.div
            className="absolute inset-x-0 bottom-0 h-1/3"
            style={{
              background:
                'linear-gradient(to top, rgba(201,162,39,0.16), transparent)',
              clipPath: 'polygon(0 62%, 12% 52%, 26% 58%, 42% 46%, 58% 55%, 74% 44%, 88% 54%, 100% 46%, 100% 100%, 0 100%)',
            }}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.25 }}
          />

          {/* Parchment scroll */}
          <motion.div
            className="relative z-10 w-[88vw] max-w-md"
            initial={reduced ? { opacity: 0 } : { y: 70, rotateX: 18, opacity: 0 }}
            animate={{ y: 0, rotateX: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 180, damping: 20, delay: reduced ? 0.1 : 0.35 }}
            style={{ perspective: 900 }}
          >
            <div className="relative overflow-hidden rounded-lg border-2 border-gold/50 bg-[var(--parchment-soft)] p-8 shadow-[0_0_60px_rgba(201,162,39,0.35)] sm:p-10">
              {/* Coordinate lines drawing */}
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                aria-hidden
              >
                <motion.g
                  stroke="var(--map-line)"
                  strokeWidth="1"
                  initial="hidden"
                  animate={phase !== 'idle' && phase !== 'ink' ? 'visible' : 'hidden'}
                  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
                >
                  <motion.line
                    x1="0" y1="0" x2="120" y2="0"
                    variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1 } }}
                    transition={{ duration: 0.7 }}
                  />
                  <motion.line
                    x1="0" y1="0" x2="0" y2="120"
                    variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1 } }}
                    transition={{ duration: 0.7 }}
                  />
                  <motion.line
                    x1="0" y1="100%" x2="140" y2="100%"
                    variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1 } }}
                    transition={{ duration: 0.7 }}
                  />
                  <motion.line
                    x1="100%" y1="0" x2="100%" y2="130"
                    variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1 } }}
                    transition={{ duration: 0.7 }}
                  />
                </motion.g>
              </svg>

              {/* Ink flourish drawing */}
              <svg
                viewBox="0 0 120 60"
                className="absolute inset-x-0 top-4 mx-auto h-12 w-32 text-[var(--navy-900)]"
                fill="none"
                aria-hidden
              >
                <motion.path
                  d="M8 34 C 22 12, 40 8, 52 22 S 74 44, 88 28 S 106 14, 112 30"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={phase === 'ink' || phase === 'banner' || phase === 'seal' || phase === 'reveal' ? { pathLength: 1 } : { pathLength: 0 }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  style={{ opacity: 0.7 }}
                />
                <motion.circle
                  cx="112" cy="30" r="3.5"
                  fill="currentColor"
                  initial={{ scale: 0 }}
                  animate={phase === 'banner' || phase === 'seal' || phase === 'reveal' ? { scale: 1 } : { scale: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.3 }}
                  style={{ opacity: 0.7 }}
                />
              </svg>

              <div className="relative pt-8 text-center">
                {/* Inscription */}
                <motion.p
                  className="font-historical text-3xl font-bold leading-relaxed text-[var(--navy-900)] sm:text-4xl"
                  initial={{ opacity: 0, y: 16 }}
                  animate={phase === 'banner' || phase === 'seal' || phase === 'reveal' ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.55 }}
                >
                  {achievement ?? 'إنجاز جديد'}
                </motion.p>

                {/* Banner */}
                <motion.div
                  className="relative mx-auto mt-5 max-w-[280px] overflow-hidden rounded-sm bg-[var(--navy-900)] py-3"
                  initial={reduced ? { opacity: 0 } : { scaleY: 0 }}
                  animate={phase === 'seal' || phase === 'reveal' ? { scaleY: 1, opacity: 1 } : {}}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  style={{ transformOrigin: 'top' }}
                >
                  <p className="text-sm font-bold text-[var(--gold-bright-accent)]" dir="rtl">
                    مع أبو كيان .. أوائل في كل مكان
                  </p>
                </motion.div>

                {/* Seal stamp */}
                <motion.div
                  className="relative mx-auto mt-6 h-20 w-20"
                  initial={reduced ? { opacity: 0 } : { scale: 2.6, rotate: -22, opacity: 0 }}
                  animate={phase === 'seal' || phase === 'reveal' ? { scale: 1, rotate: 0, opacity: 1 } : {}}
                  transition={{ type: 'spring', stiffness: 380, damping: 11 }}
                >
                  <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-[0_4px_14px_rgba(201,162,39,0.45)]">
                    <circle cx="50" cy="50" r="47" fill="none" stroke="var(--gold-accent)" strokeWidth="4" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="var(--gold-accent)" strokeWidth="1.4" strokeDasharray="3 4" />
                    <circle cx="50" cy="50" r="30" fill="none" stroke="var(--gold-accent)" strokeWidth="1" opacity="0.7" />
                    <text
                      x="50" y="42" textAnchor="middle"
                      fill="var(--gold-accent)"
                      fontSize="11"
                      fontFamily="Amiri, serif"
                      fontWeight="bold"
                    >
                      أبو كيان
                    </text>
                    <text x="50" y="58" textAnchor="middle" fill="var(--gold-accent)" fontSize="8" fontFamily="IBM Plex Sans Arabic, sans-serif">
                      تعليم × حركة
                    </text>
                  </svg>
                </motion.div>

                {/* Student name + score */}
                <motion.div
                  className="mt-5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={phase === 'reveal' ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <p className="text-base font-bold text-[var(--navy-900)]">{studentName}</p>
                  {examTitle && (
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      {examTitle}
                      {typeof percentage === 'number' && <span className="text-[var(--gold-accent)] font-bold"> — {percentage}%</span>}
                    </p>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default HistoryMadeOverlay;
