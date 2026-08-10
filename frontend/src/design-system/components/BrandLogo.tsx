import { motion } from 'motion/react';
import { Crown } from 'lucide-react';
import { Compass } from './Compass';
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
export function BrandLogo({ variant = 'lockup', size = 'sm', onDark = false, imageSrc, className = '' }: BrandLogoProps) {
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
          {imageSrc ? (
            <motion.div
              className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-gold/60 bg-white/[0.04] shadow-[0_0_30px_var(--gold-glow)]"
              initial={reduced ? undefined : { scale: 0.7, rotate: -20, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 170, damping: 15, delay: 0.15 }}
            >
              <img
                src={imageSrc}
                alt="شعار مستر محمد صيام"
                className="h-full w-full object-contain p-1.5"
                draggable={false}
              />
              <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/10" />
            </motion.div>
          ) : (
            <motion.div
              className="relative flex h-20 w-20 items-center justify-center rounded-full border border-gold/50 bg-white/[0.04]"
              initial={reduced ? undefined : { scale: 0.7, rotate: -90, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 170, damping: 15, delay: 0.15 }}
            >
              <Crown size={34} className="text-gold-bright" strokeWidth={1.4} />
              <span className="absolute inset-0 rounded-full border border-gold/20" />
            </motion.div>
          )}
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
      {imageSrc ? (
        <img
          src={imageSrc}
          alt="شعار مستر محمد صيام"
          className={`shrink-0 rounded-full border border-gold/40 object-contain ${
            size === 'md' ? 'h-11 w-11 p-0.5' : 'h-9 w-9 p-0.5'
          }`}
          draggable={false}
        />
      ) : (
        <div className={size === 'md' ? 'scale-110' : ''}>
          <Compass size={compassSize(size)} animated route className={onDark ? '[--gold-accent:var(--gold-bright)]' : ''} />
        </div>
      )}
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

function compassSize(size: 'sm' | 'md'): 'navigation' | 'medium' {
  return size === 'md' ? 'medium' : 'navigation';
}

export default BrandLogo;
