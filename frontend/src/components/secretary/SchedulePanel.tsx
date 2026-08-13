import { CalendarDays, Clock, Plus, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CompassLoader } from '../../design-system/components/CompassLoader';
import { Badge } from '../../design-system/ui/Badge';
import { Button } from '../../design-system/ui/Button';
import { Card } from '../../design-system/ui/Card';
import { EmptyState } from '../../design-system/ui/EmptyState';
import { Input } from '../../design-system/ui/Field';
import { Select } from '../../design-system/ui/Field';
import { Modal } from '../../design-system/ui/Modal';
import { api } from '../../lib/api';
import type { ScheduleSlotDto, StudyGroupListItemDto } from '../../lib/types';

const DAYS = [
  { value: 0, label: 'الأحد' },
  { value: 1, label: 'الاثنين' },
  { value: 2, label: 'الثلاثاء' },
  { value: 3, label: 'الأربعاء' },
  { value: 4, label: 'الخميس' },
  { value: 5, label: 'الجمعة' },
  { value: 6, label: 'السبت' },
];

function toLocalTime(time: string): string {
  const d = new Date(`2000-01-01T${time.slice(0, 5)}`);
  return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

export default function SecretarySchedulePage() {
  const [slots, setSlots] = useState<ScheduleSlotDto[]>([]);
  const [groups, setGroups] = useState<StudyGroupListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dayFilter, setDayFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [search, setSearch] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    groupId: '',
    day: '0',
    startTime: '17:00',
    endTime: '18:30',
    subject: '',
    room: '',
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (dayFilter) params.set('day', dayFilter);
      if (groupFilter) params.set('stage', groupFilter);
      const res = await api.get<ScheduleSlotDto[]>(`/schedule?${params.toString()}`);
      setSlots(Array.isArray(res) ? res : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تحميل الجدول');
    } finally {
      setLoading(false);
    }
  }, [dayFilter, groupFilter]);

  useEffect(() => {
    load();
    api
      .get<StudyGroupListItemDto[]>('/study-groups?includeInactive=false')
      .then((res) => setGroups(Array.isArray(res) ? res : []))
      .catch(() => setGroups([]));
  }, [load]);

  const createSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.groupId) {
      setError('اختار المجموعة');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.post<number>('/schedule', {
        groupId: Number(createForm.groupId),
        day: Number(createForm.day),
        startTime: createForm.startTime,
        endTime: createForm.endTime,
        subject: createForm.subject.trim() || null,
        room: createForm.room.trim() || null,
      });
      setCreateOpen(false);
      setCreateForm({ groupId: '', day: '0', startTime: '17:00', endTime: '18:30', subject: '', room: '' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل إضافة الحصة');
    } finally {
      setSaving(false);
    }
  };

  const deleteSlot = async (id: number) => {
    if (!window.confirm('حذف هذه الحصة من الجدول؟')) return;
    setDeletingId(id);
    setError(null);
    try {
      await api.del<boolean>(`/schedule/${id}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل حذف الحصة');
    } finally {
      setDeletingId(null);
    }
  };

  const grouped = useMemo(() => {
    const filtered = slots.filter((s) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return s.groupName.toLowerCase().includes(q) || (s.subject ?? '').toLowerCase().includes(q);
    });
    const map = new Map<number, ScheduleSlotDto[]>();
    for (const s of filtered) {
      const arr = map.get(s.day) ?? [];
      arr.push(s);
      map.set(s.day, arr);
    }
    return DAYS.map((d) => ({ day: d.value, label: d.label, items: map.get(d.value) ?? [] })).filter((d) => d.items.length > 0);
  }, [slots, search]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid grid-cols-2 gap-3 lg:flex-1">
          <Select label="اليوم" value={dayFilter} onChange={(e) => setDayFilter(e.target.value)}>
            <option value="">كل الأيام</option>
            {DAYS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </Select>
          <Select label="المرحلة" value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
            <option value="">كل المراحل</option>
            {groups.map((g) => (
              <option key={g.id} value={g.stage}>{g.stageAr}</option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 lg:w-56">
            <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث..."
              className="w-full rounded-md border border-border-subtle bg-surface-elevated py-2.5 ps-9 pe-3 text-sm text-text-primary outline-none transition-colors focus:border-gold"
            />
          </div>
          <Button variant="gold" onClick={() => setCreateOpen(true)} icon={<Plus size={16} />}>
            حصة جديدة
          </Button>
        </div>
      </div>

      {error && <p className="rounded-md border border-error/40 bg-error/10 px-4 py-2.5 text-sm font-semibold text-error">{error}</p>}

      {loading ? (
        <CompassLoader text="بنجيب الجدول..." />
      ) : grouped.length === 0 ? (
        <EmptyState title="الجدول فاضي" description="أضف أول حصة من زر «حصة جديدة»." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {grouped.map((day) => (
            <Card key={day.day}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-text-primary">
                  <CalendarDays size={15} className="text-gold" /> {day.label}
                </h3>
                <Badge variant="outline">{day.items.length} حصة</Badge>
              </div>
              <div className="flex flex-col gap-2">
                {day.items.map((s) => (
                  <div key={s.id} className="rounded-md border border-border-soft bg-surface-elevated p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-text-primary">{s.groupName}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-text-muted">
                          <Clock size={11} /> {toLocalTime(s.startTime)} — {toLocalTime(s.endTime)}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {s.subject && <Badge variant="gold">{s.subject}</Badge>}
                          {s.room && <span className="text-[11px] text-text-muted">قاعة: {s.room}</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => void deleteSlot(s.id)}
                        disabled={deletingId === s.id}
                        className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-error/10 hover:text-error disabled:opacity-40"
                        aria-label="حذف الحصة"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="حصة جديدة">
        <form onSubmit={createSlot} className="grid gap-4">
          <Select label="المجموعة" required value={createForm.groupId} onChange={(e) => setCreateForm({ ...createForm, groupId: e.target.value })}>
            <option value="">اختار المجموعة</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name} ({g.stageAr})</option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Select label="اليوم" required value={createForm.day} onChange={(e) => setCreateForm({ ...createForm, day: e.target.value })}>
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </Select>
            <Select label="المادة" value={createForm.subject} onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}>
              <option value="">بدون</option>
              <option value="تاريخ">تاريخ</option>
              <option value="جغرافيا">جغرافيا</option>
              <option value="دراسات">دراسات</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="بداية" type="time" required value={createForm.startTime} onChange={(e) => setCreateForm({ ...createForm, startTime: e.target.value })} />
            <Input label="نهاية" type="time" required value={createForm.endTime} onChange={(e) => setCreateForm({ ...createForm, endTime: e.target.value })} />
          </div>
          <Input label="القاعة (اختياري)" value={createForm.room} onChange={(e) => setCreateForm({ ...createForm, room: e.target.value })} placeholder="مثال: القاعة الرئيسية" />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>إلغاء</Button>
            <Button type="submit" variant="gold" loading={saving} icon={<Plus size={15} />}>إضافة الحصة</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}