import { useState, type FormEvent } from 'react';
import { Button } from '../../design-system/ui/Button';
import Input from '../../design-system/ui/Field';
import { useToast } from '../../design-system/ui/Toast';
import { api } from '../../lib/api';
import type { LessonDto } from '../../lib/types';

export function LessonForm({
  courseId,
  editing,
  onDone,
  onCancel,
  submitLabel,
}: {
  courseId: number;
  editing: LessonDto | null;
  onDone: () => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: editing?.title ?? '',
    summary: editing?.summary ?? '',
    contentType: editing?.contentType ?? 'lesson',
    videoUrl: editing?.videoUrl ?? '',
    durationMinutes: editing?.durationMinutes ?? 40,
    order: editing?.order ?? 0,
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/teacher-content/lessons/${editing.id}`, { ...form, durationMinutes: Number(form.durationMinutes) || 40, order: Number(form.order) || 0 });
        toast('تم التعديل', '', 'success');
      } else {
        await api.post<number>(`/teacher-content/courses/${courseId}/lessons`, { ...form, durationMinutes: Number(form.durationMinutes) || 40, order: Number(form.order) || 0 });
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
        <Input label="العنوان" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: الدرس الأول: مفهوم التاريخ" />
      </div>
      <div className="sm:col-span-2">
        <Input label="ملخص مختصر" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="سطر واحد يلخص الدرس" />
      </div>
      <div>
        <label className="mb-1.5 block text-center text-xs font-semibold text-text-secondary">النوع</label>
        <select value={form.contentType} onChange={(e) => setForm({ ...form, contentType: e.target.value })} className="w-full rounded-md border border-border-soft bg-surface px-3 py-2.5 text-center text-sm text-text-primary outline-none focus:border-gold/60">
          <option value="lesson">درس نصي</option>
          <option value="video">فيديو</option>
        </select>
      </div>
      <div>
        <Input label="المدة (دقيقة)" type="number" value={String(form.durationMinutes)} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) || 0 })} />
      </div>
      {form.contentType === 'video' && (
        <div className="sm:col-span-2">
          <Input
            label="لينك الفيديو"
            dir="ltr"
            required={form.contentType === 'video'}
            value={form.videoUrl}
            onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
            placeholder="https://youtube.com/watch?v=... أو رابط مباشر mp4"
          />
        </div>
      )}
      <div className="sm:col-span-2">
        <Input label="الترتيب" type="number" value={String(form.order)} onChange={(e) => setForm({ ...form, order: Number(e.target.value) || 0 })} />
      </div>
      <div className="flex justify-end gap-3 sm:col-span-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            إلغاء
          </Button>
        )}
        <Button type="submit" variant="gold" loading={saving}>{submitLabel ?? (editing ? 'حفظ التعديلات' : 'حفظ')}</Button>
      </div>
    </form>
  );
}
