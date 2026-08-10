import { motion } from 'motion/react';
import { useRef } from 'react';
import { Compass as CompassBrand } from '../design-system/components/Compass';
import CoordinateLabel from '../design-system/components/CoordinateLabel';
import { HistoricalDivider } from '../design-system/components/HistoricalDivider';
import { HistoricalTimeline } from '../design-system/components/HistoricalTimeline';
import { HistoricalSectionHeader } from '../design-system/components/HistoricalSectionHeader';
import { Reveal } from '../design-system/motion/Reveal';

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
