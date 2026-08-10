import { ArrowLeft, BookOpen, Map, Star, Target, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AchievementBadge } from '../../design-system/components/AchievementBadge';
import { Compass as CompassBrand } from '../../design-system/components/Compass';
import { CompassLoader } from '../../design-system/components/CompassLoader';
import CoordinateLabel from '../../design-system/components/CoordinateLabel';
import { RouteProgress } from '../../design-system/components/RouteProgress';
import { Card } from '../../design-system/ui/Card';
import { ErrorState } from '../../design-system/ui/ErrorState';
import { Progress } from '../../design-system/ui/Progress';
import { Stat } from '../../design-system/ui/Stat';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import type { StudentDashboardDto } from '../../lib/types';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<StudentDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<StudentDashboardDto>('/dashboard/student')
      .then((d) => setData(d))
      .catch((e) => setError(e instanceof Error ? e.message : 'فشل تحميل اللوحة'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CompassLoader text="بنرسم خريطتك التعليمية..." />;
  if (error || !data) return <ErrorState title={error ?? 'مفيش بيانات'} onRetry={() => window.location.reload()} />;

  const current = data.currentDestination;
  const currentStage = data.journey.find((j) => j.status === 'current' || j.status === 'in-progress') ?? data.journey[0];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Greeting */}
      <div className="relative overflow-hidden rounded-lg border border-gold/20 bg-parchment-soft p-6 shadow-soft">
        <CoordinateLabel
          latitude={{ degrees: 31, minutes: 15, hemisphere: 'N' }}
          longitude={{ degrees: 32, minutes: 18, hemisphere: 'E' }}
          ambient
          className="absolute bottom-4 end-4 hidden opacity-60 sm:inline-flex"
        />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-gold">محطتك الحالية: {data.student.stageAr}</p>
            <h1 className="display-serif mt-1 text-2xl font-bold text-text-primary">
              أهلاً يا {data.student.fullName} 👋
            </h1>
            <p className="mt-1 text-xs text-text-muted" dir="ltr">
              {data.student.studentCode} · {data.student.academicYear}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CompassBrand size="medium" animated />
            <div className="text-center">
              <p className="text-2xl font-bold text-gold">{data.stats.rank}</p>
              <p className="text-[10px] text-text-muted">من {data.stats.totalStudents} طالب</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat icon={<BookOpen size={16} />} label="امتحانات خضتها" value={String(data.stats.examsTaken)} />
        <Stat icon={<Trophy size={16} />} label="امتحانات ناجحة" value={String(data.stats.passedExams)} />
        <Stat icon={<Target size={16} />} label="المعدل العام" value={`${data.stats.average}%`} />
        <Stat icon={<Star size={16} />} label="ميداليات" value={String(data.stats.achievementsCount)} />
        <Stat
          icon={<Map size={16} />}
          label="محطات متفتحة"
          value={`${data.journey.filter((j) => j.status !== 'locked').length}/${data.journey.length}`}
        />
      </div>

      {/* Current destination */}
      <Card variant="map" className="relative overflow-hidden">
        <div className="absolute -end-10 -top-10 h-48 w-48 rounded-full bg-gold/10 blur-2xl" />
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
              <CompassBrand size="navigation" animated direction="ne" />
            </div>
            <div>
              <p className="font-plex text-[10px] uppercase tracking-[0.3em] text-gold" dir="ltr">
                Next Destination
              </p>
              <h2 className="mt-1 text-xl font-bold text-text-primary">{current.lessonTitle}</h2>
              <p className="mt-1 text-sm text-text-secondary">
                {current.courseTitle} · الدرس {current.lessonOrder} من {current.lessonCount}
              </p>
              <div className="mt-3 w-full max-w-xs">
                <Progress value={current.courseProgress} size="sm" />
              </div>
              <p className="mt-1 text-xs text-text-muted">إنجاز المادة: {current.courseProgress}%</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/exam/${current.courseId}`}
              className="rounded-md border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-bold text-gold transition-colors hover:bg-gold hover:text-navy-deep"
            >
              امتحان المادة
            </Link>
            <Link
              to="/courses"
              className="rounded-md border border-border-soft bg-surface px-4 py-2 text-xs font-bold text-text-primary transition-colors hover:border-gold/50"
            >
              كل المواد
            </Link>
          </div>
        </div>
      </Card>

      {/* Journey */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">خريطة رحلتك</h2>
            <p className="text-xs text-text-muted">مرحلتك: {currentStage?.title}</p>
          </div>
          <RouteProgress
            value={currentStage?.progress ?? 0}
            stops={data.journey.map((j, i) => ({
              position: (i / Math.max(data.journey.length - 1, 1)) * 100,
              label: j.title,
              state: j.status === 'completed' ? ('passed' as const) : j.status === 'current' ? ('current' as const) : ('locked' as const),
            }))}
          />
        </Card>

        {/* Leaderboard mini */}
        <Card>
          <h2 className="mb-4 text-lg font-bold text-text-primary">منصة التكريم</h2>
          <div className="flex flex-col gap-2.5">
            {data.leaderboard.slice(0, 5).map((l) => (
              <div
                key={l.studentId}
                className={`flex items-center gap-3 rounded-md border border-border-soft px-3 py-2 ${
                  l.studentId === data.student.id ? 'border-gold/50 bg-gold/5' : ''
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
        </Card>
      </div>

      {/* Achievements + upcoming */}
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
    </div>
  );
}
