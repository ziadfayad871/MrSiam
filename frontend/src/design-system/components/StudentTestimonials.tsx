import { resolveFileUrl } from '../../lib/api';
import type { StudentTestimonialDto } from '../../lib/types';

export function StudentTestimonials({ entries }: { entries: StudentTestimonialDto[] }) {
  if (!entries.length) return null;
  return <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28" dir="rtl"><div className="mb-10 text-center"><p className="text-sm font-bold text-gold">مع أبو كيان.. الدراسات في أمان</p><h2 className="display-serif mt-3 text-3xl font-extrabold text-text-primary sm:text-4xl">آراء طلابنا</h2></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{entries.map((entry) => <img key={entry.id} src={resolveFileUrl(entry.photoUrl)} alt="رأي طالب" className="h-72 w-full rounded-2xl border border-border-soft object-cover shadow-soft" />)}</div></section>;
}
