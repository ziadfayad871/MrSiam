import { AnimatePresence, motion } from 'motion/react';
import {
  Award,
  Compass,
  Crown,
  Landmark,
  Map,
  Medal,
  Route,
  ScrollText,
  Sparkles,
  Star,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { usePrefersReducedMotion } from '../motion/hooks';

const ICONS: Record<string, LucideIcon> = {
  compass: Compass,
  scroll: ScrollText,
  map: Map,
  landmark: Landmark,
  award: Award,
  star: Star,
  trophy: Trophy,
  route: Route,
};

export interface AchievementBadgeProps {
  code?: string;
  icon?: string;
  title: string;
  description?: string;
  unlocked: boolean;
  unlockedAt?: string;
  className?: string;
  onRevealComplete?: () => void;
}

/** Achievement as a historical medal — unlock animates compass, route, badge, gold particles */
export function AchievementBadge({
  code,
  icon = 'award',
  title,
  description,
  unlocked,
  className = '',
  onRevealComplete,
}: AchievementBadgeProps) {
  const reduced = usePrefersReducedMotion();
  const [justUnlocked, setJustUnlocked] = useState(false);
  const Icon = ICONS[icon] ?? Medal;

  return (
    <div className={`relative ${className}`}>
      {/* Gold particles on unlock */}
      <AnimatePresence>
        {unlocked && justUnlocked && !reduced && (
          <>
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.span
                key={i}
                className="pointer-events-none absolute top-1/2 left-1/2 h-1.5 w-1.5 rounded-full bg-gold"
                initial={{ x: 0, y: 0, opacity: 1, scale: 0.5 }}
                animate={{
                  x: Math.cos((i / 8) * Math.PI * 2) * 44,
                  y: Math.sin((i / 8) * Math.PI * 2) * 44,
                  opacity: 0,
                  scale: 1,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.1, ease: 'easeOut', onComplete: i === 7 ? () => onRevealComplete?.() : undefined }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      <motion.div
        className="flex h-full flex-col items-center gap-3 rounded-xl border border-border-subtle bg-surface p-6 text-center shadow-sm transition-shadow duration-300 hover:shadow-md"
        initial={reduced ? false : { scale: 0.85, opacity: 0 }}
        whileInView={reduced ? undefined : { scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        onAnimationComplete={() => setJustUnlocked(unlocked)}
      >
        {/* Medal */}
        <div className="relative">
          {!reduced && (
            <motion.div
              className="absolute -inset-2 rounded-full"
              style={{ background: 'radial-gradient(circle, var(--gold-glow), transparent 70%)' }}
              animate={unlocked ? { opacity: [0.4, 0.9, 0.4] } : undefined}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          <motion.div
            className={`relative flex h-16 w-16 items-center justify-center rounded-full border-2 transition-colors duration-500 ${
              unlocked ? 'border-gold bg-gold/10' : 'border-border-soft bg-surface-sunken'
            }`}
            initial={reduced ? false : { rotate: -30, scale: 0.7 }}
            whileInView={reduced ? undefined : unlocked ? { rotate: 0, scale: 1 } : { rotate: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 200, damping: 14 }}
          >
            <Icon size={26} className={unlocked ? 'text-gold' : 'text-text-muted'} strokeWidth={1.6} />
            {/* compass tick on the medal rim */}
            <span className="absolute -top-1 h-2 w-[2px] rounded-full bg-gold" />
            <span className="absolute -bottom-1 h-2 w-[2px] rounded-full bg-gold opacity-60" />
            <span className="absolute -left-1 h-[2px] w-2 rounded-full bg-gold opacity-60" />
            <span className="absolute -right-1 h-[2px] w-2 rounded-full bg-gold opacity-60" />
          </motion.div>
        </div>

        <div>
          <h4 className={`text-sm font-bold ${unlocked ? 'text-gold' : 'text-text-muted'}`}>{title}</h4>
          {description && <p className="mt-1 text-xs leading-relaxed text-text-muted">{description}</p>}
        </div>

        <span
          className={`mt-auto inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
            unlocked ? 'bg-gold/15 text-gold' : 'bg-surface-sunken text-text-muted'
          }`}
        >
          {unlocked ? <Sparkles size={10} /> : <span className="h-1 w-1 rounded-full bg-text-muted" />}
          {unlocked ? 'اكتشاف جديد!' : 'لم يُكتشف بعد'}
        </span>

        {code === 'journey-started' && <Crown size={12} className="text-gold opacity-60" />}
      </motion.div>
    </div>
  );
}

export default AchievementBadge;
