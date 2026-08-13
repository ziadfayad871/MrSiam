import { CheckCircle2, Clock, Loader2, Save, UserCheck, Users, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CompassLoader } from '../../design-system/components/CompassLoader';
import { Badge } from '../../design-system/ui/Badge';
import { Button } from '../../design-system/ui/Button';
import { Card } from '../../design-system/ui/Card';
import { EmptyState } from '../../design-system/ui/EmptyState';
import { ErrorState } from '../../design-system/ui/ErrorState';
import { api } from '../../lib/api';
import type { AttendanceStatusType, DailyAttendanceStudentDto } from '../../lib/types';

const STATUS_OPTIONS: { value: AttendanceStatusType; label: string; color: string }[] = [
  { value: 'Present', label: 'حاضر', color: 'text-success border-success/40 hover:bg-success/10' },
  { value: 'Absent', label: 'غائب', color: 'text-error border-error/40 hover:bg-error/10' },
  { value: 'Late', label: 'متأخر', color: 'text-gold border-gold/40 hover:bg-gold/10' },
  { value: 'Excused', label: 'معذور', color: 'text-blue-400 border-blue-500/40 hover:bg-blue-500/10' },
];

const ACTIVE_BG: Record<AttendanceStatusType, string> = {
  Present: 'bg-success/15 text-success border-success/60',
  Absent: 'bg-error/15 text-error border-error/60',
  Late: 'bg-gold/15 text-gold border-gold/60',
  Excused: 'bg-blue-500/15 text-blue-400 border-blue-500/60',
};

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function SecretaryAttendancePage() {
  const [date, setDate] = useState(todayISO());
  const [students, setStudents] = useState<DailyAttendanceStudentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = async (selectedDate: string) => {
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await api.get<DailyAttendanceStudentDto[]>(`/attendance/daily?date=${selectedDate}`);
      setStudents(Array.isArray(res) ? res : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تحميل الحضور');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setStatus = (studentId: number, status: AttendanceStatusType) => {
    setStudents((prev) => prev.map((s) => (s.studentId === studentId ? { ...s, status } : s)));
  };

  const counts = useMemo(() => {
    const marked = students.filter((s) => s.status != null).length;
    const present = students.filter((s) => s.status === 'Present').length;
    const absent = students.filter((s) => s.status === 'Absent').length;
    const late = students.filter((s) => s.status === 'Late').length;
    const excused = students.filter((s) => s.status === 'Excused').length;
    return { marked, present, absent, late, excused };
  }, [students]);

  const byStage = useMemo(() => {
    const map = new Map<string, DailyAttendanceStudentDto[]>();
    for (const s of students) {
      const arr = map.get(s.stageAr) ?? [];
      arr.push(s);
      map.set(s.stageAr, arr);
    }
    return [...map.entries()];
  }, [students]);

  const save = async () => {
    const items = students
      .filter((s) => s.status != null)
      .map((s) => ({ studentId: s.studentId, status: s.status as AttendanceStatusType, notes: s.notes ?? null }));
    if (items.length === 0) {
      setError('حدد حالة الحضور لطالب واحد على الأقل قبل الحفظ');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.post<boolean>('/attendance/bulk', { date, items });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل حفظ الحضور');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="display-serif text-xl font-bold text-text-primary">حضور وغياب اليوم</h2>
          <p className="mt-1 text-sm text-text-muted">سجّل حضور كل طالب بضغطة واحدة — احفظ الكشف في نهاية اليوم.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              load(e.target.value);
            }}
            className="rounded-md border border-border-soft bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-gold/60"
          />
          <Button variant="gold" onClick={() => void save()} loading={saving} icon={<Save size={16} />}>
            حفظ الكشف
          </Button>
        </div>
      </div>

      {saved && (
        <p className="flex items-center gap-2 rounded-md border border-success/40 bg-success/10 px-4 py-2.5 text-sm font-semibold text-success">
          <CheckCircle2 size={16} /> تم حفظ حضور اليوم بنجاح
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Card className="p-4">
          <p className="flex items-center gap-2 text-xs text-text-muted"><Users size={14} /> مسجلون</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{counts.marked} <span className="text-xs font-normal text-text-muted">من {students.length}</span></p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-2 text-xs text-text-muted"><UserCheck size={14} className="text-success" /> حاضر</p>
          <p className="mt-2 text-2xl font-bold text-success">{counts.present}</p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-2 text-xs text-text-muted"><XCircle size={14} className="text-error" /> غائب</p>
          <p className="mt-2 text-2xl font-bold text-error">{counts.absent}</p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-2 text-xs text-text-muted"><Clock size={14} className="text-gold" /> متأخر</p>
          <p className="mt-2 text-2xl font-bold text-gold">{counts.late}</p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-2 text-xs text-text-muted"><CheckCircle2 size={14} className="text-blue-400" /> معذور</p>
          <p className="mt-2 text-2xl font-bold text-blue-400">{counts.excused}</p>
        </Card>
      </div>

      {loading ? (
        <CompassLoader text="بنجيب الطلبة..." />
      ) : error && students.length === 0 ? (
        <ErrorState title={error} onRetry={() => load(date)} />
      ) : students.length === 0 ? (
        <EmptyState title="مفيش طلبة" description="سجّل طلابك الأول من صفحة إدارة الطلبة عشان تعلّم حضورهم." />
      ) : (
        byStage.map(([stageAr, list]) => (
          <Card key={stageAr}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-text-primary">
                <Users size={15} className="text-gold" /> {stageAr}
              </h3>
              <Badge variant="outline">{list.length} طالب</Badge>
            </div>
            <div className="flex flex-col divide-y divide-border-soft/60">
              {list.map((s) => (
                <div key={s.studentId} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary">{s.fullName}</p>
                    <p className="font-plex text-[11px] text-text-muted" dir="ltr">{s.studentCode}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {STATUS_OPTIONS.map((opt) => {
                      const active = s.status === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setStatus(s.studentId, opt.value)}
                          className={`rounded-md border px-3 py-1 text-xs font-bold transition-colors ${
                            active ? ACTIVE_BG[opt.value] : `border-border-soft bg-transparent text-text-muted ${opt.color}`
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))
      )}

      {error && students.length > 0 && (
        <p className="text-sm font-semibold text-error">{error}</p>
      )}
    </div>
  );
}