import {
  Award,
  BookOpenCheck,
  CalendarDays,
  ClipboardCheck,
  FileCheck2,
  GraduationCap,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { CompassLoader } from '../../design-system/components/CompassLoader';
import { Badge } from '../../design-system/ui/Badge';
import { Card } from '../../design-system/ui/Card';
import { EmptyState } from '../../design-system/ui/EmptyState';
import { ErrorState } from '../../design-system/ui/ErrorState';
import { Progress } from '../../design-system/ui/Progress';
import { Stat } from '../../design-system/ui/Stat';
import { api } from '../../lib/api';
import type { ParentDashboardDto } from '../../lib/types';

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ParentDashboardPage() {
  const [data, setData] = useState<ParentDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ParentDashboardDto>('/parents/dashboard')
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'فشل تحميل اللوحة'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CompassLoader text="بنرسم خريطة تقدم أبنائك..." />;
  if (error || !data) return <ErrorState title={error ?? 'مفيش بيانات'} onRetry={() => window.location.reload()} />;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="relative overflow-hidden rounded-lg border border-gold/20 bg-parchment-soft p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-gold">لوحة المتابعة</p>
            <h1 className="display-serif mt-1 text-2xl font-bold text-text-primary">
              أهلاً أستاذ(ة) {data.parentName} 👋
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-text-muted">
              <Phone size={13} />
              {data.phone || 'رقم غير مسجل'}
            </p>
          </div>
          <Badge variant="gold" icon={<ShieldCheck size={12} />}>
            ولي أمر
          </Badge>
        </div>
      </div>

      {data.children.length === 0 ? (
        <EmptyState icon="compass" title="مفيش أبناء مرتبطين" description="تواصل مع الأمانة لربط أبنائك بحسابك" />
      ) : (
        data.children.map((child) => {
          const lessonsPct = child.lessonsTotal > 0 ? Math.round((child.lessonsCompleted / child.lessonsTotal) * 100) : 0;
          return (
            <Card key={child.studentId} className="overflow-hidden border-gold/20 bg-parchment-soft">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-soft px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-gradient-to-br from-primary-light to-primary-dark font-bold text-gold-bright">
                    {child.fullName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="display-serif text-lg font-bold text-text-primary">{child.fullName}</h2>
                    <p className="text-[11px] text-text-muted" dir="ltr">
                      {child.studentCode} · {child.academicYear} · {child.stageAr}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {child.hasActiveSubscription ? (
                    <Badge variant="gold" icon={<Sparkles size={12} />}>
                      {child.subscriptionPlan ?? 'اشتراك'} حتى {formatDate(child.subscriptionEndsAt)}
                    </Badge>
                  ) : (
                    <Badge variant="error">اشتراك منتهي</Badge>
                  )}
                  <Badge variant="success" icon={<Zap size={12} />}>
                    مستوى {child.level} · {child.xpTotal} XP
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
                <Stat
                  icon={<BookOpenCheck size={16} />}
                  label="دروس"
                  value={`${child.lessonsCompleted}/${child.lessonsTotal}`}
                  hint={`${lessonsPct}% مكتمل`}
                />
                <Stat icon={<ClipboardCheck size={16} />} label="امتحانات" value={String(child.examsTaken)} hint={`${child.examsPassed} ناجح`} />
                <Stat
                  icon={<GraduationCap size={16} />}
                  label="نسبة النجاح"
                  value={`${child.passRate}%`}
                  hint={`متوسط ${child.averagePercentage}%`}
                />
                <Stat
                  icon={<CalendarDays size={16} />}
                  label="الحضور"
                  value={`${child.attendancePresent}`}
                  hint={`غايب ${child.attendanceAbsent}`}
                />
              </div>

              <div className="px-5 pb-5">
                <div className="mb-1.5 flex items-center justify-between text-[11px] text-text-muted">
                  <span>إنجاز الدروس</span>
                  <span>{lessonsPct}%</span>
                </div>
                <Progress value={lessonsPct} size="sm" />

                {child.lastExamTitle && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-border-soft bg-surface px-4 py-3 text-sm">
                    <span className="flex items-center gap-2 text-text-secondary">
                      <FileCheck2 size={15} className="text-gold" />
                      آخر امتحان: <span className="font-semibold text-text-primary">{child.lastExamTitle}</span>
                    </span>
                    <span className="flex items-center gap-2 text-text-secondary">
                      <Award size={15} className="text-gold" />
                      <span className="font-bold text-text-primary">{child.lastExamPercentage}%</span>
                      <span className="text-[11px] text-text-muted">{formatDate(child.lastExamAt)}</span>
                    </span>
                  </div>
                )}
              </div>
            </Card>
          );
        })
      )}

      <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-text-muted">
        <UserRound size={13} className="text-gold" />
        المنصة تُحدَّث لحظياً من أداء الطالب على المنصة
      </div>
    </div>
  );
}
