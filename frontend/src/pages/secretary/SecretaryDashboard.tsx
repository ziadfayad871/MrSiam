import { AlertTriangle, Banknote, CalendarClock, CheckCircle2, Users, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CompassLoader } from '../../design-system/components/CompassLoader';
import CoordinateLabel from '../../design-system/components/CoordinateLabel';
import { Card } from '../../design-system/ui/Card';
import { ErrorState } from '../../design-system/ui/ErrorState';
import { api } from '../../lib/api';
import type { SecretaryDashboardDto } from '../../lib/types';

const ICONS: Record<string, React.ReactNode> = {
  students: <Users size={16} />,
  payments: <Banknote size={16} />,
  pending: <CalendarClock size={16} />,
  overdue: <AlertTriangle size={16} />,
  attendance: <CheckCircle2 size={16} />,
};

function SummaryRow({ label, value, tone }: { label: string; value: number; tone: 'gold' | 'ok' | 'warn' }) {
  const color =
    tone === 'gold'
      ? 'text-gold'
      : tone === 'ok'
        ? 'text-success'
        : 'text-error';
  return (
    <div className="flex items-center justify-between rounded-md border border-border-soft px-3 py-2">
      <span className="text-xs text-text-muted">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{value} ج.م</span>
    </div>
  );
}

export default function SecretaryDashboard() {
  const [data, setData] = useState<SecretaryDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<SecretaryDashboardDto>('/dashboard/secretary')
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'فشل تحميل اللوحة'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CompassLoader text="بنجهز سجلات الأمين..." />;
  if (error || !data) return <ErrorState title={error ?? 'مفيش بيانات'} onRetry={() => window.location.reload()} />;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="display-serif text-2xl font-bold text-text-primary">سجل الأمين</h1>
        <p className="mt-1 text-sm text-text-muted">الحضور والاشتراكات والمستحقات — كل الورق في مكان واحد.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        {data.stats.map((s) => (
          <div key={s.key} className="relative overflow-hidden rounded-lg border border-border-soft bg-surface p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-text-muted">{ICONS[s.icon]}</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-text-primary">{s.value}</p>
            <p className="mt-0.5 text-[11px] text-text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today attendance */}
        <Card className="relative overflow-hidden">
          <div className="absolute -end-8 -top-8 h-32 w-32 rounded-full bg-gold/10 blur-2xl" />
          <h2 className="mb-5 text-lg font-bold text-text-primary">حضور اليوم</h2>
          <div className="flex items-end justify-around">
            <div className="text-center">
              <p className="text-3xl font-bold text-success">{data.attendanceToday}</p>
              <p className="mt-1 flex items-center justify-center gap-1 text-xs text-text-muted">
                <CheckCircle2 size={12} className="text-success" /> حاضر
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-error">{data.absentToday}</p>
              <p className="mt-1 flex items-center justify-center gap-1 text-xs text-text-muted">
                <XCircle size={12} className="text-error" /> غائب
              </p>
            </div>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-border-soft">
            <div
              className="h-full rounded-full bg-gradient-to-l from-gold to-gold/40 transition-all duration-700"
              style={{ width: `${(data.attendanceToday / Math.max(data.attendanceToday + data.absentToday, 1)) * 100}%` }}
            />
          </div>
          <CoordinateLabel
            latitude={{ degrees: 31, minutes: 15, hemisphere: 'N' }}
            longitude={{ degrees: 32, minutes: 18, hemisphere: 'E' }}
            className="mt-4 opacity-50"
          />
        </Card>

        {/* Payments summary */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">مستحقات الاشتراكات</h2>
            <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] font-bold text-gold">
              شهرياً {data.paymentsSummary.length > 0 ? data.paymentsSummary[data.paymentsSummary.length - 1].total : 0} ج.م
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {data.paymentsSummary.map((m) => (
              <div key={m.month} className="rounded-md border border-border-soft p-4">
                <p className="font-plex text-[10px] uppercase tracking-[0.2em] text-gold" dir="ltr">
                  {m.month}
                </p>
                <div className="mt-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">مُحصَّل</span>
                    <span className="font-bold text-success">{m.collected} ج.م</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">مستحق</span>
                    <span className="font-bold text-gold">{m.pending} ج.م</span>
                  </div>
                  {m.overdue > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">متأخر</span>
                      <span className="font-bold text-error">{m.overdue} ج.م</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border-soft">
                  <div
                    className="h-full rounded-full bg-gold"
                    style={{ width: `${m.total > 0 ? Math.round((m.collected / m.total) * 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent students */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">أحدث الطلاب المنضمين</h2>
          <span className="text-xs text-text-muted">قسم سجلات القافلة</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border-soft text-start text-[11px] text-text-muted">
                <th className="py-2 text-start font-medium">الطالب</th>
                <th className="py-2 text-start font-medium">الكود</th>
                <th className="py-2 text-start font-medium">المرحلة</th>
                <th className="py-2 text-start font-medium">العام الدراسي</th>
                <th className="py-2 text-start font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {data.recentStudents.map((s) => (
                <tr key={s.id} className="border-b border-border-soft/60 last:border-0">
                  <td className="py-2.5 font-semibold text-text-primary">{s.fullName}</td>
                  <td className="py-2.5 font-plex text-xs text-text-muted" dir="ltr">{s.studentCode}</td>
                  <td className="py-2.5 text-text-secondary">{s.stageAr}</td>
                  <td className="py-2.5 text-text-secondary">{s.academicYear}</td>
                  <td className="py-2.5">
                    {s.hasPaymentIssue ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-error/10 px-2 py-0.5 text-[10px] font-bold text-error">
                        <AlertTriangle size={10} /> مستحقات متأخرة
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
                        <CheckCircle2 size={10} /> سداد سليم
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
