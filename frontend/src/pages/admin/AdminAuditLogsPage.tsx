import { FileClock } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../design-system/ui/Badge';
import { EmptyState } from '../../design-system/ui/EmptyState';
import { Select } from '../../design-system/ui/Field';
import { Pagination } from '../../design-system/ui/Pagination';
import { api } from '../../lib/api';
import { useToast } from '../../design-system/ui/Toast';
import type { AuditLogListItemDto, UserListItemDto } from '../../lib/types';

const ACTION_AR: Record<string, string> = {
  create: 'إنشاء',
  update: 'تعديل',
  delete: 'حذف',
  bulk: 'تسجيل جماعي',
  login: 'تسجيل دخول',
};

const ENTITY_AR: Record<string, string> = {
  Student: 'طالب',
  Attendance: 'حضور',
  Payment: 'دفعة',
  StudyGroup: 'مجموعة',
  StudyGroupMember: 'عضو مجموعة',
  ScheduleSlot: 'حصة جدول',
  Parent: 'ولي أمر',
  Subscription: 'اشتراك',
  SubscriptionPlan: 'باقة',
  Coupon: 'كود خصم',
  User: 'مستخدم',
  Exam: 'اختبار',
  AppUser: 'مستخدم',
};

function actionBadge(action: string) {
  switch (action) {
    case 'create': return <Badge variant="success">إنشاء</Badge>;
    case 'update': return <Badge variant="gold">تعديل</Badge>;
    case 'delete': return <Badge variant="error">حذف</Badge>;
    case 'login': return <Badge variant="neutral">دخول</Badge>;
    default: return <Badge variant="outline">{ACTION_AR[action] ?? action}</Badge>;
  }
}

export default function AdminAuditLogsPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserListItemDto[]>([]);
  const [secretaryId, setSecretaryId] = useState<number | ''>('');
  const [logs, setLogs] = useState<AuditLogListItemDto[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ items: UserListItemDto[] }>('/users?page=1&pageSize=100')
      .then((res) => setUsers(res?.items ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const query = new URLSearchParams({ page: String(page), pageSize: '30' });
    if (secretaryId !== '') query.set('userId', String(secretaryId));
    api
      .get<{ items: AuditLogListItemDto[]; totalPages: number; totalCount: number }>(`/audit-logs?${query}`)
      .then((res) => {
        if (cancelled) return;
        setLogs(res?.items ?? []);
        setTotalPages(res?.totalPages ?? 1);
        setTotalCount(res?.totalCount ?? 0);
      })
      .catch((e) => {
        if (!cancelled) toast('تعذر تحميل سجل العمليات', e instanceof Error ? e.message : 'خطأ', 'error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [secretaryId, page]);

  const selectedName = useMemo(() => {
    if (secretaryId === '') return 'كل المستخدمين';
    return users.find((u) => u.id === secretaryId)?.fullName ?? 'مستخدم';
  }, [secretaryId, users]);

  return (
    <div className="admin-workspace flex flex-col gap-6 p-4 sm:p-6">
      <header>
        <p className="text-xs font-bold tracking-[.16em] text-gold">إدارة المستخدمين</p>
        <h1 className="display-serif mt-2 text-3xl font-extrabold text-text-primary">سجل العمليات</h1>
        <p className="mt-2 text-sm text-text-muted">كل العمليات اللي السكرتارية عملوها بتتسجل هنا — باسمهم وتاريخها ونوعها وشرحها.</p>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full max-w-sm">
          <Select label="السكرتير" value={secretaryId === '' ? '' : String(secretaryId)} onChange={(e) => { setPage(1); setSecretaryId(e.target.value === '' ? '' : Number(e.target.value)); }}>
            <option value="">كل المستخدمين</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.fullName} ({u.username})</option>
            ))}
          </Select>
        </div>
        <p className="pb-2.5 text-sm text-text-muted">
          <span className="font-bold text-text-primary">{selectedName}</span> — {totalCount} عملية
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border-soft bg-surface">
        {loading ? (
          <p className="p-8 text-center text-sm text-text-muted">جاري التحميل...</p>
        ) : logs.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon="scroll"
              title="مفيش عمليات مسجلة"
              description="لما السكرتارية تعمل أي عملية (تسجيل طالب، حضور، دفعات، مجموعات...)، هتظهر هنا تلقائيًا."
            />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-start text-xs font-bold text-text-muted">
                <th className="px-4 py-3 text-start">المستخدم</th>
                <th className="px-4 py-3 text-start">تاريخ العملية</th>
                <th className="px-4 py-3 text-start">نوع العملية</th>
                <th className="px-4 py-3 text-start">الشرح</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-border-subtle/60 last:border-0 hover:bg-surface-sunken/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-gold/12 text-gold">
                        <FileClock size={14} />
                      </span>
                      <span className="font-semibold text-text-primary">{log.username ?? 'نظام'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{new Date(log.createdAt).toLocaleString('ar-EG')}</td>
                  <td className="px-4 py-3">{actionBadge(log.action)}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {log.details ?? `${ACTION_AR[log.action] ?? log.action} ${ENTITY_AR[log.entity] ?? log.entity}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
