import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowDown, CalendarCheck, Compass, PlayCircle, Sparkles, UserRoundPlus, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import type { TeacherProfileDto } from '../../lib/types';

/* Seeded pseudorandom — same layout on every render */
function seeded(i: number, salt: number): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  left: seeded(i, 1) * 100,
  top: seeded(i, 2) * 100,
  size: 1 + seeded(i, 3) * 2.2,
  delay: seeded(i, 4) * 4,
  duration: 2.6 + seeded(i, 5) * 3.4,
}));

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<TeacherProfileDto | null>(null);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const textY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.1]);

  useEffect(() => {
    api.get<TeacherProfileDto>('/teacher/profile').then(setTeacher).catch(() => setTeacher(null));
  }, []);

  const years = teacher?.experienceYears ?? 18;

  return (
    <section ref={ref} className="relative overflow-hidden bg-navy-deep text-white">
      {/* Grid + stars + glows */}
      <div className="sultan-grid absolute inset-0" />
      <div className="sultan-stars absolute inset-0" aria-hidden>
        {STARS.map((s) => (
          <span
            key={s.id}
            className="sultan-star"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}
      </div>
      <div className="sultan-glow start-[-120px] top-[-60px] h-80 w-80 bg-gold/45" />
      <div className="sultan-glow end-[-140px] top-1/3 h-96 w-96 bg-[#1d4ed8]/40" style={{ animationDelay: '3s' }} />
      <div className="sultan-glow start-1/4 bottom-[-120px] h-80 w-80 bg-gold/30" style={{ animationDelay: '6s' }} />

      {/* Watermark behind */}
      <div className="pointer-events-none absolute inset-x-0 top-20 select-none overflow-hidden text-center" aria-hidden>
        <span className="sultan-watermark" dir="rtl">القيصر في التاريخ والجغرافيا</span>
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 mx-auto flex min-h-[100vh] max-w-6xl flex-col items-center justify-center px-4 py-28 lg:flex-row lg:gap-20"
        style={{ opacity }}
      >
        {/* Portrait */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="absolute -inset-10 rounded-full bg-gold/25 blur-3xl" />
          <div className="sultan-portrait-ring relative h-60 w-60 rounded-full p-2.5 sm:h-80 sm:w-80">
            <div className="grid h-full w-full place-items-center overflow-hidden rounded-full border-2 border-gold/50 bg-[#0d1f3c] shadow-[0_24px_90px_rgba(8,14,28,0.6)]">
              <img src="/mr-siam-logo.jpeg" alt="مستر محمد صيام" className="h-full w-full object-cover" />
            </div>
          </div>

          {/* Floating chips */}
          <div className="absolute -end-2 top-6 flex items-center gap-1.5 rounded-full border border-gold/40 bg-navy-deep/85 px-3.5 py-1.5 text-xs font-bold text-gold-bright backdrop-blur sm:-end-6">
            <Sparkles size={13} /> {years}+ سنة خبرة
          </div>
          <div className="absolute -start-3 bottom-10 flex items-center gap-1.5 rounded-full border border-white/15 bg-navy-deep/85 px-3.5 py-1.5 text-xs font-bold text-white/90 backdrop-blur sm:-start-6">
            <Users size={13} className="text-gold" />
            {teacher ? `${teacher.stats.studentsCount} طالب` : 'آلاف الطلاب'}
          </div>
          <div className="absolute bottom-2 end-10 flex items-center gap-1.5 rounded-full border border-gold/30 bg-navy-deep/85 px-3 py-1 text-[10px] font-semibold text-white/70 backdrop-blur">
            التاريخ · الجغرافيا · الدراسات
          </div>
        </motion.div>

        {/* Text + actions */}
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ y: textY }}
          className="mt-12 max-w-2xl text-center lg:mt-0 lg:text-start"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-bold text-gold-bright">
            <Compass size={13} /> منصة القيصر الرقمي للتعليم
          </span>

          <h1 className="display-serif mt-6 text-4xl font-bold leading-[1.35] sm:text-5xl md:text-6xl">
            م / <span className="text-gold-bright">محمد صيام</span>
          </h1>

          <div className="mt-2 inline-block pb-1">
            <span className="text-xl font-bold text-white/90 sm:text-2xl">في التاريخ والجغرافيا</span>
            <svg viewBox="0 0 320 26" className="mt-1 block h-6 w-full" aria-hidden>
              <path className="sultan-scribble" d="M6 18 C 70 7, 150 4, 314 12" />
            </svg>
          </div>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg lg:mx-0">
            التاريخ حكاية تُروى والخريطة تُقرأ — رحلة تعليمية من الإعدادية للثانوية،
            بمتعة الاستكشاف وذكاء القيصر.{" "}
            <span className="font-bold text-gold-bright">مع أبو كيان .. الدراسات في أمان 😍</span>
          </p>

          {/* Action buttons grid */}
          <div className="mt-9 grid grid-cols-3 gap-3 sm:gap-3.5">
            <button
              onClick={() => navigate('/login')}
              className="col-span-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3.5 text-sm font-bold text-navy-deep shadow-[0_10px_34px_rgba(201,162,39,0.35)] transition-all hover:bg-gold-bright hover:shadow-[0_14px_44px_rgba(201,162,39,0.5)] sm:col-span-1"
            >
              <UserRoundPlus size={17} /> طالب جديد
            </button>
            <button
              onClick={() => navigate('/parent')}
              className="col-span-1 flex w-full items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3.5 text-sm font-bold text-gold-bright transition-colors hover:bg-gold/20"
            >
              <Users size={17} /> ولي أمر
            </button>
            <button
              onClick={() => navigate('/login')}
              className="col-span-1 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-sm font-bold text-white transition-colors hover:border-gold/50 hover:text-gold-bright"
            >
              <Sparkles size={17} /> عايز اشترك
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="col-span-1 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-sm font-bold text-white transition-colors hover:border-gold/50 hover:text-gold-bright"
            >
              <CalendarCheck size={17} /> جدول دراسي
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-white/45 lg:justify-start">
            <span className="flex items-center gap-1.5">
              <Sparkles size={12} className="text-gold" /> 6 مراحل دراسية
            </span>
            <span className="h-1 w-1 rounded-full bg-white/25" />
            <span className="flex items-center gap-1.5">
              <Compass size={12} className="text-gold" /> إعدادية · ثانوية
            </span>
            <span className="h-1 w-1 rounded-full bg-white/25" />
            <span className="flex items-center gap-1.5">
              <PlayCircle size={12} className="text-gold" /> حصص ومحاضرات مسجلة
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll down */}
      <button
        onClick={() => document.getElementById('sultan-start')?.scrollIntoView({ behavior: 'smooth' })}
        className="absolute bottom-24 start-1/2 z-10 -translate-x-1/2 text-white/50 transition-colors hover:text-gold"
        aria-label="التمرير للأسفل"
      >
        <span className="sultan-bounce flex flex-col items-center gap-1">
          <ArrowDown size={20} />
        </span>
      </button>

      {/* Bottom fade to page background */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}

export default Hero;