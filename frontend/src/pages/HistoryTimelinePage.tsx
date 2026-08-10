import { motion } from 'motion/react';
import { useRef } from 'react';
import { Compass as CompassBrand } from '../design-system/components/Compass';
import CoordinateLabel from '../design-system/components/CoordinateLabel';
import { HistoricalDivider } from '../design-system/components/HistoricalDivider';
import { HistoricalTimeline } from '../design-system/components/HistoricalTimeline';
import { HistoricalSectionHeader } from '../design-system/components/HistoricalSectionHeader';
import { InteractiveTimeline } from '../design-system/components/InteractiveTimeline';
import { Reveal } from '../design-system/motion/Reveal';

const ERAS = [
  {
    id: 'ancient-egypt',
    title: 'مصر القديمة',
    range: '3100 ق.م — 332 ق.م',
    description: 'أقدم حضارة عرفها العالم — النيل، الأهرامات، المعابد، ونظام الكتابة الأول في التاريخ.',
    glyph: '🏛️',
    coordinates: '29.9°N / 31.2°E',
    events: [
      { year: '3100 ق.م', title: 'توحيد القطرين', description: 'نارمر يوحد الشمال والجنوب ويؤسس أول أسرة حاكمة.' },
      { year: '2560 ق.م', title: 'هرم خوفو', description: 'أعجوبة الدنيا الوحيدة الباقية — بنت ملوك الدولة القديمة.' },
      { year: '1279 ق.م', title: 'رمسيس الثاني', description: 'معركة قادش وأول معاهدة سلام في التاريخ.' },
    ],
  },
  {
    id: 'middle-ages',
    title: 'العصور الوسطى',
    range: '332 ق.م — 1517 م',
    description: 'من الإسكندر إلى الفتح الإسلامي إلى المماليك — مصر بوابة العالم القديم.',
    glyph: '🕌',
    coordinates: '30.0°N / 31.2°E',
    events: [
      { year: '641 م', title: 'دخول الإسلام مصر', description: 'عمرو بن العاص يفتح مصر ويؤسس الفسطاط أول عاصمة إسلامية.' },
      { year: '1171 م', title: 'صلاح الدين الأيوبي', description: 'يحرر القدس ويحصن مصر من الحملات الصليبية.' },
      { year: '1250 م', title: 'المماليك', description: 'مصر تتصدر العالم — صناعة وتجارة وعلوم.' },
    ],
  },
  {
    id: 'modern-history',
    title: 'التاريخ الحديث',
    range: '1517 م — 1952 م',
    description: 'من الحملة الفرنسية لثورة يوليو — مصر تولد من جديد وتبني وطناً حديثاً.',
    glyph: '⚓',
    coordinates: '30.05°N / 31.23°E',
    events: [
      { year: '1798 م', title: 'الحملة الفرنسية', description: 'الطباعة والعلم الحديث يدخلان مصر.' },
      { year: '1805 م', title: 'محمد علي باشا', description: 'جيش قوي، مدارس حديثة، وبعثات علمية لأوروبا.' },
      { year: '1882 م', title: 'الاحتلال البريطاني', description: 'تبدأ رحلة المقاومة الوطنية.' },
      { year: '1919 م', title: 'ثورة 1919', description: 'سعد زغلول والوفد — الشعب كله جبهة واحدة.' },
    ],
  },
  {
    id: 'contemporary',
    title: 'العصر المعاصر',
    range: '1952 م — اليوم',
    description: 'الجمهورية المصرية — استقلال، بناء، وتحرير الأرض في أكتوبر المجيد.',
    glyph: '🦅',
    coordinates: '30.04°N / 31.24°E',
    events: [
      { year: '1952 م', title: 'ثورة 23 يوليو', description: 'إنهاء الملكية وإعلان الجمهورية.' },
      { year: '1973 م', title: 'نصر أكتوبر', description: 'استعادة سيناء وكرامة الوطن.' },
    ],
  },
];

