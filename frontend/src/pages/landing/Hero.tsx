import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowLeft, Compass, MapPin } from 'lucide-react';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandLogo } from '../../design-system/components/BrandLogo';
import { Compass as CompassBrand } from '../../design-system/components/Compass';
import CoordinateLabel from '../../design-system/components/CoordinateLabel';
import { RealWorldMap } from '../../design-system/components/map/RealWorldMap';
import { Button } from '../../design-system/ui/Button';
import { usePrefersReducedMotion } from '../../design-system/motion/hooks';

const WORLD_MARKERS = [
  { id: 'cairo', lat: 30.05, lng: 31.23, label: 'القاهرة', state: 'current' as const },
  { id: 'paris', lat: 48.86, lng: 2.35, label: 'باريس', state: 'discovered' as const },
  { id: 'london', lat: 51.51, lng: -0.13, label: 'لندن', state: 'discovered' as const },
  { id: 'rome', lat: 41.9, lng: 12.5, label: 'روما', state: 'discovered' as const },
  { id: 'athens', lat: 37.98, lng: 23.73, label: 'أثينا', state: 'discovered' as const },
  { id: 'mekka', lat: 21.42, lng: 39.83, label: 'مكة', state: 'discovered' as const },
];

const WORLD_ROUTES = [
  { id: 'route1', points: [[30.05, 31.23], [48.86, 2.35], [51.51, -0.13]] as [number, number][] },
  { id: 'route2', points: [[30.05, 31.23], [41.9, 12.5], [37.98, 23.73]] as [number, number][] },
  { id: 'route3', points: [[30.05, 31.23], [21.42, 39.83]] as [number, number][] },
];

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
      {/* Base map — real world cartography (atlas tiles) */}
      <motion.div className="absolute inset-0" style={reduced ? undefined : { y: mapY }}>
        <RealWorldMap
          tileStyle="light"
          animated={!reduced}
          markers={WORLD_MARKERS}
          routes={WORLD_ROUTES}
        />
      </motion.div>

      {/* Soft top/bottom fades — keep the atlas clearly visible */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-background/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background/70 to-transparent" />

      {/* Coordinates ambience */}
      <CoordinateLabel
        latitude={{ degrees: 30, minutes: 3, hemisphere: 'N' }}
        longitude={{ degrees: 31, minutes: 14, hemisphere: 'E' }}
        ambient
        className="absolute top-10 start-6 hidden sm:inline-flex"
      />
      <CoordinateLabel
        latitude={{ degrees: 31, minutes: 12, hemisphere: 'N' }}
        longitude={{ degrees: 29, minutes: 58, hemisphere: 'E' }}
        ambient
        className="absolute bottom-28 end-6 hidden sm:inline-flex"
      />
      <span className="absolute top-24 end-10 hidden font-plex text-[10px] tracking-[0.3em] text-navy-deep/40 md:block" dir="ltr">
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

      {/* Content — dark glass panel over the atlas map */}
      <motion.div
        className="relative z-10 mx-auto flex min-h-[92vh] max-w-4xl flex-col items-center justify-center px-4 py-24 text-center"
        style={reduced ? undefined : { y: textY, opacity }}
      >
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="w-full max-w-3xl rounded-2xl border border-gold/25 bg-navy-deep/85 px-6 py-12 shadow-[0_24px_80px_rgba(8,14,28,0.55)] backdrop-blur-md sm:px-12"
        >
          <div className="mb-10">
            <BrandLogo variant="hero" imageSrc="/mr-siam-logo.jpeg" />
          </div>

          <motion.h1
            initial={reduced ? false : { opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="display-serif text-3xl font-bold leading-[1.6] text-white sm:text-4xl md:text-5xl md:leading-[1.5]"
          >
            التاريخ مش مجرد أحداث...
            <br />
            <span className="text-gold-bright">التاريخ حكايات وقصة لازم تعيشها</span>
            <br />
            <span className="text-xl font-semibold text-white/80 md:text-2xl">وتفاصيلها مع مستر صيمو.</span>
          </motion.h1>

          {/* Brand tagline */}
          <motion.p
            initial={reduced ? false : { opacity: 0, scale: 0.95, letterSpacing: '0.1em' }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.78, duration: 0.7 }}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-5 py-1.5 text-sm font-bold text-gold-bright"
          >
            مع أبو كيان .. الدراسات في أمان
          </motion.p>

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
            className="mt-12 flex items-center justify-center gap-6 text-[11px] text-white/40"
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
      </motion.div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}

export default Hero;
