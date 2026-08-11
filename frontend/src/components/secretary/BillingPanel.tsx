import { BadgeCheck, CreditCard, Percent, Plus, Ticket } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Badge } from '../../design-system/ui/Badge';
import { Button } from '../../design-system/ui/Button';
import { Card } from '../../design-system/ui/Card';
import { Input } from '../../design-system/ui/Field';
import { Select } from '../../design-system/ui/Field';
import { api } from '../../lib/api';
import type { CouponDto, StudentListItemDto, SubscriptionDto, SubscriptionPlanDto } from '../../lib/types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function BillingPanel() {
  const [plans, setPlans] = useState<SubscriptionPlanDto[]>([]);
  const [coupons, setCoupons] = useState<CouponDto[]>([]);
  const [subs, setSubs] = useState<SubscriptionDto[]>([]);
  const [students, setStudents] = useState<StudentListItemDto[]>([]);

  const [planForm, setPlanForm] = useState({ name: '', months: 1, price: 0, description: '' });
  const [couponForm, setCouponForm] = useState({ code: '', discountPercent: 10, maxUses: 1 });
  const [actForm, setActForm] = useState({ studentId: '', planId: '', couponCode: '' });

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.get<SubscriptionPlanDto[]>('/subscriptions/plans?includeInactive=true').then(setPlans).catch(() => setPlans([]));
    api.get<CouponDto[]>('/subscriptions/coupons').then(setCoupons).catch(() => setCoupons([]));
    api.get<SubscriptionDto[]>('/subscriptions').then(setSubs).catch(() => setSubs([]));
    api
      .get<StudentListItemDto[]>('/students?pageSize=200')
      .then((d) => {
        const items = Array.isArray(d) ? d : 'items' in d ? (d as { items: StudentListItemDto[] }).items : [];
        setStudents(items);
      })
      .catch(() => setStudents([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submitPlan(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.post<number>('/subscriptions/plans', planForm);
      setPlanForm({ name: '', months: 1, price: 0, description: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الإضافة');
    } finally {
      setSaving(false);
    }
  }

  async function submitCoupon(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.post<number>('/subscriptions/coupons', {
        code: couponForm.code || null,
        discountPercent: Number(couponForm.discountPercent),
        maxUses: Number(couponForm.maxUses),
      });
      setCouponForm({ code: '', discountPercent: 10, maxUses: 1 });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الإضافة');
    } finally {
      setSaving(false);
    }
  }

  async function submitActivate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!actForm.studentId || !actForm.planId) {
      setError('اختر الطالب والباقة');
      return;
    }
    setSaving(true);
    try {
      await api.post<number>('/subscriptions/activate', {
        studentId: Number(actForm.studentId),
        planId: Number(actForm.planId),
        couponCode: actForm.couponCode || null,
      });
      setActForm({ studentId: '', planId: '', couponCode: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل التفعيل');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <BadgeCheck size={17} className="text-gold" />
          <h2 className="text-lg font-bold text-text-primary">باقات الاشتراك</h2>
        </div>
        <form onSubmit={submitPlan} className="mb-4 grid grid-cols-2 gap-2">
          <Input label="اسم الباقة" value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} placeholder="شهري" />
          <Input label="المدة (شهور)" type="number" min={1} value={planForm.months} onChange={(e) => setPlanForm({ ...planForm, months: Number(e.target.value) })} />
          <Input label="السعر (جنيه)" type="number" min={0} value={planForm.price} onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })} />
          <Input label="وصف مختصر" value={planForm.description} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} />
          <div className="col-span-2">
            <Button type="submit" disabled={saving} size="sm" icon={<Plus size={14} />}>
              إضافة باقة
            </Button>
          </div>
        </form>
        <div className="flex flex-col gap-2">
          {plans.length === 0 && <p className="text-sm text-text-muted">مفيش باقات — أضف أول باقة.</p>}
          {plans.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-md border border-border-soft px-3 py-2.5">
              <div>
                <p className="text-sm font-bold text-text-primary">{p.name}</p>
                <p className="text-[11px] text-text-muted">
                  {p.months} شهر · {p.price} جنيه
                </p>
              </div>
              <Badge variant={p.isActive ? 'success' : 'neutral'}>{p.isActive ? 'مفعلة' : 'موقوفة'}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Ticket size={17} className="text-gold" />
          <h2 className="text-lg font-bold text-text-primary">أكواد الخصم</h2>
        </div>
        <form onSubmit={submitCoupon} className="mb-4 grid grid-cols-3 gap-2">
          <Input label="الكود (اختياري)" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} placeholder="يُولد تلقائياً" />
          <Input label="الخصم %" type="number" min={1} max={100} value={couponForm.discountPercent} onChange={(e) => setCouponForm({ ...couponForm, discountPercent: Number(e.target.value) })} />
          <Input label="مرات الاستخدام" type="number" min={1} value={couponForm.maxUses} onChange={(e) => setCouponForm({ ...couponForm, maxUses: Number(e.target.value) })} />
          <div className="col-span-3">
            <Button type="submit" disabled={saving} size="sm" icon={<Plus size={14} />}>
              إضافة كود
            </Button>
          </div>
        </form>
        <div className="flex flex-col gap-2">
          {coupons.length === 0 && <p className="text-sm text-text-muted">مفيش أكواد خصم.</p>}
          {coupons.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-md border border-border-soft px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="rounded bg-gold/15 px-2 py-0.5 font-mono text-xs font-bold text-gold" dir="ltr">
                  {c.code}
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-text-primary">
                  <Percent size={12} className="text-gold" />
                  {c.discountPercent}%
                </span>
              </div>
              <span className="text-[11px] text-text-muted">
                مستخدم {c.usedCount}/{c.maxUses}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <CreditCard size={17} className="text-gold" />
          <h2 className="text-lg font-bold text-text-primary">تفعيل اشتراك</h2>
        </div>
        <form onSubmit={submitActivate} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Select label="الطالب" value={actForm.studentId} onChange={(e) => setActForm({ ...actForm, studentId: e.target.value })}>
            <option value="">اختر الطالب</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.studentCode})
              </option>
            ))}
          </Select>
          <Select label="الباقة" value={actForm.planId} onChange={(e) => setActForm({ ...actForm, planId: e.target.value })}>
            <option value="">اختر الباقة</option>
            {plans
              .filter((p) => p.isActive)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.price} ج ({p.months} شهر)
                </option>
              ))}
          </Select>
          <Input label="كود الخصم (اختياري)" value={actForm.couponCode} onChange={(e) => setActForm({ ...actForm, couponCode: e.target.value })} />
          <div className="flex items-end">
            <Button type="submit" disabled={saving || plans.filter((p) => p.isActive).length === 0} icon={<BadgeCheck size={15} />}>
              تفعيل الاشتراك
            </Button>
          </div>
          {error && <p className="col-span-full text-xs font-semibold text-error">{error}</p>}
        </form>

        <div className="mt-5 flex flex-col gap-2 border-t border-border-soft pt-4">
          <h3 className="text-sm font-bold text-text-primary">آخر الاشتراكات</h3>
          {subs.length === 0 && <p className="text-sm text-text-muted">مفيش اشتراكات بعد.</p>}
          {subs.slice(0, 8).map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2 rounded-md border border-border-soft px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text-primary">{s.studentName}</p>
                <p className="text-[11px] text-text-muted">
                  {s.planName} · {s.amountPaid} ج {s.couponCode ? `· كود ${s.couponCode}` : ''}
                </p>
              </div>
              <div className="text-end">
                <p className="text-[11px] font-bold text-gold">حتى {formatDate(s.endsAt)}</p>
                <Badge variant={s.status === 'Active' ? 'success' : 'neutral'}>{s.status === 'Active' ? 'مفعل' : 'منتهي'}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <BadgeCheck size={17} className="text-gold" />
          <h2 className="text-lg font-bold text-text-primary">حسابات أولياء الأمور</h2>
        </div>
        <form
          className="grid grid-cols-1 gap-2 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            void (async () => {
              const fd = new FormData(e.currentTarget);
              setError(null);
              setSaving(true);
              try {
                const res = await api.post<{ parentId: number; username: string }>('/parents', {
                  fullName: fd.get('fullName'),
                  phone: fd.get('phone') || null,
                  password: fd.get('password'),
                  studentIds: null,
                });
                await api.post<boolean>(`/parents/${res.parentId}/students/${Number(fd.get('studentId'))}`);
                alert(`تم إنشاء حساب ولي الأمر\nاسم الدخول: ${res.username}`);
                e.currentTarget.reset();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'فشل الإنشاء');
              } finally {
                setSaving(false);
              }
            })();
          }}
        >
          <Input name="fullName" label="اسم ولي الأمر" required />
          <Input name="phone" label="رقم الهاتف" />
          <Input name="password" label="كلمة المرور" required />
          <Select name="studentId" label="الطالب" required>
            <option value="">اختر الطالب</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.studentCode})
              </option>
            ))}
          </Select>
          <div>
            <Button type="submit" disabled={saving} icon={<Plus size={15} />}>
              إنشاء الحساب
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default BillingPanel;
