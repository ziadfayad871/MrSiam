import { BarChart3, BookOpen, CheckCircle2, FileText, GraduationCap, Users, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CompassLoader } from '../design-system/components/CompassLoader';
import { Card } from '../design-system/ui/Card';
import { api } from '../lib/api';
import type { AnalyticsOverviewDto, StudentListItemDto } from '../lib/types';
import StudentDetail from './StudentDetail';

const TH = 'py-2 text-center font-medium';
const TD = 'py-2.5 text-center';

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

function PassBadge({ rate }: { rate: number }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${rate >= 50 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
      {rate >= 50 ? <CheckCircle2 size={10} /> : <XCircle size={10} />} {fmt(rate)}
    </span>
  );
}

export default function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsOverviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentListItemDto[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    api
      .get<AnalyticsOverviewDto>('/analytics/overview')
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'فشل تحميل التحليلات'))
      .finally(() => setLoading(false));
    api
      .get<{ items: StudentListItemDto[] }>('/students?pageSize=100')
      .then((res) => setStudents(res?.items ?? []))
      .catch(() => setStudents([]));
  }, []);

  if (loading) return <CompassLoader text="بنحلل النتائج..." />;
  if (error || !data)
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-md border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">{error}</p>
        {error && <p className="text-xs text-text-muted">لو لقيت خطأ authorization فتأكد إنك داخل بحساب معلم أو أمين.</p>}
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-7">
        <StatCard label="الطلاب" value={String(data.totalStudents)} icon={<Users size={15} />} />
        <StatCard label="الكورسات" value={String(data.totalCourses)} icon={<BookOpen size={15} />} />
        <StatCard label="الامتحانات" value={String(data.totalExams)} icon={<FileText size={15} />} />
        <StatCard label="المحاولات" value={String(data.totalAttempts)} icon={<GraduationCap size={15} />} />
        <StatCard label="المتوسط العام" value={fmt(data.overallAverage)} icon={<BarChart3 size={15} />} />
        <StatCard label="معدل النجاح" value={fmt(data.overallPassRate)} icon={<CheckCircle2 size={15} />} />
        <StatCard label="محاولات آخر أسبوع" value={String(data.attemptsLastWeek)} icon={<Users size={15} />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-bold text-text-primary">الأداء حسب المرحلة</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border-soft text-[11px] text-text-muted">
                  <th className={TH}>المرحلة</th>
                  <th className={TH}>طلاب</th>
                  <th className={TH}>محاولات</th>
                  <th className={TH}>المتوسط</th>
                  <th className={TH}>معدل النجاح</th>
                </tr>
              </thead>
              <tbody>
                {data.stages.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-text-muted">مفيش محاولات لسه — أول امتحان هيظهر هنا</td>
                  </tr>
                )}
                {data.stages.map((s) => (
                  <tr key={s.stage} className="border-b border-border-soft/60 last:border-0">
                    <td className={`${TD} font-semibold text-text-primary`}>{s.stageAr}</td>
                    <td className={`${TD} text-text-secondary`}>{s.studentCount}</td>
                    <td className={`${TD} text-text-secondary`}>{s.attemptCount}</td>
                    <td className={`${TD} font-bold text-gold`}>{fmt(s.avgPercentage)}</td>
                    <td className={TD}><PassBadge rate={s.passRate} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-bold text-text-primary">الأداء حسب الكورس</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border-soft text-[11px] text-text-muted">
                  <th className={TH}>الكورس</th>
                  <th className={TH}>امتحانات</th>
                  <th className={TH}>محاولات</th>
                  <th className={TH}>المتوسط</th>
                  <th className={TH}>معدل النجاح</th>
                </tr>
              </thead>
              <tbody>
                {data.courses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-text-muted">مفيش بيانات لسه</td>
                  </tr>
                )}
                {data.courses.map((c) => (
                  <tr key={c.courseId} className="border-b border-border-soft/60 last:border-0">
                    <td className={`${TD} font-semibold text-text-primary`}>{c.title}</td>
                    <td className={`${TD} text-text-secondary`}>{c.examCount}</td>
                    <td className={`${TD} text-text-secondary`}>{c.attemptCount}</td>
                    <td className={`${TD} font-bold text-gold`}>{fmt(c.avgPercentage)}</td>
                    <td className={TD}><PassBadge rate={c.passRate} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-bold text-text-primary">أقوى الامتحانات أداءً</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border-soft text-[11px] text-text-muted">
                <th className={TH}>الامتحان</th>
                <th className={TH}>محاولات</th>
                <th className={TH}>المتوسط</th>
                <th className={TH}>الأفضل</th>
                <th className={TH}>معدل النجاح</th>
              </tr>
            </thead>
            <tbody>
              {data.exams.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-text-muted">مفيش محاولات لسه</td>
                </tr>
              )}
              {data.exams.map((e) => (
                <tr key={e.examId} className="border-b border-border-soft/60 last:border-0">
                  <td className={`${TD} font-semibold text-text-primary`}>{e.title}</td>
                  <td className={`${TD} text-text-secondary`}>{e.attemptCount}</td>
                  <td className={`${TD} text-text-secondary`}>{fmt(e.avgPercentage)}</td>
                  <td className={`${TD} font-bold text-gold`}>{fmt(e.bestPercentage)}</td>
                  <td className={TD}><PassBadge rate={e.passRate} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-text-primary">ملف طالب بالتفصيل</h2>
            <p className="mt-0.5 text-xs text-text-muted">اختار طالب وشوف كل محاولاته ومستواه في كل مادة.</p>
          </div>
          <select
            value={selected ?? ''}
            onChange={(e) => setSelected(e.target.value ? Number(e.target.value) : null)}
            className="w-full max-w-xs rounded-md border border-border-soft bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-gold/60"
          >
            <option value="">اختار طالب...</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.username})
              </option>
            ))}
          </select>
        </div>
        {selected === null ? (
          <p className="rounded-md border border-dashed border-border-soft py-8 text-center text-sm text-text-muted">
            اختار طالب من القائمة عشان تشوف تحليله الكامل.
          </p>
        ) : (
          <StudentDetail studentId={selected} />
        )}
      </Card>
    </div>
  );
}
