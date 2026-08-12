import {
  ArrowLeft,
  Award,
  BookOpen,
  Compass,
  GraduationCap,
  Landmark,
  Map,
  Rocket,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRoundPlus,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe } from '../design-system/components/Globe';
import { HallOfFame } from '../design-system/components/HallOfFame';
import { HistoricalDivider } from '../design-system/components/HistoricalDivider';
import { HistoricalSectionHeader } from '../design-system/components/HistoricalSectionHeader';
import { HistoricalTimeline } from '../design-system/components/HistoricalTimeline';
import { Reveal } from '../design-system/motion/Reveal';
import { Card } from '../design-system/ui/Card';
import { api } from '../lib/api';
import type { TeacherProfileDto, TopStudentDto } from '../lib/types';
import Hero from './landing/Hero';

const SUBJECTS = [
  {
    icon: Landmark,
    title: 'التاريخ',
    desc: 'حكايات وحضارات تتحول لمتعة حقيقية — من حضارة المصريين القدماء إلى مصر الحديثة.',
    tag: 'الثانوية',
  },
  {
    icon: Map,
    title: 'الجغرافيا',
    desc: 'اقرأ الخريطة وافهم العالم — المناخ والتضاريس والموارد بأسلوب استكشافي ممتع.',
    tag: 'الثانوية',
  },
  {
    icon: Compass,
    title: 'الدراسات الاجتماعية',
    desc: 'خريطة + زمن = فهم أعمق لتاريخ مصر وجغرافيتها في المرحلة الإعدادية.',
    tag: 'الإعدادية',
  },
];

const QUALIFICATIONS = [
  { icon: GraduationCap, title: 'بكالوريوس التربية', desc: 'كلية التربية - جامعة عين شمس، وطريق التدريس بدأ من هناك' },
  { icon: BookOpen, title: 'الدراسات الاجتماعية', desc: 'مدرس إعدادية — المعلومة عندي بقت حكاية تُروى مش سطر يُحفظ' },
  { icon: Landmark, title: 'التاريخ والجغرافيا', desc: 'للثانوية العامة — الزمن يُحكى والخريطة تُقرأ بمنهج "القيصر"' },
  { icon: Compass, title: 'فلسفة الرحلة', desc: 'المنهج الجيد لا يُحفظ بل يُعاش — كل درس محطة وكل امتحان تحدٍّ' },
  { icon: Users, title: 'آلاف الطلاب', desc: 'مرّ على حصصه آلاف الطلاب من محافظات مصر كلها' },
  { icon: Rocket, title: 'القيصر الرقمي', desc: 'يبني منصته الرقمية لتكون رفيق كل طالب في رحلته' },
];

const JOURNEY_STOPS = [
  { title: 'الصف الأول الإعدادي', order: 1 },
  { title: 'الصف الثاني الإعدادي', order: 2 },
  { title: 'الصف الثالث الإعدادي', order: 3 },
  { title: 'الأول الثانوي', order: 4 },
  { title: 'الثاني الثانوي', order: 5 },
  { title: 'الثالث الثانوي', order: 6 },
];

const HISTORY_YEARS = [
  { year: 1798, title: 'الحملة الفرنسية', description: 'فتحت مصر على أوروبا الحديثة وبدأ عصر النهضة.' },
  { year: 1805, title: 'محمد علي باشا', description: 'تولى حكم مصر وبدأ بناء جيش ومدارس حديثة.' },
  { year: 1882, title: 'الاحتلال البريطاني', description: 'بداية عصر المقاومة والكفاح الوطني.' },
  { year: 1919, title: 'ثورة 1919', description: 'أول ثورة شعبية شاملة بقيادة سعد زغلول.' },
  { year: 1952, title: 'ثورة 23 يوليو', description: 'أنهت الملكية وبدأت عهد الجمهورية.' },
];

const GLOBE_MARKERS = [
  {
    id: 'cairo',
    name: 'القاهرة',
    latitude: 30.0,
    longitude: 31.2,
    x: 0.5,
    y: 0.45,
    note: 'من الفسطاط لمدينة الألف مئذنة — العاصمة اللي فضلت قلب العالم الإسلامي لقرون.',
  },
  {
    id: 'athens',
    name: 'أثينا',
    latitude: 38.0,
    longitude: 23.7,
    x: 0.62,
    y: 0.47,
    note: 'مهد الديمقراطية والفلسفة — أولادها كتبوا اسمهم بحروف نور في التاريخ.',
  },
  {
    id: 'rome',
    name: 'روما',
    latitude: 41.9,
    longitude: 12.5,
    x: 0.69,
    y: 0.41,
    note: 'عاصمة إمبراطورية امتدت من المحيط الأطلسي للفرات — وقوانينها وصلت لليوم.',
  },
  {
    id: 'london',
    name: 'لندن',
    latitude: 51.5,
    longitude: -0.1,
    x: 0.77,
    y: 0.33,
    note: 'عاصمة الثورة الصناعية — ومركز الاحتلال البريطاني اللي استقبلت مصر ثوراته.',
  },
  {
    id: 'mecca',
    name: 'مكة المكرمة',
    latitude: 21.4,
    longitude: 39.8,
    x: 0.42,
    y: 0.6,
    note: 'أطهر بقاع الأرض — وقبلة المسلمين من مشارق الأرض ومغاربها.',
  },
  {
    id: 'paris',
    name: 'باريس',
    latitude: 48.9,
    longitude: 2.4,
    x: 0.7,
    y: 0.36,
    note: 'عاصمة النور — ومنها دخلت مصر الحملة الفرنسية والطباعة والعلم الحديث.',
  },
];

