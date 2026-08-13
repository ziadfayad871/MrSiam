import { useState, type FormEvent } from 'react';
import { Button } from '../../design-system/ui/Button';
import Input from '../../design-system/ui/Field';
import { useToast } from '../../design-system/ui/Toast';
import { api } from '../../lib/api';
import type { AssignmentDto } from '../../lib/types';

export function AssignmentForm({
  courseId,
  editing,
  onDone,
  onCancel,
  submitLabel,
}: {
  courseId: number;
  editing: AssignmentDto | null;
  onDone: () => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: editing?.title ?? '',
    description: editing?.description ?? '',
    dueDate: editing?.dueDate ? editing.dueDate.slice(0, 10) : '',
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast('عنوان الواجب مطلوب', '', 'error');
      return;
    }
    setSaving(true);
    try {
      const dueDate = form.dueDate ? new Date(form.dueDate).toISOString() : null;
      if (editing) {
        await api.put(`/teacher-content/assignments/${editing.id}`, { title: form.title, description: form.description, dueDate });
        toast('تم التعديل', '', 'success');
      } else {
        await api.post<number>(`/teacher-content/courses/${courseId}/assignments`, { title: form.title, description: form.description, dueDate });
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
