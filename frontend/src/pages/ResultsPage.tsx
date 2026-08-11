import { motion } from 'motion/react';
import { ArrowLeft, BookOpenCheck, Check, Compass, Flag, MapPin, Trophy, X as XIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { AchievementBadge } from '../design-system/components/AchievementBadge';
import { Compass as CompassBrand } from '../design-system/components/Compass';
import CoordinateLabel from '../design-system/components/CoordinateLabel';
import { HistoryMadeOverlay } from '../design-system/motion/HistoryMadeOverlay';
import { Button } from '../design-system/ui/Button';
import { Card } from '../design-system/ui/Card';
import { EmptyState } from '../design-system/ui/EmptyState';
import { Modal } from '../design-system/ui/Modal';
import type { AttemptResultDto, ExamReviewDto } from '../lib/types';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';

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
  const [celebrated, setCelebrated] = useState(false);
  const [review, setReview] = useState<ExamReviewDto | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const { user } = useAuth();
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
  const openReview = async () => {
    setReviewLoading(true);
    try {
      const r = await api.get<ExamReviewDto>(`/student/exams/${result.examId}/attempts/${result.attemptId}/review`);
      setReview(r);
    } catch (e) {
      setReview(null);
      window.alert(e instanceof Error ? e.message : 'المراجعة مش متاحة دلوقتي');
    } finally {
      setReviewLoading(false);
    }
  };
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
      {/* Big unlock moment — full-screen history inscription */}
      <HistoryMadeOverlay
        open={passed && result.unlockedAchievements.length > 0 && !celebrated}
        studentName={user?.fullName ?? 'بطل'}
        examTitle={result.examTitle}
        percentage={result.percentage}
        achievement={result.unlockedAchievements[0]?.title}
        onComplete={() => setCelebrated(true)}
      />

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
        <button
          onClick={() => void openReview()}
          disabled={reviewLoading}
          className="flex items-center gap-1.5 rounded-md bg-gold px-4 py-2 text-xs font-bold text-navy-deep transition-colors hover:bg-gold/90 disabled:opacity-50"
        >
          <BookOpenCheck size={15} /> {reviewLoading ? 'بنجيب المراجعة...' : 'راجع إجاباتك'}
        </button>
        <Link to="/courses">
          <Button variant="outline" icon={<ArrowLeft size={15} className="rotate-180" />}>
            المواد
          </Button>
        </Link>
        <Link to="/achievements">
          <Button variant="ghost">كل الميداليات</Button>
        </Link>
      </div>

      {/* Exam review modal */}
      <Modal open={review !== null} onClose={() => setReview(null)} title={`مراجعة: ${review?.examTitle ?? ''}`} size="lg">
        {review && (
          <div className="flex flex-col gap-4">
            {!review.allowReview ? (
              <p className="py-4 text-center text-sm text-text-muted">المدرّس قفل المراجعة على الامتحان ده دلوقتي — راجع لاحقاً.</p>
            ) : review.items.length === 0 ? (
              <p className="py-4 text-center text-sm text-text-muted">مفيش تفاصيل مراجعة متاحة للامتحان ده.</p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-gold/30 bg-gold/5 px-3 py-2 text-xs">
                  <span className="font-bold text-text-primary">النتيجة: {review.percentage}%</span>
                  <span className={`rounded-full px-2 py-0.5 font-bold ${review.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {review.passed ? 'ناجح ✓' : 'محتاجة مراجعة'}
                  </span>
                  {!review.showCorrectAnswers && <span className="text-text-muted">(الإجابات الصحيحة مخفية)</span>}
                </div>
                {review.items.map((item) => (
                  <div key={item.questionId} className="rounded-md border border-border-soft p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-text-primary">{item.questionText}</p>
                      {item.isSkipped ? (
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">متخطى</span>
                      ) : item.isCorrect ? (
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          <Check size={10} /> صح
                        </span>
                      ) : (
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                          <XIcon size={10} /> خطأ
                        </span>
                      )}
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {item.studentAnswerText && (
                        <div className={`rounded-md border px-3 py-1.5 ${item.isCorrect && !item.isSkipped ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                          <p className="text-[10px] font-bold text-text-muted">إجابتك</p>
                          <p className="text-xs text-text-secondary">{item.studentAnswerText}</p>
                        </div>
                      )}
                      {item.correctAnswerText && review.showCorrectAnswers && (
                        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5">
                          <p className="text-[10px] font-bold text-emerald-700">الإجابة الصحيحة</p>
                          <p className="text-xs text-text-secondary">{item.correctAnswerText}</p>
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-[10px] text-text-muted">الدرس: {item.lessonTitle}</p>
                    {item.explanation && review.showCorrectAnswers && (
                      <p className="mt-1.5 rounded-md bg-parchment-soft px-3 py-1.5 text-xs leading-relaxed text-text-secondary">{item.explanation}</p>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
