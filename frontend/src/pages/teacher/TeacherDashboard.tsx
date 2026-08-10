import { BookOpen, CheckCircle2, Compass, FileText, GraduationCap, Users, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CompassLoader } from '../../design-system/components/CompassLoader';
import { Podium } from '../../design-system/components/Podium';
import { Card } from '../../design-system/ui/Card';
import { ErrorState } from '../../design-system/ui/ErrorState';
import { Progress } from '../../design-system/ui/Progress';
import { Stat } from '../../design-system/ui/Stat';
import { api } from '../../lib/api';
import type { TeacherDashboardDto } from '../../lib/types';

const ICONS: Record<string, React.ReactNode> = {
  students: <Users size={16} />,
  courses: <BookOpen size={16} />,
  exams: <FileText size={16} />,
  attempts: <GraduationCap size={16} />,
  passRate: <CheckCircle2 size={16} />,
  achievements: <Compass size={16} />,
};

function StatCard({ label, value, unit, icon, trend }: { label: string; value: string; unit: string; icon: string; trend: number }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border-soft bg-surface p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-text-muted">{ICONS[icon]}</span>
        {trend !== 0 && (
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${trend > 0 ? 'bg-success/15 text-success' : 'bg-error/15 text-error'}`}>
            {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold text-text-primary">
        {value}
        {unit && <span className="ms-1 text-sm font-normal text-text-muted">{unit}</span>}
      </p>
      <p className="mt-0.5 text-[11px] text-text-muted">{label}</p>
    </div>
  );
}

export default function TeacherDashboard() {
  const [data, setData] = useState<TeacherDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<TeacherDashboardDto>('/dashboard/teacher')
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'فشل تحميل اللوحة'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CompassLoader text="بنرسم الخريطة العامة..." />;
  if (error || !data) return <ErrorState title={error ?? 'مفيش بيانات'} onRetry={() => window.location.reload()} />;

  const maxAttempts = Math.max(...data.performanceTrend.map((p) => p.attempts), 1);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="display-serif text-2xl font-bold text-text-primary">غرفة قيادة الرحلة</h1>
        <p className="mt-1 text-sm text-text-muted">ملخص أداء طلابك عبر المحطات — بمنظور مدرّس القافلة.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {data.stats.map((s) => (
          <StatCard
            key={s.key}
            label={s.label}
            value={s.value}
            unit={s.unit}
            icon={s.icon}
            trend={s.trend}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Trend */}
        <Card className="lg:col-span-2">
          <h2 className="mb-5 text-lg font-bold text-text-primary">منحنى الأداء الشهري</h2>
          <div className="flex h-48 items-end gap-2 sm:gap-4">
            {data.performanceTrend.map((p) => (
              <div key={p.period} className="group flex flex-1 flex-col items-center gap-2">
                <div className="relative flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-gold/30 to-gold transition-all duration-500 group-hover:from-gold/50"
                    style={{ height: `${Math.max((p.average / 100) * 100, 4)}%` }}
                    title={`متوسط ${p.average}%`}
                  />
                </div>
                <div className="flex w-full flex-col items-center gap-0.5">
                  <span className="font-plex text-[9px] text-gold" dir="ltr">
                    {p.average}%
                  </span>
                  <span className="text-[10px] text-text-muted">{p.period}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Podium */}
        <Card>
          <h2 className="mb-4 text-lg font-bold text-text-primary">أوائل الرحلة</h2>
          <Podium entries={data.podium.map((p) => ({ rank: p.rank, name: p.fullName, score: p.average, stage: p.stageAr }))} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Course performance */}
        <Card className="lg:col-span-2">
          <h2 className="mb-5 text-lg font-bold text-text-primary">أداء المواد</h2>
          <div className="flex flex-col gap-4">
            {data.coursePerformance.map((c) => (
              <div key={c.courseId} className="rounded-md border border-border-soft p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-text-primary">{c.title}</p>
                    <p className="text-[10px] text-text-muted">{c.studentsCount} طالب · {c.attempts} محاولة</p>
                  </div>
                  <span className="text-sm font-bold text-gold">{c.average}%</span>
                </div>
                <Progress value={c.successRate} />
                <p className="mt-1 text-[10px] text-text-muted">معدل نجاح {c.successRate}%</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent attempts */}
        <Card>
          <h2 className="mb-4 text-lg font-bold text-text-primary">آخر المحاولات</h2>
          <div className="flex flex-col gap-2">
            {data.recentAttempts.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-md border border-border-soft px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text-primary">{a.studentName}</p>
                  <p className="truncate text-[10px] text-text-muted">{a.examTitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  {a.passed ? <CheckCircle2 size={15} className="text-success" /> : <XCircle size={15} className="text-error" />}
                  <span className="text-xs font-bold text-text-primary">{a.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
          <Link to="/courses" className="mt-4 block text-center text-xs font-semibold text-gold hover:underline">
            إدارة الامتحانات والمواد
          </Link>
        </Card>
      </div>
    </div>
  );
}
