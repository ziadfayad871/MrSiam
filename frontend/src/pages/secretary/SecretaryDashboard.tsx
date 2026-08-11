import QRCode from 'qrcode';
import { AlertTriangle, Banknote, BarChart3, CalendarClock, CheckCircle2, CreditCard, KeyRound, Loader2, Pencil, Plus, Printer, QrCode, Trash2, Users, XCircle } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import AnalyticsTab from '../../components/AnalyticsTab';
import BillingPanel from '../../components/secretary/BillingPanel';
import { CompassLoader } from '../../design-system/components/CompassLoader';
import CoordinateLabel from '../../design-system/components/CoordinateLabel';
import { Card } from '../../design-system/ui/Card';
import { ErrorState } from '../../design-system/ui/ErrorState';
import { Button } from '../../design-system/ui/Button';
import Input from '../../design-system/ui/Field';
import { Modal } from '../../design-system/ui/Modal';
import { Tabs } from '../../design-system/ui/Tabs';
import { useToast } from '../../design-system/ui/Toast';
import { api } from '../../lib/api';
import type { CreateStudentResult, SecretaryDashboardDto, StudentCredentialsDto, StudentListItemDto } from '../../lib/types';

const ICONS: Record<string, React.ReactNode> = {
  students: <Users size={16} />,
  payments: <Banknote size={16} />,
  pending: <CalendarClock size={16} />,
  overdue: <AlertTriangle size={16} />,
  attendance: <CheckCircle2 size={16} />,
};

const STAGES = [
  { key: 'PrepOne', ar: 'أولى إعدادي' },
  { key: 'PrepTwo', ar: 'تانية إعدادي' },
  { key: 'PrepThree', ar: 'تالتة إعدادي' },
  { key: 'SecOne', ar: 'أولى ثانوي' },
  { key: 'SecTwo', ar: 'تانية ثانوي' },
  { key: 'SecThree', ar: 'تالتة ثانوي' },
] as const;

const TH = 'py-2 text-center font-medium';
const TD = 'py-2.5 text-center';

function SummaryRow({ label, value, tone }: { label: string; value: number; tone: 'gold' | 'ok' | 'warn' }) {
  const color =
    tone === 'gold'
      ? 'text-gold'
      : tone === 'ok'
        ? 'text-success'
        : 'text-error';
  return (
    <div className="flex items-center justify-between rounded-md border border-border-soft px-3 py-2">
      <span className="text-xs text-text-muted">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{value} ج.م</span>
    </div>
  );
}