export default function LandingPage() {
  const [topStudents, setTopStudents] = useState<TopStudentDto[]>([]);
  const [albumLoading, setAlbumLoading] = useState(true);
  const [teacher, setTeacher] = useState<TeacherProfileDto | null>(null);

  useEffect(() => {
    api
      .get<TopStudentDto[]>('/top-students')
      .then(setTopStudents)
      .catch(() => setTopStudents([]))
      .finally(() => setAlbumLoading(false));
    api.get<TeacherProfileDto>('/teacher/profile').then(setTeacher).catch(() => setTeacher(null));
  }, []);

  const stats = teacher?.stats;
  const statCards = [
    { icon: GraduationCap, label: 'سنوات الخبرة', value: `${teacher?.experienceYears ?? 18}+`, unit: 'سنة' },
    { icon: Users, label: 'طلاب المنصة', value: stats ? String(stats.studentsCount) : '—' },
    { icon: BookOpen, label: 'مقررات دراسية', value: stats ? String(stats.coursesCount) : '—' },
    { icon: Trophy, label: 'نسبة النجاح', value: stats ? `${stats.successRate}%` : '—' },
  ];

  return (
    <div>
      <Hero />

      {/* ===== Sultan promo banner ===== */}
      <section id="sultan-start" className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <div
          className="relative overflow-hidden rounded-2xl border-2 border-gold/60 px-6 py-8 shadow-[0_18px_60px_rgba(11,30,54,0.35)] sm:px-10"
          style={{ background: 'linear-gradient(135deg, #0b1e36 0%, #1d3a6b 55%, #c9a227 130%)' }}
        >
          <div className="pointer-events-none absolute -top-16 end-16 h-40 w-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-12 start-10 h-28 w-28 rounded-full bg-gold/25" />
          <div className="relative z-10 flex flex-col items-center justify-between gap-6 lg:flex-row">
            <div className="max-w-2xl text-center lg:text-start">
              <h4 className="display-serif text-xl font-bold text-white sm:text-2xl">
                سجّل حسابك وابدأ رحلة القيصر الرقمي — من غير ما تتعقد
              </h4>
              <p className="mt-2 text-sm text-white/85">
                دلوقتي تقدر تشترك في المقررات بسهولة وأمان، وتذاكر التاريخ والجغرافيا بالطريقة اللي بتحبها.
              </p>
              <ul className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs font-semibold text-white/75 lg:justify-start">
                <li className="flex items-center gap-1.5"><Sparkles size={12} className="text-gold-bright" /> خطوتين بس عشان تسجل</li>
                <li className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-gold-bright" /> وصول فوري لكل المحتوى</li>
              </ul>
            </div>
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-navy-deep shadow-lg transition-all hover:bg-gold-bright"
            >
              <UserRoundPlus size={17} /> اضغط هنا للاشتراك
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Sultan "من هو المستر؟" timeline ===== */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <HistoricalSectionHeader number="01" title="مين هو مستر محمد صيام؟" subtitle="THE TEACHER">
          مدرس دراسات اجتماعية للمرحلة الإعدادية، ومدرس تاريخ وجغرافيا للمرحلة الثانوية.
        </HistoricalSectionHeader>

        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {QUALIFICATIONS.map((q, i) => (
            <Reveal key={q.title} delay={i * 0.08}>
              <div className="group relative h-full overflow-hidden rounded-xl border border-border-soft bg-gradient-to-b from-surface to-surface-sunken/60 p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-[0_16px_44px_rgba(201,162,39,0.12)]">
                <div className="absolute -end-10 -top-10 h-28 w-28 rounded-full bg-gold/5 transition-colors duration-300 group-hover:bg-gold/10" />
                <div className="relative">
                  <div className="grid h-12 w-12 place-items-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
                    <q.icon size={22} strokeWidth={1.8} />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-text-primary">{q.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{q.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== Sultan stats ===== */}
      <section className="relative overflow-hidden bg-navy-deep py-16 text-white">
        <div className="sultan-grid absolute inset-0" />
        <div className="sultan-stars absolute inset-0" aria-hidden>
          {Array.from({ length: 26 }, (_, i) => (
            <span
              key={i}
              className="sultan-star"
              style={{
                left: `${(Math.sin(i * 91.7) * 0.5 + 0.5) * 100}%`,
                top: `${(Math.sin(i * 47.3) * 0.5 + 0.5) * 100}%`,
                width: `${1 + (Math.sin(i * 13.1) * 0.5 + 0.5) * 2}px`,
                height: `${1 + (Math.sin(i * 13.1) * 0.5 + 0.5) * 2}px`,
                animationDelay: `${(Math.sin(i * 23.7) * 0.5 + 0.5) * 4}s`,
                animationDuration: `${2.6 + (Math.sin(i * 37.9) * 0.5 + 0.5) * 3.4}s`,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 flex items-center justify-center gap-2.5">
            <Sparkles size={18} className="text-gold" />
            <h2 className="text-center text-2xl font-bold sm:text-3xl">
              بعض <span className="text-gold-bright">الإحصائيات</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {statCards.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-4 rounded-xl border border-gold/20 bg-white/5 px-5 py-6 backdrop-blur-sm transition-colors hover:border-gold/45 hover:bg-white/10"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gold/15 text-gold-bright">
                  <s.icon size={22} strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <p className="display-serif text-2xl font-bold text-white">
                    {s.value}
                    {s.unit && <span className="ms-1 text-sm font-normal text-gold">{s.unit}</span>}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] font-semibold text-white/60">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      </section>

      {/* ===== Subjects ===== */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <HistoricalSectionHeader number="02" title="رحلتك مع أبو كيان" subtitle="THE SUBJECTS" align="center">
          التخصصات اللي بيحولها المستر لحكاية — اختر محطتك.
        </HistoricalSectionHeader>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {SUBJECTS.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.1}>
              <Card hoverable className="group h-full">
                <div className="absolute -top-6 end-6 rounded-lg border border-gold/30 bg-gold/10 px-3 py-1 text-[11px] font-bold text-gold">
                  {s.tag}
                </div>
                <s.icon size={30} className="mb-4 text-gold" strokeWidth={1.5} />
                <h3 className="text-lg font-bold text-text-primary">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{s.desc}</p>
                <Link
                  to="/dashboard"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-gold opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                >
                  ابدأ الرحلة <ArrowLeft size={14} />
                </Link>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <HistoricalDivider />

      {/* The journey */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <HistoricalSectionHeader number="02" title="رحلتك التعليمية" subtitle="THE JOURNEY" align="center">
          من أول يوم في الإعدادية لحد هدفك في الثانوية — كل مرحلة محطة في خريطتك.
        </HistoricalSectionHeader>

        <Reveal className="mx-auto mt-14 max-w-3xl">
          <HistoricalTimeline
            variant="horizontal"
            items={JOURNEY_STOPS.map((s, i) => ({
              id: `stage-${s.order}`,
              title: s.title,
              state: i === 2 ? 'current' : 'locked',
            }))}
          />
        </Reveal>
      </section>

      <HistoricalDivider />

      {/* Discover the world */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <HistoricalSectionHeader
          number="03"
          title="اكتشف العالم مع أبو كيان"
          subtitle="THE GLOBE"
          align="center"
        >
          التاريخ مش بس أزمنة — ده أماكن كمان. لفّ الكرة ودوّر على محطات الحضارة.
        </HistoricalSectionHeader>

        <Reveal className="mt-14">
          <Globe markers={GLOBE_MARKERS} title="الكرة الأرضية — محطات الحضارة" />
        </Reveal>
      </section>

      <HistoricalDivider />

      {/* History route */}
      <section className="map-grid mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <HistoricalSectionHeader
          number="04"
          title="رحلة التاريخ"
          subtitle="THE HISTORY ROUTE"
        >
          أحداث مصر الحديثة على خط زمني واحد — كل محطة وراها حكاية.
        </HistoricalSectionHeader>

        <div className="mx-auto mt-12 max-w-2xl">
          <HistoricalTimeline
            items={HISTORY_YEARS.map((h) => ({ id: String(h.year), year: h.year, title: h.title, description: h.description }))}
          />
        </div>
      </section>

      <HistoricalDivider />

      {/* Hall of Top Students — real album */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <HistoricalSectionHeader
          number="05"
          title="أوائل مستر محمد صيام"
          subtitle="THE TOP STUDENTS"
          align="center"
        >
          ألبوم الشرف — صور حقيقية لإنجازات حقيقية، بيتحدث كل مرة يضيف الأستاذ نجمة جديدة.
        </HistoricalSectionHeader>

        <Reveal className="mt-14">
          <HallOfFame entries={topStudents} loading={albumLoading} />
        </Reveal>

        <Reveal className="mt-14 text-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-md border border-gold/40 bg-gold/10 px-6 py-3 text-sm font-bold text-gold transition-all hover:bg-gold hover:text-navy-deep"
          >
            اعمل حسابك وابقى من الأوائل <ArrowLeft size={16} />
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
