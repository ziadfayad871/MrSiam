import { animate, motion, useReducedMotion, useInView } from 'motion/react';
import { Crown, Medal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface HallEntry {
  rank: number;
  name: string;
  grade?: string;
  score: number;
  percentage: number;
  achievement?: string;
  year?: string;
}

export interface HallOfFameProps {
  entries: HallEntry[];
  className?: string;
}

/**
 * The Hall of Top Students — "مع أبو كيان.. أوائل في كل مكان".
 * A prestigious hall feel: soft light sweeps across, plaques appear sequentially
 * (3rd, 2nd, then 1st last with a golden spotlight), animated score counters,
 * and subtle 3D tilt on hover.
 */
export function HallOfFame({ entries, className = '' }: HallOfFameProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const top = [...entries].filter((e) => e.rank <= 3).sort((a, b) => a.rank - b.rank);
  const ordered = [top.find((e) => e.rank === 3), top.find((e) => e.rank === 2), top.find((e) => e.rank === 1)].filter(Boolean) as HallEntry[];
  if (ordered.length === 0) return null;

  return (
    <div ref={ref} className={`relative overflow-hidden rounded-2xl ${className}`}>
      {/* Hall backdrop */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, var(--navy-950) 0%, var(--navy-900) 55%, var(--navy-950) 100%)' }}
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.9 }}
      />

      {/* Golden ambient glow */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(60% 45% at 50% 0%, var(--gold-glow), transparent 70%)' }}
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: [0.2, 0.5, 0.2] } : {}}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Soft light sweep */}
      <motion.div
        className="pointer-events-none absolute inset-y-0 w-1/3"
        style={{
          background: 'linear-gradient(100deg, transparent, rgba(255, 214, 122, 0.14), transparent)',
          transform: 'skewX(-18deg)',
        }}
        initial={{ x: '-120%' }}
        animate={inView && !reduced ? { x: ['-120%', '420%'] } : {}}
        transition={{ duration: 2.6, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Hall pillars */}
      <div className="pointer-events-none absolute inset-y-0 start-0 w-6 sm:w-10" style={{ background: 'linear-gradient(90deg, rgba(255,214,122,0.08), transparent)' }} />
      <div className="pointer-events-none absolute inset-y-0 end-0 w-6 sm:w-10" style={{ background: 'linear-gradient(-90deg, rgba(255,214,122,0.08), transparent)' }} />

      <div className="relative z-10 px-6 py-14 sm:px-12">
        {/* Header */}
        <motion.div
          className="mb-12 text-center"
          initial={reduced ? undefined : { opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <div className="mb-3 flex items-center justify-center gap-2 text-gold-bright">
            <Crown size={18} strokeWidth={1.6} />
            <span className="font-plex text-[10px] uppercase tracking-[0.42em] text-white/50" dir="ltr">
              Hall of Top Students
            </span>
            <Crown size={18} strokeWidth={1.6} />
          </div>
          <h2 className="display-serif text-3xl font-bold text-white sm:text-4xl">
            مع أبو كيان.. <span className="text-gold-bright">أوائل في كل مكان</span>
          </h2>
          <p className="mt-2 text-sm text-white/50">قاعة الشرف — حيث يتحول الاجتهاد إلى ميداليات</p>
        </motion.div>

        {/* Plaques: 3rd, 2nd, 1st last */}
        <div className="mx-auto grid max-w-4xl items-end gap-4 sm:grid-cols-3 sm:gap-6">
          {ordered.map((entry, i) => (
            <Plaque key={entry.rank} entry={entry} index={i} inView={inView} isFirst={entry.rank === 1} reduced={!!reduced} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Plaque({
  entry,
  index,
  inView,
  isFirst,
  reduced,
}: {
  entry: HallEntry;
  index: number;
  inView: boolean;
  isFirst: boolean;
  reduced: boolean;
}) {
  const [display, setDisplay] = useState(0);
  const scoreRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!inView || reduced) {
      setDisplay(entry.percentage);
      return;
    }
    const controls = animate(0, entry.percentage, {
      duration: 1.6,
      delay: 0.9 + index * 0.35,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, entry.percentage, index, reduced]);

  const tilt = useRef<HTMLDivElement>(null);
  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduced || !tilt.current) return;
    const rect = tilt.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    tilt.current.style.transform = `perspective(800px) rotateY(${px * 7}deg) rotateX(${-py * 7}deg) translateY(-6px)`;
  }
  function onLeave() {
    if (tilt.current) tilt.current.style.transform = '';
  }

  const rankStyle =
    entry.rank === 1
      ? { ring: 'border-gold/70', glow: '0 0 46px var(--gold-glow), inset 0 0 30px var(--gold-glow)', chip: 'bg-gold text-navy-deep' }
      : entry.rank === 2
        ? { ring: 'border-[#9aa5b5]/50', glow: '0 0 24px rgba(154,165,181,0.25)', chip: 'bg-[#9aa5b5] text-navy-deep' }
        : { ring: 'border-[#cd8a4b]/50', glow: '0 0 22px rgba(205,138,75,0.3)', chip: 'bg-[#cd8a4b] text-navy-deep' };

  return (
    <motion.div
      initial={reduced ? undefined : { opacity: 0, y: 60, scale: 0.94 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.7, delay: 0.5 + index * 0.32, ease: [0.16, 1, 0.3, 1] }}
      className={isFirst ? 'sm:-mt-6' : 'sm:mt-6'}
    >
      {/* Golden spotlight on first */}
      {isFirst && inView && (
        <motion.div
          className="pointer-events-none absolute inset-x-0 -top-10 mx-auto h-24 w-40 rounded-full"
          style={{ background: 'radial-gradient(ellipse, var(--gold-glow), transparent 70%)' }}
          initial={{ opacity: 0 }}
          animate={reduced ? {} : { opacity: [0.25, 0.8, 0.25] }}
          transition={{ delay: 1.5, duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <motion.div
        ref={tilt}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className={`group relative flex h-full flex-col items-center gap-3 rounded-xl border p-6 text-center backdrop-blur-sm transition-shadow duration-300 ${
          isFirst ? 'bg-white/[0.07]' : 'bg-white/[0.04]'
        } ${rankStyle.ring}`}
        style={{ boxShadow: isFirst ? '0 18px 50px rgba(0,0,0,0.45)' : '0 12px 36px rgba(0,0,0,0.3)', transformStyle: 'preserve-3d' }}
        whileHover={reduced ? undefined : { y: -4 }}
      >
        {/* Rank medallion */}
        <motion.div
          className={`flex h-16 w-16 items-center justify-center rounded-full border-2 ${rankStyle.ring} ${rankStyle.chip} shadow-lg`}
          initial={reduced ? undefined : { rotate: -40, scale: 0.4, opacity: 0 }}
          animate={inView ? { rotate: 0, scale: 1, opacity: 1 } : {}}
          transition={{ type: 'spring', stiffness: 190, damping: 13, delay: 0.75 + index * 0.32 }}
        >
          {isFirst ? <Crown size={26} strokeWidth={1.6} /> : <Medal size={24} strokeWidth={1.6} />}
        </motion.div>

        <div className="flex-1">
          <p className="font-plex text-[9px] uppercase tracking-[0.3em] text-gold-bright" dir="ltr">
            Rank {entry.rank}
          </p>
          <h3 className="mt-1 text-lg font-bold text-white">{entry.name}</h3>
          {entry.grade && <p className="text-[11px] text-white/50">{entry.grade}</p>}
          {entry.achievement && (
            <p className="mt-2 inline-block rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-[10px] font-semibold text-gold-bright">
              ✦ {entry.achievement}
            </p>
          )}
        </div>

        <div>
          <p className="font-historical text-4xl font-bold text-gold-bright" dir="ltr">
            {display}
            <span className="text-xl">%</span>
          </p>
          <p className="mt-0.5 text-[10px] text-white/40">
            {entry.score} درجة {entry.year ? `· ${entry.year}` : ''}
          </p>
        </div>

        {/* bottom shine */}
        <div className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-gradient-to-l from-transparent via-gold/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </motion.div>
    </motion.div>
  );
}

export default HallOfFame;
