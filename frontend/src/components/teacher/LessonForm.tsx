import { ImagePlus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '../../design-system/ui/Button';
import Input from '../../design-system/ui/Field';
import { ImageCropper } from '../../design-system/components/ImageCropper';
import { Modal } from '../../design-system/ui/Modal';
import { useToast } from '../../design-system/ui/Toast';
import { api, resolveFileUrl } from '../../lib/api';
import type { LessonDto } from '../../lib/types';

export function LessonForm({
  courseId,
  editing,
  onDone,
  onCancel,
  submitLabel,
  onDirtyChange,
}: {
  courseId: number;
  editing: LessonDto | null;
  onDone: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  onDirtyChange?: (dirty: boolean) => void;
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
    form.summary !== initialRef.current.summary ||
    form.contentType !== initialRef.current.contentType ||
    form.videoUrl !== initialRef.current.videoUrl ||
    form.durationMinutes !== initialRef.current.durationMinutes ||
    form.order !== initialRef.current.order ||
    imageFile !== null;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      let lessonId = editing?.id;
      if (editing) {
        await api.put(`/teacher-content/lessons/${editing.id}`, { ...form, durationMinutes: Number(form.durationMinutes) || 40, order: Number(form.order) || 0 });
        lessonId = editing.id;
        toast('تم التعديل', '', 'success');
      } else {
        lessonId = await api.post<number>(`/teacher-content/courses/${courseId}/lessons`, { ...form, durationMinutes: Number(form.durationMinutes) || 40, order: Number(form.order) || 0 });
        toast('تمت الإضافة', '', 'success');
      }
      if (imageFile && lessonId) {
        const fd = new FormData();
        fd.append('file', imageFile, 'lesson.jpg');
        await api.upload<boolean>(`/teacher-content/lessons/${lessonId}/image`, fd);
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
        <label className="mb-1.5 block text-xs font-semibold text-text-secondary">صورة الحصة (اختياري)</label>
        <div className="flex flex-wrap items-center gap-4">
          {imagePreview ? (
            <img src={imagePreview.startsWith('blob:') ? imagePreview : resolveFileUrl(imagePreview)} alt="صورة الحصة" className="h-24 w-36 rounded-lg border border-border-soft object-cover" />
          ) : (
            <div className="flex h-24 w-36 items-center justify-center rounded-lg border border-dashed border-border-soft bg-surface-sunken text-[11px] text-text-muted">
              مفيش صورة
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

    <Modal open={showCrop} onClose={closeCrop} title="قصّ صورة الحصة">
      {cropSrc && <ImageCropper src={cropSrc} aspect={4 / 3} onCancel={closeCrop} onConfirm={confirmCrop} />}
    </Modal>
    </>
  );
}
