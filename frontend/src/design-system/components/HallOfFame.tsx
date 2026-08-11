import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight, Crown, Medal, User } from 'lucide-react';
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
          <div className="relative min-h-[26rem] overflow-hidden rounded-xl border border-gold/30 bg-navy-950/60 sm:min-h-[24rem]">
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
                    className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-stretch sm:gap-8 sm:p-8"
                  >
                    {/* Photo */}
                    <div className="relative shrink-0">
                      <div className="absolute -inset-1 rounded-full bg-gold/20 blur-lg" style={{ background: 'radial-gradient(50% 50% at 50% 50%, var(--gold-glow), transparent 70%)' }} />
                      <div className="relative h-56 w-56 overflow-hidden rounded-full border-4 border-gold/50 shadow-2xl sm:h-64 sm:w-64">
                        {photoUrl ? (
                          <img src={photoUrl} alt={entry.fullName} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-navy-800 to-navy-950">
                            <Medal size={44} strokeWidth={1.4} className="text-gold-bright/70" />
                            <span className="text-[11px] text-white/40">الصورة في الطريق</span>
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-gold/40 bg-gold px-4 py-1 text-xs font-black text-navy-deep shadow-lg">
                        {entry.score != null ? `${Number(entry.score).toFixed(1)}%` : 'الأول'}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex flex-1 flex-col items-center justify-center text-center sm:items-start sm:text-start">
                      <p className="font-plex text-[9px] uppercase tracking-[0.3em] text-gold-bright" dir="ltr">
                        Top Student {index + 1}
                      </p>
                      <h3 className="display-serif mt-2 text-2xl font-bold text-white sm:text-3xl">{entry.fullName}</h3>
                      <p className="mt-1 text-sm text-white/60">{entry.stageAr}{entry.year ? ` · ${entry.year}` : ''}</p>
                      <span className="mt-4 inline-block rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-semibold text-gold-bright">
                        ✦ {entry.achievement}
                      </span>
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
                  className="absolute start-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-gold/40 bg-navy-950/70 p-2.5 text-gold-bright backdrop-blur transition-all hover:bg-gold hover:text-navy-deep"
                >
                  <ChevronRight size={20} />
                </button>
                <button
                  onClick={() => go(1)}
                  aria-label="التالي"
                  className="absolute end-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-gold/40 bg-navy-950/70 p-2.5 text-gold-bright backdrop-blur transition-all hover:bg-gold hover:text-navy-deep"
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
