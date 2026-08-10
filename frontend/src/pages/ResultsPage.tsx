import { motion } from 'motion/react';
import { ArrowLeft, Compass, Flag, MapPin, Trophy } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { AchievementBadge } from '../design-system/components/AchievementBadge';
import { Compass as CompassBrand } from '../design-system/components/Compass';
import CoordinateLabel from '../design-system/components/CoordinateLabel';
import { Button } from '../design-system/ui/Button';
import { Card } from '../design-system/ui/Card';
import { EmptyState } from '../design-system/ui/EmptyState';
import type { AttemptResultDto } from '../lib/types';

function ScoreRing({ percentage, totalMarks }: { percentage: number; totalMarks: number }) {
  const r = 56;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - percentage / 100);
  const passed = percentage >= 50;

  return (
    <div className="relative flex h-40 w-40 items-center justify-center">
      <svg viewBox="0 0 128 128" className="h-40 w-40 -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-border-soft" />
        <motion.circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          className={passed ? 'text-gold' : 'text-error'}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="display-serif text-4xl font-bold text-text-primary">{percentage}%</p>
        <p className="text-[10px] text-text-muted">من {totalMarks} درجة</p>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const location = useLocation();
  const result = useMemo<AttemptResultDto | null>(() => {
    const fromState = (location.state as { result?: AttemptResultDto } | null)?.result;
    if (fromState) return fromState;
    try {
      const raw = sessionStorage.getItem('mrsiam_last_result');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as AttemptResultDto;
      return String(parsed.attemptId) === attemptId ? parsed : null;
    } catch {
      return null;
    }
  }, [location.state, attemptId]);

  if (!result) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <EmptyState
          icon="map"
          title="مفيش نتيجة متاحة"
          description="النتيجة دي خلصت من سجل الجلسة — خد امتحان جديد وشوف نتيجتك!"
        />
        <Link to="/courses" className="mt-6">
          <Button variant="gold">المواد والامتحانات</Button>
        </Link>
      </div>
    );
  }

  const passed = result.passed;
  const grade =
    result.percentage >= 90
      ? 'ممتاز — إنت مستكشف من الطراز الأول!'
      : result.percentage >= 75
        ? 'جيد جداً — خليك على الوتيرة دي!'
        : result.percentage >= 50
          ? 'جيد — المحطة وصلت، كمّل!'
          : 'لسه الطريق طويل — راجِع الدرس وجرب تاني.';

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Card variant="map" className="relative overflow-hidden text-center">
        <CoordinateLabel
          latitude={{ degrees: 31, minutes: 15, hemisphere: 'N' }}
          longitude={{ degrees: 32, minutes: 18, hemisphere: 'E' }}
          ambient
          className="absolute top-5 start-5"
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex flex-col items-center px-4 py-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.2 }}
          >
            <CompassBrand size="navigation" animated={!passed} direction={passed ? 'ne' : 'sw'} route />
          </motion.div>

          <p className="mt-6 font-plex text-[10px] uppercase tracking-[0.35em] text-gold" dir="ltr">
            {passed ? 'Destination Reached' : 'Route Recalculating'}
          </p>
          <h1 className="display-serif mt-2 text-2xl font-bold text-text-primary sm:text-3xl">
            {passed ? 'وصلت للمحطة!' : 'مفيش مشكلة — البوصلة بتتظبط'}
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-text-secondary">{grade}</p>

          <div className="mt-8 flex items-center justify-center gap-10">
            <ScoreRing percentage={result.percentage} totalMarks={result.totalMarks} />
          </div>

          <div className="mt-8 grid w-full max-w-md grid-cols-3 gap-3 text-center">
            <div className="rounded-md border border-border-soft bg-surface px-2 py-3">
              <p className="text-xl font-bold text-text-primary">{result.correctCount}</p>
              <p className="text-[10px] text-text-muted">إجابات صحيحة</p>
            </div>
            <div className="rounded-md border border-border-soft bg-surface px-2 py-3">
              <p className="text-xl font-bold text-error">{result.wrongCount}</p>
              <p className="text-[10px] text-text-muted">خطأ</p>
            </div>
            <div className="rounded-md border border-border-soft bg-surface px-2 py-3">
              <p className="text-xl font-bold text-text-muted">{result.skippedCount}</p>
              <p className="text-[10px] text-text-muted">مُتخطى</p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-sm font-bold text-gold">
            <Trophy size={15} />
            ترتيبك: {result.rank} في القافلة · {result.score}/{result.totalMarks} درجة
          </div>
        </motion.div>
      </Card>

      {/* Achievements unlocked */}
      {result.unlockedAchievements.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }} className="mt-8">
          <Card className="p-6 text-center">
            <p className="flex items-center justify-center gap-2 text-lg font-bold text-gold">
              <Flag size={18} /> اكتشاف جديد!
            </p>
            <p className="mt-1 text-xs text-text-muted">فتحت ميدالية جديدة في خريطتك</p>
            <div className="mt-5 flex flex-wrap justify-center gap-4">
              {result.unlockedAchievements.map((a, i) => (
                <AchievementBadge key={a.id} title={a.title} icon={a.icon} description={a.description} unlocked />
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Next stop */}
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.6 }} className="mt-8">
        <Card className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:justify-between sm:text-start">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
              <MapPin size={18} className="text-gold" />
            </div>
            <div>
              <p className="font-plex text-[10px] uppercase tracking-[0.3em] text-gold" dir="ltr">
                Next Stop
              </p>
              <p className="mt-1 text-base font-bold text-text-primary">{result.nextStop}</p>
            </div>
          </div>
          <Link to="/dashboard">
            <Button variant="gold" icon={<Compass size={16} />}>
              كمل الرحلة
            </Button>
          </Link>
        </Card>
      </motion.div>

      <div className="mt-8 flex justify-center gap-2">
        <Link to="/courses">
          <Button variant="outline" icon={<ArrowLeft size={15} className="rotate-180" />}>
            المواد
          </Button>
        </Link>
        <Link to="/achievements">
          <Button variant="ghost">كل الميداليات</Button>
        </Link>
      </div>
    </div>
  );
}
