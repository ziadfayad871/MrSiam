import { ImagePlus, Loader2, Pencil, Trash2, Trophy, UploadCloud, Users } from 'lucide-react';
import { useEffect, useRef, useState, type DragEvent } from 'react';
import { useToast } from '../../design-system/ui/Toast';
import { api, resolveFileUrl } from '../../lib/api';
import type { TopStudentDto } from '../../lib/types';

const STAGE_OPTIONS = [
  'الصف الأول الإعدادي',
  'الصف الثاني الإعدادي',
  'الصف الثالث الإعدادي',
  'الأول الثانوي',
  'الثاني الثانوي',
  'الثالث الثانوي',
];

const EMPTY_FORM = { fullName: '', stageAr: STAGE_OPTIONS[5], achievement: '', score: '', year: '' };

export default function MasterTopStudentsPage() {
  const { toast } = useToast();
  const [album, setAlbum] = useState<TopStudentDto[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => api.get<TopStudentDto[]>('/top-students').then(setAlbum).catch(() => setAlbum([]));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pickFile(file: File | undefined) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast('الصورة لازم تكون JPG أو PNG أو WebP', '', 'error');
      return;
    }
    setPhoto(file);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0]);
  }

  function startEdit(t: TopStudentDto) {
    setEditingId(t.id);
    setForm({ fullName: t.fullName, stageAr: t.stageAr, achievement: t.achievement, score: t.score != null ? String(t.score) : '', year: t.year ?? '' });
    setPhoto(null);
    setPhotoPreview(t.photoUrl ? resolveFileUrl(t.photoUrl) ?? null : null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setPhoto(null);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileRef.current) fileRef.current.value = '';
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim() || !form.achievement.trim()) {
      toast('اكتب اسم الطالب والإنجاز الأول', '', 'error');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('fullName', form.fullName.trim());
      fd.append('stageAr', form.stageAr);
      fd.append('achievement', form.achievement.trim());
      if (form.score.trim()) fd.append('score', form.score.trim());
      if (form.year.trim()) fd.append('year', form.year.trim());
      if (photo) fd.append('photo', photo);

      if (editingId != null) {
        await api.uploadForm<boolean>('PUT', `/top-students/${editingId}`, fd);
        toast('تم التعديل', 'اتحدثت بيانات الطالب في الألبوم', 'success');
      } else {
        await api.upload<number>('/top-students', fd);
        toast('اتضاف للألبوم', 'بيكمل رحلته في الإبداع', 'success');
      }
      cancelEdit();
      await load();
    } catch (err) {
      toast('فشل الحفظ', err instanceof Error ? err.message : 'خطأ', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function remove(t: TopStudentDto) {
    if (!window.confirm(`حذف «${t.fullName}» من الألبوم؟`)) return;
    setDeletingId(t.id);
    try {
      await api.del<boolean>(`/top-students/${t.id}`);
      toast('تم الحذف', '', 'success');
      await load();
    } catch (err) {
      toast('فشل الحذف', err instanceof Error ? err.message : 'خطأ', 'error');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="admin-workspace flex flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[.16em] text-gold">المتفوقين</p>
          <h1 className="display-serif mt-2 text-3xl font-extrabold text-text-primary">ألبوم الأوائل</h1>
          <p className="mt-2 text-sm text-text-muted">ضيف الأوائل بالاسم والصورة والإنجاز — السنة والمجموع اختياريين، ودوس «ضيف للألبوم».</p>
        </div>
        <span className="rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-bold text-gold">{album.length} عضو</span>
      </header>

      <form onSubmit={submit} className="rounded-xl border border-border-soft bg-surface p-5 sm:p-6">
        <h2 className="mb-4 text-base font-bold text-text-primary">{editingId != null ? 'تعديل عضو في الألبوم' : 'إضافة نجم جديد'}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-text-secondary">اسم الطالب *</span>
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="مثال: أحمد سمير"
              className="w-full rounded-md border border-border-soft bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-gold/60"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-text-secondary">المرحلة *</span>
            <select
              value={form.stageAr}
              onChange={(e) => setForm({ ...form, stageAr: e.target.value })}
              className="w-full rounded-md border border-border-soft bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-gold/60"
            >
              {STAGE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-text-secondary">الإنجاز *</span>
            <input
              value={form.achievement}
              onChange={(e) => setForm({ ...form, achievement: e.target.value })}
              placeholder="مثال: علامة كاملة في التاريخ"
              className="w-full rounded-md border border-border-soft bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-gold/60"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-text-secondary">المجموع (اختياري)</span>
            <input
              value={form.score}
              onChange={(e) => setForm({ ...form, score: e.target.value })}
              placeholder="مثال: 98.5"
              inputMode="decimal"
              className="w-full rounded-md border border-border-soft bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-gold/60"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-text-secondary">السنة (اختياري)</span>
            <input
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              placeholder="مثال: 2026"
              className="w-full rounded-md border border-border-soft bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-gold/60"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-text-secondary">الصورة (اسحبها هنا أو دوس للاختيار)</span>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`flex h-[42px] cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-3 text-xs font-semibold transition-colors ${
                dragging ? 'border-gold bg-gold/15 text-gold' : photoPreview ? 'border-gold/40 bg-gold/5 text-gold' : 'border-border-soft bg-surface-sunken text-text-muted hover:border-gold/40 hover:text-gold'
              }`}
            >
              {photoPreview ? <><UploadCloud size={15} /> {editingId != null ? 'صورة جديدة مختارة' : 'الصورة جاهزة'}</> : <><ImagePlus size={15} /> اسحب صورة هنا</>}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
        </div>

        {photoPreview && (
          <div className="mt-4 flex items-center gap-3 rounded-md border border-border-soft bg-surface-sunken/40 p-3">
            <img src={photoPreview} alt="معاينة" className="h-16 w-16 rounded-full border-2 border-gold/50 object-cover" />
            <p className="text-xs text-text-muted">{editingId != null ? 'معاينة الصورة الجديدة — سيبها زي ما هي إن مش هتغيرها.' : 'دي الصورة اللي هتظهر في الألبوم.'}</p>
          </div>
        )}

        {editingId != null && (
          <p className="mt-3 text-xs font-semibold text-gold">جاري تعديل العضو المحدد — اعمل حفظ وبعدين اضافه للألبوم.</p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-gold px-6 py-2.5 text-sm font-bold text-navy-deep transition-opacity hover:opacity-90 disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <><Trophy size={16} /> {editingId != null ? 'حفظ التعديل' : 'ضيف للألبوم'}</>}
          </button>
          {editingId != null && (
            <button type="button" onClick={cancelEdit} className="rounded-md border border-border-soft px-4 py-2 text-sm font-semibold text-text-muted transition-colors hover:border-error/40 hover:text-error">
              إلغاء
            </button>
          )}
        </div>
      </form>

      {album.length === 0 && !saving ? (
        <div className="rounded-xl border border-dashed border-border-soft bg-surface/50 p-10 text-center">
          <Trophy size={30} className="mx-auto text-gold/60" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-text-muted">الألبوم فاضي — ضيف أول نجم و يظهر في الصفحة الرئيسية فورًا.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {album.map((t) => (
            <div key={t.id} className="group relative overflow-hidden rounded-xl border border-border-soft bg-surface shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/40">
              <div className="relative h-44 overflow-hidden bg-surface-sunken">
                {resolveFileUrl(t.photoUrl) ? (
                  <img src={resolveFileUrl(t.photoUrl)} alt={t.fullName} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="grid h-full w-full place-items-center">
                    <Users size={44} className="text-gold/50" strokeWidth={1.5} />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-navy-deep/85 to-transparent p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{t.fullName}</p>
                    <p className="truncate text-[10px] text-white/70">{t.stageAr}{t.year ? ` · ${t.year}` : ''}</p>
                  </div>
                  {t.score != null && <span className="shrink-0 rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold text-navy-deep">{Number(t.score).toFixed(1)}%</span>}
                </div>
                <div className="absolute end-2 top-2 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => startEdit(t)} aria-label="تعديل" className="grid h-8 w-8 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-gold hover:text-navy-deep">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => remove(t)} disabled={deletingId === t.id} aria-label="حذف" className="grid h-8 w-8 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-error hover:text-white disabled:opacity-50">
                    {deletingId === t.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-text-primary">{t.achievement}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}