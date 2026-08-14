import {
  CalendarDays,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Search,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { createPortal } from 'react-dom';
import { useEffect, useMemo, useState } from 'react';
import { CompassLoader } from '../../design-system/components/CompassLoader';
import { Badge } from '../../design-system/ui/Badge';
import { Button } from '../../design-system/ui/Button';
import { Card } from '../../design-system/ui/Card';
import { EmptyState } from '../../design-system/ui/EmptyState';
import { ErrorState } from '../../design-system/ui/ErrorState';
import { Input, Select } from '../../design-system/ui/Field';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import type {
  AttendanceStatusType,
  MonthlyAttendanceStudentDto,
  Stage,
  StudyGroupListItemDto,
} from '../../lib/types';

const STAGES: { key: Stage; ar: string }[] = [
  { key: 'PrepOne', ar: 'أولى إعدادي' },
  { key: 'PrepTwo', ar: 'تانية إعدادي' },
  { key: 'PrepThree', ar: 'تالتة إعدادي' },
  { key: 'SecOne', ar: 'أولى ثانوي' },
  { key: 'SecTwo', ar: 'تانية ثانوي' },
  { key: 'SecThree', ar: 'تالتة ثانوي' },
];

const WEEKDAY_NAMES = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

const STATUS_META: Record<AttendanceStatusType, { label: string; mark: string; cell: string }> = {
  Present: { label: 'حاضر', mark: '✓', cell: 'bg-success/20 text-success' },
  Absent: { label: 'غائب', mark: 'غ', cell: 'bg-error/15 text-error' },
  Late: { label: 'متأخر', mark: 'مت', cell: 'bg-gold/20 text-gold' },
  Excused: { label: 'معذور', mark: 'ع', cell: 'bg-blue-500/15 text-blue-400' },
};

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
}

