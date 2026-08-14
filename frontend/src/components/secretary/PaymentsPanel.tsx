import { AlertTriangle, Banknote, CalendarClock, Check, CheckCircle2, Plus, Printer, Search, UserCheck, X } from 'lucide-react';
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
import { formatDate, ReceiptView } from './PaymentReceipt';
import type { PaymentDto, PaymentReceiptDto, StudentListItemDto } from '../../lib/types';

const TH = 'py-2 text-center font-medium';
const TD = 'py-2.5 text-center';

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMoney(n: number): string {
  return `${Number(n).toLocaleString('ar-EG')} ج.م`;
}

export default function PaymentsTab() {
  const [payments, setPayments] = useState<PaymentDto[]>([]);
  const [students, setStudents] = useState<StudentListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [monthFilter, setMonthFilter] = useState(currentMonth());
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ amount: '', month: currentMonth(), method: 'نقدي' });
  const [savingCreate, setSavingCreate] = useState(false);
  const [codeQuery, setCodeQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentListItemDto | null>(null);

  const [receipt, setReceipt] = useState<PaymentReceiptDto | null>(null);

  const [markingId, setMarkingId] = useState<number | null>(null);
  const [markMethod, setMarkMethod] = useState('نقدي');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (monthFilter) params.set('month', monthFilter);
      if (statusFilter) params.set('status', statusFilter);
      params.set('pageSize', '200');
      const res = await api.get<{ items: PaymentDto[] }>(`/payments?${params.toString()}`);
      setPayments(res?.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تحميل الدفعات');
    } finally {
      setLoading(false);
    }
  }, [monthFilter, statusFilter]);

  useEffect(() => {
    load();
    api
      .get<{ items: StudentListItemDto[] }>('/students?pageSize=200')
      .then((res) => setStudents(res?.items ?? []))
      .catch(() => setStudents([]));
  }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return payments;
    const q = search.trim().toLowerCase();
    return payments.filter((p) => p.studentName.toLowerCase().includes(q));
  }, [payments, search]);

  const studentMatches = useMemo(() => {
    const q = codeQuery.trim().toLowerCase();
    if (!q) return [];
    return students
      .filter(
        (s) =>
          s.username.toLowerCase().includes(q) ||
          s.studentCode.toLowerCase().includes(q) ||
          s.fullName.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [codeQuery, students]);

  const totals = useMemo(() => {
    const collected = payments.filter((p) => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
    const pending = payments.filter((p) => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);
    const overdue = payments.filter((p) => p.status === 'Overdue').reduce((sum, p) => sum + p.amount, 0);
    return { collected, pending, overdue };
  }, [payments]);

  const markAsPaid = async (id: number) => {
    setMarkingId(id);
    try {
      await api.patch<boolean>(`/payments/${id}/paid?method=${encodeURIComponent(markMethod)}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تأكيد الدفعة');
    } finally {
      setMarkingId(null);
    }
  };

  const createPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !createForm.amount) {
      setError('اكتب كود الطالب واختاره، وحدد المبلغ');
      return;
    }
    setSavingCreate(true);
    setError(null);
    try {
      const rec = await api.post<PaymentReceiptDto>('/payments/collect', {
        studentId: selectedStudent.id,
        amount: Number(createForm.amount),
        month: createForm.month || currentMonth(),
        method: createForm.method,
      });
      setReceipt(rec);
      setCreateOpen(false);
      setCreateForm({ amount: '', month: currentMonth(), method: 'نقدي' });
      setSelectedStudent(null);
      setCodeQuery('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تسجيل الدفعة');
    } finally {
      setSavingCreate(false);
    }
  };

  const openReceipt = (p: PaymentDto) => {
    const s = students.find((x) => x.id === p.studentId);
    setReceipt({
      id: p.id,
      studentId: p.studentId,
      studentName: p.studentName,
      username: s?.username ?? '—',
      studentCode: s?.studentCode ?? '—',
      stageAr: s?.stageAr ?? '',
      amount: p.amount,
      month: p.month,
      method: p.method ?? null,
      paidAt: p.paidAt ?? new Date().toISOString(),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid grid-cols-2 gap-3 lg:flex-1">
          <Input label="الشهر" type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} />
          <Select label="الحالة" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">الكل</option>
            <option value="Paid">مدفوع</option>
            <option value="Pending">مستحق</option>
            <option value="Overdue">متأخر</option>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 lg:w-64">
            <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم..."
              className="w-full rounded-md border border-border-subtle bg-surface-elevated py-2.5 ps-9 pe-3 text-sm text-text-primary outline-none transition-colors focus:border-gold"
            />
          </div>
          <Button variant="gold" onClick={() => setCreateOpen(true)} icon={<Plus size={16} />}>
            تحصيل وإيصال
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="flex items-center gap-2 text-xs text-text-muted"><CheckCircle2 size={14} className="text-success" /> محصَّل</p>
          <p className="mt-2 text-2xl font-bold text-success">{formatMoney(totals.collected)}</p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-2 text-xs text-text-muted"><CalendarClock size={14} className="text-gold" /> مستحق الدفع</p>
          <p className="mt-2 text-2xl font-bold text-gold">{formatMoney(totals.pending)}</p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-2 text-xs text-text-muted"><AlertTriangle size={14} className="text-error" /> متأخر</p>
          <p className="mt-2 text-2xl font-bold text-error">{formatMoney(totals.overdue)}</p>
        </Card>
      </div>

      {error && <p className="rounded-md border border-error/40 bg-error/10 px-4 py-2.5 text-sm font-semibold text-error">{error}</p>}

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-text-primary">
            <Banknote size={17} className="text-gold" /> سجل الدفعات
          </h2>
          <Badge variant="outline">{filtered.length} دفعة</Badge>
        </div>

        {loading ? (
          <CompassLoader text="بنجيب الدفعات..." />
        ) : filtered.length === 0 ? (
          <EmptyState title="مفيش دفعات" description="أضف دفعة جديدة أو غيّر الفلاتر." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-border-soft text-[11px] text-text-muted">
                  <th className={TH}>الطالب</th>
                  <th className={TH}>المبلغ</th>
                  <th className={TH}>الشهر</th>
                  <th className={TH}>الطريقة</th>
                  <th className={TH}>تاريخ السداد</th>
                  <th className={TH}>الحالة</th>
                  <th className={TH}>التحكم</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border-soft/60 last:border-0">
                    <td className={`${TD} font-semibold text-text-primary`}>{p.studentName}</td>
                    <td className={`${TD} font-bold text-gold`}>{formatMoney(p.amount)}</td>
                    <td className={`${TD} font-plex text-xs text-text-muted`} dir="ltr">{p.month}</td>
                    <td className={`${TD} text-xs text-text-secondary`}>{p.method ?? '—'}</td>
                    <td className={`${TD} text-xs text-text-secondary`}>{formatDate(p.paidAt)}</td>
                    <td className={TD}>
                      <Badge variant={p.status === 'Paid' ? 'success' : p.status === 'Overdue' ? 'error' : 'warning'}>
                        {p.status === 'Paid' ? 'مدفوع' : p.status === 'Overdue' ? 'متأخر' : 'مستحق'}
                      </Badge>
                    </td>
                    <td className={TD}>
                      {p.status !== 'Paid' ? (
                        markingId === p.id ? (
                          <span className="flex items-center justify-center gap-1.5">
                            <select
                              value={markMethod}
                              onChange={(e) => setMarkMethod(e.target.value)}
                              className="rounded border border-border-soft bg-surface px-1.5 py-1 text-[11px] text-text-secondary outline-none"
                            >
                              <option value="نقدي">نقدي</option>
                              <option value="محفظة إلكترونية">محفظة</option>
                              <option value="تحويل بنكي">بنكي</option>
                            </select>
                            <button
                              onClick={() => void markAsPaid(p.id)}
                              className="flex items-center gap-1 rounded bg-success/15 px-2 py-1 text-[11px] font-bold text-success transition-colors hover:bg-success/25"
                            >
                              <Check size={12} /> تأكيد
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setMarkingId(p.id)}
                            className="flex items-center gap-1 rounded bg-gold/15 px-2.5 py-1 text-[11px] font-bold text-gold transition-colors hover:bg-gold/25"
                          >
                            <Check size={12} /> تأكيد السداد
                          </button>
                        )
                      ) : (
                        <span className="flex items-center justify-center gap-1.5">
                          <span className="flex items-center gap-1 text-xs font-semibold text-success">
                            <CheckCircle2 size={13} /> مؤكدة
                          </span>
                          <button
                            onClick={() => openReceipt(p)}
                            title="طباعة الإيصال"
                            className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-gold/10 hover:text-gold"
                          >
                            <Printer size={14} />
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="تحصيل دفع — إيصال فوري">
        <form onSubmit={createPayment} className="grid gap-4">
          {error && (
            <p className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-xs text-error">{error}</p>
          )}
          <div>
            <label className="mb-1.5 block text-center text-xs font-semibold text-text-secondary">
              كود الطالب (اليوزر نيم على المنصة)
            </label>
            <div className="relative">
              <UserCheck size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                value={codeQuery}
                onChange={(e) => setCodeQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && studentMatches.length > 0) {
                    e.preventDefault();
                    setSelectedStudent(studentMatches[0]);
                    setCodeQuery('');
                  }
                }}
                placeholder="اكتب الكود... مثال: SIMO12"
                className="w-full rounded-md border border-border-subtle bg-surface-elevated py-2.5 ps-9 pe-3 text-sm text-text-primary outline-none transition-colors focus:border-gold"
              />
            </div>

            {selectedStudent ? (
              <div className="mt-2 flex items-center justify-between gap-2 rounded-md border border-success/30 bg-success/10 p-3">
                <div>
                  <p className="text-sm font-bold text-text-primary">{selectedStudent.fullName}</p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    <span className="font-plex text-gold" dir="ltr">
                      {selectedStudent.username}
                    </span>
                    {' · '}
                    {selectedStudent.stageAr} · {selectedStudent.studentCode}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudent(null);
                    setCodeQuery('');
                  }}
                  className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-error/10 hover:text-error"
                  title="تغيير الطالب"
                >
                  <X size={15} />
                </button>
              </div>
            ) : studentMatches.length > 0 ? (
              <div className="mt-2 overflow-hidden rounded-md border border-border-soft bg-surface-elevated shadow-soft">
                {studentMatches.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedStudent(s);
                      setCodeQuery('');
                    }}
                    className="flex w-full items-center justify-between gap-2 border-b border-border-subtle px-3 py-2 text-start transition-colors last:border-0 hover:bg-gold/10"
                  >
                    <span className="text-sm font-semibold text-text-primary">{s.fullName}</span>
                    <span className="font-plex text-xs text-gold" dir="ltr">
                      {s.username}
                    </span>
                  </button>
                ))}
              </div>
            ) : codeQuery.trim() ? (
              <p className="mt-2 text-xs text-error">مفيش طالب بكود «{codeQuery}» — تأكد من اليوزر نيم</p>
            ) : null}
          </div>

          <Input
            label="المبلغ (جنيه)"
            required
            type="number"
            min={1}
            value={createForm.amount}
            onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="الشهر"
              type="month"
              value={createForm.month}
              onChange={(e) => setCreateForm({ ...createForm, month: e.target.value })}
            />
            <Select label="طريقة الدفع" value={createForm.method} onChange={(e) => setCreateForm({ ...createForm, method: e.target.value })}>
              <option value="نقدي">نقدي</option>
              <option value="محفظة إلكترونية">محفظة إلكترونية</option>
              <option value="تحويل بنكي">تحويل بنكي</option>
            </Select>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" variant="gold" loading={savingCreate} icon={<CheckCircle2 size={15} />}>
              سدّد واطبع الإيصال
            </Button>
          </div>
        </form>
      </Modal>

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
    </div>
  );
}