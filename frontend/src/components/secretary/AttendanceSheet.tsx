import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock,
  Pencil,
  Printer,
  Save,
  Search,
  Settings2,
  Trash2,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { CompassLoader } from '../../design-system/components/CompassLoader';
import { Badge } from '../../design-system/ui/Badge';
import { Button } from '../../design-system/ui/Button';
import { Card } from '../../design-system/ui/Card';
import { EmptyState } from '../../design-system/ui/EmptyState';
import { ErrorState } from '../../design-system/ui/ErrorState';
import { Input, Select, Textarea } from '../../design-system/ui/Field';
import { Modal } from '../../design-system/ui/Modal';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import type {
  AttendanceStatusType,
  DailyAttendanceStudentDto,
  PaymentReceiptDto,
  ScheduleSlotDto,
  Stage,
  StudyGroupDetailDto,
  StudyGroupListItemDto,
} from '../../lib/types';
import { ReceiptView } from './PaymentReceipt';

const STAGES: { key: Stage; ar: string }[] = [
  { key: 'PrepOne', ar: 'أولى إعدادي' },
  { key: 'PrepTwo', ar: 'تانية إعدادي' },
  { key: 'PrepThree', ar: 'تالتة إعدادي' },
  { key: 'SecOne', ar: 'أولى ثانوي' },
  { key: 'SecTwo', ar: 'تانية ثانوي' },
  { key: 'SecThree', ar: 'تالتة ثانوي' },
];

const STATUS_OPTIONS: { value: AttendanceStatusType; label: string; color: string }[] = [
  { value: 'Present', label: 'حاضر', color: 'text-success border-success/40 hover:bg-success/10' },
  { value: 'Absent', label: 'غائب', color: 'text-error border-error/40 hover:bg-error/10' },
  { value: 'Late', label: 'متأخر', color: 'text-gold border-gold/40 hover:bg-gold/10' },
  { value: 'Excused', label: 'معذور', color: 'text-blue-400 border-blue-500/40 hover:bg-blue-500/10' },
];

const WEEKDAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const DAY_NAME_TO_NUM: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const toDow = (day: number | string): number =>
  typeof day === 'number' ? day : (DAY_NAME_TO_NUM[day] ?? -1);

const ACTIVE_BG: Record<AttendanceStatusType, string> = {
  Present: 'bg-success/15 text-success border-success/60',
  Absent: 'bg-error/15 text-error border-error/60',
  Late: 'bg-gold/15 text-gold border-gold/60',
  Excused: 'bg-blue-500/15 text-blue-400 border-blue-500/60',
};

const TH = 'py-2.5 px-3 text-center text-[11px] font-bold text-text-muted';
const TD = 'py-2.5 px-3 text-center';

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthOf(dateISO: string): string {
  return dateISO.slice(0, 7);
}

function formatDateLong(dateISO: string): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const FEES_KEY = 'mrsiam_monthly_fees_v1';

interface MonthlyFees {
  stages: Partial<Record<Stage, number>>;
  groups: Partial<Record<number, number>>;
}

function loadFees(): MonthlyFees {
  try {
    const raw = localStorage.getItem(FEES_KEY);
    if (!raw) return { stages: {}, groups: {} };
    const parsed = JSON.parse(raw) as Partial<MonthlyFees>;
    return { stages: parsed?.stages ?? {}, groups: parsed?.groups ?? {} };
  } catch {
    return { stages: {}, groups: {} };
  }
}

function formatMoney(n: number): string {
  return `${Number(n).toLocaleString('ar-EG')} ج.م`;
}

