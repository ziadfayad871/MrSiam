import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '../../design-system/ui/Button';
import Input from '../../design-system/ui/Field';
import { useToast } from '../../design-system/ui/Toast';
import { api } from '../../lib/api';
import type { AssignmentDto, LessonDto } from '../../lib/types';

const CHOICE_LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ'];

export function AssignmentForm({
  courseId,
  editing,
  onDone,
  onCancel,
  submitLabel,
  onDirtyChange,
  defaultLessonId,
  initialCorrectAnswers,
}: {
  courseId: number;
  editing: AssignmentDto | null;
  onDone: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  onDirtyChange?: (dirty: boolean) => void;
  defaultLessonId?: number;
  initialCorrectAnswers?: number[];
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: editing?.title ?? '',
    description: editing?.description ?? '',
    dueDate: editing?.dueDate ? editing.dueDate.slice(0, 10) : '',
    lessonId: editing?.lessonId ? String(editing.lessonId) : defaultLessonId ? String(defaultLessonId) : '',
  });
  const [enableQuestions, setEnableQuestions] = useState(editing?.hasQuestions ?? false);
  const [questionCount, setQuestionCount] = useState(editing?.questionCount ?? 5);
  const [choicesPerQuestion, setChoicesPerQuestion] = useState(editing?.choicesPerQuestion ?? 4);
  const [correctAnswers, setCorrectAnswers] = useState<number[]>(
    initialCorrectAnswers?.length ? initialCorrectAnswers : Array(editing?.questionCount ?? 5).fill(0),
  );
  const [lessons, setLessons] = useState<LessonDto[]>([]);
  const [saving, setSaving] = useState(false);
  const initialRef = useRef(form);

  useEffect(() => {
    api
      .get<LessonDto[]>(`/courses/${courseId}/lessons`)
      .then(setLessons)
      .catch(() => setLessons([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const isDirty =
    form.title !== initialRef.current.title ||
    form.description !== initialRef.current.description ||
    form.dueDate !== initialRef.current.dueDate ||
    form.lessonId !== initialRef.current.lessonId ||
    enableQuestions !== (editing?.hasQuestions ?? false);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  function resizeCorrectAnswers(count: number) {
    setCorrectAnswers((prev) => {
      const next = prev.slice(0, count);
      while (next.length < count) next.push(0);
      return next;
    });
  }

  function changeChoices(count: number) {
    setChoicesPerQuestion(count);
    setCorrectAnswers((prev) => prev.map((v) => Math.min(v, count - 1)));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast('عنوان الواجب مطلوب', '', 'error');
      return;
    }
    setSaving(true);
    try {
      const dueDate = form.dueDate ? new Date(form.dueDate).toISOString() : null;
      const lessonId = form.lessonId ? Number(form.lessonId) : null;
      const payload = {
        title: form.title,
        description: form.description,
        dueDate,
        lessonId,
        questionCount: enableQuestions ? questionCount : null,
        choicesPerQuestion: enableQuestions ? choicesPerQuestion : null,
        correctAnswers: enableQuestions ? correctAnswers : null,
      };
      if (editing) {
        await api.put(`/teacher-content/assignments/${editing.id}`, payload);
        toast('تم التعديل', '', 'success');
      } else {
        await api.post<number>(`/teacher-content/courses/${courseId}/assignments`, payload);
        toast('تمت الإضافة', '', 'success');
      }
      onDone();
    } catch (err) {
      toast('فشل الحفظ', err instanceof Error ? err.message : 'خطأ', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Input label="عنوان الواجب" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: واجب الوحدة الأولى" />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-center text-xs font-semibold text-text-secondary">الحصة (اختياري)</label>
        <select value={form.lessonId} onChange={(e) => setForm({ ...form, lessonId: e.target.value })} className="w-full rounded-md border border-border-soft bg-surface px-3 py-2.5 text-center text-sm text-text-primary outline-none focus:border-gold/60">
          <option value="">من غير حصة (عام)</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>{l.order}. {l.title}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <Input label="وصف الواجب" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="المطلوب من الطالب يعمله" />
      </div>

      <div className="rounded-md border border-border-soft bg-background/40 p-4 sm:col-span-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-text-primary">
          <input type="checkbox" checked={enableQuestions} onChange={(e) => setEnableQuestions(e.target.checked)} className="h-4 w-4 accent-gold" />
          أضف أسئلة اختيار من متعدد (النظام يولّد الأسئلة ويصحح تلقائيًا)
        </label>
        <p className="mt-1 text-[11px] text-text-muted">الأسئلة بتيجي "السؤال الأول: أ ب ج د" وبتوصل للطالب إلكترونيًا — اختار الإجابة الصحيحة لكل سؤال.</p>

        {enableQuestions && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-center text-xs font-semibold text-text-secondary">عدد الأسئلة</label>
              <input
                type="number"
                min={1}
                max={30}
                dir="ltr"
                value={questionCount}
                onChange={(e) => {
                  const v = Math.max(1, Math.min(30, Number(e.target.value) || 1));
                  setQuestionCount(v);
                  resizeCorrectAnswers(v);
                }}
                className="w-full rounded-md border border-border-soft bg-surface px-3 py-2.5 text-center text-sm text-text-primary outline-none focus:border-gold/60"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-center text-xs font-semibold text-text-secondary">عدد الاختيارات لكل سؤال</label>
              <select
                value={choicesPerQuestion}
                onChange={(e) => changeChoices(Number(e.target.value))}
                className="w-full rounded-md border border-border-soft bg-surface px-3 py-2.5 text-center text-sm text-text-primary outline-none focus:border-gold/60"
              >
                <option value={2}>2 (أ ب)</option>
                <option value={3}>3 (أ ب ج)</option>
                <option value={4}>4 (أ ب ج د)</option>
                <option value={5}>5 (أ ب ج د هـ)</option>
              </select>
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <p className="text-xs font-bold text-text-primary">الإجابات الصحيحة:</p>
              {Array.from({ length: questionCount }, (_, i) => (
                <div key={i} className="flex items-center justify-between gap-3 rounded-md border border-border-soft/70 bg-surface px-3 py-2">
                  <span className="text-xs font-semibold text-text-primary">
                    {i + 1} — السؤال {i + 1 === 1 ? 'الأول' : i + 1 === 2 ? 'الثاني' : i + 1 === 3 ? 'الثالث' : i + 1 === 4 ? 'الرابع' : i + 1 === 5 ? 'الخامس' : i + 1 === 6 ? 'السادس' : i + 1 === 7 ? 'السابع' : i + 1 === 8 ? 'الثامن' : i + 1 === 9 ? 'التاسع' : i + 1 === 10 ? 'العاشر' : String(i + 1)}
                  </span>
                  <div className="flex gap-1.5">
                    {CHOICE_LETTERS.slice(0, choicesPerQuestion).map((letter, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setCorrectAnswers((prev) => prev.map((v, vi) => (vi === i ? idx : v)))
                        }
                        className={`flex h-9 w-9 items-center justify-center rounded-md border text-sm font-bold transition-colors ${
                          correctAnswers[i] === idx
                            ? 'border-gold bg-gold text-navy-deep'
                            : 'border-border-soft bg-surface text-text-secondary hover:border-gold/40'
                        }`}
                      >
                        {letter}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="sm:col-span-2">
        <Input label="آخر موعد (اختياري)" type="date" dir="ltr" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
      </div>
      <div className="flex justify-end gap-3 sm:col-span-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            إلغاء
          </Button>
        )}
        <Button type="submit" variant="gold" loading={saving}>{submitLabel ?? (editing ? 'حفظ التعديلات' : 'أضف الواجب')}</Button>
      </div>
    </form>
  );
}