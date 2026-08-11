import { BookOpen, CheckCircle2, Compass, FileText, GraduationCap, ImagePlus, Loader2, Trash2, Upload, Users, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CompassLoader } from '../../design-system/components/CompassLoader';
import { Podium } from '../../design-system/components/Podium';
import { Card } from '../../design-system/ui/Card';
import { ErrorState } from '../../design-system/ui/ErrorState';
import { Progress } from '../../design-system/ui/Progress';
import { Stat } from '../../design-system/ui/Stat';
import { api, resolveFileUrl } from '../../lib/api';
import type { TeacherDashboardDto, TopStudentDto } from '../../lib/types';

const STAGE_OPTIONS = [
  'الصف الأول الإعدادي',
  'الصف الثاني الإعدادي',
  'الصف الثالث الإعدادي',
  'الأول الثانوي',
  'الثاني الثانوي',
  'الثالث الثانوي',
];

const ICONS: Record<string, React.ReactNode> = {
  students: <Users size={16} />,
  courses: <BookOpen size={16} />,
  exams: <FileText size={16} />,
  attempts: <GraduationCap size={16} />,
  passRate: <CheckCircle2 size={16} />,
  achievements: <Compass size={16} />,
};

function StatCard({ label, value, unit, icon, trend }: { label: string; value: string; unit: string; icon: string; trend: number }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border-soft bg-surface p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-text-muted">{ICONS[icon]}</span>
        {trend !== 0 && (
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${trend > 0 ? 'bg-success/15 text-success' : 'bg-error/15 text-error'}`}>
            {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold text-text-primary">
        {value}
        {unit && <span className="ms-1 text-sm font-normal text-text-muted">{unit}</span>}
      </p>
      <p className="mt-0.5 text-[11px] text-text-muted">{label}</p>
    </div>
  );
}

export default function TeacherDashboard() {
  const [data, setData] = useState<TeacherDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [album, setAlbum] = useState<TopStudentDto[]>([]);
  const [form, setForm] = useState({ fullName: '', stageAr: STAGE_OPTIONS[5], achievement: '', score: '', year: '' });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadAlbum = () =>
    api
      .get<TopStudentDto[]>('/top-students')
      .then(setAlbum)
      .catch(() => setAlbum([]));

  useEffect(() => {
    api
      .get<TeacherDashboardDto>('/dashboard/teacher')
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'فشل تحميل اللوحة'))
      .finally(() => setLoading(false));
    loadAlbum();
  }, []);

  function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.fullName.trim() || !form.stageAr || !form.achievement.trim()) {
      setFormError('الاسم والمرحلة والإنجاز مطلوبون');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('fullName', form.fullName.trim());
      fd.append('stageAr', form.stageAr);
      fd.append('achievement', form.achievement.trim());
      if (form.score.trim()) fd.append('score', form.score.trim());
      if (form.year.trim()) fd.append('year', form.year.trim());
      if (photo) fd.append('photo', photo);

      await api.upload<number>('/top-students', fd);
      setForm({ fullName: '', stageAr: STAGE_OPTIONS[5], achievement: '', score: '', year: '' });
      setPhoto(null);
      setPhotoPreview(null);
      if (fileRef.current) fileRef.current.value = '';
      await loadAlbum();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'فشل الإضافة');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: number) {
    setDeletingId(id);
    try {
      await api.del<boolean>(`/top-students/${id}`);
      await loadAlbum();
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <CompassLoader text="بنرسم الخريطة العامة..." />;
  if (error || !data) return <ErrorState title={error ?? 'مفيش بيانات'} onRetry={() => window.location.reload()} />;

  const maxAttempts = Math.max(...data.performanceTrend.map((p) => p.attempts), 1);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="display-serif text-2xl font-bold text-text-primary">غرفة قيادة الرحلة</h1>
        <p className="mt-1 text-sm text-text-muted">ملخص أداء طلابك عبر المحطات — بمنظور مدرّس القافلة.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {data.stats.map((s) => (
          <StatCard
            key={s.key}
            label={s.label}
            value={s.value}
            unit={s.unit}
            icon={s.icon}
            trend={s.trend}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Trend */}
        <Card className="lg:col-span-2">
          <h2 className="mb-5 text-lg font-bold text-text-primary">منحنى الأداء الشهري</h2>
          <div className="flex h-48 items-end gap-2 sm:gap-4">
            {data.performanceTrend.map((p) => (
              <div key={p.period} className="group flex flex-1 flex-col items-center gap-2">
                <div className="relative flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-gold/30 to-gold transition-all duration-500 group-hover:from-gold/50"
                    style={{ height: `${Math.max((p.average / 100) * 100, 4)}%` }}
                    title={`متوسط ${p.average}%`}
                  />
                </div>
                <div className="flex w-full flex-col items-center gap-0.5">
                  <span className="font-plex text-[9px] text-gold" dir="ltr">
                    {p.average}%
                  </span>
                  <span className="text-[10px] text-text-muted">{p.period}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Podium */}
        <Card>
          <h2 className="mb-4 text-lg font-bold text-text-primary">أوائل الرحلة</h2>
          <Podium entries={data.podium.map((p) => ({ rank: p.rank, name: p.fullName, score: p.average, stage: p.stageAr }))} />
        </Card>
      </div>

      {/* Top students album — management */}
      <Card>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-text-primary">ألبوم الأوائل</h2>
            <p className="mt-0.5 text-xs text-text-muted">الصور دي بتظهر في صفحة الهوم — ضيف نجم جديد بالصورة والإنجاز.</p>
          </div>
          <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] font-bold text-gold">
            {album.length} عضو
          </span>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4 rounded-md border border-border-soft p-4 sm:grid-cols-2 lg:grid-cols-6">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-text-muted">اسم الطالب</span>
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="مثال: أحمد سمير"
              className="w-full rounded-md border border-border-soft bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-gold/60"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-text-muted">المرحلة</span>
            <select
              value={form.stageAr}
              onChange={(e) => setForm({ ...form, stageAr: e.target.value })}
              className="w-full rounded-md border border-border-soft bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-gold/60"
            >
              {STAGE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-text-muted">الإنجاز</span>
            <input
              value={form.achievement}
              onChange={(e) => setForm({ ...form, achievement: e.target.value })}
              placeholder="مثال: علامة كاملة"
              className="w-full rounded-md border border-border-soft bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-gold/60"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-text-muted">النسبة (اختياري)</span>
            <input
              value={form.score}
              onChange={(e) => setForm({ ...form, score: e.target.value })}
              placeholder="مثال: 98.4"
              inputMode="decimal"
              className="w-full rounded-md border border-border-soft bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-gold/60"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-text-muted">السنة (اختياري)</span>
            <input
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              placeholder="مثال: 2026"
              className="w-full rounded-md border border-border-soft bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-gold/60"
            />
          </label>

          <div className="flex flex-col justify-end gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-md border border-dashed border-gold/40 bg-gold/5 px-3 py-2 text-xs font-semibold text-gold transition-colors hover:bg-gold/10"
            >
              {photoPreview ? <span className="flex items-center gap-1.5"><Upload size={14} /> صورة مختارة</span> : <span className="flex items-center gap-1.5"><ImagePlus size={14} /> اختار صورة</span>}
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onPickPhoto} className="hidden" />
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-md bg-gold px-3 py-2 text-xs font-bold text-navy-deep transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {saving ? 'بيتضاف...' : 'ضيف للألبوم'}
            </button>
            {formError && <p className="text-[11px] font-semibold text-error">{formError}</p>}
          </div>
        </form>

        {photoPreview && (
          <div className="mt-4 flex items-center gap-3">
            <img src={photoPreview} alt="معاينة" className="h-16 w-16 rounded-full border-2 border-gold/50 object-cover" />
            <p className="text-xs text-text-muted">معاينة الصورة اللي هتظهر في الألبوم.</p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          {album.length === 0 && (
            <p className="w-full rounded-md border border-dashed border-border-soft px-4 py-6 text-center text-sm text-text-muted">
              الألبوم فاضي — أضف أول نجم واخلّيه يظهر في الصفحة الرئيسية.
            </p>
          )}
          {album.map((t) => (
            <div key={t.id} className="group flex items-center gap-3 rounded-md border border-border-soft px-3 py-2">
              {resolveFileUrl(t.photoUrl) ? (
                <img src={resolveFileUrl(t.photoUrl)} alt={t.fullName} className="h-11 w-11 rounded-full border border-gold/30 object-cover" />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
                  <Users size={16} className="text-gold" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-text-primary">{t.fullName}</p>
                <p className="truncate text-[10px] text-text-muted">{t.stageAr}{t.year ? ` · ${t.year}` : ''}</p>
              </div>
              {t.score != null && <span className="text-sm font-bold text-gold">{Number(t.score).toFixed(1)}%</span>}
              <button
                onClick={() => onDelete(t.id)}
                disabled={deletingId === t.id}
                aria-label={`حذف ${t.fullName}`}
                className="ms-1 rounded-full p-1.5 text-text-muted transition-colors hover:bg-error/10 hover:text-error disabled:opacity-40"
              >
                {deletingId === t.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Course performance */}
        <Card className="lg:col-span-2">
          <h2 className="mb-5 text-lg font-bold text-text-primary">أداء المواد</h2>
          <div className="flex flex-col gap-4">
            {data.coursePerformance.map((c) => (
              <div key={c.courseId} className="rounded-md border border-border-soft p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-text-primary">{c.title}</p>
                    <p className="text-[10px] text-text-muted">{c.studentsCount} طالب · {c.attempts} محاولة</p>
                  </div>
                  <span className="text-sm font-bold text-gold">{c.average}%</span>
                </div>
                <Progress value={c.successRate} />
                <p className="mt-1 text-[10px] text-text-muted">معدل نجاح {c.successRate}%</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent attempts */}
        <Card>
          <h2 className="mb-4 text-lg font-bold text-text-primary">آخر المحاولات</h2>
          <div className="flex flex-col gap-2">
            {data.recentAttempts.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-md border border-border-soft px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text-primary">{a.studentName}</p>
                  <p className="truncate text-[10px] text-text-muted">{a.examTitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  {a.passed ? <CheckCircle2 size={15} className="text-success" /> : <XCircle size={15} className="text-error" />}
                  <span className="text-xs font-bold text-text-primary">{a.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
          <Link to="/courses" className="mt-4 block text-center text-xs font-semibold text-gold hover:underline">
            إدارة الامتحانات والمواد
          </Link>
        </Card>
      </div>
    </div>
  );
}
