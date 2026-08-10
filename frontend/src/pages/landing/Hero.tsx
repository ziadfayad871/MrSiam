import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowLeft, Compass, MapPin } from 'lucide-react';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass as CompassBrand } from '../../design-system/components/Compass';
import CoordinateLabel from '../../design-system/components/CoordinateLabel';
import { HistoricalMap } from '../../design-system/components/map/HistoricalMap';
import { Button } from '../../design-system/ui/Button';
import { usePrefersReducedMotion } from '../../design-system/motion/hooks';

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const navigate = useNavigate();

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const mapY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0.15]);

  return (
    <section ref={ref} className="relative overflow-hidden bg-navy-deep text-white">
      {/* Base map */}
      <motion.div className="absolute inset-0" style={reduced ? undefined : { y: mapY }}>
        <HistoricalMap
          style="world"
          showGraticule
          animated={!reduced}
          className="opacity-90"
          markers={[
            { id: 'cairo', x: 42, y: 33, label: 'القاهرة', state: 'current' },
            { id: 'paris', x: 40, y: 14, label: 'باريس', state: 'discovered' },
            { id: 'london', x: 36, y: 10, label: 'لندن', state: 'discovered' },
            { id: 'rome', x: 45, y: 18, label: 'روما', state: 'discovered' },
            { id: 'athens', x: 49, y: 17, label: 'أثينا', state: 'discovered' },
            { id: 'mekka', x: 55, y: 25, label: 'مكة', state: 'discovered' },
          ]}
          routes={[
            { id: 'route1', points: [[42, 33], [40, 14], [36, 10]] },
            { id: 'route2', points: [[42, 33], [45, 18], [49, 17]] },
            { id: 'route3', points: [[42, 33], [55, 25]] },
          ]}
        />
      </motion.div>

      {/* Vignette for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-deep/55 via-navy-deep/35 to-navy-deep" />

      {/* Coordinates ambience */}
      <CoordinateLabel
        latitude={{ degrees: 30, minutes: 3, hemisphere: 'N' }}
        longitude={{ degrees: 31, minutes: 14, hemisphere: 'E' }}
        ambient
        className="absolute top-8 start-6 hidden sm:inline-flex"
      />
      <CoordinateLabel
        latitude={{ degrees: 31, minutes: 12, hemisphere: 'N' }}
        longitude={{ degrees: 29, minutes: 58, hemisphere: 'E' }}
        ambient
        className="absolute bottom-24 end-6 hidden sm:inline-flex"
      />
      <span className="absolute top-24 end-10 hidden font-plex text-[10px] tracking-[0.3em] text-white/25 md:block" dir="ltr">
        1798 · 1805 · 1882 · 1952
      </span>

      {/* Compass — small rotating dial */}
      <motion.div
        className="absolute start-10 top-1/3 hidden opacity-60 lg:block"
        animate={reduced ? undefined : { rotate: [0, 180, 360] }}
        transition={{ duration: 90, ease: 'linear', repeat: Infinity }}
      >
        <CompassBrand size="large" animated />
      </motion.div>

      {/* Content */}
      <motion.div
        className="relative z-10 mx-auto flex min-h-[92vh] max-w-4xl flex-col items-center justify-center px-4 py-24 text-center"
        style={reduced ? undefined : { y: textY, opacity }}
      >
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mb-8 flex items-center gap-3"
        >
          <CompassBrand size="hero" animated route />
        </motion.div>

        <motion.p
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="font-plex mb-5 text-[11px] font-semibold uppercase tracking-[0.42em] text-gold-bright"
          dir="ltr"
        >
          The Digital Atlas of Education
        </motion.p>

        <motion.h1
          initial={reduced ? false : { opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="display-serif text-4xl font-bold leading-[1.5] text-white sm:text-5xl md:text-6xl md:leading-[1.4]"
        >
          التاريخ مش مجرد تواريخ...
          <br />
          <span className="text-gold-bright">التاريخ حكاية لازم تعيشها.</span>
        </motion.h1>

        <motion.p
          initial={reduced ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.8 }}
          className="mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg"
        >
          مع مستر محمد صيام — افهم التاريخ، اقرأ الخريطة، واصنع تفوقك.
        </motion.p>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Button
            variant="gold"
            size="lg"
            onClick={() => navigate('/login')}
            icon={<ArrowLeft size={18} />}
            className="text-base"
          >
            ابدأ رحلتك
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/teacher-profile')}
            className="border-white/25 text-white hover:border-gold hover:text-gold"
          >
            اكتشف مستر محمد صيام
          </Button>
        </motion.div>

        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 1 }}
          className="mt-14 flex items-center gap-6 text-[11px] text-white/40"
        >
          <span className="flex items-center gap-1.5">
            <MapPin size={12} className="text-gold" /> 12+ عاماً من التدريس
          </span>
          <span className="h-1 w-1 rounded-full bg-white/25" />
          <span className="flex items-center gap-1.5">
            <Compass size={12} className="text-gold" /> آلاف الطلاب
          </span>
          <span className="h-1 w-1 rounded-full bg-white/25" />
          <span>إعدادية · ثانوية</span>
        </motion.div>
      </motion.div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}

export default Hero;