function OverviewTab({ data }: { data: SecretaryDashboardDto }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        {data.stats.map((s) => (
          <div key={s.key} className="relative overflow-hidden rounded-lg border border-border-soft bg-surface p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-text-muted">{ICONS[s.icon]}</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-text-primary">{s.value}</p>
            <p className="mt-0.5 text-[11px] text-text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today attendance */}
        <Card className="relative overflow-hidden">
          <div className="absolute -end-8 -top-8 h-32 w-32 rounded-full bg-gold/10 blur-2xl" />
          <h2 className="mb-5 text-lg font-bold text-text-primary">حضور اليوم</h2>
          <div className="flex items-end justify-around">
            <div className="text-center">
              <p className="text-3xl font-bold text-success">{data.attendanceToday}</p>
              <p className="mt-1 flex items-center justify-center gap-1 text-xs text-text-muted">
                <CheckCircle2 size={12} className="text-success" /> حاضر
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-error">{data.absentToday}</p>
              <p className="mt-1 flex items-center justify-center gap-1 text-xs text-text-muted">
                <XCircle size={12} className="text-error" /> غائب
              </p>
            </div>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-border-soft">
            <div
              className="h-full rounded-full bg-gradient-to-l from-gold to-gold/40 transition-all duration-700"
              style={{ width: `${(data.attendanceToday / Math.max(data.attendanceToday + data.absentToday, 1)) * 100}%` }}
            />
          </div>
          <CoordinateLabel
            latitude={{ degrees: 31, minutes: 15, hemisphere: 'N' }}
            longitude={{ degrees: 32, minutes: 18, hemisphere: 'E' }}
            className="mt-4 opacity-50"
          />
        </Card>

        {/* Payments summary */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">مستحقات الاشتراكات</h2>
            <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] font-bold text-gold">
              شهرياً {data.paymentsSummary.length > 0 ? data.paymentsSummary[data.paymentsSummary.length - 1].total : 0} ج.م
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {data.paymentsSummary.map((m) => (
              <div key={m.month} className="rounded-md border border-border-soft p-4">
                <p className="font-plex text-center text-[10px] uppercase tracking-[0.2em] text-gold" dir="ltr">
                  {m.month}
                </p>
                <div className="mt-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">مُحصَّل</span>
                    <span className="font-bold text-success">{m.collected} ج.م</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">مستحق</span>
                    <span className="font-bold text-gold">{m.pending} ج.م</span>
                  </div>
                  {m.overdue > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">متأخر</span>
                      <span className="font-bold text-error">{m.overdue} ج.م</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border-soft">
                  <div
                    className="h-full rounded-full bg-gold"
                    style={{ width: `${m.total > 0 ? Math.round((m.collected / m.total) * 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent students */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">أحدث الطلاب المنضمين</h2>
          <span className="text-xs text-text-muted">قسم سجلات القافلة</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border-soft text-[11px] text-text-muted">
                <th className={TH}>الطالب</th>
                <th className={TH}>الكود</th>
                <th className={TH}>المرحلة</th>
                <th className={TH}>العام الدراسي</th>
                <th className={TH}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {data.recentStudents.map((s) => (
                <tr key={s.id} className="border-b border-border-soft/60 last:border-0">
                  <td className={`${TD} font-semibold text-text-primary`}>{s.fullName}</td>
                  <td className={`${TD} font-plex text-xs text-text-muted`} dir="ltr">{s.studentCode}</td>
                  <td className={`${TD} text-text-secondary`}>{s.stageAr}</td>
                  <td className={`${TD} text-text-secondary`}>{s.academicYear}</td>
                  <td className={TD}>
                    {s.hasPaymentIssue ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-error/10 px-2 py-0.5 text-[10px] font-bold text-error">
                        <AlertTriangle size={10} /> مستحقات متأخرة
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
                        <CheckCircle2 size={10} /> سداد سليم
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StudentsTab() {
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ fullName: '', guardianPhone: '', stage: 'PrepOne' as string, academicYear: '2025/2026', password: '' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [lastCreated, setLastCreated] = useState<(CreateStudentResult & { password: string; fullName: string }) | null>(null);

  const [editing, setEditing] = useState<StudentListItemDto | null>(null);
  const [editForm, setEditForm] = useState({ fullName: '', guardianPhone: '', stage: 'PrepOne' as string, academicYear: '', newPassword: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  const [printing, setPrinting] = useState<StudentListItemDto | null>(null);
  const [printPassword, setPrintPassword] = useState('');
  const [printError, setPrintError] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrBusy, setQrBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ items: StudentListItemDto[] }>('/students?pageSize=100');
      setStudents(res?.items ?? []);
    } catch (e) {
      toast('تعذر تحميل الطلبة', e instanceof Error ? e.message : 'خطأ', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setLastCreated(null);
    try {
      const res = await api.post<CreateStudentResult>('/students', {
        fullName: form.fullName.trim(),
        guardianPhone: form.guardianPhone.trim(),
        stage: form.stage,
        academicYear: form.academicYear.trim(),
        password: form.password,
      });
      if (res) {
        const created = { ...res, password: form.password, fullName: form.fullName.trim() };
        setLastCreated(created);
        toast('تم تسجيل الطالب', `يوزر نيم: ${res.username}`, 'success');
        setForm((f) => ({ ...f, fullName: '', guardianPhone: '', password: '' }));
        load();
      }
    } catch (err) {
      toast('فشل تسجيل الطالب', err instanceof Error ? err.message : 'خطأ', 'error');
    } finally {
      setSaving(false);
    }
  }

  function openEdit(student: StudentListItemDto) {
    setEditing(student);
    setEditForm({
      fullName: student.fullName,
      guardianPhone: student.guardianPhone,
      stage: student.stage,
      academicYear: student.academicYear,
      newPassword: '',
    });
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSavingEdit(true);
    try {
      await api.put(`/students/${editing.id}`, {
        id: editing.id,
        fullName: editForm.fullName.trim(),
        guardianPhone: editForm.guardianPhone.trim(),
        stage: editForm.stage,
        academicYear: editForm.academicYear.trim(),
        newPassword: editForm.newPassword.trim() || null,
      });
      toast('تم التعديل', 'اتحدثت بيانات الطالب', 'success');
      setEditing(null);
      load();
    } catch (err) {
      toast('فشل التعديل', err instanceof Error ? err.message : 'خطأ', 'error');
    } finally {
      setSavingEdit(false);
    }
  }

  async function openPrint(student: StudentListItemDto) {
    setPrinting(student);
    setPrintPassword('');
    setQrUrl(null);
    setPrintError(null);
    try {
      const creds = await api.get<StudentCredentialsDto>(`/students/${student.id}/credentials`);
      setPrintPassword(creds.password);
    } catch (err) {
      setPrintError(err instanceof Error ? err.message : 'مفيش باسورد محفوظ');
    }
  }

  async function buildQr() {
    if (!printing || printPassword.trim().length < 4) return;
    setQrBusy(true);
    try {
      const url = new URL('/login', window.location.origin);
      url.searchParams.set('u', printing.username);
      url.searchParams.set('p', printPassword.trim());
      const dataUrl = await QRCode.toDataURL(url.toString(), {
        width: 280,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#16121f', light: '#ffffff' },
      });
      setQrUrl(dataUrl);
    } catch {
      toast('فشل توليد الكود', 'جرب تاني', 'error');
    } finally {
      setQrBusy(false);
    }
  }

  useEffect(() => {
    if (!printing) return;
    const t = setTimeout(() => {
      buildQr();
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printPassword, printing]);

  async function remove(student: StudentListItemDto) {
    if (!window.confirm(`حذف الطالب ${student.fullName} (${student.username})؟ كل بياناته هتتمسح.`)) return;
    setDeletingId(student.id);
    try {
      await api.del(`/students/${student.id}`);
      toast('تم الحذف', `شيلنا ${student.fullName} من السجلات`, 'success');
      load();
    } catch (err) {
      toast('فشل الحذف', err instanceof Error ? err.message : 'خطأ', 'error');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="mb-5 flex items-center gap-3">
          <span className="rounded-md bg-gold/10 p-2 text-gold">
            <Plus size={18} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-text-primary">تسجيل طالب جديد</h2>
            <p className="text-xs text-text-muted">
              اليوزر نيم بيتبني تلقائياً (SIMO1 ثم SIMO2…) — إنت بتحدد كلمة المرور
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            label="الاسم الكامل"
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder="مثال: أحمد محمد علي"
          />
          <div>
            <label className="mb-1.5 block text-center text-xs font-semibold text-text-secondary">المرحلة</label>
            <select
              value={form.stage}
              onChange={(e) => setForm({ ...form, stage: e.target.value })}
              className="w-full rounded-md border border-border-soft bg-surface px-3 py-2.5 text-center text-sm text-text-primary outline-none transition-colors focus:border-gold/60"
            >
              {STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.ar}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="العام الدراسي"
            required
            value={form.academicYear}
            onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
            placeholder="2025/2026"
          />
          <Input
            label="رقم ولي الأمر (اختياري)"
            dir="ltr"
            value={form.guardianPhone}
            onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
            placeholder="01000000000"
          />
          <Input
            label="كلمة المرور"
            required
            type="text"
            icon={<KeyRound size={15} />}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="هيّا بتدّيها للطالب"
          />
          <div className="flex items-end">
            <Button type="submit" variant="gold" loading={saving} icon={<Plus size={16} />} className="w-full">
              سجّل الطالب
            </Button>
          </div>
        </form>

        {lastCreated && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-success/30 bg-success/10 p-4">
            <div>
              <p className="text-sm font-bold text-success">تم التسجيل — سلّم للطالب بياناته:</p>
              <p className="mt-2 font-plex text-sm text-text-primary" dir="ltr">
                يوزر نيم: <span className="font-bold text-gold">{lastCreated.username}</span> · باسورد: {lastCreated.password}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<Printer size={15} />}
              onClick={() => {
                const stub: StudentListItemDto = {
                  id: lastCreated.studentId,
                  fullName: lastCreated.fullName,
                  studentCode: lastCreated.studentCode,
                  username: lastCreated.username,
                  stage: form.stage as StudentListItemDto['stage'],
                  stageAr: STAGES.find((s) => s.key === form.stage)?.ar ?? '',
                  guardianPhone: '',
                  academicYear: form.academicYear,
                  joinedAt: new Date().toISOString(),
                  isActive: true,
                  average: 0,
                  examsTaken: 0,
                };
                openPrint(stub);
              }}
            >
              اطبع كارت الدخول
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">قائمة الطلبة</h2>
          <span className="text-xs text-text-muted">{students.length} طالب</span>
        </div>
        {loading ? (
          <CompassLoader text="بنجيب السجلات..." />
        ) : students.length === 0 ? (
          <p className="rounded-md border border-dashed border-border-soft py-8 text-center text-sm text-text-muted">
            مفيش طلبة لسه — سجّل أول طالب من الفورم فوق
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border-soft text-[11px] text-text-muted">
                  <th className={TH}>الطالب</th>
                  <th className={TH}>اليوزر نيم</th>
                  <th className={TH}>المرحلة</th>
                  <th className={TH}>العام</th>
                  <th className={TH}>ولي الأمر</th>
                  <th className={TH}>التحكم</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-border-soft/60 last:border-0">
                    <td className={`${TD} font-semibold text-text-primary`}>{s.fullName}</td>
                    <td className={`${TD} font-plex text-xs text-gold`} dir="ltr">{s.username}</td>
                    <td className={`${TD} text-text-secondary`}>{s.stageAr}</td>
                    <td className={`${TD} text-text-secondary`}>{s.academicYear}</td>
                    <td className={`${TD} font-plex text-xs text-text-muted`} dir="ltr">{s.guardianPhone || '—'}</td>
                    <td className={TD}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEdit(s)}
                          title="تعديل"
                          className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-gold/10 hover:text-gold"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => openPrint(s)}
                          title="طباعة كارت QR"
                          className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-gold/10 hover:text-gold"
                        >
                          <QrCode size={15} />
                        </button>
                        <button
                          onClick={() => remove(s)}
                          disabled={deletingId === s.id}
                          title="حذف"
                          className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-error/10 hover:text-error disabled:opacity-40"
                        >
                          {deletingId === s.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit modal */}
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={`تعديل بيانات — ${editing?.username ?? ''}`}>
        <form onSubmit={saveEdit} className="grid gap-4 sm:grid-cols-2">
          <Input
            label="الاسم الكامل"
            required
            value={editForm.fullName}
            onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
          />
          <div>
            <label className="mb-1.5 block text-center text-xs font-semibold text-text-secondary">المرحلة</label>
            <select
              value={editForm.stage}
              onChange={(e) => setEditForm({ ...editForm, stage: e.target.value })}
              className="w-full rounded-md border border-border-soft bg-surface px-3 py-2.5 text-center text-sm text-text-primary outline-none transition-colors focus:border-gold/60"
            >
              {STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.ar}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="العام الدراسي"
            required
            value={editForm.academicYear}
            onChange={(e) => setEditForm({ ...editForm, academicYear: e.target.value })}
          />
          <Input
            label="رقم ولي الأمر"
            dir="ltr"
            value={editForm.guardianPhone}
            onChange={(e) => setEditForm({ ...editForm, guardianPhone: e.target.value })}
          />
          <div className="sm:col-span-2">
            <Input
              label="كلمة مرور جديدة (اتركها فاضية لو مش هتغيّرها)"
              type="text"
              icon={<KeyRound size={15} />}
              value={editForm.newPassword}
              onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
              placeholder="لو هتغيّر الباسورد اكتب الجديد هنا"
            />
          </div>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              إلغاء
            </Button>
            <Button type="submit" variant="gold" loading={savingEdit}>
              حفظ التعديلات
            </Button>
          </div>
        </form>
      </Modal>

      {/* QR print modal */}
      <Modal
        open={printing !== null}
        onClose={() => setPrinting(null)}
        title={`كارت دخول — ${printing?.fullName ?? ''}`}
      >
        <div className="flex flex-col gap-4">
          {printError && (
            <p className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-xs text-error">
              {printError}
            </p>
          )}

          <div className="flex justify-center">
            <div
              id="student-qr-card"
              className="w-[300px] rounded-xl border border-border-soft bg-white p-6 text-center shadow-soft"
            >
              <p className="display-serif text-lg font-bold text-[#16121f]">مستر محمد صيام</p>
              <p className="mt-0.5 text-[11px] text-[#6b6b76]">مع أبو كيان .. الدراسات في أمان</p>
              <p className="mt-3 text-sm font-bold text-[#16121f]">{printing?.fullName}</p>
              <p className="text-xs text-[#6b6b76]">{printing?.stageAr}</p>
              <div className="mt-4 flex justify-center">
                {qrBusy ? (
                  <div className="flex h-[280px] w-[280px] items-center justify-center">
                    <Loader2 size={28} className="animate-spin text-gold" />
                  </div>
                ) : qrUrl ? (
                  <img src={qrUrl} alt="QR code" className="h-[280px] w-[280px]" />
                ) : (
                  <div className="flex h-[280px] w-[280px] items-center justify-center rounded border border-dashed border-[#d8d4cc] text-xs text-[#6b6b76]">
                    {printError ? 'مفيش كود — عدّل الباسورد الأول' : 'بنجهّز الكود...'}
                  </div>
                )}
              </div>
              <div className="mt-4 rounded-lg border border-[#e4e0d8] p-3" dir="ltr">
                <p className="font-plex text-sm font-bold tracking-wide text-[#16121f]">{printing?.username}</p>
                <p className="mt-1 font-plex text-sm font-bold tracking-wide text-[#16121f]">
                  باسورد: {printPassword || '••••••'}
                </p>
              </div>
              <p className="mt-3 text-[10px] text-[#6b6b76]">
                امسح الكود أو ادخل البيانات على الموقع وابدأ رحلتك
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setPrinting(null)}>
              إلغاء
            </Button>
            <Button
              variant="gold"
              icon={<Printer size={16} />}
              disabled={!qrUrl}
              onClick={() => window.print()}
            >
              طباعة الكارت
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function SecretaryDashboard() {
  const [data, setData] = useState<SecretaryDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    api
      .get<SecretaryDashboardDto>('/dashboard/secretary')
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'فشل تحميل اللوحة'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CompassLoader text="بنجهز سجلات الأمين..." />;
  if (error || !data) return <ErrorState title={error ?? 'مفيش بيانات'} onRetry={() => window.location.reload()} />;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="display-serif text-2xl font-bold text-text-primary">سجل الأمين</h1>
        <p className="mt-1 text-sm text-text-muted">الحضور والاشتراكات وتسجيل الطلبة — كل الورق في مكان واحد.</p>
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        items={[
          { key: 'overview', label: 'نظرة عامة' },
          { key: 'students', label: 'إدارة الطلبة', icon: <Users size={15} /> },
          { key: 'billing', label: 'الفوترة والاشتراكات', icon: <CreditCard size={15} /> },
          { key: 'analytics', label: 'التحليلات', icon: <BarChart3 size={15} /> },
        ]}
      />

      {tab === 'overview' ? (
        <OverviewTab data={data} />
      ) : tab === 'students' ? (
        <StudentsTab />
      ) : tab === 'billing' ? (
        <BillingPanel />
      ) : (
        <AnalyticsTab />
      )}
    </div>
  );
}
