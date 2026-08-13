import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '../../design-system/ui/Button';
import Input from '../../design-system/ui/Field';
import { useToast } from '../../design-system/ui/Toast';
import { api } from '../../lib/api';
import type { AssignmentDto, LessonDto } from '../../lib/types';

export function AssignmentForm({
  courseId,
  editing,
  onDone,
  onCancel,
  submitLabel,
  onDirtyChange,
  defaultLessonId,
}: {
  courseId: number;
  editing: AssignmentDto | null;
  onDone: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  onDirtyChange?: (dirty: boolean) => void;
  defaultLessonId?: number;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: editing?.title ?? '',
    description: editing?.description ?? '',
    dueDate: editing?.dueDate ? editing.dueDate.slice(0, 10) : '',
    lessonId: editing?.lessonId ? String(editing.lessonId) : defaultLessonId ? String(defaultLessonId) : '',
  });
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
    form.lessonId !== initialRef.current.lessonId;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

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
      if (editing) {
        await api.put(`/teacher-content/assignments/${editing.id}`, { title: form.title, description: form.description, dueDate, lessonId });
        toast('تم التعديل', '', 'success');
      } else {
        await api.post<number>(`/teacher-content/courses/${courseId}/assignments`, { title: form.title, description: form.description, dueDate, lessonId });
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
