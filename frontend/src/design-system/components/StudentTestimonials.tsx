import { Quote } from 'lucide-react';
import { resolveFileUrl } from '../../lib/api';
import type { StudentTestimonialDto } from '../../lib/types';

export function StudentTestimonials({ entries }: { entries: StudentTestimonialDto[] }) {
  if (!entries.length) return null;
  return <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28" dir="rtl"><div className="mb-10 text-center"><p className="text-sm font-bold text-gold">مع أبو كيان.. الدراسات في أمان</p><h2 className="display-serif mt-3 text-3xl font-extrabold text-text-primary sm:text-4xl">آراء طلابنا</h2><p className="mt-3 text-text-secondary">حكايات حقيقية من رحلة التعلّم والتفوق.</p></div><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{entries.map((entry) => <article key={entry.id} className="rounded-2xl border border-border-soft bg-surface p-6 shadow-soft"><Quote className="text-gold" size={28} fill="currentColor" /><p className="mt-4 leading-8 text-text-secondary">{entry.quote}</p><div className="mt-6 flex items-center gap-3 border-t border-border-subtle pt-4">{entry.photoUrl ? <img src={resolveFileUrl(entry.photoUrl)} alt={entry.fullName} className="h-11 w-11 rounded-full object-cover" /> : <div className="grid h-11 w-11 place-items-center rounded-full bg-gold/15 font-bold text-gold">{entry.fullName.slice(0, 1)}</div>}<div><p className="font-bold text-text-primary">{entry.fullName}</p>{entry.stageAr && <p className="text-xs text-text-muted">{entry.stageAr}</p>}</div></div></article>)}</div></section>;
}
