import { motion } from 'motion/react';
import { usePrefersReducedMotion } from '../motion/hooks';

export interface BrandLogoProps {
  /** hero = large centered mark (image/crown + القيصر + tagline) */
  variant?: 'hero' | 'lockup';
  /** lockup size for header/footer */
  size?: 'sm' | 'md';
  /** on dark backgrounds (hero) */
  onDark?: boolean;
  /** optional image mark (e.g. the teacher's own logo) — replaces the crown/compass */
  imageSrc?: string;
  className?: string;
}

/**
 * Brand signature of "القيصر" — the compass crown mark of Mr. Mohamed Siam.
 * hero: image/crown over an Arabic gold wordmark; lockup: mark + wordmark row.
 */
export function BrandLogo({ variant = 'lockup', size = 'sm', onDark = false, imageSrc = '/caesar-logo.webp', className = '' }: BrandLogoProps) {
  const reduced = usePrefersReducedMotion();

  if (variant === 'hero') {
    return (
      <motion.div
        className={`flex flex-col items-center gap-3 ${className}`}
        initial={reduced ? undefined : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="relative">
          <motion.div
            className="absolute -inset-6 rounded-full"
            style={{ background: 'radial-gradient(circle, var(--gold-glow), transparent 70%)' }}
            animate={reduced ? undefined : { opacity: [0.35, 0.8, 0.35] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-gold/60 bg-black shadow-[0_0_30px_var(--gold-glow)]" initial={reduced ? undefined : { scale: 0.7, rotate: -20, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 170, damping: 15, delay: 0.15 }}>
            <img src={imageSrc} alt="شعار القيصر" className="h-full w-full object-contain" draggable={false} />
          </motion.div>
        </div>

        <p className="display-serif bg-gradient-to-b from-gold-bright via-gold to-gold/60 bg-clip-text text-5xl font-bold leading-tight text-transparent drop-shadow-[0_2px_12px_var(--gold-glow)] sm:text-6xl">
          القيصر
        </p>
        <p className="font-plex text-[11px] font-semibold uppercase tracking-[0.5em] text-white/50" dir="ltr">
          Al-Qaesar
        </p>
        <p className="mt-1 text-sm text-white/60">بوصلة المعرفة</p>
      </motion.div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img src={imageSrc} alt="شعار القيصر" className={`shrink-0 rounded-full border border-gold/40 bg-black object-contain ${size === 'md' ? 'h-11 w-11' : 'h-9 w-9'}`} draggable={false} />
      <div className="leading-tight">
        <p className={`display-serif text-lg font-bold ${onDark ? 'text-white' : 'text-text-primary'}`}>
          القيصر
        </p>
        <p
          className={`font-plex text-[9px] uppercase tracking-[0.3em] ${onDark ? 'text-white/50' : 'text-text-muted'}`}
          dir="ltr"
        >
          Al-Qaesar
        </p>
      </div>
    </div>
  );
}

export default BrandLogo;
