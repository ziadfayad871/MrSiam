import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight, Crown, Medal } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { resolveFileUrl } from '../../lib/api';
import type { TopStudentDto } from '../../lib/types';

export interface HallOfFameProps {
  entries: TopStudentDto[];
  loading?: boolean;
  className?: string;
}

/**
 * Top Students Photo Album — "مع أبو كيان.. أوائل في كل مكان".
 * Real photos added by the teacher, navigated with next/prev arrows and dots.
 */
export function HallOfFame({ entries, loading = false, className = '' }: HallOfFameProps) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (index >= entries.length && entries.length > 0) setIndex(entries.length - 1);
  }, [entries.length, index]);

  const go = useCallback(
    (dir: number) => {
      if (entries.length === 0) return;
      setDirection(dir);
      setIndex((prev) => (prev + dir + entries.length) % entries.length);
    },
    [entries.length],
  );

  if (!loading && entries.length === 0) return null;

  const entry = entries[index];
  const photoUrl = entry ? resolveFileUrl(entry.photoUrl) : undefined;

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      {/* Hall backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, var(--navy-950) 0%, var(--navy-900) 55%, var(--navy-950) 100%)' }}
      />

      {/* Golden ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 animate-pulse"
        style={{ background: 'radial-gradient(60% 45% at 50% 0%, var(--gold-glow), transparent 70%)', animationDuration: '5s' }}
      />

      {/* Hall pillars */}
      <div className="pointer-events-none absolute inset-y-0 start-0 w-6 sm:w-10" style={{ background: 'linear-gradient(90deg, rgba(255,214,122,0.08), transparent)' }} />
      <div className="pointer-events-none absolute inset-y-0 end-0 w-6 sm:w-10" style={{ background: 'linear-gradient(-90deg, rgba(255,214,122,0.08), transparent)' }} />

      <div className="relative z-10 px-6 py-14 sm:px-12">
        {/* Header */}
        <div className="mb-10 text-center">
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
          <p className="mt-2 text-sm text-white/50">ألبوم الشرف — صور حقيقية.. وإنجازات تُروى</p>
        </div>

        {/* Album stage */}
        <div className="relative mx-auto max-w-3xl">
          <div className="group relative min-h-[29rem] overflow-hidden rounded-2xl border border-gold/35 bg-navy-950/60 shadow-[0_22px_55px_rgba(0,0,0,.25)] sm:min-h-[32rem]">
            {loading ? (
              <div className="flex h-[26rem] flex-col items-center justify-center gap-4">
                <motion.div
                  className="h-16 w-16 rounded-full border-2 border-gold/30 border-t-gold"
                  animate={reduced ? {} : { rotate: 360 }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                />
                <p className="text-sm text-white/50">الألبوم بيتحمّل...</p>
              </div>
            ) : (
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                {entry && (
                  <motion.div
                    key={entry.id}
                    custom={direction}
                    initial={reduced ? { opacity: 0 } : { opacity: 0, x: direction * 90 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduced ? { opacity: 0 } : { opacity: 0, x: direction * -90 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0"
                  >
                    {photoUrl ? (
                      <img src={photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_72%_38%,rgba(201,162,39,.25),transparent_22%),linear-gradient(135deg,#18345e,#071321)]">
                        <Medal size={70} strokeWidth={1.15} className="text-gold/60" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(4,14,29,.78)_0%,rgba(4,14,29,.38)_35%,rgba(4,14,29,.06)_72%)] transition-opacity duration-500 group-hover:opacity-15" />

                    <div className="relative z-10 flex h-full max-w-xl flex-col justify-end p-7 text-center sm:p-10 sm:text-right [text-shadow:0_2px_12px_rgba(0,0,0,.85)]">
                      <p className="font-plex text-[10px] font-bold uppercase tracking-[0.32em] text-gold-bright" dir="ltr">
                        Top Student {index + 1}
                      </p>
                      <h3 className="display-serif mt-3 text-3xl font-bold text-white sm:text-5xl">{entry.fullName}</h3>
                      <p className="mt-2 text-base font-semibold text-white/75">{entry.stageAr}{entry.year ? ` · ${entry.year}` : ''}</p>
                      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                        <span className="rounded-full border border-gold/45 bg-navy-950/45 px-4 py-2 text-xs font-bold text-gold-bright backdrop-blur-sm">✦ {entry.achievement}</span>
                        <span className="rounded-full bg-gold px-4 py-2 text-xs font-black text-navy-deep shadow-lg">
                          {entry.score != null ? `${Number(entry.score).toFixed(1)}%` : 'من أوائل الدفعة'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Navigation arrows */}
            {!loading && entries.length > 1 && (
              <>
                <button
                  onClick={() => go(-1)}
                  aria-label="السابق"
                  className="absolute start-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-gold/40 bg-navy-950/70 p-3 text-gold-bright backdrop-blur transition-all hover:bg-gold hover:text-navy-deep"
                >
                  <ChevronRight size={20} />
                </button>
                <button
                  onClick={() => go(1)}
                  aria-label="التالي"
                  className="absolute end-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-gold/40 bg-navy-950/70 p-3 text-gold-bright backdrop-blur transition-all hover:bg-gold hover:text-navy-deep"
                >
                  <ChevronLeft size={20} />
                </button>
              </>
            )}
          </div>

          {/* Dots + counter */}
          {!loading && entries.length > 0 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <div className="flex items-center gap-2">
                {entries.map((e, i) => (
                  <button
                    key={e.id}
                    onClick={() => {
                      setDirection(i > index ? 1 : -1);
                      setIndex(i);
                    }}
                    aria-label={`الصورة ${i + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${i === index ? 'w-7 bg-gold' : 'w-2 bg-white/25 hover:bg-white/50'}`}
                  />
                ))}
              </div>
              <span className="ms-2 font-plex text-[11px] text-white/40" dir="ltr">
                {entries.length > 0 ? `${index + 1} / ${entries.length}` : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HallOfFame;
