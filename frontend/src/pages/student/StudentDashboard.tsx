import {
  ArrowLeft,
  Award,
  Bookmark,
  CalendarDays,
  Flame,
  Map,
  NotebookPen,
  Play,
  Radio,
  Shield,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AchievementBadge } from '../../design-system/components/AchievementBadge';
import { Compass as CompassBrand } from '../../design-system/components/Compass';
import { CompassLoader } from '../../design-system/components/CompassLoader';
import CoordinateLabel from '../../design-system/components/CoordinateLabel';
import { Badge } from '../../design-system/ui/Badge';
import { Card } from '../../design-system/ui/Card';
import { ErrorState } from '../../design-system/ui/ErrorState';
import { Progress } from '../../design-system/ui/Progress';
import { Stat } from '../../design-system/ui/Stat';
import { api } from '../../lib/api';
import type { LiveLessonDto, MySubscriptionDto, StudentDashboardV2Dto } from '../../lib/types';

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `من ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `من ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `من ${days} يوم`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ar-EG', { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
}

export default function StudentDashboard() {
  const [data, setData] = useState<StudentDashboardV2Dto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certs, setCerts] = useState<{ id: number }[]>([]);
  const [sub, setSub] = useState<MySubscriptionDto | null>(null);
  const [live, setLive] = useState<LiveLessonDto[] | null>(null);

  useEffect(() => {
    api
      .get<StudentDashboardV2Dto>('/student/dashboard')
      .then((d) => setData(d))
      .catch((e) => setError(e instanceof Error ? e.message : 'فشل تحميل اللوحة'))
      .finally(() => setLoading(false));
    api
      .get<{ id: number }[]>('/student/certificates')
      .then(setCerts)
      .catch(() => setCerts([]));
    api
      .get<MySubscriptionDto>('/subscriptions/mine')
      .then(setSub)
      .catch(() => setSub({ hasActiveSubscription: false }));
    api
      .get<LiveLessonDto[]>('/live/upcoming')
      .then(setLive)
      .catch(() => setLive([]));
  }, []);

  const markAllRead = async () => {
    await api.put('/student/notifications/read').catch(() => null);
    setData((d) => (d ? { ...d, notifications: d.notifications.map((n) => ({ ...n, isRead: true })) } : d));
  };

  if (loading) return <CompassLoader text="بنرسم خريطتك التعليمية..." />;
  if (error || !data) return <ErrorState title={error ?? 'مفيش بيانات'} onRetry={() => window.location.reload()} />;

  const { student, xp, streak, stats } = data;

  return (
    <div className="student-command-center platform-dashboard flex flex-col gap-5 p-2 sm:p-4">
      <div className="grid gap-5 xl:grid-cols-[.58fr_1.42fr]">
        <Card className="student-continue-card relative overflow-hidden">
          <div className="relative">
            <p className="text-lg font-extrabold text-text-primary">استكمال التعلم</p>
            {data.continueWatching ? (
              <>
                <p className="mt-4 text-sm font-bold text-gold">{data.continueWatching.courseTitle}</p>
                <p className="mt-1 truncate text-xs text-text-secondary">{data.continueWatching.lessonTitle}</p>
                <Progress value={data.continueWatching.percent} className="mt-5" />
                <div className="mt-2 flex justify-between text-xs"><span className="font-bold text-gold">{data.continueWatching.percent}%</span><span className="text-text-muted">{formatDuration(data.continueWatching.positionSeconds)}</span></div>
                <Link to={`/courses/${data.continueWatching.courseId}`} className="mt-5 flex items-center justify-center gap-2 rounded-lg border border-gold/45 px-3 py-2 text-xs font-bold text-gold transition hover:bg-gold/10"><Play size={15} /> متابعة الدرس</Link>
              </>
            ) : (
              <div className="mt-8 text-center"><Play className="mx-auto text-gold" size={30} /><p className="mt-3 text-sm text-text-muted">ابدأ أول درس في رحلتك</p><Link to="/courses" className="mt-4 inline-flex rounded-lg bg-gold px-4 py-2 text-xs font-bold text-navy-deep">تصفح الدروس</Link></div>
            )}
          </div>
        </Card>
        <div className="student-welcome relative min-h-[260px] overflow-hidden rounded-2xl border border-gold/35 shadow-[0_14px_44px_rgba(0,0,0,.2)]">
          <img src="/siam-student-dashboard.jpeg" alt="مستر محمد صيام" className="absolute inset-0 h-full w-full object-contain object-left" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,13,11,.18),rgba(8,13,11,.78)_73%,rgba(8,13,11,.94))]" />
          <div className="relative flex min-h-[260px] items-center justify-end p-7 text-right sm:p-10">
            <div className="max-w-md">
              <p className="text-xs font-bold tracking-[.16em] text-gold-bright">منصة القيصر التعليمية</p>
              <h1 className="display-serif mt-3 text-3xl font-extrabold text-white sm:text-4xl">مرحباً بك يا {student.fullName} 👋</h1>
              <p className="mt-3 text-sm leading-7 text-white/75">استمر في التعلّم، المستقبل يصنع الآن.</p>
              <div className="mt-5 flex flex-wrap justify-end gap-2"><span className="rounded-lg border border-gold/40 bg-navy-deep/55 px-3 py-2 text-xs font-bold text-gold-bright">{student.stageAr}</span><span className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-xs font-bold text-white/75">{xp.total} نقطة خبرة</span></div>
            </div>
          </div>
        </div>
      </div>
      {/* Hero: greeting + XP compass + streak + rank */}
      <div className="platform-dashboard-hero relative overflow-hidden rounded-2xl border border-gold/35 bg-parchment-soft p-6 shadow-soft">
        <CoordinateLabel
          latitude={{ degrees: 31, minutes: 15, hemisphere: 'N' }}
          longitude={{ degrees: 32, minutes: 18, hemisphere: 'E' }}
          ambient
          className="absolute bottom-4 end-4 hidden opacity-60 sm:inline-flex"
        />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-gold">محطتك الحالية: {student.stageAr}</p>
            <h1 className="display-serif mt-1 text-2xl font-bold text-text-primary">
              أهلاً يا {student.fullName} 👋
            </h1>
            <p className="mt-1 text-xs text-text-muted" dir="ltr">
              {student.studentCode} · {student.academicYear}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-md border border-orange-300/40 bg-orange-100/60 px-3 py-2" title="أيام التعلم المتتالية">
              <Flame size={18} className="text-orange-500" />
              <div className="text-center">
                <p className="text-xl font-black leading-none text-orange-600">{streak.current}</p>
                <p className="text-[9px] text-text-muted">يوم متتالي</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-gold/40 bg-gold/10 px-3 py-2">
              <Zap size={18} className="text-gold" />
              <div className="text-center">
                <p className="text-xl font-black leading-none text-gold">{xp.total}</p>
                <p className="text-[9px] text-text-muted">نقطة خبرة</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-border-soft bg-surface px-3 py-2">
              <CompassBrand size="small" animated />
              <div className="text-center">
                <p className="text-xl font-black leading-none text-text-primary">{stats.rank}</p>
                <p className="text-[9px] text-text-muted">من {stats.totalStudents} طالب</p>
              </div>
            </div>
          </div>
        </div>

        {/* Level progress */}
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-bold text-text-primary">المستوى {xp.level} — {xp.levelTitle}</span>
            <span className="text-text-muted">
              {xp.nextThreshold > 0 ? `${xp.nextThreshold - xp.total} نقطة للمستوى التالي (${xp.nextLevelTitle})` : 'وصلت لأعلى مستوى 🏛️'}
            </span>
          </div>
          <Progress value={xp.progressPercent} />
        </div>
      </div>

      {/* Quick stats */}
      <div className="platform-dashboard-stats grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Stat icon={<Bookmark size={16} />} label="كورسات مكتملة" value={`${data.completedCourses}/${data.totalCourses}`} />
        <Stat icon={<Trophy size={16} />} label="امتحانات ناجحة" value={`${stats.passedExams}/${stats.examsTaken}`} />
        <Stat icon={<Target size={16} />} label="المعدل العام" value={`${stats.average}%`} />
        <Stat icon={<Star size={16} />} label="ميداليات" value={String(stats.achievementsCount)} />
        <Link to="/mistakes" className="block">
          <Stat icon={<NotebookPen size={16} />} label="أخطاء في الكراسة" value={String(data.weakTopics.reduce((s, w) => s + w.wrongCount, 0))} className="border-gold/40" />
        </Link>
        <Link to="/passport" className="block">
          <Stat icon={<Map size={16} />} label="جواز السفر" value="افتح" className="border-gold/40" />
        </Link>
        <Link to="/certificates" className="block">
          <Stat icon={<Award size={16} />} label="شهاداتي" value={String(certs.length)} className="border-gold/40" />
        </Link>
      </div>

      {/* Continue watching + notifications */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card variant="map" className="relative overflow-hidden lg:col-span-2">
          <div className="absolute -end-10 -top-10 h-48 w-48 rounded-full bg-gold/10 blur-2xl" />
          <div className="relative">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-primary">أكمل من حيث وقفت ⏳</h2>
              <Link to="/courses" className="text-xs font-semibold text-gold hover:underline">
                كل المواد
              </Link>
            </div>
            {!data.continueWatching ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <Play size={28} className="text-gold" />
                <p className="text-sm text-text-muted">لسه مفيش فيديو قافل نصه — ابدأ درس جديد من المواد.</p>
                <Link to="/courses" className="rounded-md border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-bold text-gold transition-colors hover:bg-gold hover:text-navy-deep">
                  ابدأ الرحلة
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex h-24 w-40 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gold/30 bg-navy-deep/90">
                  <CompassBrand size="medium" animated />
                  <span className="absolute bottom-1 end-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white" dir="ltr">
                    {formatDuration(data.continueWatching.positionSeconds)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold text-gold">{data.continueWatching.courseTitle}</p>
                  <h3 className="mt-0.5 truncate text-base font-bold text-text-primary">{data.continueWatching.lessonTitle}</h3>
                  <div className="mt-2">
                    <Progress value={data.continueWatching.percent} size="sm" />
                  </div>
                  <p className="mt-1 text-xs text-text-muted">
                    وقفت عند {formatDuration(data.continueWatching.positionSeconds)} من {formatDuration(data.continueWatching.durationSeconds)} · {data.continueWatching.percent}%
                  </p>
                </div>
                <Link
                  to={`/courses/${data.continueWatching.courseId}`}
                  className="flex shrink-0 items-center gap-1.5 rounded-md bg-gold px-4 py-2 text-xs font-bold text-navy-deep transition-colors hover:bg-gold/90"
                >
                  <Play size={14} /> كمّل المشاهدة
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* Notifications */}
        <Card className="flex flex-col">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">الإشعارات</h2>
            {data.notifications.some((n) => !n.isRead) && (
              <button onClick={markAllRead} className="text-xs font-semibold text-gold hover:underline">
                حدد الكل كمقروء
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 260 }}>
            {data.notifications.length === 0 && <p className="py-6 text-center text-sm text-text-muted">مفيش إشعارات جديدة — كله هادي 😌</p>}
            {data.notifications.map((n) => (
              <div
                key={n.id}
                className={`rounded-md border px-3 py-2.5 ${n.isRead ? 'border-border-soft' : 'border-gold/50 bg-gold/5'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-bold ${n.isRead ? 'text-text-secondary' : 'text-text-primary'}`}>{n.title}</p>
                  <span className="shrink-0 text-[9px] text-text-muted">{timeAgo(n.createdAt)}</span>
                </div>
                <p className="mt-0.5 text-xs text-text-muted">{n.body}</p>
                {n.link && (
                  <Link to={n.link} className="mt-1 inline-block text-[11px] font-semibold text-gold hover:underline">
                    عرض →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Weak topics + recommended lessons */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">نقاط الضعف 🎯</h2>
            <Link to="/mistakes" className="text-xs font-semibold text-gold hover:underline">
              كراسة الأخطاء
            </Link>
          </div>
          {data.weakTopics.length === 0 ? (
            <p className="text-sm text-text-muted">مفيش نقاط ضعف — أنت نجم الأداء! ⭐</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {data.weakTopics.map((w) => (
                <div key={w.courseId} className="flex items-center gap-3 rounded-md border border-border-soft px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-text-primary">{w.title}</p>
                    <p className="text-[10px] text-text-muted">{w.subjectAr}</p>
                  </div>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">{w.wrongCount} أخطاء</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">دروس مقترحة ليك</h2>
            <Shield size={16} className="text-gold" />
          </div>
          {data.recommendedLessons.length === 0 ? (
            <p className="text-sm text-text-muted">دلوقتي تمام — خد امتحان في موادك المتاحة.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {data.recommendedLessons.map((l) => (
                <Link
                  key={l.lessonId}
                  to={`/courses/${l.courseId}`}
                  className="group flex items-center gap-3 rounded-md border border-border-soft px-3 py-2.5 transition-colors hover:border-gold/50 hover:bg-gold/5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-text-primary group-hover:text-gold">{l.lessonTitle}</p>
                    <p className="text-[10px] text-text-muted">{l.courseTitle} · الدرس {l.order}</p>
                  </div>
                  <ArrowLeft size={16} className="text-text-muted transition-transform group-hover:-translate-x-1 group-hover:text-gold" />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent results + upcoming exams */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">آخر نتائجك</h2>
            <Link to="/courses" className="text-xs font-semibold text-gold hover:underline">
              عرض الكل
            </Link>
          </div>
          {data.recentResults.length === 0 ? (
            <p className="text-sm text-text-muted">خد أول امتحان وهنا تظهر نتايجك!</p>
          ) : (
            <div className="flex flex-col gap-2">
              {data.recentResults.map((r) => (
                <Link
                  key={r.attemptId}
                  to={`/results/${r.attemptId}`}
                  className="flex items-center justify-between gap-2 rounded-md border border-border-soft px-3 py-2.5 transition-colors hover:border-gold/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-text-primary">{r.examTitle}</p>
                    <p className="text-[10px] text-text-muted">{r.submittedAt ? timeAgo(r.submittedAt) : ''}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${r.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {r.percentage}% {r.passed ? 'ناجح ✓' : 'راجع الأخطاء'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">امتحانات جاية في الطريق</h2>
            <Link to="/courses" className="text-xs font-semibold text-gold hover:underline">
              عرض الكل
            </Link>
          </div>
          {data.upcomingExams.length === 0 ? (
            <p className="text-sm text-text-muted">مفيش امتحانات جاية حالياً — استعد كويس!</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {data.upcomingExams.map((e) => (
                <Link
                  key={e.id}
                  to={`/exam/${e.id}`}
                  className="group flex items-center justify-between rounded-md border border-border-soft px-4 py-3 transition-colors hover:border-gold/50 hover:bg-gold/5"
                >
                  <div>
                    <p className="text-sm font-bold text-text-primary group-hover:text-gold">{e.title}</p>
                    <p className="text-[11px] text-text-muted">{e.courseTitle} · {e.questionCount} سؤال</p>
                  </div>
                  <ArrowLeft size={16} className="text-text-muted transition-transform group-hover:-translate-x-1 group-hover:text-gold" />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Achievements + leaderboard */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">ميدالياتك</h2>
            <Link to="/achievements" className="text-xs font-semibold text-gold hover:underline">
              كل الميداليات
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {data.recentAchievements.length === 0 && (
              <p className="text-sm text-text-muted">لسه مفيش ميداليات — خد أول امتحان!</p>
            )}
            {data.recentAchievements.map((a) => (
              <AchievementBadge key={a.id} title={a.title} icon={a.icon} unlocked />
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold text-text-primary">منصة التكريم</h2>
          <div className="flex flex-col gap-2.5">
            {data.leaderboard.slice(0, 5).map((l) => (
              <div
                key={l.studentId}
                className={`flex items-center gap-3 rounded-md border border-border-soft px-3 py-2 ${
                  l.studentId === student.id ? 'border-gold/50 bg-gold/5' : ''
                }`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${l.rank === 1 ? 'bg-gold text-navy-deep' : l.rank === 2 ? 'bg-[#c9ccd4] text-navy-deep' : l.rank === 3 ? 'bg-[#cd8a4b] text-navy-deep' : 'bg-border-soft text-text-muted'}`}>
                  {l.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">{l.fullName}</p>
                  <p className="text-[10px] text-text-muted">{l.stageAr}</p>
                </div>
                <span className="text-sm font-bold text-gold">{l.average}%</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-md border border-gold/30 bg-gold/5 px-4 py-3">
            <CompassBrand size="small" />
            <p className="text-xs text-text-secondary">
              اكسب نقاط خبرة من الامتحانات الناجحة والتعلم المتواصل — <span className="font-bold text-gold">مع أبو كيان.. الدراسات في أمان</span>
            </p>
          </div>
        </Card>
      </div>

      {/* Subscription + live lessons */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <Shield size={16} className="text-gold" />
            <h2 className="text-lg font-bold text-text-primary">اشتراكك</h2>
          </div>
          {sub === null ? (
            <p className="text-sm text-text-muted">جاري التحميل...</p>
          ) : sub.hasActiveSubscription ? (
            <div>
              <Badge variant="gold" icon={<Sparkles size={12} />}>
                {sub.planName} · مفعل
              </Badge>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Stat icon={<CalendarDays size={15} />} label="ينتهي في" value={sub.endsAt ? formatDate(sub.endsAt) : '—'} />
                <Stat icon={<Shield size={15} />} label="متبقي" value={`${sub.daysLeft} يوم`} />
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-text-muted">اشتراكك غير مفعل حالياً — تواصل مع الأمانة لتفعيل باقتك.</p>
              <div className="mt-3 rounded-md border border-border-soft bg-surface px-3 py-2.5 text-[11px] text-text-secondary">
                الباقات تشمل كل المقررات والامتحانات والجوائز 🏆
              </div>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio size={16} className="text-gold" />
              <h2 className="text-lg font-bold text-text-primary">البث المباشر</h2>
            </div>
            <Badge variant="gold" icon={<Sparkles size={12} />}>
              قاعة أبو كيان
            </Badge>
          </div>
          {live === null ? (
            <p className="text-sm text-text-muted">جاري التحميل...</p>
          ) : live.length === 0 ? (
            <p className="text-sm text-text-muted">مفيش بث مجدول حالياً — ارجع قريب!</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {live.map((l) => {
                const isLive = new Date(l.scheduledAt).getTime() <= Date.now() && Date.now() <= new Date(l.scheduledAt).getTime() + l.durationMinutes * 60000;
                return (
                  <div key={l.id} className="flex items-center justify-between gap-3 rounded-md border border-border-soft px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-text-primary">{l.title}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-text-muted">
                        <CalendarDays size={12} />
                        {formatDateTime(l.scheduledAt)} · {l.durationMinutes} دقيقة
                      </p>
                      {l.courseTitle && <p className="text-[10px] text-text-muted">{l.courseTitle}</p>}
                    </div>
                    {l.meetUrl ? (
                      <a
                        href={l.meetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                          isLive ? 'bg-red-100 text-red-700' : 'bg-gold/15 text-gold hover:bg-gold/25'
                        }`}
                      >
                        {isLive ? 'ادخل الآن 🔴' : 'رابط البث'}
                      </a>
                    ) : (
                      <Badge variant="neutral">{isLive ? 'البث جاري 🔴' : 'جاري التحضير'}</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
