import { FileText, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CompassLoader } from '../design-system/components/CompassLoader';
import { Badge } from '../design-system/ui/Badge';
import { Button } from '../design-system/ui/Button';
import { Card } from '../design-system/ui/Card';
import { EmptyState } from '../design-system/ui/EmptyState';
import { ErrorState } from '../design-system/ui/ErrorState';
import { Progress } from '../design-system/ui/Progress';
import { useToast } from '../design-system/ui/Toast';
import { api } from '../lib/api';
import type { AttemptResultDto, ExamDetailDto } from '../lib/types';

interface Answer {
  questionId: number;
  selectedOptionId?: number;
}

export default function ExamPage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [exam, setExam] = useState<ExamDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    api
      .get<ExamDetailDto>(`/exams/${examId}`)
      .then(setExam)
      .catch((e) => setError(e instanceof Error ? e.message : 'فشل تحميل الامتحان'))
      .finally(() => setLoading(false));
  }, [examId]);

  function toggleOption(questionId: number, optionId: number) {
    setAnswers((prev) => {
      const next = { ...prev };
      if (next[questionId] === optionId) delete next[questionId];
      else next[questionId] = optionId;
      return next;
    });
  }

  async function submit() {
    if (!exam) return;
    setSubmitting(true);
    try {
      const payload: Answer[] = exam.questions.map((q) =>
        answers[q.id] !== undefined ? { questionId: q.id, selectedOptionId: answers[q.id] } : { questionId: q.id },
      );
      const result = await api.post<AttemptResultDto>(`/exams/${exam.id}/attempts`, {
        examId: exam.id,
        answers: payload,
      });
      sessionStorage.setItem('mrsiam_last_result', JSON.stringify(result));
      navigate(`/results/${result.attemptId}`, { state: { result } });
    } catch (err) {
      toast('خطأ', err instanceof Error ? err.message : 'فشل إرسال الإجابات', 'error');
    } finally {
      setSubmitting(false);
      setConfirming(false);
    }
  }

  if (loading) return <CompassLoader text="بنجهز ورقة الأسئلة..." />;
  if (error) return <ErrorState title={error} onRetry={() => window.location.reload()} />;
  if (!exam) return <EmptyState icon="map" title="مفيش امتحان" description="مفيش امتحان بالكود ده." />;

  const answered = Object.keys(answers).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* Exam header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
            <FileText size={18} className="text-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">{exam.title}</h1>
            <p className="text-xs text-text-muted">{exam.questions.length} سؤال · {exam.totalMarks} درجة · {exam.durationMinutes} دقيقة</p>
          </div>
        </div>
        <Badge variant="gold">{exam.type}</Badge>
      </div>

      <div className="mt-5">
        <Progress value={Math.round((answered / exam.questions.length) * 100)} label={`أجبت على ${answered} من ${exam.questions.length}`} />
      </div>

      {/* Questions */}
      <div className="mt-8 flex flex-col gap-6">
        {exam.questions.map((q, qi) => (
          <Card key={q.id} className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-xs font-bold text-gold">
                {qi + 1}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold leading-relaxed text-text-primary sm:text-base">{q.text}</p>
                <p className="mt-1 text-[11px] text-text-muted">{q.marks} درجة</p>

                <div className="mt-4 flex flex-col gap-2">
                  {q.options.map((opt) => {
                    const selected = answers[q.id] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => toggleOption(q.id, opt.id)}
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
                        {opt.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Submit */}
      <div className="sticky bottom-4 mt-10 flex items-center justify-between gap-4 rounded-lg border border-gold/25 bg-background/90 p-4 shadow-floating backdrop-blur-md">
        <p className="text-xs text-text-muted">
          {answered === exam.questions.length ? 'جاهز للإبحار — خليك واثق من إجاباتك!' : `لسه فيه ${exam.questions.length - answered} سؤال من غير إجابة`}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            رجوع
          </Button>
          <Button variant="gold" loading={submitting} disabled={answered < exam.questions.length} onClick={() => setConfirming(true)}>
            سلّم إجاباتك
          </Button>
        </div>
      </div>

      {/* Confirm modal */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/70 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-sm p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
              <ArrowLeft size={20} className="text-gold" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-text-primary">متأكد من التسليم؟</h3>
            <p className="mt-2 text-sm text-text-secondary">
              سلمت {answered} من {exam.questions.length} سؤال. بعد التسليم مش هتقدر تعدّل إجاباتك.
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
    </div>
  );
}
