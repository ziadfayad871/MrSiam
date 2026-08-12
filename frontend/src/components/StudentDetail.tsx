import { BarChart3, BookOpen, CheckCircle2, FileText, GraduationCap, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CompassLoader } from '../design-system/components/CompassLoader';
import { Card } from '../design-system/ui/Card';
import { Progress } from '../design-system/ui/Progress';
import { api } from '../lib/api';
import type { StudentAnalyticsDto } from '../lib/types';

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border-soft bg-surface p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-text-muted">{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-bold text-text-primary">{value}</p>
      <p className="mt-0.5 text-[11px] text-text-muted">{label}</p>
    </div>
  );
}

function fmt(n: number): string {
  return `${Number(n).toFixed(1)}%`;
}

export default function StudentDetail({ studentId }: { studentId: number }) {
  const [data, setData] = useState<StudentAnalyticsDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<StudentAnalyticsDto>(`/analytics/students/${studentId}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <CompassLoader text="بنجيب ملف الطالب..." />;
  if (!data) return <p className="rounded-md border border-dashed border-border-soft py-6 text-center text-sm text-text-muted">مفيش بيانات للطالب ده.</p>;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="امتحانات تمت" value={String(data.examsTaken)} icon={<FileText size={15} />} />
        <StatCard label="إجمالي المحاولات" value={String(data.totalAttempts)} icon={<GraduationCap size={15} />} />
        <StatCard label="ناجح" value={String(data.passedExams)} icon={<CheckCircle2 size={15} />} />
        <StatCard label="أفضل نتيجة" value={fmt(data.bestPercentage)} icon={<BarChart3 size={15} />} />
        <StatCard label="المتوسط" value={fmt(data.avgPercentage)} icon={<BookOpen size={15} />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-sm font-bold text-text-primary">أداء المواد</h3>
          {data.subjects.length === 0 ? (
            <p className="py-4 text-center text-xs text-text-muted">لسه مفيش محاولات</p>
          ) : (
            <div className="flex flex-col gap-3">
              {data.subjects.map((s) => (
                <div key={s.subject}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary">{s.subjectAr}</span>
                    <span className="text-text-muted">{s.attemptCount} محاولة · {fmt(s.avgPercentage)}</span>
                  </div>
                  <Progress value={s.avgPercentage} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-bold text-text-primary">كل المحاولات</h3>
          {data.attempts.length === 0 ? (
            <p className="py-4 text-center text-xs text-text-muted">لسه مفيش محاولات</p>
          ) : (
            <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
              {data.attempts.map((a) => (
                <div key={`${a.examId}-${a.submittedAt}`} className="flex items-center justify-between rounded-md border border-border-soft px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-text-primary">{a.examTitle}</p>
                    <p className="text-[10px] text-text-muted">{a.score} درجة</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.passed ? <CheckCircle2 size={13} className="text-success" /> : <XCircle size={13} className="text-error" />}
                    <span className="text-xs font-bold text-text-primary">{fmt(a.percentage)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
