import { ImagePlus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api, resolveFileUrl } from '../../lib/api';
import { useToast } from '../../design-system/ui/Toast';
import type { StudentTestimonialDto } from '../../lib/types';

export default function TeacherTestimonialsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<StudentTestimonialDto[]>([]); const [photo, setPhoto] = useState<File | null>(null); const fileRef = useRef<HTMLInputElement>(null);
  const load = () => api.get<StudentTestimonialDto[]>('/testimonials').then(setItems).catch(() => setItems([])); useEffect(() => { load(); }, []);
  async function submit(e: React.FormEvent) { e.preventDefault(); if (!photo) return; const data = new FormData(); data.append('photo', photo); try { await api.upload<number>('/testimonials', data); toast('تم النشر ✓', 'اتضافت الصورة لألبوم آراء الطلاب', 'success'); setPhoto(null); if (fileRef.current) fileRef.current.value = ''; load(); } catch (err) { toast('فشل النشر', err instanceof Error ? err.message : 'حاول تاني', 'error'); } }
  return <div className="teacher-workspace flex flex-col gap-6 p-2 sm:p-4"><header><p className="text-xs font-bold tracking-[.16em] text-gold">مع أبو كيان.. الدراسات في أمان</p><h1 className="display-serif mt-2 text-3xl font-extrabold text-text-primary">آراء طلابنا</h1><p className="mt-2 text-sm text-text-muted">ألبوم صور فقط يظهر في الصفحة الرئيسية.</p></header><form onSubmit={submit} className="rounded-2xl border border-border-soft bg-surface p-5"><div className="flex gap-3"><button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-gold/40 px-4 py-2 text-gold"><ImagePlus size={16} /> {photo ? 'تم اختيار صورة' : 'اختيار صورة'}</button><input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => setPhoto(e.target.files?.[0] ?? null)} /><button disabled={!photo} className="rounded-lg bg-gold px-5 py-2 font-bold text-navy-deep disabled:opacity-50">نشر الصورة</button></div></form><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map(item => <div key={item.id} className="relative overflow-hidden rounded-xl border border-border-soft bg-surface"><img src={resolveFileUrl(item.photoUrl)} alt="رأي طالب" className="h-64 w-full object-cover" /><button onClick={async () => { await api.del(`/testimonials/${item.id}`); load(); }} className="absolute left-3 top-3 rounded-full bg-black/60 p-2 text-white"><Trash2 size={17} /></button></div>)}</div></div>;
}