export default function MonthlyAttendanceSheet() {
  const { user } = useAuth();
  const isCollector = user?.role === 'Secretary' || user?.role === 'Admin';

  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<MonthlyAttendanceStudentDto[]>([]);
  const [groups, setGroups] = useState<StudyGroupListItemDto[]>([]);
  const [paidIds, setPaidIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stageFilter, setStageFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [search, setSearch] = useState('');

  const load = async (m: string, groupId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ month: m });
      if (groupId) params.set('groupId', groupId);
      const [monthly, groupsRes, paidRes] = await Promise.all([
        api.get<MonthlyAttendanceStudentDto[]>(`/attendance/monthly?${params.toString()}`),
        api.get<StudyGroupListItemDto[]>('/study-groups?includeInactive=false'),
        isCollector
          ? api.get<{ items: { studentId: number }[] }>(`/payments?month=${m}&status=Paid&pageSize=500`)
          : Promise.resolve(null),
      ]);
      setData(Array.isArray(monthly) ? monthly : []);
      setGroups(Array.isArray(groupsRes) ? groupsRes : []);
      setPaidIds(new Set((paidRes?.items ?? []).map((p) => p.studentId)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تحميل التقرير');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(month, groupFilter || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, groupFilter]);

  const groupsForStage = useMemo(
    () => (stageFilter ? groups.filter((g) => g.stage === stageFilter) : groups),
    [groups, stageFilter],
  );

  const roster = useMemo(() => {
    let rows = data;
    if (stageFilter) rows = rows.filter((s) => s.stage === stageFilter);
    if (groupFilter) rows = rows.filter((s) => s.groupId === Number(groupFilter));
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (s) => s.fullName.toLowerCase().includes(q) || s.studentCode.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [data, stageFilter, groupFilter, search]);

  // لما بنختار مجموعة بنعرض أيام حصصها بس (من جدولها)؛ من غير اختيار بنعرض كل أيام الشهر.
  const sessionMode = Boolean(groupFilter);
  const days = useMemo(() => {
    const all = data[0]?.days ?? [];
    return sessionMode ? all.filter((d) => d.isSession) : all;
  }, [data, sessionMode]);

  const sessionCount = sessionMode ? data[0]?.sessionCount ?? 0 : 0;

  const [y, m] = month.split('-').map(Number);

  const dayWeekday = (day: number) => new Date(y, m - 1, day).getDay();
  const isWeekend = (day: number) => {
    const w = dayWeekday(day);
    return w === 5 || w === 6;
  };

  const sessionDowNames = useMemo(() => {
    const set = new Set<string>();
    (data[0]?.days ?? [])
      .filter((d) => d.isSession)
      .forEach((d) => set.add(WEEKDAY_NAMES[dayWeekday(d.day)]));
    return [...set];
  }, [data, y, m]); // eslint-disable-line react-hooks/exhaustive-deps

  const summary = useMemo(() => {
    const totalPresent = roster.reduce((sum, s) => sum + s.presentCount, 0);
    const totalAbsent = roster.reduce((sum, s) => sum + s.absentCount, 0);
    const totalLate = roster.reduce((sum, s) => sum + s.lateCount, 0);
    const totalExcused = roster.reduce((sum, s) => sum + s.excusedCount, 0);
    const markedStudents = roster.filter((s) => s.markedCount > 0);
    const denominatorOf = (s: MonthlyAttendanceStudentDto) =>
      sessionMode && s.sessionCount > 0 ? s.sessionCount : s.markedCount;
    const avgRate =
      markedStudents.length > 0
        ? Math.round(
            (markedStudents.reduce(
              (acc, s) =>
                acc +
                (s.presentCount + s.lateCount) /
                  (denominatorOf(s) > 0 ? denominatorOf(s) : 1),
              0,
            ) /
              markedStudents.length) *
              100,
          )
        : null;
    const markedDayCount = days.filter((d) =>
      roster.some((s) => s.days.find((x) => x.day === d.day)?.status != null),
    ).length;
    const paidCount = roster.filter((s) => paidIds.has(s.studentId)).length;
    return { totalPresent, totalAbsent, totalLate, totalExcused, avgRate, markedDayCount, paidCount };
  }, [roster, days, sessionMode, paidIds]);

  const dailyPresent = useMemo(
    () =>
      days.map(
        (d) => roster.filter((s) => s.days.find((x) => x.day === d.day)?.status === 'Present').length,
      ),
    [days, roster],
  );

  const stageLabel = stageFilter ? STAGES.find((s) => s.key === stageFilter)?.ar ?? '—' : 'جميع المراحل';
  const groupLabel = groupFilter
    ? groups.find((g) => g.id === Number(groupFilter))?.name ?? '—'
    : 'جميع المجموعات';

  const handlePrint = () => {
    document.body.classList.add('print-attendance-month-mode');
    window.print();
    const cleanup = () => document.body.classList.remove('print-attendance-month-mode');
    window.onafterprint = cleanup;
    setTimeout(cleanup, 1500);
  };

  const handleExportExcel = () => {
    const header: (string | number)[] = ['م', 'اسم الطالب', 'الكود'];
    if (!groupFilter) header.push('المجموعة');
    days.forEach((d) => header.push(`يوم ${d.day}`));
    header.push('حضر من الحصص');
    if (isCollector) header.push('دفع الشهر');

    const rows = roster.map((s, i) => {
      const denominator = sessionMode && s.sessionCount > 0 ? s.sessionCount : s.markedCount;
      const attended = s.presentCount + s.lateCount;
      const row: (string | number)[] = [i + 1, s.fullName, s.studentCode];
      if (!groupFilter) row.push(s.groupName ?? '—');
      s.days
        .filter((d) => !sessionMode || d.isSession)
        .forEach((d) => row.push(d.status ? STATUS_META[d.status].label : ''));
      row.push(denominator > 0 ? `${attended}/${denominator}` : '—');
      if (isCollector) row.push(paidIds.has(s.studentId) ? 'مدفوع' : 'غير مدفوع');
      return row;
    });

    const totalRow: (string | number)[] = ['∑', 'إجمالي الحضور اليومي', ''];
    if (!groupFilter) totalRow.push('');
    days.forEach((d, idx) => totalRow.push(dailyPresent[idx] || ''));
    totalRow.push(summary.avgRate != null ? `${summary.avgRate}%` : '—');
    if (isCollector) totalRow.push(summary.paidCount);

    const colCount = header.length;
    const aoa: (string | number)[][] = [
      [`تقرير الحضور الشهري — ${monthLabel(month)}`],
      [
        `المرحلة: ${stageLabel}  •  المجموعة: ${groupLabel}  •  عدد الطلاب: ${roster.length}  •  حصص الشهر: ${
          sessionMode ? sessionCount : days.length
        }`,
      ],
      header,
      ...rows,
      totalRow,
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } },
    ];
    ws['!cols'] = [
      { wch: 6 },
      { wch: 28 },
      { wch: 12 },
      ...(groupFilter ? [] : [{ wch: 14 }]),
      ...days.map(() => ({ wch: 7 })),
      { wch: 16 },
      ...(isCollector ? [{ wch: 12 }] : []),
    ];
    ws['!dir'] = 'rtl';

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'التقرير الشهري');
    XLSX.writeFile(wb, `تقرير الحضور ${month}.xlsx`);
  };

  const stickyBg = 'bg-surface';

  return (
    <div className="flex flex-col gap-6">
      {/* ---- Toolbar ---- */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="display-serif text-xl font-bold text-text-primary">تقرير الحضور الشهري</h2>
          <p className="mt-1 text-sm text-text-muted">
            شبكة أيام حصص المجموعة لكل طالب — حضر كام مرة في الشهر ودفع الشهر وطباعة الكشف.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Input
            label="الشهر"
            type="month"
            value={month}
            onChange={(e) => {
              if (e.target.value) setMonth(e.target.value);
            }}
          />
          <Button variant="outline" onClick={handleExportExcel} icon={<FileSpreadsheet size={16} />} disabled={roster.length === 0}>
            تصدير Excel
          </Button>
          <Button variant="outline" onClick={handlePrint} icon={<Printer size={16} />} disabled={roster.length === 0}>
            طباعة التقرير
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
            onChange={(e) => setGroupFilter(e.target.value)}
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
              عرض <b className="text-text-primary">{roster.length}</b> طالب
              {search.trim() && ' — نتيجة البحث'}
            </p>
          </div>
        </div>
      </Card>

      {/* ---- Summary ---- */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="p-4">
          <p className="flex items-center gap-2 text-xs text-text-muted"><Users size={14} /> طلاب</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{roster.length}</p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-2 text-xs text-text-muted"><CalendarDays size={14} /> أيام مسجلة</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{summary.markedDayCount}</p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-2 text-xs text-text-muted"><CalendarDays size={14} className="text-gold" /> حصص الشهر</p>
          <p className="mt-2 text-2xl font-bold text-gold">
            {sessionMode ? sessionCount : days.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-2 text-xs text-text-muted"><CheckCircle2 size={14} className="text-success" /> متوسط الحضور</p>
          <p className="mt-2 text-2xl font-bold text-success">{summary.avgRate != null ? `${summary.avgRate}%` : '—'}</p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-2 text-xs text-text-muted"><UserCheck size={14} className="text-success" /> إجمالي حاضر</p>
          <p className="mt-2 text-2xl font-bold text-success">{summary.totalPresent}</p>
        </Card>
        {isCollector ? (
          <Card className="p-4">
            <p className="flex items-center gap-2 text-xs text-text-muted"><XCircle size={14} className="text-error" /> لم يدفعوا الشهر</p>
            <p className="mt-2 text-2xl font-bold text-error">{roster.length - summary.paidCount}</p>
          </Card>
        ) : (
          <Card className="p-4">
            <p className="flex items-center gap-2 text-xs text-text-muted"><XCircle size={14} className="text-error" /> إجمالي غائب</p>
            <p className="mt-2 text-2xl font-bold text-error">{summary.totalAbsent}</p>
          </Card>
        )}
      </div>

      {/* ---- Grid table ---- */}
      {loading ? (
        <CompassLoader text="بنجيب التقرير..." />
      ) : error && data.length === 0 ? (
        <ErrorState title={error} onRetry={() => load(month, groupFilter || undefined)} />
      ) : roster.length === 0 ? (
        <EmptyState
          title={search.trim() ? 'مفيش نتيجة للبحث' : 'مفيش طلاب'}
          description="غيّر الفلاتر أو سجّل حضور من صفحة تحضير اليوم."
        />
      ) : (
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-bold text-text-primary">
              <CalendarDays size={15} className="text-gold" /> {monthLabel(month)}
              <Badge variant="outline">{roster.length} طالب</Badge>
              {sessionMode && sessionCount > 0 && (
                <Badge variant="outline" className="text-gold">
                  {sessionCount} حصة — {sessionDowNames.join(' و')}
                </Badge>
              )}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-muted">
              {Object.values(STATUS_META).map((meta) => (
                <span key={meta.label} className="flex items-center gap-1">
                  <span className={`grid h-4 w-4 place-items-center rounded text-[10px] font-bold ${meta.cell}`}>
                    {meta.mark}
                  </span>
                  {meta.label}
                </span>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] table-fixed border-separate border-spacing-0 text-sm">
              <colgroup>
                <col className="w-10" />
                <col className="w-44" />
                <col className="w-24" />
                {!groupFilter && <col className="w-28" />}
                {days.map((d) => (
                  <col key={d.day} />
                ))}
                <col className="w-40" />
                {isCollector && <col className="w-16" />}
              </colgroup>
              <thead>
                <tr className="text-[11px] text-text-muted">
                  <th className={`sticky right-0 z-20 w-10 border-b border-border-soft py-2 text-center font-bold ${stickyBg}`}>م</th>
                  <th className={`sticky right-10 z-20 w-44 border-b border-border-soft py-2 pe-2 text-start font-bold ${stickyBg}`}>الطالب</th>
                  <th className={`sticky right-54 z-20 w-24 border-b border-border-soft py-2 text-center font-bold ${stickyBg}`}>الكود</th>
                  {!groupFilter && <th className="border-b border-border-soft py-2 text-center font-bold">المجموعة</th>}
                  {days.map((d) => (
                    <th
                      key={d.day}
                      className={`border-b border-border-soft py-1.5 text-center ${isWeekend(d.day) ? 'bg-surface-sunken/60' : ''}`}
                    >
                      <div className="text-[11px] font-bold text-text-primary">{d.day}</div>
                      <div className="text-[9px] text-text-muted">{WEEKDAY_NAMES[dayWeekday(d.day)]}</div>
                    </th>
                  ))}
                  <th className="border-b border-border-soft py-2 px-3 text-center font-bold">حضر من الحصص</th>
                  {isCollector && (
                    <th
                      className="border-b border-border-soft py-2 px-2 text-center font-bold"
                      title="دفع المصاريف الشهرية أم لا"
                    >
                      دفع الشهر
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {roster.map((s, i) => {
                  const denominator = sessionMode && s.sessionCount > 0 ? s.sessionCount : s.markedCount;
                  const attended = s.presentCount + s.lateCount;
                  const pct = denominator > 0 ? Math.round((attended / denominator) * 100) : null;
                  const absencePct = pct != null ? 100 - pct : null;
                  const paid = paidIds.has(s.studentId);
                  return (
                    <tr key={s.studentId} className="hover:bg-gold/[.03]">
                      <td className={`sticky right-0 z-10 border-b border-border-soft/60 py-1.5 text-center text-xs text-text-muted ${stickyBg}`}>{i + 1}</td>
                      <td className={`sticky right-10 z-10 border-b border-border-soft/60 py-1.5 pe-2 ${stickyBg}`}>
                        <p className="truncate font-semibold text-text-primary">{s.fullName}</p>
                      </td>
                      <td className={`sticky right-54 z-10 border-b border-border-soft/60 py-1.5 text-center font-plex text-xs text-gold ${stickyBg}`} dir="ltr">
                        {s.studentCode}
                      </td>
                      {!groupFilter && (
                        <td className="border-b border-border-soft/60 py-1.5 text-center text-xs text-text-secondary">
                          {s.groupName ?? '—'}
                        </td>
                      )}
                      {s.days
                        .filter((d) => !sessionMode || d.isSession)
                        .map((d) => (
                          <td
                            key={d.day}
                            className={`border-b border-border-soft/60 py-1 text-center ${isWeekend(d.day) ? 'bg-surface-sunken/40' : ''}`}
                          >
                            {d.status ? (
                              <span
                                className={`mx-auto grid h-6 w-6 place-items-center rounded text-[11px] font-bold ${STATUS_META[d.status].cell}`}
                                title={`${STATUS_META[d.status].label} — يوم ${d.day}`}
                              >
                                {STATUS_META[d.status].mark}
                              </span>
                            ) : (
                              <span className="text-[11px] text-text-muted/30">·</span>
                            )}
                          </td>
                        ))}
                      <td className="border-b border-border-soft/60 px-3 py-1.5 text-center">
                        {pct == null ? (
                          <span className="text-xs text-text-muted">—</span>
                        ) : (
                          <div
                            className="flex flex-col items-center gap-1"
                            title={`حاضر ${s.presentCount} • غائب ${s.absentCount} • متأخر ${s.lateCount} • معذور ${s.excusedCount}`}
                          >
                            <div className="flex h-1.5 w-24 overflow-hidden rounded-full bg-error/20">
                              <div className="bg-success/80" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[11px] font-bold text-text-primary">
                              {sessionMode && s.sessionCount > 0
                                ? `حضر ${attended} من ${s.sessionCount}`
                                : `حضور ${pct}%`}
                              {!sessionMode && (
                                <span className="font-normal text-text-muted"> · غياب {absencePct}%</span>
                              )}
                            </span>
                          </div>
                        )}
                      </td>
                      {isCollector && (
                        <td className="border-b border-border-soft/60 py-1.5 text-center">
                          {paid ? (
                            <span className="mx-auto grid h-6 w-6 place-items-center rounded-full bg-success/15 text-success" title={`دفع شهر ${monthLabel(month)}`}>
                              ✓
                            </span>
                          ) : (
                            <span className="mx-auto grid h-6 w-6 place-items-center rounded-full bg-error/10 text-error/80" title="لم يدفع هذا الشهر">
                              ✗
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
                <tr className="bg-gold/[.04]">
                  <td className={`sticky right-0 z-10 py-1.5 text-center text-[11px] font-bold text-gold ${stickyBg}`}>∑</td>
                  <td className={`sticky right-10 z-10 py-1.5 pe-2 text-[11px] font-bold text-text-secondary ${stickyBg}`}>حاضر اليوم</td>
                  <td className={`sticky right-54 z-10 py-1.5 ${stickyBg}`} />
                  {!groupFilter && <td />}
                  {days.map((d, idx) => (
                    <td key={d.day} className="py-1.5 text-center text-[11px] font-bold text-text-secondary">
                      {dailyPresent[idx] || ''}
                    </td>
                  ))}
                  <td className="px-3 py-1.5 text-center text-[11px] font-bold text-text-secondary">
                    {summary.avgRate != null ? `${summary.avgRate}%` : '—'}
                  </td>
                  {isCollector && (
                    <td className="py-1.5 text-center text-[11px] font-bold text-text-secondary">
                      {summary.paidCount}
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ---- Print-only sheet (portal to body) ---- */}
      {roster.length > 0 &&
        createPortal(
          <div id="attendance-month-print-sheet">
            <div className="print-month-header">
              <h1>كشف الحضور الشهري</h1>
              <p className="print-month-sub">مستر محمد صيام — مع أبو كيان .. الدراسات في أمان</p>
              <div className="print-month-meta">
                <span>الشهر: {monthLabel(month)}</span>
                <span>المرحلة: {stageLabel}</span>
                <span>المجموعة: {groupLabel}</span>
                <span>عدد الطلاب: {roster.length}</span>
                {sessionMode && sessionCount > 0 && <span>حصص الشهر: {sessionCount}</span>}
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>م</th>
                  <th>اسم الطالب</th>
                  <th>الكود</th>
                  {days.map((d) => (
                    <th key={d.day} className={isWeekend(d.day) ? 'print-month-weekend' : ''}>
                      {d.day}
                    </th>
                  ))}
                  <th>حضر/حصص</th>
                  {isCollector && <th>دفع الشهر</th>}
                </tr>
              </thead>
              <tbody>
                {roster.map((s, i) => {
                  const denominator = sessionMode && s.sessionCount > 0 ? s.sessionCount : s.markedCount;
                  const attended = s.presentCount + s.lateCount;
                  const pct = denominator > 0 ? Math.round((attended / denominator) * 100) : null;
                  return (
                    <tr key={s.studentId}>
                      <td>{i + 1}</td>
                      <td className="print-month-name">{s.fullName}</td>
                      <td dir="ltr">{s.studentCode}</td>
                      {s.days
                        .filter((d) => !sessionMode || d.isSession)
                        .map((d) => (
                          <td key={d.day} className={isWeekend(d.day) ? 'print-month-weekend' : ''}>
                            {d.status ? STATUS_META[d.status].mark : ''}
                          </td>
                        ))}
                      <td>
                        {pct != null
                          ? sessionMode && s.sessionCount > 0
                            ? `${attended}/${s.sessionCount}`
                            : `${pct}%`
                          : '—'}
                      </td>
                      {isCollector && <td>{paidIds.has(s.studentId) ? '✓' : ''}</td>}
                    </tr>
                  );
                })}
                <tr className="print-month-total">
                  <td colSpan={3}>إجمالي الحضور اليومي</td>
                  {days.map((d, idx) => (
                    <td key={d.day}>{dailyPresent[idx] || ''}</td>
                  ))}
                  <td>{summary.avgRate != null ? `${summary.avgRate}%` : '—'}</td>
                  {isCollector && <td>{summary.paidCount}</td>}
                </tr>
              </tbody>
            </table>
            <div className="print-month-footer">
              <span>إمضاء الأمين: ........................</span>
              <span>إمضاء المدرس: ........................</span>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
