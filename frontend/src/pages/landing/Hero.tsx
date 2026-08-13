import { motion } from 'motion/react';
import { BookOpen, Compass, LogIn, Moon, Sparkles, Sun, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import type { TeacherProfileDto } from '../../lib/types';
import { useTheme } from '../../lib/theme';

export function Hero() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [teacher, setTeacher] = useState<TeacherProfileDto | null>(null);

  useEffect(() => {
    api.get<TeacherProfileDto>('/teacher/profile').then(setTeacher).catch(() => setTeacher(null));
  }, []);

  const stats = teacher?.stats;

  return (
    <section className="history-hero relative isolate overflow-hidden bg-[#120e09] text-white">
      <div className="history-hero-image absolute inset-0" aria-hidden />
      <div className="history-hero-overlay absolute inset-0" aria-hidden />

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-4rem)] max-w-[1600px] flex-col px-4 pb-8 pt-5 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between" dir="rtl">
          <img src="/caesar-logo.webp" alt="شعار القيصر" className="caesar-header-mark" />

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 rounded-xl border border-[#c99b4b]/65 bg-[#1d1710]/75 px-4 py-2.5 text-sm font-bold text-[#f6e5c4] backdrop-blur transition hover:bg-[#c99b4b]/20 sm:px-6"
            >
              <LogIn size={16} /> تسجيل الدخول
            </button>
            <button
              onClick={toggle}
              className="history-hero-theme grid h-11 w-20 place-items-center rounded-full border border-[#c99b4b]/65 text-[#e5b45a] transition hover:bg-[#d7a54a]/15"
              aria-label="تبديل الوضع الليلي"
            >
              {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
            </button>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-start py-12 lg:py-8" dir="rtl">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="history-hero-copy w-full max-w-xl text-center lg:me-[8%] lg:text-right"
          >
            <div className="mb-5 flex items-center justify-center gap-3 text-[#e2ae55] lg:justify-start">
              <Compass className="h-10 w-10 sm:h-12 sm:w-12" strokeWidth={1.3} />
              <span className="h-px w-12 bg-[#d5a44d]/70" />
              <span className="text-sm font-bold tracking-[0.13em]">منصة القيصر التعليمية</span>
            </div>

            <h1 className="history-hero-title text-4xl font-extrabold leading-[1.22] text-[#fff8e9] sm:text-5xl xl:text-6xl">
              رحلة التفوق <span className="block text-[#e6af54]">تبدأ من هنا</span>
            </h1>
            <p className="mt-5 text-base leading-8 text-[#f1e1c5]/88 sm:text-lg">
              شرح مبسّط وممتع للدراسات الاجتماعية، التاريخ والجغرافيا لطلاب المرحلة الإعدادية والثانوية مع مستر محمد صيام.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <button
                onClick={() => navigate('/login')}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#d9a74e] px-7 py-3.5 text-base font-extrabold text-[#21170c] shadow-[0_12px_30px_rgba(217,167,78,.28)] transition hover:-translate-y-0.5 hover:bg-[#efbd63]"
              >
                <BookOpen size={20} /> ابدأ رحلتك الآن
              </button>
              <button
                onClick={() => navigate('/parent')}
                className="flex items-center justify-center gap-2 rounded-2xl border border-[#d9a74e]/60 bg-black/20 px-7 py-3.5 text-base font-bold text-[#ffe8bd] transition hover:bg-[#d9a74e]/15"
              >
                <Users size={20} /> ولي أمر
              </button>
            </div>

            <div className="mt-10 grid grid-cols-3 divide-x divide-x-reverse divide-[#d6a54d]/35 border-y border-[#d6a54d]/30 py-5 text-center lg:text-right">
              <div className="px-2">
                <p className="text-2xl font-extrabold text-[#e6af54] sm:text-3xl">{stats?.studentsCount || '50K'}+</p>
                <p className="mt-1 text-xs font-semibold text-[#f4e5cb]/75 sm:text-sm">طالب وثقوا بنا</p>
              </div>
              <div className="px-2">
                <p className="text-2xl font-extrabold text-[#e6af54] sm:text-3xl">{stats?.coursesCount || '1000'}+</p>
                <p className="mt-1 text-xs font-semibold text-[#f4e5cb]/75 sm:text-sm">درس ومراجعة</p>
              </div>
              <div className="px-2">
                <p className="text-2xl font-extrabold text-[#e6af54] sm:text-3xl">{stats?.successRate || 98}%</p>
                <p className="mt-1 text-xs font-semibold text-[#f4e5cb]/75 sm:text-sm">نسبة رضا الطلاب</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="rounded-2xl border border-[#c99b4b]/20 bg-black/25 px-5 py-3 text-center backdrop-blur-sm lg:text-right" dir="rtl">
          <p className="text-sm font-bold leading-7 text-[#f4e5cb]/90 sm:text-base">
            هدفي أصنع طالب واثق من نفسه، مؤمن بإمكانياته، وشخص ناجح في حياته.
          </p>
        </div>
      </div>
    </section>
  );
}

export default Hero;
