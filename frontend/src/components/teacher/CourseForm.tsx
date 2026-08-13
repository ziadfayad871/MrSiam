import { useState, type FormEvent } from 'react';
import { Button } from '../../design-system/ui/Button';
import Input from '../../design-system/ui/Field';
import { useToast } from '../../design-system/ui/Toast';
import { api } from '../../lib/api';
import type { CourseDto, Stage, Subject } from '../../lib/types';

export const STAGES = [
  { key: 'PrepOne', ar: 'أولى إعدادي' },
  { key: 'PrepTwo', ar: 'تانية إعدادي' },
  { key: 'PrepThree', ar: 'تالتة إعدادي' },
  { key: 'SecOne', ar: 'أولى ثانوي' },
  { key: 'SecTwo', ar: 'تانية ثانوي' },
  { key: 'SecThree', ar: 'تالتة ثانوي' },
] as const;

export const SUBJECTS = [
  { key: 'SocialStudies', ar: 'دراسات اجتماعية' },
  { key: 'History', ar: 'تاريخ' },
  { key: 'Geography', ar: 'جغرافيا' },
] as const;

export function CourseForm({
  editing,
  onDone,
  onCancel,
  submitLabel,
}: {
  editing: CourseDto | null;
  onDone: () => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<{ title: string; description: string; subject: Subject; stage: Stage; order: number }>({
    title: editing?.title ?? '',
    description: editing?.description ?? '',
    subject: editing?.subject ?? 'SocialStudies',
    stage: editing?.stage ?? 'PrepOne',
    order: editing?.order ?? 0,
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast('اسم الكورس مطلوب', '', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/teacher-content/courses/${editing.id}`, { title: form.title, description: form.description, subject: form.subject, stage: form.stage, order: Number(form.order) || 0 });
        toast('تم التعديل', 'اتحدثت بيانات الكورس', 'success');
      } else {
        await api.post<number>('/teacher-content/courses', { title: form.title, description: form.description, subject: form.subject, stage: form.stage, order: Number(form.order) || 0 });
        toast('تم إنشاء الكورس', 'ظاهر دلوقتي للطلبة', 'success');
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
        <Input label="اسم الكورس" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: الدراسات الاجتماعية - أولى إعدادي" />
      </div>
      <div className="sm:col-span-2">
        <Input label="الوصف" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="وصف مختصر للكورس" />
      </div>
      <div>
        <label className="mb-1.5 block text-center text-xs font-semibold text-text-secondary">المادة</label>
        <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value as Subject })} className="w-full rounded-md border border-border-soft bg-surface px-3 py-2.5 text-center text-sm text-text-primary outline-none focus:border-gold/60">
          {SUBJECTS.map((s) => (
            <option key={s.key} value={s.key}>{s.ar}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-center text-xs font-semibold text-text-secondary">المرحلة</label>
        <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value as Stage })} className="w-full rounded-md border border-border-soft bg-surface px-3 py-2.5 text-center text-sm text-text-primary outline-none focus:border-gold/60">
          {STAGES.map((s) => (
            <option key={s.key} value={s.key}>{s.ar}</option>
          ))}
        </select>
      </div>
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
