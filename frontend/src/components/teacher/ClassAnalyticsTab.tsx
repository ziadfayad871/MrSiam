import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  FileText,
  GraduationCap,
  ShieldAlert,
  Sparkles,
  UserX,
  Users,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CompassLoader } from '../../design-system/components/CompassLoader';
import { Card } from '../../design-system/ui/Card';
import { api } from '../../lib/api';
import type { ClassAnalyticsDto, ClassStudentRowDto, EarlyWarningDto } from '../../lib/types';
import StudentDetail from '../StudentDetail';

const TH = 'py-2 text-center font-medium';
const TD = 'py-2.5 text-center';

function fmt(n: number): string {
  return `${Number(n).toFixed(1)}%`;
}

function StatCard({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone?: 'gold' | 'error' }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border-soft bg-surface p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <span className={tone === 'error' ? 'text-error' : 'text-gold'}>{icon}</span>
      </div>
      <p className={`mt-3 text-2xl font-bold ${tone === 'error' ? 'text-error' : 'text-text-primary'}`}>{value}</p>
      <p className="mt-0.5 text-[11px] text-text-muted">{label}</p>
    </div>
  );
}

function RiskBadge({ rate }: { rate: number }) {
  if (rate >= 70)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
        <CheckCircle2 size={10} /> منخفض
      </span>
    );
  if (rate >= 50)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold">
        <AlertTriangle size={10} /> متوسط
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-error/10 px-2 py-0.5 text-[10px] font-bold text-error">
      <XCircle size={10} /> مرتفع
    </span>
  );
}

