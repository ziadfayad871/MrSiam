import { motion } from 'motion/react';
import { Medal } from 'lucide-react';
import { usePrefersReducedMotion } from '../motion/hooks';

export interface PodiumEntry {
  rank: number;
  name: string;
  score: number;
  stage: string;
  year?: string;
  examCount?: number;
}

export interface PodiumProps {
  entries: PodiumEntry[];
  className?: string;
}

const MEDAL_STYLES: Record<number, { ring: string; text: string; height: string; glow: string }> = {
  1: { ring: 'border-gold bg-gold/12', text: 'text-gold', height: 'h-36', glow: '--gold-glow' },
  2: { ring: 'border-[#9aa5b5] bg-[#9aa5b5]/10', text: 'text-[#8f9aab]', height: 'h-28', glow: '--navy-glow' },
  3: { ring: 'border-[#a9744f] bg-[#a9744f]/10', text: 'text-[#a9744f]', height: 'h-24', glow: '--gold-glow' },
};

/** Top students podium — historical medals / academic honors */
export function Podium({ entries, className = '' }: PodiumProps) {
  const reduced = usePrefersReducedMotion();
  const top = entries.filter((e) => e.rank <= 3);
  const ordered = [top.find((e) => e.rank === 2), top.find((e) => e.rank === 1), top.find((e) => e.rank === 3)].filter(
    Boolean,
  ) as PodiumEntry[];

  if (ordered.length === 0) return null;

  return (
    <div className={`flex items-end justify-center gap-3 ${className}`}>
      {ordered.map((entry, i) => {
        const style = MEDAL_STYLES[entry.rank];
        const isFirst = entry.rank === 1;
        return (
          <motion.div
            key={entry.rank}
            className="flex flex-1 flex-col items-center"
            initial={reduced ? false : { opacity: 0, y: 40 }}
            whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 + i * 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Medal */}
            <motion.div
              className={`mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 ${style.ring} ${isFirst ? 'scale-110' : ''}`}
              initial={reduced ? false : { rotate: -40, scale: 0.5, opacity: 0 }}
              whileInView={reduced ? undefined : { rotate: 0, scale: isFirst ? 1.1 : 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 190, damping: 13, delay: 0.3 + i * 0.18 }}
            >
              <Medal size={22} className={style.text} strokeWidth={1.7} />
            </motion.div>

            <div className="mb-2 text-center">
              <p className="text-sm font-bold text-text-primary">{entry.name}</p>
              <p className="text-[11px] text-text-muted">{entry.stage}</p>
              <p className="font-historical mt-0.5 text-base font-bold" style={{ color: style.text.startsWith('text-gold') ? 'var(--gold-accent)' : undefined }}>
                {entry.score}%
              </p>
            </div>

            {/* Podium block */}
            <div
              className={`relative w-full rounded-t-lg border border-b-0 ${style.height} ${style.ring}`}
              style={{ boxShadow: `inset 0 0 40px var(${style.glow})` }}
            >
              <span
                className={`absolute -top-7 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border-2 ${style.ring} bg-surface text-sm font-extrabold ${style.text}`}
              >
                {entry.rank}
              </span>
              {isFirst && (
                <span className="absolute -top-1 left-1/2 h-1 w-16 -translate-x-1/2 rounded-full bg-gold/60" />
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default Podium;
