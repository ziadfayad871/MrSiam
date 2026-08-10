import { BookOpen, GraduationCap, Map, Medal, MessageCircle, Star, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Compass as CompassBrand } from '../design-system/components/Compass';
import CoordinateLabel from '../design-system/components/CoordinateLabel';
import { HistoricalDivider } from '../design-system/components/HistoricalDivider';
import { HistoricalSectionHeader } from '../design-system/components/HistoricalSectionHeader';
import { HistoricalTimeline } from '../design-system/components/HistoricalTimeline';
import { Reveal } from '../design-system/motion/Reveal';
import { Button } from '../design-system/ui/Button';
import { Card } from '../design-system/ui/Card';

const CHAPTERS = [
  {
    icon: BookOpen,
    title: 'البداية',
    text: 'بدأت حكايتي في مدرسة صغيرة — كنت دايماً بحب أحكي حكايات الفراعنة لزمايلي في الفسحة، وعرفت يومها إن التاريخ لازم يُحكى.',
  },
  {
    icon: GraduationCap,
    title: 'الرحلة',
    text: 'درست التاريخ والجغرافيا وقررت إن التخصص مش شرط يخلّي الحكاية مملة — ابتديت أطوّر طريقة "الحكاية والخريطة": كل درس حكاية، وكل حكاية ليها خريطة.',
  },
  {
    icon: Users,
    title: 'الخبرة',
    text: 'أكتر من 12 سنة في المدارس والمعاهد، مرّيت على آلاف الطلاب، وكل جيل علّمني أسلوب جديد في التوصيل.',
  },
  {
    icon: Medal,
    title: 'الإنجازات',
    text: 'الطلاب اللي عرفوني بقوا من أوائل الجمهورية في الدراسات الاجتماعية، وكنت فخور إن أكتر من جيل كرّمني بثقتهم وحبهم.',
  },
  {
    icon: Map,
    title: 'المستقبل',
    text: 'ودلوقتي حاطط كل الخبرة دي في منصة رقمية — عشان كل طالب في مصر يلاقي الحكاية والخريطة في أي وقت.',
  },
];

const SIGNS = [
  { label: 'طلاب تتجاوزت أعدادهم', value: '+4000' },
  { label: 'سنوات خبرة', value: '12+' },
  { label: 'أوائل في إدارات مختلفة', value: '30+' },
  { label: 'درس مُصمَّم بمنهجية الحكاية', value: '500+' },
];

export default function TeacherProfile() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-deep text-white">
        <CoordinateLabel
          latitude={{ degrees: 31, minutes: 15, hemisphere: 'N' }}
          longitude={{ degrees: 32, minutes: 18, hemisphere: 'E' }}
          ambient
          className="absolute top-10 start-8 hidden md:inline-flex"
        />
        <div className="map-grid absolute inset-0 opacity-60" />
        <div className="absolute -start-40 -top-40 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-4 py-24 text-center">
          <Reveal>
            <div className="relative">
              <div className="flex h-36 w-36 items-center justify-center rounded-full border border-gold/40 bg-white/[0.04]">
                <span className="display-serif text-5xl font-bold text-gold-bright">ص</span>
              </div>
              <div className="absolute -end-4 -top-2">
                <CompassBrand size="medium" animated />
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="display-serif mt-8 text-4xl font-bold text-white sm:text-5xl">
              مستر <span className="text-gold-bright">محمد صيام</span>
            </h1>
            <p className="mt-3 font-plex text-[11px] uppercase tracking-[0.4em] text-white/40" dir="ltr">
              Social Studies · History · Geography
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              مدرّس شغوف، بيرسم للطلاب خريطة المعرفة وبيحكي لهم التاريخ حكاية.
              هنا هتلاقي اللي خلّى جيل كامل يقول: "أول مرة أفهم التاريخ!"
            </p>
          </Reveal>

          <Reveal delay={0.3} className="mt-10 grid w-full max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
            {SIGNS.map((s) => (
              <div key={s.label} className="rounded-lg border border-white/10 bg-white/[0.05] px-4 py-5">
                <p className="text-2xl font-bold text-gold-bright">{s.value}</p>
                <p className="mt-1 text-[11px] leading-5 text-white/50">{s.label}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <HistoricalDivider />

      {/* The story chapters */}
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <HistoricalSectionHeader number="01" title="حكاية المستر" subtitle="THE STORY" align="center" />
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {CHAPTERS.map((c, i) => (
            <Reveal key={c.title} delay={(i % 2) * 0.1}>
              <Card hoverable className="h-full">
                <c.icon size={26} className="mb-3 text-gold" strokeWidth={1.6} />
                <h3 className="text-lg font-bold text-text-primary">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{c.text}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <HistoricalDivider />

      {/* Philosophy */}
      <section className="map-grid mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <Reveal>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
            <Star size={26} className="text-gold" strokeWidth={1.5} />
          </div>
          <h2 className="display-serif mt-6 text-2xl font-bold text-text-primary sm:text-3xl">
            "أنا مش بعلّم تواريخ... أنا بحكي حكايات."
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base">
            الخريطة والزمن هما طريق المعرفة الحقيقي — لما تفهم إزاي تيجي الحدث ليه مكان ووقت،
            هتعيش التاريخ مش تحفظه.
          </p>
        </Reveal>
      </section>

      <HistoricalDivider />

      {/* Message to students */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <HistoricalSectionHeader number="02" title="رسالة لطلابي" subtitle="A MESSAGE" align="center" />
        <Reveal className="mt-10">
          <div className="coordinates-frame relative rounded-lg border border-gold/25 bg-parchment-soft p-8 text-center shadow-floating">
            <MessageCircle size={30} className="mx-auto mb-4 text-gold" strokeWidth={1.5} />
            <p className="text-base leading-loose text-text-primary sm:text-lg">
              يا بطل الرحلة،
              <br />
              <br />
              أنت مش مجرد طالب بتحفظ دروس — أنت مستكشف. خريطتك في إيدك، ووقتك هو بوصلتك،
              وكل سؤال في الامتحان محطة جديدة. مستمرين مع بعض في الحكاية دي لأقصى خط.
            </p>
            <Link
              to="/timeline"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-md border border-gold/40 bg-gold/10 px-6 py-3 text-sm font-bold text-gold transition-colors hover:bg-gold hover:text-navy-deep"
            >
              شوف خريطة التاريخ <span className="text-[10px]">↑</span>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Mini timeline */}
      <section className="mx-auto max-w-2xl px-4 pb-24 sm:px-6">
        <Reveal>
          <HistoricalTimeline
            items={[
              { id: 't1', year: '2013', title: 'بداية التدريس', description: 'أول سنة كمدرس دراسات اجتماعية.' },
              { id: 't2', year: '2018', title: 'منهجية الحكاية والخريطة', description: 'تطوير طريقة التدريس الخاصة بالمستري.' },
              { id: 't3', year: '2024', title: 'المنصة الرقمية', description: 'تحويل الرحلة كاملة لمنصة تفاعلية.' },
            ]}
          />
        </Reveal>
      </section>

      <div className="pb-24 text-center">
        <Button variant="gold" size="lg" onClick={() => (window.location.href = '/login')}>
          ابدأ رحلتك مع المستر
        </Button>
      </div>
    </div>
  );
}
