import {
  ArrowLeft,
  BookMarked,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  GraduationCap,
  Headphones,
  Layers3,
  MapPinned,
  PlayCircle,
  Sparkles,
  Trophy,
  UsersRound,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HallOfFame } from '../design-system/components/HallOfFame';
import { StudentTestimonials } from '../design-system/components/StudentTestimonials';
import { Reveal } from '../design-system/motion/Reveal';
import { api } from '../lib/api';
import type { StudentTestimonialDto, TopStudentDto } from '../lib/types';
import Hero from './landing/Hero';

const stages = [
  {
    level: '١',
    title: 'المرحلة الإعدادية',
    subtitle: 'دراسات اجتماعية بشكل مختلف',
    icon: MapPinned,
    tone: 'from-[#1d3a6b] to-[#0b1e36]',
  },
  {
    level: '٢',
    title: 'الصف الأول الثانوي',
    subtitle: 'تاريخ وجغرافيا من أول درس',
    icon: Compass,
    tone: 'from-[#354f32] to-[#172719]',
  },
  {
    level: '٣',
    title: 'الصف الثاني الثانوي',
    subtitle: 'ثبّت فهمك وكمّل رحلتك',
    icon: BookMarked,
    tone: 'from-[#633c24] to-[#2b1710]',
  },
  {
    level: '٤',
    title: 'الصف الثالث الثانوي',
    subtitle: 'المراجعة الأقوى نحو هدفك',
    icon: Trophy,
    tone: 'from-[#58251f] to-[#250e0b]',
  },
];

const highlights = [
  { label: 'شرح مبسّط', value: 'كل درس بيتحكي كأنه قصة', icon: PlayCircle },
  { label: 'تدريب مستمر', value: 'أسئلة بعد كل جزء', icon: ClipboardCheck },
  { label: 'مراجعات ذكية', value: 'مركّزة في وقتها', icon: BrainCircuit },
];

const platformFeatures = [
  { icon: PlayCircle, title: 'محتوى متاح في أي وقت', text: 'شوف الدرس وراجعه براحتك، وارجع لأي نقطة وقت ما تحتاج.' },
  { icon: ClipboardCheck, title: 'تدريبات وامتحانات', text: 'اعرف مستواك أول بأول وتدرّب على شكل الأسئلة الحقيقي.' },
  { icon: Layers3, title: 'رحلة منظمة وواضحة', text: 'كل حاجة مترتبة قدامك: الدروس، الواجبات، والمراجعات.' },
  { icon: Headphones, title: 'دعم معاك في الطريق', text: 'فريق المنصة جاهز يساعدك عشان تكمّل من غير ما تقف.' },
];

