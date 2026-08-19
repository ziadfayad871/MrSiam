import { ArrowLeft, CheckCircle2, ClipboardList, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CompassLoader } from '../design-system/components/CompassLoader';
import { Badge } from '../design-system/ui/Badge';
import { Button } from '../design-system/ui/Button';
import { Card } from '../design-system/ui/Card';
import { EmptyState } from '../design-system/ui/EmptyState';
import { ErrorState } from '../design-system/ui/ErrorState';
import { Progress } from '../design-system/ui/Progress';
import { useToast } from '../design-system/ui/Toast';
import { api } from '../lib/api';
import type { AssignmentDetailDto, AssignmentSubmissionResultDto } from '../lib/types';

export default function AssignmentTakePage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { toast } = useToast();
  const [detail, setDetail] = useState<AssignmentDetailDto | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    api
      .get<AssignmentDetailDto>(`/assignments/${assignmentId}`)
      .then(setDetail)
      .catch((e) => setError(e instanceof Error ? e.message : 'فشل تحميل الواجب'))
      .finally(() => setLoading(false));
  }, [assignmentId]);

  function toggleOption(order: number, index: number) {
    setAnswers((prev) => {
      const next = { ...prev };
      if (next[order] === index) delete next[order];
      else next[order] = index;
      return next;
    });
  }

  async function submit() {
    if (!detail) return;
    setSubmitting(true);
    try {
      const result = await api.post<AssignmentSubmissionResultDto>(`/assignments/${detail.id}/submit`, {
        answers: detail.questions.map((q) => ({ order: q.order, selectedIndex: answers[q.order] ?? null })),
      });
      setDetail({ ...detail, submitted: true, mySubmission: result });
      toast('تم تسليم الواجب بنجاح', '', 'success');
    } catch (err) {
      toast('خطأ', err instanceof Error ? err.message : 'فشل إرسال الإجابات', 'error');
    } finally {
      setSubmitting(false);
      setConfirming(false);
    }
  }

  if (loading) return <CompassLoader text="بنجهز ورقة الواجب..." />;
  if (error) return <ErrorState title={error} onRetry={() => window.location.reload()} />;
  if (!detail) return <EmptyState icon="map" title="مفيش واجب" description="مفيش واجب بالكود ده." />;

  const answered = Object.keys(answers).length;
  const done = detail.submitted && detail.mySubmission;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
            <ClipboardList size={18} className="text-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">{detail.title}</h1>
            <p className="text-xs text-text-muted">
              {detail.questionCount} سؤال · كل سؤال باختياراتك {detail.description ? '· ' + detail.description : ''}
            </p>
          </div>
        </div>
        {detail.dueDate && (
          <Badge variant="warning">آخر موعد: {new Date(detail.dueDate).toLocaleDateString('ar-EG')}</Badge>
        )}
      </div>

      {done && detail.mySubmission ? (
        <div className="mt-6">
          <Card className="p-6 text-center">
            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full border ${
                detail.mySubmission.passed ? 'border-success/40 bg-success/10' : 'border-gold/40 bg-gold/10'
              }`}
            >
              {detail.mySubmission.passed ? <CheckCircle2 size={28} className="text-success" /> : <ArrowLeft size={28} className="text-gold" />}
            </div>
            <h2 className="mt-4 text-2xl font-extrabold text-text-primary">
              {detail.mySubmission.score}/{detail.mySubmission.totalQuestions}
            </h2>
            <p className="mt-1 text-sm text-text-muted">{detail.mySubmission.percentage}٪</p>
            <p className="mt-3 text-sm font-semibold text-text-secondary">
              {detail.mySubmission.passed ? 'الواجب اتحل صح — مبروك!' : 'النتيجة كويسة — راجع اجاباتك تحت'}
            </p>
          </Card>

          <div className="mt-6 flex flex-col gap-4">
            {detail.mySubmission.answers.map((a) => (
              <Card key={a.order} className="p-4">
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      a.isCorrect ? 'border border-success/40 bg-success/10 text-success' : 'border border-error/40 bg-error/10 text-error'
                    }`}
                  >
                    {a.isCorrect ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-primary">{detail.questions.find((q) => q.order === a.order)?.label ?? `السؤال ${a.order}`}</p>
                    <p className="mt-1.5 text-xs text-text-secondary">
                      {a.isSkipped ? (
                        <>سُبت من غير إجابة · الإجابة الصحيحة: <b className="text-success">{a.correctLetter}</b></>
                      ) : a.isCorrect ? (
                        <>إجابتك: <b className="text-success">{a.selectedLetter}</b> ✓</>
                      ) : (
                        <>إجابتك: <b className="text-error">{a.selectedLetter}</b> · الصحيحة: <b className="text-success">{a.correctLetter}</b></>
                      )}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link to={`/courses/${detail.courseId}`} className="text-sm font-semibold text-gold underline underline-offset-2">
              ارجع لصفحة الكورس
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-5">
            <Progress value={Math.round((answered / detail.questions.length) * 100)} label={`جاوبت على ${answered} من ${detail.questions.length}`} />
          </div>

          <div className="mt-8 flex flex-col gap-6">
            {detail.questions.map((q) => (
              <Card key={q.order} className="p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-xs font-bold text-gold">
                    {q.order}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold leading-relaxed text-text-primary sm:text-base">{q.label}</p>
                    <div className="mt-4 flex flex-col gap-2">
                      {q.options.map((letter, idx) => {
                        const selected = answers[q.order] === idx;
                        return (
                          <button
                            key={idx}
                            onClick={() => toggleOption(q.order, idx)}
                            className={`flex items-center gap-3 rounded-md border px-4 py-3 text-start text-sm transition-all ${
                              selected
                                ? 'border-gold bg-gold/10 text-gold'
                                : 'border-border-soft bg-surface text-text-secondary hover:border-gold/40 hover:text-text-primary'
                            }`}
                          >
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                                selected ? 'border-gold bg-gold' : 'border-border-soft'
                              }`}
                            >
                              {selected && <span className="h-1.5 w-1.5 rounded-full bg-navy-deep" />}
                            </span>
                            {letter}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="sticky bottom-4 mt-10 flex items-center justify-between gap-4 rounded-lg border border-gold/25 bg-background/90 p-4 shadow-floating backdrop-blur-md">
            <p className="text-xs text-text-muted">
              {answered === detail.questions.length ? 'جاهز للتسليم — خليك واثق من إجاباتك!' : `لسه فيه ${detail.questions.length - answered} سؤال من غير إجابة`}
            </p>
            <div className="flex gap-2">
              <Link to={`/courses/${detail.courseId}`} className="flex items-center rounded-md border border-border-soft px-4 py-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface">
                رجوع
              </Link>
              <Button variant="gold" loading={submitting} disabled={answered < detail.questions.length} onClick={() => setConfirming(true)}>
                سلّم الواجب
              </Button>
            </div>
          </div>

          {confirming && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/70 p-4 backdrop-blur-sm">
              <Card className="w-full max-w-sm p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
                  <ClipboardList size={20} className="text-gold" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-text-primary">متأكد من التسليم؟</h3>
                <p className="mt-2 text-sm text-text-secondary">
                  سلمت {answered} من {detail.questions.length} سؤال. بعد التسليم مش هتقدر تعدّل إجاباتك.
                </p>
                <div className="mt-6 flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setConfirming(false)}>
                    راجِع تاني
                  </Button>
                  <Button variant="gold" className="flex-1" loading={submitting} onClick={submit}>
                    سلّم
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}