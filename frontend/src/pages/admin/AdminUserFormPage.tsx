import { ArrowRight } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../design-system/ui/Button';
import { Input, Select } from '../../design-system/ui/Field';
import { api } from '../../lib/api';
import { useToast } from '../../design-system/ui/Toast';
import type { Role, UserListItemDto } from '../../lib/types';

export default function AdminUserFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editingId = id ? Number(id) : null;
  const { toast } = useToast();

  const [form, setForm] = useState({ username: '', fullName: '', password: '', role: 'Secretary' as Role, isActive: true });
  const [loading, setLoading] = useState(!!editingId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editingId) return;
    api
      .get<UserListItemDto>(`/users?page=1&pageSize=100`)
      .then((res) => {
        const user = (res as unknown as { items: UserListItemDto[] }).items?.find((u) => u.id === editingId);
        if (user) {
          setForm({ username: user.username, fullName: user.fullName, password: '', role: user.role, isActive: user.isActive });
        } else {
          setError('الحساب غير موجود');
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'تعذر تحميل الحساب'))
      .finally(() => setLoading(false));
  }, [editingId]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await api.put(`/users/${editingId}`, {
          fullName: form.fullName.trim(),
          role: form.role,
          isActive: form.isActive,
          newPassword: form.password || undefined,
        });
        toast('تم تحديث الحساب', `تم تعديل بيانات ${form.fullName}`, 'success');
      } else {
        await api.post('/users', {
          username: form.username.trim(),
          fullName: form.fullName.trim(),
          password: form.password,
          role: form.role,
          isActive: form.isActive,
        });
        toast('تم إنشاء الحساب', `حساب ${form.fullName} جاهز للدخول`, 'success');
      }
      navigate('/admin/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشلت العملية');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-text-muted">جاري تحميل بيانات الحساب...</p>
      </div>
    );
  }

  return (
    <div className="admin-workspace flex flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[.16em] text-gold">إدارة المستخدمين</p>
          <h1 className="display-serif mt-2 text-3xl font-extrabold text-text-primary">{editingId ? 'تعديل مستخدم' : 'إضافة مستخدم'}</h1>
          <p className="mt-2 text-sm text-text-muted">
            {editingId ? 'عدّل بيانات الحساب — لو كتبت كلمة مرور جديدة هتتحدث.' : 'أنشئ حساب سكرتير أو مدير — يقدر يدخل على بوابة المستر فورًا.'}
          </p>
        </div>
        <Button variant="ghost" icon={<ArrowRight size={15} />} onClick={() => navigate('/admin/users')}>
          رجوع للقائمة
        </Button>
      </header>

      <form onSubmit={submit} className="max-w-2xl space-y-5 rounded-xl border border-border-soft bg-surface p-5 sm:p-8">
        {error && <p className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">{error}</p>}

        <Input
          label="اسم المستخدم (يوزر نيم)"
          required
          disabled={!!editingId}
          value={form.username}
          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          placeholder="مثال: secretary1"
          hint={editingId ? 'اسم المستخدم لا يمكن تغييره بعد الإنشاء.' : 'بيه يدخل بيه على بوابة المستر.'}
        />
        <Input
          label="الاسم الكامل"
          required
          value={form.fullName}
          onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
          placeholder="مثال: أمين المعهد"
        />
        <Input
          label={editingId ? 'كلمة مرور جديدة (اختياري)' : 'كلمة المرور'}
          required={!editingId}
          type="password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          placeholder="4 أحرف على الأقل"
          hint={editingId ? 'لو سبتها فاضية هتفضل كلمة المرور الحالية.' : 'هتكون كلمة مرور الدخول للحساب.'}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Select
            label="الدور"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
          >
            <option value="Secretary">أمين (سكرتير)</option>
            <option value="Admin">مدير (مستر)</option>
          </Select>
          <Select
            label="حالة الحساب"
            value={form.isActive ? 'active' : 'inactive'}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === 'active' }))}
          >
            <option value="active">نشط</option>
            <option value="inactive">موقوف</option>
          </Select>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="submit" variant="gold" loading={saving}>
            {editingId ? 'حفظ التعديلات' : 'إنشاء الحساب'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/users')}>
            إلغاء
          </Button>
        </div>
      </form>
    </div>
  );
}
