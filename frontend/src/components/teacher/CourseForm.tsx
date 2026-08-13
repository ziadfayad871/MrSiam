import { ImagePlus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '../../design-system/ui/Button';
import Input from '../../design-system/ui/Field';
import { ImageCropper } from '../../design-system/components/ImageCropper';
import { Modal } from '../../design-system/ui/Modal';
import { useToast } from '../../design-system/ui/Toast';
import { api, resolveFileUrl } from '../../lib/api';
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

export const MONTHS = [
  { value: 0, ar: 'بدون شهر' },
  { value: 1, ar: 'يناير' },
  { value: 2, ar: 'فبراير' },
  { value: 3, ar: 'مارس' },
  { value: 4, ar: 'أبريل' },
  { value: 5, ar: 'مايو' },
  { value: 6, ar: 'يونيو' },
  { value: 7, ar: 'يوليو' },
  { value: 8, ar: 'أغسطس' },
  { value: 9, ar: 'سبتمبر' },
  { value: 10, ar: 'أكتوبر' },
  { value: 11, ar: 'نوفمبر' },
  { value: 12, ar: 'ديسمبر' },
] as const;

export function CourseForm({
  editing,
  onDone,
  onCancel,
  submitLabel,
  onDirtyChange,
}: {
  editing: CourseDto | null;
  onDone: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<{ title: string; description: string; subject: Subject; stage: Stage; order: number; month: number }>({
    title: editing?.title ?? '',
    description: editing?.description ?? '',
    subject: editing?.subject ?? 'SocialStudies',
    stage: editing?.stage ?? 'PrepOne',
    order: editing?.order ?? 0,
    month: editing?.month ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<Blob | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(editing?.imageUrl ?? null);
  const [showCrop, setShowCrop] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const initialRef = useRef(form);

  function openCrop(file: File | undefined) {
    if (!file) return;
    setCropSrc(URL.createObjectURL(file));
    setShowCrop(true);
  }

  function closeCrop() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setShowCrop(false);
  }

  function confirmCrop(blob: Blob) {
    setImageFile(blob);
    setImagePreview((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return URL.createObjectURL(blob);
    });
    closeCrop();
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return editing?.imageUrl ?? null;
    });
  }

  const isDirty =
    form.title !== initialRef.current.title ||
    form.description !== initialRef.current.description ||
    form.subject !== initialRef.current.subject ||
    form.stage !== initialRef.current.stage ||
    form.order !== initialRef.current.order ||
    form.month !== initialRef.current.month ||
    imageFile !== null;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast('اسم الكورس مطلوب', '', 'error');
      return;
    }
    setSaving(true);
    try {
      let courseId = editing?.id;
      if (editing) {
        await api.put(`/teacher-content/courses/${editing.id}`, { title: form.title, description: form.description, subject: form.subject, stage: form.stage, order: Number(form.order) || 0, month: form.month || null });
        courseId = editing.id;
        toast('تم التعديل', 'اتحدثت بيانات الكورس', 'success');
      } else {
        courseId = await api.post<number>('/teacher-content/courses', { title: form.title, description: form.description, subject: form.subject, stage: form.stage, order: Number(form.order) || 0, month: form.month || null });
        toast('تم إنشاء الكورس', 'ظاهر دلوقتي للطلبة', 'success');
      }
      if (imageFile && courseId) {
        const fd = new FormData();
        fd.append('file', imageFile, 'course.jpg');
        await api.upload<boolean>(`/teacher-content/courses/${courseId}/image`, fd);
      }
      onDone();
    } catch (err) {
      toast('فشل الحفظ', err instanceof Error ? err.message : 'خطأ', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-xs font-semibold text-text-secondary">الصورة المصغرة للكورس (اختياري)</label>
        <div className="flex flex-wrap items-center gap-4">
          {imagePreview ? (
            <img src={imagePreview.startsWith('blob:') ? imagePreview : resolveFileUrl(imagePreview)} alt="صورة الكورس" className="h-28 w-44 rounded-lg border border-border-soft object-cover" />
          ) : (
            <div className="flex h-28 w-44 items-center justify-center rounded-lg border border-dashed border-border-soft bg-surface-sunken text-[11px] text-text-muted">
              مفيش صورة — هتظهر ككارت عادي
            </div>
          )}
          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                openCrop(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <Button type="button" variant="outline" size="sm" icon={<ImagePlus size={14} />} onClick={() => fileRef.current?.click()} disabled={saving}>
              {imagePreview ? 'تغيير الصورة' : 'اختر صورة'}
            </Button>
            {imageFile && (
              <Button type="button" variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={clearImage} disabled={saving}>
                إلغاء الاختيار
              </Button>
            )}
          </div>
        </div>
      </div>
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
      <div>
        <label className="mb-1.5 block text-center text-xs font-semibold text-text-secondary">الشهر</label>
        <select value={form.month} onChange={(e) => setForm({ ...form, month: Number(e.target.value) })} className="w-full rounded-md border border-border-soft bg-surface px-3 py-2.5 text-center text-sm text-text-primary outline-none focus:border-gold/60">
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>{m.ar}</option>
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

    <Modal open={showCrop} onClose={closeCrop} title="قصّ صورة الكورس">
      {cropSrc && <ImageCropper src={cropSrc} aspect={16 / 9} onCancel={closeCrop} onConfirm={confirmCrop} />}
    </Modal>
    </>
  );
}
