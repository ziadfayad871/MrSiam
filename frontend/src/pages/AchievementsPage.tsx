import { useEffect, useState } from 'react';
import { CompassLoader } from '../design-system/components/CompassLoader';
import { HistoricalSectionHeader } from '../design-system/components/HistoricalSectionHeader';
import { AchievementBadge } from '../design-system/components/AchievementBadge';
import { Card } from '../design-system/ui/Card';
import { EmptyState } from '../design-system/ui/EmptyState';
import { ErrorState } from '../design-system/ui/ErrorState';
import { Progress } from '../design-system/ui/Progress';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { AchievementDto, StudentDashboardDto } from '../lib/types';

export default function AchievementsPage() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<AchievementDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let studentId: number | undefined;
        if (user?.role === 'Student') {
          const dash = await api.get<StudentDashboardDto>('/dashboard/student');
          studentId = dash.student.id;
        }
        if (!studentId) {
          setError('قسم الميداليات متاح للطلاب فقط');
          return;
        }
        const list = await api.get<AchievementDto[]>(`/students/${studentId}/achievements`);
        if (!cancelled) setAchievements(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'فشل تحميل الميداليات');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  if (loading) return <CompassLoader text="بنجمع ميدالياتك..." />;
  if (error) return <ErrorState title={error} onRetry={() => window.location.reload()} />;

  const unlocked = achievements.filter((a) => a.isUnlocked);
  const locked = achievements.filter((a) => !a.isUnlocked);
  const percent = achievements.length > 0 ? Math.round((unlocked.length / achievements.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <HistoricalSectionHeader
        number="الميداليات"
        title="خريطة الاكتشافات"
        subtitle="ACHIEVEMENTS"
        align="center"
      >
        كل محطة بتكسب بيها ميدالية — جمّعها كلها وخلّي خريطتك مليانة ذهب.
      </HistoricalSectionHeader>

      <Card className="mt-10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-lg font-bold text-text-primary">
              فتحت {unlocked.length} من {achievements.length} ميدالية
            </p>
            <p className="mt-1 text-xs text-text-muted">كل ميدالية بتتحط على خريطتك جنب محطتك</p>
          </div>
          <div className="w-44">
            <Progress value={percent} />
          </div>
        </div>
      </Card>

      {achievements.length === 0 ? (
        <EmptyState icon="trophy" title="مفيش ميداليات" description="شكله لسه مفيش ميداليات متاحة — رجّع بعد ما تحل أول امتحان." className="mt-16" />
      ) : (
        <>
          {unlocked.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-5 text-lg font-bold text-text-primary">المفتوحة في خريطتك</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {unlocked.map((a) => (
                  <AchievementBadge
                    key={a.id}
                    title={a.title}
                    description={a.description}
                    icon={a.icon}
                    unlocked
                    unlockedAt={a.unlockedAt}
                    className="h-full"
                  />
                ))}
              </div>
            </div>
          )}

          {locked.length > 0 && (
            <div className="mt-12">
              <h2 className="mb-5 text-lg font-bold text-text-primary">لسه في الطريق</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {locked.map((a) => (
                  <AchievementBadge
                    key={a.id}
                    title={a.title}
                    description={a.description}
                    icon={a.icon}
                    unlocked={false}
                    className="h-full"
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
