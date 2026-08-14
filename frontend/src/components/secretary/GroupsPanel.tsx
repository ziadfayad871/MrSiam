import { CalendarClock, CalendarDays, Check, CheckCircle2, Clock, Layers, Pencil, Plus, Search, Trash2, UserMinus, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { CompassLoader } from '../../design-system/components/CompassLoader';
import { Badge } from '../../design-system/ui/Badge';
import { Button } from '../../design-system/ui/Button';
import { Card } from '../../design-system/ui/Card';
import { EmptyState } from '../../design-system/ui/EmptyState';
import { Input } from '../../design-system/ui/Field';
import { Select } from '../../design-system/ui/Field';
import { Modal } from '../../design-system/ui/Modal';
import { api } from '../../lib/api';
import type { ScheduleSlotDto, Stage as StageType, StudentListItemDto, StudyGroupDetailDto, StudyGroupListItemDto } from '../../lib/types';

const STAGES = [
  { key: 'PrepOne', ar: 'أولى إعدادي' },
  { key: 'PrepTwo', ar: 'تانية إعدادي' },
  { key: 'PrepThree', ar: 'تالتة إعدادي' },
  { key: 'SecOne', ar: 'أولى ثانوي' },
  { key: 'SecTwo', ar: 'تانية ثانوي' },
  { key: 'SecThree', ar: 'تالتة ثانوي' },
] as const;

const DAYS = [
  { value: 0, label: 'الأحد' },
  { value: 1, label: 'الاثنين' },
  { value: 2, label: 'الثلاثاء' },
  { value: 3, label: 'الأربعاء' },
  { value: 4, label: 'الخميس' },
  { value: 5, label: 'الجمعة' },
  { value: 6, label: 'السبت' },
];

const DAY_NAME_TO_NUM: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

// الـ API بيرجّع اليوم كنص (Sunday) — نوحّده لرقم 0-6.
const toDow = (day: number | string): number =>
  typeof day === 'number' ? day : (DAY_NAME_TO_NUM[day] ?? -1);

const formatTime = (t: string) => {
  const d = new Date(`2000-01-01T${t.slice(0, 5)}`);
  return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
};

const TH = 'py-2 text-center font-medium';
const TD = 'py-2.5 text-center';

export default function SecretaryGroupsPage() {
  const [groups, setGroups] = useState<StudyGroupListItemDto[]>([]);
  const [students, setStudents] = useState<StudentListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: number; name: string } | null>(null);
  const [createForm, setCreateForm] = useState({
    name: '',
    stage: 'PrepOne' as string,
    academicYear: '2025/2026',
    days: [] as number[],
    startTime: '17:00',
    endTime: '18:30',
    subject: '',
  });
  const [saving, setSaving] = useState(false);
  const [stageFilter, setStageFilter] = useState('');
  const [search, setSearch] = useState('');

  const [detail, setDetail] = useState<StudyGroupDetailDto | null>(null);
  const [detailSlots, setDetailSlots] = useState<ScheduleSlotDto[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addStudentId, setAddStudentId] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (stageFilter) params.set('stage', stageFilter);
      const res = await api.get<StudyGroupListItemDto[]>(`/study-groups?${params.toString()}`);
      setGroups(Array.isArray(res) ? res : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تحميل المجموعات');
    } finally {
      setLoading(false);
    }
  }, [stageFilter]);

  useEffect(() => {
    load();
    api
      .get<{ items: StudentListItemDto[] }>('/students?pageSize=200')
      .then((res) => setStudents(res?.items ?? []))
      .catch(() => setStudents([]));
  }, [load]);

  const toggleDay = (d: number) =>
    setCreateForm((f) => ({
      ...f,
      days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d].sort((a, b) => a - b),
    }));

  const closeModal = () => {
    setCreateOpen(false);
    setEditing(null);
  };

  // نعبّي النموذج ببيانات المجموعة + أول حصة في جدولها (عشان الموعد والمادة).
  const openEditWith = async (g: { id: number; name: string; stage: string; academicYear: string; days: number[] }) => {
    setError(null);
    setEditing({ id: g.id, name: g.name });
    setCreateForm({
      name: g.name,
      stage: g.stage,
      academicYear: g.academicYear,
      days: [...new Set(g.days)],
      startTime: '17:00',
      endTime: '18:30',
      subject: '',
    });
    try {
      const slots = await api.get<ScheduleSlotDto[]>(`/schedule?groupId=${g.id}`);
      const first = Array.isArray(slots) && slots.length > 0 ? slots[0] : null;
      if (first) {
        setCreateForm((f) => ({
          ...f,
          startTime: first.startTime.slice(0, 5),
          endTime: first.endTime.slice(0, 5),
          subject: first.subject ?? '',
        }));
      }
    } catch {
      // الجدول مش مهم — النموذج يشتغل بالافتراضي.
    }
    setCreateOpen(true);
  };

  // تعديل مجموعة من الكارت: نعبّي النموذج ببياناتها وأيام حصصها الحالية.
  const openEdit = (g: StudyGroupListItemDto) =>
    void openEditWith({
      id: g.id,
      name: g.name,
      stage: g.stage,
      academicYear: g.academicYear,
      days: g.scheduleDays ?? [],
    });

  // تعديل سريع من نافذة التفاصيل
  const openEditFromDetail = () => {
    if (!detail) return;
    const days = detailSlots.map((s) => toDow(s.day)).filter((d) => d >= 0);
    const first = detailSlots[0];
    setError(null);
    setEditing({ id: detail.id, name: detail.name });
    setCreateForm({
      name: detail.name,
      stage: detail.stage,
      academicYear: detail.academicYear,
      days: [...new Set(days)],
      startTime: first ? first.startTime.slice(0, 5) : '17:00',
      endTime: first ? first.endTime.slice(0, 5) : '18:30',
      subject: first?.subject ?? '',
    });
    setDetail(null);
    setCreateOpen(true);
  };

  const saveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.stage) {
      setError('اسم المجموعة والمرحلة مطلوبان');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await api.put<boolean>(`/study-groups/${editing.id}`, {
          name: createForm.name.trim(),
          stage: createForm.stage,
          academicYear: createForm.academicYear.trim() || '2025/2026',
          scheduleDays: createForm.days,
          startTime: createForm.startTime,
          endTime: createForm.endTime,
          subject: createForm.subject || null,
        });
      } else {
        await api.post<number>('/study-groups', {
          name: createForm.name.trim(),
          stage: createForm.stage,
          academicYear: createForm.academicYear.trim() || '2025/2026',
          scheduleDays: createForm.days,
          startTime: createForm.startTime,
          endTime: createForm.endTime,
          subject: createForm.subject || null,
        });
      }
      closeModal();
      setCreateForm({ name: '', stage: 'PrepOne' as string, academicYear: '2025/2026', days: [], startTime: '17:00', endTime: '18:30', subject: '' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل حفظ المجموعة');
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (id: number) => {
    setDetail(null);
    setDetailSlots([]);
    setDetailLoading(true);
    setError(null);
    try {
      const res = await api.get<StudyGroupDetailDto>(`/study-groups/${id}`);
      setDetail(res);
      const slots = await api.get<ScheduleSlotDto[]>(`/schedule?groupId=${id}`);
      setDetailSlots(Array.isArray(slots) ? slots : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تحميل المجموعة');
    } finally {
      setDetailLoading(false);
    }
  };

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail || !addStudentId) {
      setError('اختار طالب');
      return;
    }
    setAddingMember(true);
    setError(null);
    try {
      await api.post<boolean>(`/study-groups/${detail.id}/members/${Number(addStudentId)}`);
      setAddStudentId('');
      await openDetail(detail.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل إضافة الطالب');
    } finally {
      setAddingMember(false);
    }
  };

  const removeMember = async (studentId: number) => {
    if (!detail) return;
    if (!window.confirm('حذف الطالب من المجموعة؟')) return;
    setError(null);
    try {
      await api.del<boolean>(`/study-groups/${detail.id}/members/${studentId}`);
      await openDetail(detail.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل إزالة الطالب');
    }
  };

  const deleteGroup = async (id: number, name: string) => {
    if (!window.confirm(`حذف مجموعة "${name}"؟ كل أعضائها هيتشالوا.`)) return;
    setError(null);
    try {
      await api.del<boolean>(`/study-groups/${id}`);
      if (detail?.id === id) setDetail(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل حذف المجموعة');
    }
  };

  const visibleStudents = students.filter((s) => {
    if (!memberSearch.trim()) return true;
    const q = memberSearch.trim().toLowerCase();
    return s.fullName.toLowerCase().includes(q) || s.username.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="gold" onClick={() => setCreateOpen(true)} icon={<Plus size={16} />}>
            مجموعة جديدة
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:w-96">
          <Select label="المرحلة" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
            <option value="">كل المراحل</option>
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>{s.ar}</option>
            ))}
          </Select>
          <div className="relative">
            <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث..."
              className="mt-5 w-full rounded-md border border-border-subtle bg-surface-elevated py-2.5 ps-9 pe-3 text-sm text-text-primary outline-none transition-colors focus:border-gold"
            />
          </div>
        </div>
      </div>

      {error && <p className="rounded-md border border-error/40 bg-error/10 px-4 py-2.5 text-sm font-semibold text-error">{error}</p>}

      {loading ? (
        <CompassLoader text="بنجيب المجموعات..." />
      ) : groups.length === 0 ? (
        <EmptyState title="مفيش مجموعات" description="أنشئ أول مجموعة دراسية لتقسيم طلبتك." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups
            .filter((g) => !search.trim() || g.name.toLowerCase().includes(search.trim().toLowerCase()))
            .map((g) => (
              <Card key={g.id} hoverable className="cursor-pointer" onClick={() => void openDetail(g.id)}>
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-gold/10 p-2 text-gold"><Layers size={17} /></span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void openEdit(g);
                      }}
                      className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-gold/10 hover:text-gold"
                      aria-label="تعديل المجموعة"
                      title="تعديل الأيام والبيانات"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void deleteGroup(g.id, g.name);
                      }}
                      className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-error/10 hover:text-error"
                      aria-label="حذف المجموعة"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <h3 className="mt-3 text-base font-bold text-text-primary">{g.name}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-text-muted">{g.stageAr}</span>
                  <span className="text-xs text-text-muted">· {g.academicYear}</span>
                </div>
                {g.scheduleDays && g.scheduleDays.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-gold">
                    <CalendarDays size={12} />
                    <span>{[...new Set(g.scheduleDays)].sort((a, b) => a - b).map((d) => DAYS.find((x) => x.value === d)?.label).filter(Boolean).join(' و')}</span>
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-border-soft pt-3">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-gold">
                    <Users size={13} /> {g.memberCount} طالب
                  </span>
                  <Badge variant={g.isActive ? 'success' : 'neutral'}>{g.isActive ? 'نشطة' : 'موقوفة'}</Badge>
                </div>
              </Card>
            ))}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={closeModal}
        title={editing ? `تعديل مجموعة «${editing.name}»` : 'مجموعة دراسية جديدة'}
      >
        <form onSubmit={saveGroup} className="grid gap-4">
          <Input label="اسم المجموعة" required value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="مثال: أولى إعدادي - أ" />
          <Select label="المرحلة" required value={createForm.stage} onChange={(e) => setCreateForm({ ...createForm, stage: e.target.value })}>
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>{s.ar}</option>
            ))}
          </Select>
          <Input label="العام الدراسي" required value={createForm.academicYear} onChange={(e) => setCreateForm({ ...createForm, academicYear: e.target.value })} placeholder="2025/2026" />

          <div>
            <label className="mb-1.5 block text-xs font-bold text-text-muted">
              أيام الحصص (ممكن أكتر من يوم — زي الأحد والأربعاء)
            </label>
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
              {DAYS.map((d) => {
                const active = createForm.days.includes(d.value);
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={`flex items-center justify-center gap-1 rounded-md border px-1 py-2 text-[11px] font-bold transition-colors ${
                      active
                        ? 'border-gold bg-gold/15 text-gold'
                        : 'border-border-soft bg-surface-elevated text-text-muted hover:border-gold/50'
                    }`}
                  >
                    {active && <Check size={11} className="shrink-0" />}
                    {d.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-text-muted">
              <CalendarClock size={12} /> التحضير والتقرير الشهري هيمشوا على الأيام دي تلقائيًا.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="بداية الحصة" type="time" value={createForm.startTime} onChange={(e) => setCreateForm({ ...createForm, startTime: e.target.value })} />
            <Input label="نهاية الحصة" type="time" value={createForm.endTime} onChange={(e) => setCreateForm({ ...createForm, endTime: e.target.value })} />
          </div>
          <Select label="المادة (اختياري)" value={createForm.subject} onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}>
            <option value="">بدون</option>
            <option value="تاريخ">تاريخ</option>
            <option value="جغرافيا">جغرافيا</option>
            <option value="دراسات">دراسات</option>
          </Select>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={closeModal}>إلغاء</Button>
            <Button type="submit" variant="gold" loading={saving} icon={<Plus size={15} />}>
              {editing ? 'حفظ التعديل' : 'إنشاء'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={detail !== null} onClose={() => setDetail(null)} title={detail ? `${detail.name} — ${detail.stageAr}` : ''} size="lg">
        {detailLoading ? (
          <CompassLoader text="بنجيب بيانات المجموعة..." />
        ) : detail ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3 text-xs text-text-muted">
                <span className="flex items-center gap-1"><CalendarClock size={13} /> {detail.academicYear}</span>
                <span className="flex items-center gap-1"><Users size={13} /> {detail.members.length} طالب</span>
              </div>
              <Button size="sm" variant="outline" icon={<Plus size={14} />} onClick={() => setAddOpen(true)}>
                إضافة طالب
              </Button>
            </div>

            <div className="rounded-md border border-gold/30 bg-gold/10 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-bold text-text-primary">
                  <CalendarDays size={15} className="text-gold" />
                  أيام الحصص
                </span>
                <button
                  onClick={openEditFromDetail}
                  className="flex items-center gap-1 rounded-md border border-gold/40 px-2 py-1 text-[11px] font-bold text-gold transition-colors hover:bg-gold/15"
                >
                  <Pencil size={11} /> تعديل سريع
                </button>
              </div>
              {detailSlots.length === 0 ? (
                <p className="mt-2 text-xs text-text-muted">
                  مفيش أيام حصص محددة — اضغط «تعديل سريع» واختار الأيام.
                </p>
              ) : (
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-gold">
                    <CalendarDays size={12} />
                    {[...new Set(detailSlots.map((s) => toDow(s.day)))].filter((d) => d >= 0).sort((a, b) => a - b)
                      .map((d) => DAYS.find((x) => x.value === d)?.label)
                      .filter(Boolean)
                      .join(' و')}
                  </span>
                  <span className="flex items-center gap-1 text-text-secondary">
                    <Clock size={12} className="text-text-muted" />
                    {formatTime(detailSlots[0].startTime)} — {formatTime(detailSlots[0].endTime)}
                  </span>
                  {detailSlots[0].subject && (
                    <span className="text-text-secondary">المادة: {detailSlots[0].subject}</span>
                  )}
                </div>
              )}
            </div>

            {addOpen && (
              <form onSubmit={addMember} className="rounded-md border border-border-soft bg-surface-elevated p-3">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <select
                    value={addStudentId}
                    onChange={(e) => setAddStudentId(e.target.value)}
                    className="w-full rounded-md border border-border-subtle bg-surface-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-gold sm:flex-1"
                  >
                    <option value="">اختار طالب...</option>
                    {visibleStudents.map((s) => (
                      <option key={s.id} value={s.id} disabled={detail.members.some((m) => m.studentId === s.id)}>
                        {s.fullName} ({s.username}){detail.members.some((m) => m.studentId === s.id) ? ' — موجود' : ''}
                      </option>
                    ))}
                  </select>
                  <input
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="ابحث..."
                    className="w-full rounded-md border border-border-subtle bg-surface-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-gold sm:w-44"
                  />
                  <Button type="submit" size="sm" variant="gold" loading={addingMember}>إضافة</Button>
                </div>
              </form>
            )}

            {detail.members.length === 0 ? (
              <EmptyState title="مفيش طلبة في المجموعة" description="أضف طلبة للمجموعة من زر «إضافة طالب»." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-border-soft text-[11px] text-text-muted">
                      <th className={TH}>الطالب</th>
                      <th className={TH}>الكود</th>
                      <th className={TH}>المرحلة</th>
                      <th className={TH}>التحكم</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.members.map((m) => (
                      <tr key={m.studentId} className="border-b border-border-soft/60 last:border-0">
                        <td className={`${TD} font-semibold text-text-primary`}>{m.fullName}</td>
                        <td className={`${TD} font-plex text-xs text-text-muted`} dir="ltr">{m.studentCode}</td>
                        <td className={`${TD} text-xs text-text-secondary`}>{m.stageAr}</td>
                        <td className={TD}>
                          <button
                            onClick={() => void removeMember(m.studentId)}
                            className="flex items-center gap-1 rounded bg-error/10 px-2 py-1 text-[11px] font-bold text-error transition-colors hover:bg-error/20"
                          >
                            <UserMinus size={12} /> إزالة
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}