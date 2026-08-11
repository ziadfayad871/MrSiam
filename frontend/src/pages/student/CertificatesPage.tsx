import { Award, Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CompassLoader } from '../../design-system/components/CompassLoader';
import { HistoricalSectionHeader } from '../../design-system/components/HistoricalSectionHeader';
import { EmptyState } from '../../design-system/ui/EmptyState';
import { ErrorState } from '../../design-system/ui/ErrorState';
import { api } from '../../lib/api';
import type { CertificateDto } from '../../lib/types';

export default function CertificatesPage() {
  const [items, setItems] = useState<CertificateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CertificateDto | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get<CertificateDto[]>('/student/certificates')
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : 'فشل تحميل الشهادات'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CompassLoader text="بنحضّر خزنة الشهادات..." />;
  if (error) return <ErrorState title={error} onRetry={() => window.location.reload()} />;

  const gradeBadge: Record<string, string> = {
    'امتياز': 'bg-gold/20 border-gold/60 text-gold',
    'جيد جداً': 'bg-emerald-500/10 border-emerald-500/50 text-emerald-600',
    'جيد': 'bg-sky-500/10 border-sky-500/50 text-sky-600',
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <HistoricalSectionHeader number="الشهادات" title="خزنة الشهادات" subtitle="CERTIFICATES" align="center">
        كل امتحان تعدّي 80% منه بيكسبك شهادة موثّقة باسمك — اطبعها وعلّقها على الحائط.
      </HistoricalSectionHeader>

      {items.length === 0 ? (
        <EmptyState
          icon="trophy"
          title="لسه مفيش شهادات"
          description="جاوب صح في الامتحانات (80% فأكتر) عشان شهادتك الأولى تتصدر هنا."
          className="mt-16"
        />
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className="group overflow-hidden rounded-lg border border-gold/30 bg-parchment-soft p-5 text-start shadow-soft transition-transform hover:-translate-y-0.5"
            >
              <div className="mb-3 flex items-center justify-between">
                <Award size={26} className="text-gold" strokeWidth={1.5} />
                <span className={`rounded-full border px-3 py-0.5 text-[10px] font-bold ${gradeBadge[c.grade] ?? gradeBadge['جيد']}`}>
                  {c.grade}
                </span>
              </div>
              <p className="display-serif text-sm font-bold text-text-primary">{c.examTitle}</p>
              <p className="mt-1 text-xs text-text-secondary">{c.courseTitle}</p>
              <p className="mt-3 text-[11px] text-text-muted">
                {new Date(c.issuedAt).toLocaleDateString('ar-EG')} · {c.percentage}%
              </p>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/80 p-4" onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-2xl overflow-hidden rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div id="certificate-print" className="relative bg-parchment p-8 text-center sm:p-10">
              <div className="pointer-events-none absolute inset-2 rounded border-2 border-double border-gold/70" />
              <div className="pointer-events-none absolute inset-5 rounded border border-gold/40" />
              <div className="relative">
                <Award size={44} className="mx-auto text-gold" strokeWidth={1.2} />
                <p className="mt-3 text-[11px] font-bold tracking-[0.35em] text-text-muted">MR. SIAM ACADEMY</p>
                <h1 className="display-serif mt-1 text-3xl font-black text-navy-deep">شهادة تقدير</h1>
                <p className="mt-1 text-xs text-text-muted">تُمنح هذه الشهادة إلى</p>
                <p className="display-serif mt-3 text-2xl font-bold text-text-primary">{selected.studentName}</p>
                <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-text-secondary">
                  لاجتيازه بنجاح امتحان
                  <span className="mx-1 font-bold text-gold">{selected.examTitle}</span>
                  ضمن مادة
                  <span className="mx-1 font-bold text-text-primary">{selected.courseTitle}</span>
                  بمجموع
                  <span className="mx-1 font-bold text-gold">{selected.percentage}%</span>
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className={`rounded-full border px-4 py-1 text-xs font-bold ${gradeBadge[selected.grade] ?? gradeBadge['جيد']}`}>
                    بتقدير: {selected.grade}
                  </span>
                </div>
                <div className="mt-8 flex items-end justify-between text-start">
                  <div>
                    <p className="text-[10px] text-text-muted">تاريخ الإصدار</p>
                    <p className="text-sm font-bold text-text-primary">{new Date(selected.issuedAt).toLocaleDateString('ar-EG')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-navy-deep">الأستاذ محمد صيام</p>
                    <p className="mt-1 text-[10px] text-text-muted">مؤسس الأكاديمية</p>
                  </div>
                </div>
                <p className="mt-6 border-t border-gold/30 pt-3 text-[10px] tracking-wider text-text-muted">كود التحقق: {selected.code}</p>
              </div>
            </div>
            <div className="flex items-center justify-between bg-surface px-4 py-3">
              <button onClick={() => setSelected(null)} className="text-xs font-bold text-text-muted hover:text-text-primary">
                إغلاق
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-full bg-gold px-5 py-2 text-xs font-bold text-navy-deep transition-colors hover:bg-gold/90"
              >
                <Printer size={14} /> اطبع الشهادة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
