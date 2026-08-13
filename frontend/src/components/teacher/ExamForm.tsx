import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '../../design-system/ui/Button';
import Input from '../../design-system/ui/Field';
import { useToast } from '../../design-system/ui/Toast';
import { api } from '../../lib/api';
import type { ExamListItemDto, ExamType, LessonDto } from '../../lib/types';

const EXAM_TYPES = [
  { key: 'Practice', ar: 'تدريبي' },
  { key: 'Lesson', ar: 'درس' },
  { key: 'Unit', ar: 'وحدة' },
  { key: 'Final', ar: 'نهائي' },
  { key: 'Boss', ar: 'بوس ⚔️' },
] as const;

type QuestionForm = {
  text: string;
  type: 'SingleChoice' | 'TrueFalse';
  marks: number;
  options: string[];
  correctIndex: number;
};

function emptyQuestion(): QuestionForm {
  return { text: '', type: 'SingleChoice', marks: 1, options: ['', '', '', ''], correctIndex: 0 };
}

export function ExamForm({
  courseId,
  editing,
  onDone,
  onCancel,
  submitLabel,
  onDirtyChange,
  defaultLessonId,
}: {
  courseId: number;
  editing: ExamListItemDto | null;
  onDone: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  onDirtyChange?: (dirty: boolean) => void;
  defaultLessonId?: number;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<{ title: string; type: ExamType; durationMinutes: number; attemptsAllowed: number; isPublished: boolean; lessonId: string }>({
    title: editing?.title ?? '',
    type: editing?.type ?? 'Lesson',
    durationMinutes: editing?.durationMinutes ?? 10,
    attemptsAllowed: 3,
    isPublished: editing ? editing.isPublished : true,
    lessonId: editing?.lessonId ? String(editing.lessonId) : defaultLessonId ? String(defaultLessonId) : '',
  });
  const [lessons, setLessons] = useState<LessonDto[]>([]);
  const [questions, setQuestions] = useState<QuestionForm[]>([emptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const initialFormRef = useRef(form);
  const initialQuestionsRef = useRef<QuestionForm[]>([emptyQuestion()]);

  useEffect(() => {
    api
      .get<LessonDto[]>(`/courses/${courseId}/lessons`)
      .then(setLessons)
      .catch(() => setLessons([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  useEffect(() => {
    if (editing) {
      api
        .get<{ questions: { text: string; type: 'SingleChoice' | 'TrueFalse'; marks: number; options: { text: string }[] }[] }>(`/exams/${editing.id}`)
        .then((d) => {
          const loaded = d.questions.map((q) => ({
            text: q.text,
            type: q.type,
            marks: q.marks,
            options: q.type === 'TrueFalse' ? ['صواب', 'خطأ'] : q.options.map((o) => o.text),
            correctIndex: 0,
          }));
          initialQuestionsRef.current = loaded;
          setQuestions(loaded);
        })
        .catch(() => {
          initialQuestionsRef.current = [emptyQuestion()];
          setQuestions([emptyQuestion()]);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const isDirty =
    form.title !== initialFormRef.current.title ||
    form.type !== initialFormRef.current.type ||
    form.durationMinutes !== initialFormRef.current.durationMinutes ||
    form.attemptsAllowed !== initialFormRef.current.attemptsAllowed ||
    form.isPublished !== initialFormRef.current.isPublished ||
    form.lessonId !== initialFormRef.current.lessonId ||
    JSON.stringify(questions) !== JSON.stringify(initialQuestionsRef.current);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  function setQ(i: number, patch: Partial<QuestionForm>) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast('اسم الاختبار مطلوب', '', 'error');
      return;
    }
    const clean = questions
      .filter((q) => q.text.trim())
      .map((q) => ({
        text: q.text.trim(),
        type: q.type,
        marks: Number(q.marks) > 0 ? Number(q.marks) : 1,
        options: q.type === 'TrueFalse' ? ['صواب', 'خطأ'] : q.options,
        correctIndex: q.type === 'TrueFalse' ? q.correctIndex : q.correctIndex,
      }));
    if (clean.length === 0) {
      toast('الاختبار لازم فيه سؤال واحد على الأقل', '', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        type: form.type,
        durationMinutes: Number(form.durationMinutes) || 10,
        attemptsAllowed: Number(form.attemptsAllowed) || 3,
        isPublished: form.isPublished,
        lessonId: form.lessonId ? Number(form.lessonId) : null,
        questions: clean,
      };
      if (editing) {
        await api.put(`/teacher-content/exams/${editing.id}`, payload);
        toast('تم التعديل', '', 'success');
      } else {
        await api.post<number>(`/teacher-content/courses/${courseId}/exams`, payload);
        toast('تم إنشاء الاختبار', '', 'success');
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
        <Input label="اسم الاختبار" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: اختبار الوحدة الأولى" />
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
      <div>
        <label className="mb-1.5 block text-center text-xs font-semibold text-text-secondary">النوع</label>
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ExamType })} className="w-full rounded-md border border-border-soft bg-surface px-3 py-2.5 text-center text-sm text-text-primary outline-none focus:border-gold/60">
          {EXAM_TYPES.map((t) => (
            <option key={t.key} value={t.key}>{t.ar}</option>
          ))}
        </select>
      </div>
      <div>
        <Input label="المدة (دقيقة)" type="number" value={String(form.durationMinutes)} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) || 0 })} />
      </div>
      <div>
        <Input label="عدد المحاولات المسموحة" type="number" value={String(form.attemptsAllowed)} onChange={(e) => setForm({ ...form, attemptsAllowed: Number(e.target.value) || 0 })} />
      </div>
      <div className="flex items-end pb-1">
        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-text-secondary">
          <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="h-4 w-4 accent-gold" />
          منشور (يظهر للطلبة)
        </label>
      </div>

      <div className="flex flex-col gap-4 sm:col-span-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-primary">الأسئلة ({questions.length})</h3>
          <button
            type="button"
            onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])}
            className="flex items-center gap-1.5 rounded-md border border-gold/40 bg-gold/5 px-3 py-1.5 text-xs font-semibold text-gold transition-colors hover:bg-gold/10"
          >
            <Plus size={13} /> سؤال جديد
          </button>
        </div>
        {questions.map((q, i) => (
          <div key={i} className="rounded-md border border-border-soft p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input label={`سؤال ${i + 1}`} value={q.text} onChange={(e) => setQ(i, { text: e.target.value })} placeholder="نص السؤال" />
              </div>
              <div>
                <label className="mb-1.5 block text-center text-xs font-semibold text-text-secondary">النوع</label>
                <select
                  value={q.type}
                  onChange={(e) => setQ(i, { type: e.target.value as QuestionForm['type'], correctIndex: 0 })}
                  className="w-full rounded-md border border-border-soft bg-surface px-3 py-2.5 text-center text-sm text-text-primary outline-none focus:border-gold/60"
                >
                  <option value="SingleChoice">اختيار من متعدد</option>
                  <option value="TrueFalse">صح / خطأ</option>
                </select>
              </div>
              <div>
                <Input label="الدرجة" type="number" value={String(q.marks)} onChange={(e) => setQ(i, { marks: Number(e.target.value) || 0 })} />
              </div>
              {q.type === 'SingleChoice' ? (
                <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
                  {q.options.map((opt, oi) => (
                    <label key={oi} className="flex cursor-pointer items-center gap-2 rounded-md border border-border-soft px-3 py-2">
                      <input type="radio" name={`correct-${i}`} checked={q.correctIndex === oi} onChange={() => setQ(i, { correctIndex: oi })} className="h-3.5 w-3.5 accent-gold" />
                      <input
                        value={opt}
                        onChange={(e) => setQ(i, { options: q.options.map((o, x) => (x === oi ? e.target.value : o)) })}
                        placeholder={`اختيار ${oi + 1}`}
                        className="w-full bg-transparent text-sm text-text-primary outline-none"
                      />
                    </label>
                  ))}
                  <p className="col-span-2 text-[10px] text-text-muted">الاختيار المحدد بنقطة هو الإجابة الصحيحة.</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 sm:col-span-2">
                  <span className="text-xs text-text-muted">الإجابة الصحيحة:</span>
                  {['صواب', 'خطأ'].map((label, oi) => (
                    <label key={label} className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-text-secondary">
                      <input type="radio" name={`tf-${i}`} checked={q.correctIndex === oi} onChange={() => setQ(i, { correctIndex: oi })} className="h-3.5 w-3.5 accent-gold" />
                      {label}
                    </label>
                  ))}
                </div>
              )}
            </div>
            {questions.length > 1 && (
              <button
                type="button"
                onClick={() => setQuestions((qs) => qs.filter((_, idx) => idx !== i))}
                className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-error hover:underline"
              >
                <Trash2 size={12} /> احذف السؤال
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3 sm:col-span-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            إلغاء
          </Button>
        )}
        <Button type="submit" variant="gold" loading={saving}>{submitLabel ?? (editing ? 'حفظ التعديلات' : 'أنشئ الاختبار')}</Button>
      </div>
    </form>
  );
}