const STOPS = [
  {
    year: '1798',
    title: 'الحملة الفرنسية',
    description: 'وصلت الحملة الفرنسية بقيادة نابليون إلى مصر، وجاء معها العلم الحديث — الطباعة والمطبعة والبعثات العلمية.',
    details: ['مطبعة بولاق', 'المجمع العلمي', 'بداية الوعي الحديث'],
  },
  {
    year: '1805',
    title: 'تولى محمد علي باشا الحكم',
    description: 'بداية عصر النهضة — بنى جيشاً قوياً، ومدارس حديثة، وأرسل البعثات العلمية لأوروبا.',
    details: ['الأسطول الحربي', 'مدرسة الألسن', 'الري والزراعة'],
  },
  {
    year: '1882',
    title: 'الاحتلال البريطاني',
    description: 'دخل الجيش البريطاني مصر، وبدأ الكفاح الوطني يتحول لمنظم — الثورة العرابية كانت أول مواجهة كبرى.',
    details: ['الثورة العرابية', 'المقاومة الشعبية', 'أحمد عرابي'],
  },
  {
    year: '1919',
    title: 'ثورة 1919',
    description: 'ثورة شعبية شاملة قادها سعد زغلول والوفد المصري — المساجد والكنائس والمحاكم اجتمعت على كلمة واحدة.',
    details: ['سعد زغلول', 'الوفد المصري', 'وحدة الشعب'],
  },
  {
    year: '1952',
    title: 'ثورة 23 يوليو',
    description: 'ثورة الضباط الأحرار أنهت الملكية وأعلنت الجمهورية، وبدأ عهد جديد من الإصلاح الزراعي والصناعي.',
    details: ['الضباط الأحرار', 'إلغاء الملكية', 'الإصلاح الاجتماعي'],
  },
];

export default function HistoryTimelinePage() {
  const progressRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen pb-28">
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-deep py-24 text-center text-white">
        <div className="map-grid absolute inset-0 opacity-50" />
        <CoordinateLabel
          latitude={{ degrees: 30, minutes: 3, hemisphere: 'N' }}
          longitude={{ degrees: 31, minutes: 14, hemisphere: 'E' }}
          ambient
          className="absolute top-10 start-8 hidden md:inline-flex"
        />
        <div className="relative z-10 mx-auto max-w-3xl px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="mb-6 flex justify-center"
          >
            <CompassBrand size="medium" animated />
          </motion.div>
          <h1 className="display-serif text-4xl font-bold text-white sm:text-5xl">
            خط زمني في <span className="text-gold-bright">حكاية</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
            خريطة تاريخ مصر الحديثة — من الحملة الفرنسية لثورة يوليو. اسحب الخط تحت وإنت هتشوف المحطات بتتفتح واحدة واحدة.
          </p>
        </div>
      </section>

      {/* Progress bar */}
      <div ref={progressRef} className="sticky top-16 z-30 border-b border-border-soft bg-background/80 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4">
          <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-border-soft">
            <motion.div
              className="absolute inset-y-0 start-0 rounded-full bg-gold"
              initial={{ width: 0 }}
              whileInView={{ width: '100%' }}
              viewport={{ root: progressRef }}
              transition={{ duration: 2, ease: 'easeInOut' }}
            />
          </div>
          <span className="font-plex whitespace-nowrap text-[10px] tracking-[0.2em] text-text-muted" dir="ltr">
            1798 – 1952
          </span>
        </div>
      </div>

      <HistoricalDivider />

      {/* Timeline */}
      <section className="mx-auto max-w-3xl px-4">
        <HistoricalSectionHeader number="01" title="محطات الحكاية" subtitle="THE STOPS" align="center" />

        <div className="mt-14">
          <HistoricalTimeline
            items={STOPS.map((s) => ({
              id: s.year,
              year: s.year,
              title: s.title,
              description: s.description,
              details: s.details,
            }))}
          />
        </div>
      </section>

      <HistoricalDivider />

      {/* Interactive eras timeline */}
      <section className="mx-auto max-w-4xl px-4 py-20">
        <HistoricalSectionHeader number="02" title="عصور التاريخ" subtitle="THE ERAS" align="center">
          اتحرك بالخط تحت — كل عصر بيفتح حكايته، وكل حدث بيظهر في موعده.
        </HistoricalSectionHeader>
        <InteractiveTimeline eras={ERAS} className="mt-14" />
      </section>

      <HistoricalDivider />

      {/* Epilogue */}
      <Reveal className="mx-auto mt-20 max-w-2xl px-4 text-center">
        <div className="coordinates-frame rounded-lg border border-gold/25 bg-parchment-soft p-8">
          <p className="text-base leading-loose text-text-primary">
            من 1798 لحد 1952... ولا يوم من الأيام كان مصادفة.
            <br />
            كل محطة بنتها ناس استخدموا عقولهم وقلوبهم عشان مصر.
            <br />
            <span className="font-bold text-gold">وإنت دلوقتي في محطة "الفهم" — مبروك وصلت!</span>
          </p>
        </div>
      </Reveal>
    </div>
  );
}