export default function LandingPage() {
  const [topStudents, setTopStudents] = useState<TopStudentDto[]>([]);
  const [albumLoading, setAlbumLoading] = useState(true);
  const [testimonials, setTestimonials] = useState<StudentTestimonialDto[]>([]);

  useEffect(() => {
    api
      .get<TopStudentDto[]>('/top-students')
      .then(setTopStudents)
      .catch(() => setTopStudents([]))
      .finally(() => setAlbumLoading(false));
    api.get<StudentTestimonialDto[]>('/testimonials').then(setTestimonials).catch(() => setTestimonials([]));
  }, []);

  return (
    <div dir="rtl" className="overflow-hidden bg-background">
      <Hero />

      <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="landing-orbit landing-orbit-one" aria-hidden />
        <div className="relative">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-xs font-bold text-gold">
              <Sparkles size={14} /> اختار مرحلتك وابدأ
            </span>
            <h2 className="display-serif mt-5 text-3xl font-extrabold text-text-primary sm:text-4xl">
              رحلتك مع مستر محمد صيام
            </h2>
            <p className="mt-3 text-sm leading-7 text-text-secondary sm:text-base">
              من أول حصة لحد المراجعة النهائية، هتلاقي كل اللي محتاجه عشان تفهم وتتفوق.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stages.map((stage, index) => (
              <Reveal key={stage.title} delay={index * 0.08}>
                <Link
                  to="/login"
                  className="group landing-stage-card block overflow-hidden rounded-2xl border border-border-soft bg-surface p-3 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-gold/60"
                >
                  <div className={`relative flex h-44 items-end overflow-hidden rounded-xl bg-gradient-to-br ${stage.tone} p-5`}>
                    <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full border border-white/10" />
                    <div className="absolute bottom-[-42px] left-5 h-32 w-32 rounded-full bg-gold/15 blur-xl" />
                    <stage.icon className="absolute left-5 top-5 text-gold-bright/90" size={37} strokeWidth={1.3} />
                    <span className="relative grid h-11 w-11 place-items-center rounded-xl bg-gold text-xl font-extrabold text-navy-deep shadow-lg">
                      {stage.level}
                    </span>
                    <Compass className="absolute -bottom-4 -right-4 text-white/10 transition-transform duration-500 group-hover:rotate-45" size={120} />
                  </div>
                  <div className="px-2 pb-2 pt-4">
                    <h3 className="text-base font-extrabold text-text-primary">{stage.title}</h3>
                    <p className="mt-1 text-xs text-text-secondary">{stage.subtitle}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-gold">
                      ادخل على المرحلة <ArrowLeft size={14} />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:pb-28">
        <Reveal>
          <HallOfFame entries={topStudents} loading={albumLoading} />
        </Reveal>
      </section>

      <section className="relative overflow-hidden bg-navy-deep py-20 text-white lg:py-24">
        <div className="sultan-grid absolute inset-0 opacity-70" />
        <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-7 text-center lg:flex-row lg:text-right">
            <div className="max-w-xl">
              <span className="text-xs font-bold tracking-[0.18em] text-gold-bright">منصة القيصر التعليمية</span>
              <h2 className="display-serif mt-3 text-3xl font-extrabold sm:text-4xl">مش مجرد فيديوهات… دي خطة تفوقك</h2>
              <p className="mt-4 leading-7 text-white/70">شرح واضح، تطبيق كتير، ومتابعة تخليك دايمًا عارف إنت واقف فين والخطوة الجاية إيه.</p>
            </div>
            <Link to="/login" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gold px-6 py-3.5 font-bold text-navy-deep transition hover:bg-gold-bright">
              ابدأ رحلتك الآن <ArrowLeft size={17} />
            </Link>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {highlights.map((item, index) => (
              <Reveal key={item.label} delay={index * 0.1}>
                <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold-bright"><item.icon size={23} /></div>
                  <div>
                    <p className="text-sm font-extrabold">{item.label}</p>
                    <p className="mt-1 text-xs text-white/65">{item.value}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[.85fr_1.15fr]">
          <Reveal>
            <div className="relative mx-auto max-w-md overflow-hidden rounded-[2rem] border border-gold/25 bg-surface-sunken p-5 shadow-[0_25px_70px_rgba(11,30,54,.14)]">
              <div className="absolute -top-12 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full bg-gold/25 blur-2xl" />
              <div className="relative rounded-2xl bg-navy-deep p-7 text-center text-white">
                <GraduationCap className="mx-auto text-gold-bright" size={47} strokeWidth={1.3} />
                <p className="display-serif mt-5 text-2xl font-extrabold">مستعد تكتب قصتك؟</p>
                <p className="mt-2 text-sm leading-6 text-white/70">سجّل حسابك، اختار مرحلتك، وخلي أول درس يكون بداية مختلفة.</p>
                <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/10 pt-5 text-center">
                  <div><UsersRound className="mx-auto text-gold" size={19} /><p className="mt-2 text-[10px] text-white/60">طلاب كتير</p></div>
                  <div><BookOpen className="mx-auto text-gold" size={19} /><p className="mt-2 text-[10px] text-white/60">دروس منظمة</p></div>
                  <div><CheckCircle2 className="mx-auto text-gold" size={19} /><p className="mt-2 text-[10px] text-white/60">تقدم واضح</p></div>
                </div>
              </div>
            </div>
          </Reveal>

          <div>
            <span className="text-sm font-bold text-gold">ليه تكمل معانا؟</span>
            <h2 className="display-serif mt-3 text-3xl font-extrabold text-text-primary sm:text-4xl">كل حاجة تساعدك تفهم، مش تحفظ وبس</h2>
            <p className="mt-4 max-w-2xl leading-7 text-text-secondary">بنرتّب لك المنهج في رحلة سهلة وممتعة، عشان توصل للامتحان وإنت واثق من نفسك.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {platformFeatures.map((feature, index) => (
                <Reveal key={feature.title} delay={index * 0.08}>
                  <div className="group rounded-2xl border border-border-soft bg-surface p-5 transition hover:border-gold/50 hover:shadow-soft">
                    <feature.icon className="text-gold transition-transform group-hover:-translate-y-0.5" size={25} strokeWidth={1.6} />
                    <h3 className="mt-4 font-extrabold text-text-primary">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-text-secondary">{feature.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <StudentTestimonials entries={testimonials} />

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:pb-28">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-gold/35 bg-[linear-gradient(125deg,#0b1e36_0%,#18345e_58%,#8a661b_160%)] px-6 py-12 text-center text-white shadow-[0_20px_60px_rgba(11,30,54,.25)] sm:px-12">
            <div className="absolute -right-10 -top-14 h-52 w-52 rounded-full border-[18px] border-gold/15" />
            <div className="absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-gold/10 blur-2xl" />
            <div className="relative mx-auto max-w-2xl">
              <Sparkles className="mx-auto text-gold-bright" size={27} />
              <h2 className="display-serif mt-4 text-3xl font-extrabold sm:text-4xl">يلا نبدأ أول خطوة</h2>
              <p className="mt-3 leading-7 text-white/75">مستقبل كبير بيبدأ بقرار صغير. انضم لمنصة القيصر وخلي مذاكرتك ليها معنى.</p>
              <Link to="/login" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gold px-7 py-3.5 font-extrabold text-navy-deep transition hover:bg-gold-bright">
                تسجيل الدخول <ArrowLeft size={18} />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
