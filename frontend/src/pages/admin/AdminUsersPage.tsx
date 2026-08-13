import { Pencil, Plus, Search, Trash2, UserCheck, UserX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '../../design-system/ui/Badge';
import { Button } from '../../design-system/ui/Button';
import { EmptyState } from '../../design-system/ui/EmptyState';
import { Input } from '../../design-system/ui/Field';
import { api } from '../../lib/api';
import { useToast } from '../../design-system/ui/Toast';
import type { Role, UserListItemDto } from '../../lib/types';

function roleAr(role: Role) {
  switch (role) {
    case 'Secretary': return 'أمين';
    case 'Admin': return 'مدير';
    default: return role;
  }
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ items: UserListItemDto[] }>(`/users?page=1&pageSize=100&search=${encodeURIComponent(search)}`);
      setUsers(res?.items ?? []);
    } catch (e) {
      toast('تعذر تحميل المستخدمين', e instanceof Error ? e.message : 'خطأ', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function toggleActive(user: UserListItemDto) {
    try {
      await api.put(`/users/${user.id}`, { isActive: !user.isActive });
      toast(user.isActive ? 'تم إيقاف الحساب' : 'تم تفعيل الحساب', user.fullName, 'success');
      load();
    } catch (e) {
      toast('فشلت العملية', e instanceof Error ? e.message : 'خطأ', 'error');
    }
  }

  async function remove(user: UserListItemDto) {
    if (!window.confirm(`متأكد إنك عايز تحذف حساب «${user.fullName}»؟ دي عملية نهائية.`)) return;
    setDeletingId(user.id);
    try {
      await api.del(`/users/${user.id}`);
      toast('تم حذف الحساب', user.fullName, 'success');
      load();
    } catch (e) {
      toast('فشل الحذف', e instanceof Error ? e.message : 'خطأ', 'error');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="admin-workspace flex flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[.16em] text-gold">إدارة المستخدمين</p>
          <h1 className="display-serif mt-2 text-3xl font-extrabold text-text-primary">قائمة المستخدمين</h1>
          <p className="mt-2 text-sm text-text-muted">حسابات السكرتارية والمديرين — من هنا بتضيفهم أو تعدلهم أو توقفهم.</p>
        </div>
        <Button variant="gold" icon={<Plus size={16} />} onClick={() => navigate('/admin/users/new')}>
          إضافة مستخدم
        </Button>
      </header>

      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="دور على مستخدم..." className="ps-9" />
        </div>
        <p className="text-sm text-text-muted">{users.length} مستخدم</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border-soft bg-surface">
        {loading ? (
          <p className="p-8 text-center text-sm text-text-muted">جاري التحميل...</p>
        ) : users.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon="scroll"
              title="مفيش مستخدمين"
              description="ابدأ بإضافة سكرتير جديد — هيعرف يدخل على بوابة المستر فورًا."
              actionLabel="إضافة مستخدم"
              onAction={() => navigate('/admin/users/new')}
            />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-start text-xs font-bold text-text-muted">
                <th className="px-4 py-3 text-start">الاسم</th>
                <th className="px-4 py-3 text-start">اسم المستخدم</th>
                <th className="px-4 py-3 text-start">الدور</th>
                <th className="px-4 py-3 text-start">الحالة</th>
                <th className="px-4 py-3 text-start">آخر دخول</th>
                <th className="px-4 py-3 text-end">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border-subtle/60 last:border-0 hover:bg-surface-sunken/40">
                  <td className="px-4 py-3 font-semibold text-text-primary">{u.fullName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{u.username}</td>
                  <td className="px-4 py-3"><Badge variant={u.role === 'Admin' ? 'gold' : 'neutral'}>{roleAr(u.role)}</Badge></td>
                  <td className="px-4 py-3">
                    <Badge variant={u.isActive ? 'success' : 'neutral'}>{u.isActive ? 'نشط' : 'موقوف'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('ar-EG') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/admin/users/${u.id}/edit`}
                        className="grid h-8 w-8 place-items-center rounded-md text-text-secondary transition hover:bg-gold/15 hover:text-gold"
                        title="تعديل"
                      >
                        <Pencil size={15} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleActive(u)}
                        className="grid h-8 w-8 place-items-center rounded-md text-text-secondary transition hover:bg-gold/15 hover:text-gold"
                        title={u.isActive ? 'إيقاف الحساب' : 'تفعيل الحساب'}
                      >
                        {u.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(u)}
                        disabled={deletingId === u.id}
                        className="grid h-8 w-8 place-items-center rounded-md text-text-secondary transition hover:bg-error/15 hover:text-error"
                        title="حذف"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