function WarningCard({ w, onOpen }: { w: EarlyWarningDto; onOpen: () => void }) {
  const critical = w.severity === 'Critical';
  return (
    <div
      className={`rounded-lg border p-4 ${critical ? 'border-error/40 bg-error/5' : 'border-gold/40 bg-gold/5'}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${critical ? 'bg-error/15 text-error' : 'bg-gold/15 text-gold'}`}>
            {critical ? <ShieldAlert size={16} /> : <AlertTriangle size={16} />}
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary">{w.fullName}</p>
            <p className="text-[10px] text-text-muted" dir="ltr">
              {w.studentCode} · {w.stageAr}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-text-secondary">
            {w.avgPercentage > 0 ? fmt(w.avgPercentage) : '—'}
          </span>
          <button
            type="button"
            onClick={onOpen}
            className="rounded-md border border-border-soft bg-surface px-2.5 py-1 text-[11px] font-semibold text-text-secondary transition-colors hover:border-gold/50 hover:text-gold"
          >
            ملف الطالب
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {w.reasons.map((r) => (
          <span
            key={r}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${critical ? 'bg-error/10 text-error' : 'bg-gold/10 text-gold'}`}
          >
            <AlertTriangle size={10} />
            {r}
          </span>
        ))}
      </div>
    </div>
  );
}

function StudentRow({ row, expanded, onToggle }: { row: ClassStudentRowDto; expanded: boolean; onToggle: () => void }) {
  return (
    <>
      <tr onClick={onToggle} className="cursor-pointer border-b border-border-soft/60 transition-colors last:border-0 hover:bg-surface-sunken/60">
        <td className={`${TD} text-start`}>
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold/10 text-[10px] font-bold text-gold">
              {row.fullName.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-text-primary">{row.fullName}</p>
              <p className="text-[10px] text-text-muted" dir="ltr">{row.studentCode}</p>
            </div>
          </div>
        </td>
        <td className={`${TD} text-xs text-text-secondary`}>{row.stageAr}</td>
        <td className={`${TD} text-xs text-text-secondary`}>{row.examsTaken}</td>
        <td className={`${TD} font-bold text-gold`}>{row.attemptCount > 0 ? fmt(row.avgPercentage) : '—'}</td>
        <td className={TD}><RiskBadge rate={row.avgPercentage} /></td>
        <td className={`${TD} text-xs text-text-secondary`}>
          {row.attendanceRate > 0 ? fmt(row.attendanceRate) : '—'}
        </td>
        <td className={`${TD} text-xs text-text-secondary`}>{row.lessonsCompleted}</td>
        <td className={`${TD} text-[10px] text-text-muted`}>
          {row.lastActiveAt ? new Date(row.lastActiveAt).toLocaleDateString('ar-EG') : '—'}
        </td>
        <td className={TD}>
          <ChevronDown size={14} className={`mx-auto text-text-muted transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-border-soft/60">
          <td colSpan={9} className="bg-surface-sunken/40 px-4 py-4">
            <StudentDetail studentId={row.studentId} />
          </td>
        </tr>
      )}
    </>
  );
}

type SortKey = 'avg' | 'attempts' | 'lastActive' | 'name' | 'attendance';

const SORT_LABELS: Record<SortKey, string> = {
  avg: 'المتوسط',
  attempts: 'عدد المحاولات',
  lastActive: 'آخر نشاط',
  name: 'الاسم',
  attendance: 'الحضور',
};

export default function ClassAnalyticsTab() {
  const [data, setData] = useState<ClassAnalyticsDto | null>(null);
  const [warnings, setWarnings] = useState<EarlyWarningDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('avg');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<ClassAnalyticsDto>('/analytics/class'),
      api.get<EarlyWarningDto[]>('/analytics/warnings'),
    ])
      .then(([c, w]) => {
        setData(c);
        setWarnings(w ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'فشل تحميل بيانات الفصل'))
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => {
    if (!data) return [];
    const list = [...data.students];
    switch (sort) {
      case 'avg':
        return list.sort((a, b) => b.avgPercentage - a.avgPercentage);
      case 'attempts':
        return list.sort((a, b) => b.attemptCount - a.attemptCount);
      case 'attendance':
        return list.sort((a, b) => b.attendanceRate - a.attendanceRate);
      case 'lastActive':
        return list.sort((a, b) => (b.lastActiveAt ?? '').localeCompare(a.lastActiveAt ?? ''));
      case 'name':
        return list.sort((a, b) => a.fullName.localeCompare(b.fullName, 'ar'));
    }
  }, [data, sort]);

  if (loading) return <CompassLoader text="بنجمع ملفات الفصل..." />;
  if (error || !data)
    return <p className="rounded-md border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">{error}</p>;

  const criticalCount = warnings.filter((w) => w.severity === 'Critical').length;

  return (
    <div className="flex flex-col gap-6">
      {/* Warnings — early warning system */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-error/10 text-error">
              <ShieldAlert size={17} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-text-primary">الإنذار المبكر</h2>
              <p className="text-xs text-text-muted">طلاب محتاجين تدخل سريع قبل ما يقعوا.</p>
            </div>
          </div>
          {warnings.length > 0 && (
            <span className="rounded-full border border-error/40 bg-error/10 px-3 py-1 text-[11px] font-bold text-error">
              {warnings.length} طالب محتاج متابعة
            </span>
          )}
        </div>

        {warnings.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-success/40 bg-success/5 px-4 py-3">
            <Sparkles size={16} className="text-success" />
            <p className="text-sm text-text-secondary">الكل تمام — مفيش طالب محتاج إنذار في الوقت الحالي.</p>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {warnings.map((w) => (
              <WarningCard key={w.studentId} w={w} onOpen={() => setExpandedId(expandedId === w.studentId ? null : w.studentId)} />
            ))}
          </div>
        )}
      </div>

      {/* Class stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard label="إجمالي الطلاب" value={String(data.totalStudents)} icon={<Users size={15} />} />
        <StatCard label="طلاب نشطين" value={String(data.activeStudents)} icon={<UserX size={15} />} />
        <StatCard label="متوسط الفصل" value={fmt(data.avgPercentage)} icon={<GraduationCap size={15} />} />
        <StatCard label="معدل النجاح" value={fmt(data.passRate)} icon={<CheckCircle2 size={15} />} />
        <StatCard label="متوسط الحضور" value={fmt(data.attendanceRate)} icon={<CalendarClock size={15} />} />
        <StatCard label="تحت المراقبة" value={String(criticalCount)} icon={<AlertTriangle size={15} />} tone={criticalCount > 0 ? 'error' : undefined} />
      </div>

      {/* Class roster */}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-text-primary">كشف الفصل</h2>
            <p className="mt-0.5 text-xs text-text-muted">اضغط على أي طالب عشان تشوف ملفه الكامل.</p>
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-md border border-border-soft bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-gold/60"
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <option key={k} value={k}>ترتيب: {SORT_LABELS[k]}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-border-soft text-[11px] text-text-muted">
                <th className={`${TH} text-start`}>الطالب</th>
                <th className={TH}>المرحلة</th>
                <th className={TH}>امتحانات</th>
                <th className={TH}>المتوسط</th>
                <th className={TH}>المستوى</th>
                <th className={TH}>الحضور</th>
                <th className={TH}>دروس مكتملة</th>
                <th className={TH}>آخر نشاط</th>
                <th className={TH}></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-text-muted">مفيش طلاب مسجلين لسه.</td>
                </tr>
              )}
              {rows.map((r) => (
                <StudentRow
                  key={r.studentId}
                  row={r}
                  expanded={expandedId === r.studentId}
                  onToggle={() => setExpandedId(expandedId === r.studentId ? null : r.studentId)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