export default function AttendanceSheet() {
  const [date, setDate] = useState(todayISO());
  const [students, setStudents] = useState<DailyAttendanceStudentDto[]>([]);
  const [groups, setGroups] = useState<StudyGroupListItemDto[]>([]);
  const [groupDetail, setGroupDetail] = useState<StudyGroupDetailDto | null>(null);
  const [sessionDow, setSessionDow] = useState<Set<number>>(new Set());
  const [paidIds, setPaidIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [stageFilter, setStageFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [search, setSearch] = useState('');

  const [editTarget, setEditTarget] = useState<DailyAttendanceStudentDto | null>(null);
  const [editStatus, setEditStatus] = useState<AttendanceStatusType>('Present');
  const [editNotes, setEditNotes] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<DailyAttendanceStudentDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [collectTarget, setCollectTarget] = useState<DailyAttendanceStudentDto | null>(null);
  const [collectForm, setCollectForm] = useState({ amount: '', method: 'نقدي' });
  const [collecting, setCollecting] = useState(false);
  const [receipt, setReceipt] = useState<PaymentReceiptDto | null>(null);

  const [fees, setFees] = useState<MonthlyFees>(loadFees);
  const [feesOpen, setFeesOpen] = useState(false);
  const [feesDraft, setFeesDraft] = useState<MonthlyFees | null>(null);

  const { user } = useAuth();
  const isCollector = user?.role === 'Secretary' || user?.role === 'Admin';

  const load = async (selectedDate: string) => {
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const [daily, groupsRes, paymentsRes] = await Promise.all([
        api.get<DailyAttendanceStudentDto[]>(`/attendance/daily?date=${selectedDate}`),
        api.get<StudyGroupListItemDto[]>('/study-groups?includeInactive=false'),
        isCollector
          ? api
              .get<{ items: { studentId: number }[] }>(`/payments?month=${monthOf(selectedDate)}&status=Paid&pageSize=200`)
              .catch(() => ({ items: [] }))
          : Promise.resolve({ items: [] }),
      ]);
      setStudents(Array.isArray(daily) ? daily : []);
      setGroups(Array.isArray(groupsRes) ? groupsRes : []);
      setPaidIds(new Set((paymentsRes?.items ?? []).map((p) => p.studentId)));
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

  useEffect(() => {
    if (!groupFilter) {
      setGroupDetail(null);
      setSessionDow(new Set());
      return;
    }
    let cancelled = false;
    api
      .get<StudyGroupDetailDto>(`/study-groups/${groupFilter}`)
      .then((res) => {
        if (!cancelled) setGroupDetail(res);
      })
      .catch(() => {
        if (!cancelled) setGroupDetail(null);
      });
    api
      .get<ScheduleSlotDto[]>(`/schedule?groupId=${groupFilter}`)
      .then((res) => {
        if (!cancelled)
          setSessionDow(
            new Set(
              (Array.isArray(res) ? res : [])
                .map((s) => toDow(s.day))
                .filter((d) => d >= 0),
            ),
          );
      })
      .catch(() => {
        if (!cancelled) setSessionDow(new Set());
      });
    return () => {
      cancelled = true;
    };
  }, [groupFilter]);

  const setStatus = (studentId: number, status: AttendanceStatusType) => {
    setStudents((prev) => prev.map((s) => (s.studentId === studentId ? { ...s, status } : s)));
  };

  const groupsForStage = useMemo(
    () => (stageFilter ? groups.filter((g) => g.stage === stageFilter) : groups),
    [groups, stageFilter],
  );

  const roster = useMemo(() => {
    let rows = students;
    if (groupFilter) {
      const memberIds = new Set((groupDetail?.members ?? []).map((m) => m.studentId));
      rows = rows.filter((s) => memberIds.has(s.studentId));
    } else if (stageFilter) {
      rows = rows.filter((s) => s.stage === stageFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (s) => s.fullName.toLowerCase().includes(q) || s.studentCode.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [students, groupFilter, groupDetail, stageFilter, search]);

  const counts = useMemo(() => {
    const marked = roster.filter((s) => s.status != null).length;
    const present = roster.filter((s) => s.status === 'Present').length;
    const absent = roster.filter((s) => s.status === 'Absent').length;
    const late = roster.filter((s) => s.status === 'Late').length;
    const excused = roster.filter((s) => s.status === 'Excused').length;
    const collected = roster.filter((s) => paidIds.has(s.studentId)).length;
    return { marked, present, absent, late, excused, collected };
  }, [roster, paidIds]);

  const markAllPresent = () => {
    const ids = new Set(roster.map((r) => r.studentId));
    setStudents((prev) => prev.map((s) => (ids.has(s.studentId) ? { ...s, status: 'Present' } : s)));
  };

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

  const openEdit = (s: DailyAttendanceStudentDto) => {
    setEditTarget(s);
    setEditStatus(s.status ?? 'Present');
    setEditNotes(s.notes ?? '');
  };

  const saveEdit = () => {
    if (!editTarget) return;
    setStudents((prev) =>
      prev.map((s) =>
        s.studentId === editTarget.studentId
          ? { ...s, status: editStatus, notes: editNotes.trim() || null }
          : s,
      ),
    );
    setEditTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      await api.del<boolean>(`/attendance/records/${deleteTarget.studentId}?date=${date}`);
      setStudents((prev) =>
        prev.map((s) => (s.studentId === deleteTarget.studentId ? { ...s, status: null, notes: null } : s)),
      );
      setDeleteTarget(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل حذف تسجيل الحضور');
    } finally {
      setDeleting(false);
    }
  };

  const collect = async () => {
    if (!collectTarget || !collectForm.amount || Number(collectForm.amount) <= 0) {
      setError('اكتب مبلغ التحصيل الصحيح');
      return;
    }
    setCollecting(true);
    setError(null);
    try {
      const rec = await api.post<PaymentReceiptDto>('/payments/collect', {
        studentId: collectTarget.studentId,
        amount: Number(collectForm.amount),
        month: monthOf(date),
        method: collectForm.method,
      });
      setReceipt(rec);
      setCollectTarget(null);
      setCollectForm({ amount: '', method: 'نقدي' });
      setPaidIds((prev) => new Set(prev).add(rec.studentId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تسجيل التحصيل');
    } finally {
      setCollecting(false);
    }
  };

  const handlePrint = () => {
    document.body.classList.add('print-attendance-mode');
    window.print();
    const cleanup = () => document.body.classList.remove('print-attendance-mode');
    window.onafterprint = cleanup;
    setTimeout(cleanup, 1500);
  };

  const suggestedAmount = (s: DailyAttendanceStudentDto): string => {
    const override = s.groupId != null ? fees.groups[s.groupId] : undefined;
    const value = override ?? fees.stages[s.stage];
    return value != null && value > 0 ? String(value) : '';
  };

  const openFees = () => {
    setFeesDraft({ stages: { ...fees.stages }, groups: { ...fees.groups } });
    setFeesOpen(true);
  };

  const saveFees = () => {
    if (!feesDraft) return;
    const stages: MonthlyFees['stages'] = {};
    for (const [k, v] of Object.entries(feesDraft.stages)) {
      const n = Number(v);
      if (n > 0) stages[k as Stage] = n;
    }
    const groups: MonthlyFees['groups'] = {};
    for (const [k, v] of Object.entries(feesDraft.groups)) {
      const n = Number(v);
      if (n > 0) groups[Number(k)] = n;
    }
    const next = { stages, groups };
    setFees(next);
    localStorage.setItem(FEES_KEY, JSON.stringify(next));
    setFeesOpen(false);
  };

  const stageLabel = groupDetail?.stageAr ?? (stageFilter ? STAGES.find((s) => s.key === stageFilter)?.ar ?? '—' : 'جميع المراحل');
  const groupLabel = groupDetail?.name ?? (groupFilter ? '—' : 'جميع المجموعات');
  const showStageCol = !stageFilter && !groupFilter;

  const dateDow = new Date(`${date}T00:00:00`).getDay();
  const isSessionDay = sessionDow.has(dateDow);
  const sessionDowNames = [...sessionDow].map((d) => WEEKDAY_NAMES[d]).join(' و');

  return (
    <div className="flex flex-col gap-6">
      {/* ---- Header toolbar ---- */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="display-serif text-xl font-bold text-text-primary">كشف تحضير اليوم</h2>
          <p className="mt-1 text-sm text-text-muted">اختار المرحلة والمجموعة، سجّل الحضور والتحصيل، واطبع الكشف.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              load(e.target.value);
            }}
            className="rounded-md border border-border-soft bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-gold/60"
          />
          <Button variant="outline" onClick={markAllPresent} icon={<UserCheck size={16} />} disabled={roster.length === 0}>
            الكل حاضر
          </Button>
          <Button variant="outline" onClick={handlePrint} icon={<Printer size={16} />} disabled={roster.length === 0}>
            طباعة الكشف
          </Button>
          {isCollector && (
            <Button variant="outline" onClick={openFees} icon={<Settings2 size={16} />}>
              المصاريف الشهرية
            </Button>
          )}
          <Link to={isCollector ? '/secretary/attendance/monthly' : '/teacher/attendance/monthly'}>
            <Button variant="outline" icon={<CalendarDays size={16} />}>
              التقرير الشهري
            </Button>
          </Link>
          <Button variant="gold" onClick={() => void save()} loading={saving} icon={<Save size={16} />}>
            حفظ الكشف
          </Button>
        </div>
      </div>

      {/* ---- Client-side filters ---- */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="المرحلة"
            value={stageFilter}
            onChange={(e) => {
              const stage = e.target.value;
              setStageFilter(stage);
              if (groupFilter) {
                const g = groups.find((x) => x.id === Number(groupFilter));
                if (g && stage && g.stage !== stage) setGroupFilter('');
              }
            }}
          >
            <option value="">كل المراحل</option>
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.ar}
              </option>
            ))}
          </Select>

          <Select
            label="المجموعة"
            value={groupFilter}
            onChange={(e) => {
              setGroupFilter(e.target.value);
              if (e.target.value) setStageFilter('');
            }}
          >
            <option value="">كل المجموعات</option>
            {groupsForStage.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.stageAr}) — {g.memberCount} طالب
              </option>
            ))}
          </Select>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">بحث بالاسم أو الكود</label>
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="اكتب الاسم أو الكود..."
                className="w-full rounded-md border border-border-subtle bg-surface-elevated py-2.5 ps-9 pe-3 text-sm text-text-primary outline-none transition-colors focus:border-gold"
              />
            </div>
          </div>

          <div className="flex flex-col justify-end">
            <p className="text-xs text-text-muted">
              عرض <b className="text-text-primary">{roster.length}</b> من {students.length} طالب
              {search.trim() && ' — نتيجة البحث'}
            </p>
          </div>
        </div>
      </Card>

      {groupFilter && sessionDow.size > 0 && (
        <p className="flex flex-wrap items-center gap-2 rounded-md border border-gold/30 bg-gold/[.06] px-4 py-2.5 text-sm text-text-secondary">
          <Clock size={15} className="text-gold" />
          أيام حصص مجموعة «{groupDetail?.name ?? ''}»: <b className="text-text-primary">{sessionDowNames}</b>
          {isSessionDay ? (
            <Badge variant="outline" className="border-success/50 text-success">اليوم يوم حصة ✓</Badge>
          ) : (
            <Badge variant="outline" className="border-error/40 text-error">اليوم مش من أيام الحصص</Badge>
          )}
        </p>
      )}

      {saved && (
        <p className="flex items-center gap-2 rounded-md border border-success/40 bg-success/10 px-4 py-2.5 text-sm font-semibold text-success">
          <CheckCircle2 size={16} /> تم حفظ حضور اليوم بنجاح
        </p>
      )}

      {/* ---- Stats ---- */}
      <div className={`grid grid-cols-2 gap-4 ${isCollector ? 'sm:grid-cols-6' : 'sm:grid-cols-5'}`}>
        <Card className="p-4">
          <p className="flex items-center gap-2 text-xs text-text-muted"><Users size={14} /> مسجلون</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{counts.marked} <span className="text-xs font-normal text-text-muted">من {roster.length}</span></p>
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
        {isCollector && (
          <Card className="p-4">
            <p className="flex items-center gap-2 text-xs text-text-muted"><Banknote size={14} className="text-gold" /> محصَّل</p>
            <p className="mt-2 text-2xl font-bold text-gold">{counts.collected}</p>
          </Card>
        )}
      </div>

      {/* ---- Table ---- */}
      {loading ? (
        <CompassLoader text="بنجيب الطلبة..." />
      ) : error && students.length === 0 ? (
        <ErrorState title={error} onRetry={() => load(date)} />
      ) : roster.length === 0 ? (
        <EmptyState
          title={search.trim() ? 'مفيش نتيجة للبحث' : 'مفيش طلاب'}
          description={
            search.trim()
              ? 'جرب اسم أو كود تاني، أو امسح الفلاتر.'
              : groupFilter
                ? 'المجموعة دي مفيش فيها طلاب — ضيف طلاب من صفحة المجموعات.'
                : 'سجّل طلابك الأول من صفحة إدارة الطلبة عشان تعلّم حضورهم.'
          }
        />
      ) : (
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-bold text-text-primary">
              <Users size={15} className="text-gold" /> {groupLabel}
              <Badge variant="outline">{roster.length} طالب</Badge>
            </h3>
            {isCollector && <span className="text-xs text-text-muted">تحصيل شهر {monthOf(date)}</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border-soft">
                  <th className={TH}>م</th>
                  <th className={TH}>الطالب</th>
                  <th className={TH}>الكود</th>
                  {showStageCol && <th className={TH}>المرحلة</th>}
                  {!groupFilter && <th className={TH}>المجموعة</th>}
                  <th className={TH}>الحالة</th>
                  {isCollector && <th className={TH}>التحصيل</th>}
                  <th className={TH}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((s, i) => {
                  const paid = paidIds.has(s.studentId);
                  return (
                    <tr key={s.studentId} className="border-b border-border-soft/60 last:border-0 hover:bg-gold/[.03]">
                      <td className={`${TD} text-xs text-text-muted`}>{i + 1}</td>
                      <td className={`${TD} text-start`}>
                        <p className="font-semibold text-text-primary">{s.fullName}</p>
                        {s.notes && <p className="mt-0.5 text-[11px] text-text-muted">{s.notes}</p>}
                      </td>
                      <td className={`${TD} font-plex text-xs text-gold`} dir="ltr">{s.studentCode}</td>
                      {showStageCol && <td className={`${TD} text-xs text-text-secondary`}>{s.stageAr}</td>}
                      {!groupFilter && (
                        <td className={`${TD} text-xs text-text-secondary`}>{s.groupName ?? '—'}</td>
                      )}
                      <td className={TD}>
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          {STATUS_OPTIONS.map((opt) => {
                            const active = s.status === opt.value;
                            return (
                              <button
                                key={opt.value}
                                onClick={() => setStatus(s.studentId, opt.value)}
                                className={`rounded-md border px-2.5 py-1 text-xs font-bold transition-colors ${
                                  active ? ACTIVE_BG[opt.value] : `border-border-soft bg-transparent text-text-muted ${opt.color}`
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      {isCollector && (
                        <td className={TD}>
                          {paid ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-success/40 bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
                              <CheckCircle2 size={13} /> محصَّل
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="rounded-md border border-error/40 bg-error/10 px-2.5 py-1 text-xs font-bold text-error">
                                لم يُحصَّل
                              </span>
                              <button
                                onClick={() => {
                                  setCollectTarget(s);
                                  setCollectForm({ amount: suggestedAmount(s), method: 'نقدي' });
                                }}
                                title="تحصيل الآن"
                                className="rounded-md border border-gold/40 bg-gold/10 p-1.5 text-gold transition-colors hover:bg-gold/25"
                              >
                                <Banknote size={13} />
                              </button>
                            </span>
                          )}
                        </td>
                      )}
                      <td className={TD}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEdit(s)}
                            title="تعديل الحضور"
                            className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-gold/10 hover:text-gold"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(s)}
                            disabled={!s.status}
                            title={s.status ? 'حذف تسجيل الحضور' : 'لا يوجد تسجيل لحذفه'}
                            className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-error/10 hover:text-error disabled:cursor-not-allowed disabled:opacity-35"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {error && students.length > 0 && (
        <p className="rounded-md border border-error/40 bg-error/10 px-4 py-2.5 text-sm font-semibold text-error">{error}</p>
      )}

      {/* ---- Edit modal ---- */}
      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="تعديل حضور الطالب">
        {editTarget && (
          <div className="grid gap-4">
            <div className="rounded-md border border-border-soft bg-surface p-3">
              <p className="text-sm font-bold text-text-primary">{editTarget.fullName}</p>
              <p className="mt-0.5 text-xs text-text-muted">
                <span className="font-plex text-gold" dir="ltr">{editTarget.studentCode}</span>
                {' · '}
                {editTarget.stageAr}
              </p>
            </div>
            <Select label="حالة الحضور" value={editStatus} onChange={(e) => setEditStatus(e.target.value as AttendanceStatusType)}>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
            <Textarea
              label="ملاحظات"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="مثال: تأخر بالحصة الأولى بسبب موعد الكشف..."
            />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setEditTarget(null)}>
                إلغاء
              </Button>
              <Button type="button" variant="gold" onClick={saveEdit} icon={<Save size={15} />}>
                حفظ
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ---- Delete confirm ---- */}
      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="حذف تسجيل الحضور">
        {deleteTarget && (
          <div className="grid gap-4">
            <p className="text-sm text-text-secondary">
              هتتمسح حالة الحضور بتاعة <b className="text-text-primary">{deleteTarget.fullName}</b> ليوم{' '}
              <b className="text-text-primary">{formatDateLong(date)}</b>. تقدر تسجّلها تاني في أي وقت.
            </p>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setDeleteTarget(null)}>
                إلغاء
              </Button>
              <Button type="button" variant="danger" onClick={() => void confirmDelete()} loading={deleting} icon={<Trash2 size={15} />}>
                حذف
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ---- Collect modal ---- */}
      <Modal open={collectTarget !== null} onClose={() => setCollectTarget(null)} title="تحصيل دفع — إيصال فوري">
        {collectTarget && (
          <div className="grid gap-4">
            <div className="rounded-md border border-border-soft bg-surface p-3">
              <p className="text-sm font-bold text-text-primary">{collectTarget.fullName}</p>
              <p className="mt-0.5 text-xs text-text-muted">
                <span className="font-plex text-gold" dir="ltr">{collectTarget.studentCode}</span>
                {' · '}
                {collectTarget.stageAr} · شهر {monthOf(date)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="المبلغ (جنيه)"
                required
                type="number"
                min={1}
                value={collectForm.amount}
                onChange={(e) => setCollectForm({ ...collectForm, amount: e.target.value })}
              />
              <Select
                label="طريقة الدفع"
                value={collectForm.method}
                onChange={(e) => setCollectForm({ ...collectForm, method: e.target.value })}
              >
                <option value="نقدي">نقدي</option>
                <option value="محفظة إلكترونية">محفظة إلكترونية</option>
                <option value="تحويل بنكي">تحويل بنكي</option>
              </Select>
            </div>
            {suggestedAmount(collectTarget) && (
              <p className="text-xs text-text-muted">
                المبلغ الافتراضي المحدد: <b className="text-gold">{formatMoney(Number(suggestedAmount(collectTarget)))}</b>
                {collectTarget.groupName ? ` — مجموعة ${collectTarget.groupName}` : ''}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setCollectTarget(null)}>
                إلغاء
              </Button>
              <Button type="button" variant="gold" onClick={() => void collect()} loading={collecting} icon={<Banknote size={15} />}>
                سدّد واطبع الإيصال
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ---- Monthly fees settings modal ---- */}
      <Modal open={feesOpen} onClose={() => setFeesOpen(false)} title="المصاريف الشهرية" size="lg">
        {feesDraft && (
          <div className="grid gap-6">
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-text-primary">
                <Banknote size={15} className="text-gold" /> المبلغ الافتراضي لكل مرحلة
              </h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {STAGES.map((s) => (
                  <Input
                    key={s.key}
                    label={s.ar}
                    type="number"
                    min={0}
                    placeholder="—"
                    value={feesDraft.stages[s.key] ?? ''}
                    onChange={(e) =>
                      setFeesDraft({
                        ...feesDraft,
                        stages: {
                          ...feesDraft.stages,
                          [s.key]: e.target.value === '' ? undefined : Number(e.target.value),
                        },
                      })
                    }
                  />
                ))}
              </div>
            </div>
            <div>
              <h4 className="mb-1 flex items-center gap-2 text-sm font-bold text-text-primary">
                <Users size={15} className="text-gold" /> تخصيص المجموعات (اختياري)
              </h4>
              <p className="mb-2 text-xs text-text-muted">
                لو مجموعة ليها مبلغ مختلف عن المرحلة اكتبه هنا — لو سايبها فاضلة هتاخد مبلغ المرحلة تلقائيًا.
              </p>
              {groups.length === 0 ? (
                <p className="text-xs text-text-muted">مفيش مجموعات مسجلة.</p>
              ) : (
                <div className="grid max-h-56 grid-cols-2 gap-3 overflow-y-auto pe-1 sm:grid-cols-3">
                  {groups.map((g) => (
                    <Input
                      key={g.id}
                      label={`${g.name} — ${g.stageAr}`}
                      type="number"
                      min={0}
                      placeholder={fees.stages[g.stage] ? `افتراضي: ${fees.stages[g.stage]}` : '—'}
                      value={feesDraft.groups[g.id] ?? ''}
                      onChange={(e) =>
                        setFeesDraft({
                          ...feesDraft,
                          groups: {
                            ...feesDraft.groups,
                            [g.id]: e.target.value === '' ? undefined : Number(e.target.value),
                          },
                        })
                      }
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 border-t border-border-subtle pt-4">
              <Button type="button" variant="ghost" onClick={() => setFeesOpen(false)}>
                إلغاء
              </Button>
              <Button type="button" variant="gold" onClick={saveFees} icon={<Save size={15} />}>
                حفظ الإعدادات
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ---- Receipt modal ---- */}
      <Modal open={receipt !== null} onClose={() => setReceipt(null)} title="إيصال دفع">
        {receipt && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-center">
              <ReceiptView rec={receipt} />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setReceipt(null)}>
                إغلاق
              </Button>
              <Button variant="gold" icon={<Printer size={16} />} onClick={() => window.print()}>
                طباعة الإيصال
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ---- Print-only sheet (portal to body) ---- */}
      {roster.length > 0 &&
        createPortal(
          <div id="attendance-print-sheet">
            <div className="print-sheet-header">
              <h1>كشف تحضير</h1>
              <p className="print-sheet-sub">مستر محمد صيام — مع أبو كيان .. الدراسات في أمان</p>
              <div className="print-sheet-meta">
                <span>التاريخ: {formatDateLong(date)}</span>
                <span>المرحلة: {stageLabel}</span>
                <span>المجموعة: {groupLabel}</span>
                <span>عدد الطلاب: {roster.length}</span>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>م</th>
                  <th>اسم الطالب</th>
                  <th>الكود</th>
                  <th>حاضر</th>
                  <th>غائب</th>
                  <th>متأخر</th>
                  <th>معذور</th>
                  {isCollector && <th>التحصيل</th>}
                  <th>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((s, i) => (
                  <tr key={s.studentId}>
                    <td>{i + 1}</td>
                    <td className="print-name">{s.fullName}</td>
                    <td dir="ltr">{s.studentCode}</td>
                    <td className="print-mark">{s.status === 'Present' ? '✓' : ''}</td>
                    <td className="print-mark">{s.status === 'Absent' ? '✓' : ''}</td>
                    <td className="print-mark">{s.status === 'Late' ? '✓' : ''}</td>
                    <td className="print-mark">{s.status === 'Excused' ? '✓' : ''}</td>
                    {isCollector && <td className="print-mark">{paidIds.has(s.studentId) ? '✓' : ''}</td>}
                    <td>{s.notes ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="print-sheet-footer">
              <span>إمضاء الأمين: ........................</span>
              <span>إمضاء المدرس: ........................</span>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
