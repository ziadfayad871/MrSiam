import { ArrowLeft, Compass, Landmark, Map } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Globe } from '../design-system/components/Globe';
import { HallOfFame } from '../design-system/components/HallOfFame';
import { HistoricalDivider } from '../design-system/components/HistoricalDivider';
import { HistoricalSectionHeader } from '../design-system/components/HistoricalSectionHeader';
import { HistoricalTimeline } from '../design-system/components/HistoricalTimeline';
import { Podium } from '../design-system/components/Podium';
import { Reveal } from '../design-system/motion/Reveal';
import { Card } from '../design-system/ui/Card';
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

const PODIUM_DEMO = [
  { rank: 1, name: 'ملك محمود', score: 98.4, stage: 'الثالث الثانوي' },
  { rank: 2, name: 'أحمد سمير', score: 96.2, stage: 'الثالث الإعدادي' },
  { rank: 3, name: 'عمر خالد', score: 94.8, stage: 'الثاني الثانوي' },
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
  return (
    <div>
      <Hero />

      {/* Teacher intro */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <HistoricalSectionHeader
          number="01"
          title="مين هو مستر محمد صيام؟"
          subtitle="THE TEACHER"
        >
          مدرس دراسات اجتماعية للمرحلة الإعدادية، ومدرس تاريخ وجغرافيا للمرحلة الثانوية.
          مؤمن إن التاريخ حكاية تُروى، والجغرافيا خريطة تُقرأ، وإن كل طالب يملك بوصلة
          تقوده لأي علم ما دام عرف يقرأ الخريطة ويحكي الحكاية.
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

      {/* Podium */}
      <section className="mx-auto max-w-5xl px-4 py-24 sm:px-6">
        <HistoricalSectionHeader
          number="05"
          title="أوائل مستر محمد صيام"
          subtitle="THE TOP STUDENTS"
          align="center"
        >
          منصة التكريم — حيث تتحول الدرجات إلى ميداليات.
        </HistoricalSectionHeader>

        <div className="mt-14">
          <Podium entries={PODIUM_DEMO} />
        </div>

        <Reveal className="mt-14 text-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-md border border-gold/40 bg-gold/10 px-6 py-3 text-sm font-bold text-gold transition-all hover:bg-gold hover:text-navy-deep"
          >
            اعمل حسابك وابقى من الأوائل <ArrowLeft size={16} />
          </Link>
        </Reveal>
      </section>

      <HistoricalDivider />

      {/* Hall of Top Students */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <HallOfFame
          entries={[
            { rank: 1, name: 'ملك محمود', grade: 'الثالث الثانوي', score: 98.4, percentage: 98.4, achievement: 'مؤرخ المستقبل', year: '2026' },
            { rank: 2, name: 'أحمد سمير', grade: 'الثالث الإعدادي', score: 96.2, percentage: 96.2, achievement: 'ملك الخرائط', year: '2026' },
            { rank: 3, name: 'عمر خالد', grade: 'الثاني الثانوي', score: 94.8, percentage: 94.8, achievement: 'بطل الشهر', year: '2026' },
          ]}
        />
      </section>
    </div>
  );
}
