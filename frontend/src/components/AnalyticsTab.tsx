import { BarChart3, BookOpen, CheckCircle2, FileText, GraduationCap, Search, Users, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CompassLoader } from '../design-system/components/CompassLoader';
import { Card } from '../design-system/ui/Card';
import { api } from '../lib/api';
import type { AnalyticsOverviewDto, StudyGroupDetailDto, StudyGroupListItemDto, StudyGroupMemberDto } from '../lib/types';
import StudentDetail from './StudentDetail';

const TH = 'py-2 text-center font-medium';
const TD = 'py-2.5 text-center';

const STAGES = [
  { key: 'PrepOne', ar: 'أولى إعدادي' },
  { key: 'PrepTwo', ar: 'تانية إعدادي' },
  { key: 'PrepThree', ar: 'تالتة إعدادي' },
  { key: 'SecOne', ar: 'أولى ثانوي' },
  { key: 'SecTwo', ar: 'تانية ثانوي' },
  { key: 'SecThree', ar: 'تالتة ثانوي' },
] as const;

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border-soft bg-surface p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-text-muted">{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-bold text-text-primary">{value}</p>
      <p className="mt-0.5 text-[11px] text-text-muted">{label}</p>
    </div>
  );
}

function fmt(n: number): string {
  return `${Number(n).toFixed(1)}%`;
}

function PassBadge({ rate }: { rate: number }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${rate >= 50 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
      {rate >= 50 ? <CheckCircle2 size={10} /> : <XCircle size={10} />} {fmt(rate)}
    </span>
  );
}

export default function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsOverviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedStage, setSelectedStage] = useState('');
  const [groups, setGroups] = useState<StudyGroupListItemDto[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [groupDetail, setGroupDetail] = useState<StudyGroupDetailDto | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [groupBusy, setGroupBusy] = useState(false);

  useEffect(() => {
    api
      .get<AnalyticsOverviewDto>('/analytics/overview')
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'فشل تحميل التحليلات'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSelectedGroupId('');
    setGroupDetail(null);
    setSelected(null);
    if (!selectedStage) {
      setGroups([]);
      return;
    }
    api
      .get<StudyGroupListItemDto[]>(`/study-groups?stage=${selectedStage}`)
      .then((res) => setGroups(Array.isArray(res) ? res : []))
      .catch(() => setGroups([]));
  }, [selectedStage]);

  useEffect(() => {
    setGroupDetail(null);
    setSelected(null);
    if (!selectedGroupId) return;
    setGroupBusy(true);
    api
      .get<StudyGroupDetailDto>(`/study-groups/${selectedGroupId}`)
      .then(setGroupDetail)
      .catch(() => setGroupDetail(null))
      .finally(() => setGroupBusy(false));
  }, [selectedGroupId]);

  const members: StudyGroupMemberDto[] = (groupDetail?.members ?? []).filter((m) => {
    if (!memberSearch.trim()) return true;
    const q = memberSearch.trim().toLowerCase();
    return m.fullName.toLowerCase().includes(q) || m.studentCode.toLowerCase().includes(q) || m.stageAr.toLowerCase().includes(q);
  });

  if (loading) return <CompassLoader text="بنحلل النتائج..." />;
  if (error || !data)
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-md border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">{error}</p>
        {error && <p className="text-xs text-text-muted">لو لقيت خطأ authorization فتأكد إنك داخل بحساب معلم أو أمين.</p>}
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-7">
        <StatCard label="الطلاب" value={String(data.totalStudents)} icon={<Users size={15} />} />
        <StatCard label="الكورسات" value={String(data.totalCourses)} icon={<BookOpen size={15} />} />
        <StatCard label="الامتحانات" value={String(data.totalExams)} icon={<FileText size={15} />} />
        <StatCard label="المحاولات" value={String(data.totalAttempts)} icon={<GraduationCap size={15} />} />
        <StatCard label="المتوسط العام" value={fmt(data.overallAverage)} icon={<BarChart3 size={15} />} />
        <StatCard label="معدل النجاح" value={fmt(data.overallPassRate)} icon={<CheckCircle2 size={15} />} />
        <StatCard label="محاولات آخر أسبوع" value={String(data.attemptsLastWeek)} icon={<Users size={15} />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-bold text-text-primary">الأداء حسب المرحلة</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border-soft text-[11px] text-text-muted">
                  <th className={TH}>المرحلة</th>
                  <th className={TH}>طلاب</th>
                  <th className={TH}>محاولات</th>
                  <th className={TH}>المتوسط</th>
                  <th className={TH}>معدل النجاح</th>
                </tr>
              </thead>
              <tbody>
                {data.stages.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-text-muted">مفيش محاولات لسه — أول امتحان هيظهر هنا</td>
                  </tr>
                )}
                {data.stages.map((s) => (
                  <tr key={s.stage} className="border-b border-border-soft/60 last:border-0">
                    <td className={`${TD} font-semibold text-text-primary`}>{s.stageAr}</td>
                    <td className={`${TD} text-text-secondary`}>{s.studentCount}</td>
                    <td className={`${TD} text-text-secondary`}>{s.attemptCount}</td>
                    <td className={`${TD} font-bold text-gold`}>{fmt(s.avgPercentage)}</td>
                    <td className={TD}><PassBadge rate={s.passRate} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-bold text-text-primary">الأداء حسب الكورس</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border-soft text-[11px] text-text-muted">
                  <th className={TH}>الكورس</th>
                  <th className={TH}>امتحانات</th>
                  <th className={TH}>محاولات</th>
                  <th className={TH}>المتوسط</th>
                  <th className={TH}>معدل النجاح</th>
                </tr>
              </thead>
              <tbody>
                {data.courses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-text-muted">مفيش بيانات لسه</td>
                  </tr>
                )}
                {data.courses.map((c) => (
                  <tr key={c.courseId} className="border-b border-border-soft/60 last:border-0">
                    <td className={`${TD} font-semibold text-text-primary`}>{c.title}</td>
                    <td className={`${TD} text-text-secondary`}>{c.examCount}</td>
                    <td className={`${TD} text-text-secondary`}>{c.attemptCount}</td>
                    <td className={`${TD} font-bold text-gold`}>{fmt(c.avgPercentage)}</td>
                    <td className={TD}><PassBadge rate={c.passRate} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-bold text-text-primary">أقوى الامتحانات أداءً</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border-soft text-[11px] text-text-muted">
                <th className={TH}>الامتحان</th>
                <th className={TH}>محاولات</th>
                <th className={TH}>المتوسط</th>
                <th className={TH}>الأفضل</th>
                <th className={TH}>معدل النجاح</th>
              </tr>
            </thead>
            <tbody>
              {data.exams.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-text-muted">مفيش محاولات لسه</td>
                </tr>
              )}
              {data.exams.map((e) => (
                <tr key={e.examId} className="border-b border-border-soft/60 last:border-0">
                  <td className={`${TD} font-semibold text-text-primary`}>{e.title}</td>
                  <td className={`${TD} text-text-secondary`}>{e.attemptCount}</td>
                  <td className={`${TD} text-text-secondary`}>{fmt(e.avgPercentage)}</td>
                  <td className={`${TD} font-bold text-gold`}>{fmt(e.bestPercentage)}</td>
                  <td className={TD}><PassBadge rate={e.passRate} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-text-primary">ملف طالب بالتفصيل</h2>
            <p className="mt-0.5 text-xs text-text-muted">اختار المرحلة والمجموعة، وبعدين دوّر على الطالب بالاسم أو شوف كل طلاب المجموعة.</p>
          </div>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-text-secondary">المرحلة</span>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full rounded-md border border-border-soft bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-gold/60"
            >
              <option value="">اختار المرحلة...</option>
              {STAGES.map((s) => (
                <option key={s.key} value={s.key}>{s.ar}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-text-secondary">المجموعة</span>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              disabled={!selectedStage}
              className="w-full rounded-md border border-border-soft bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-gold/60 disabled:opacity-40"
            >
              <option value="">اختار المجموعة...</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name} ({g.memberCount} طالب)</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-text-secondary">بحث بالاسم</span>
            <div className="relative">
              <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                disabled={!groupDetail}
                placeholder="اكتب اسم الطالب..."
                className="w-full rounded-md border border-border-soft bg-surface py-2.5 ps-10 pe-3 text-sm text-text-primary outline-none focus:border-gold/60 disabled:opacity-40"
              />
            </div>
          </label>
        </div>

        {groupBusy ? (
          <CompassLoader text="بنجيب طلاب المجموعة..." />
        ) : selectedStage && selectedGroupId && groupDetail && members.length > 0 ? (
          <div className="max-h-72 overflow-y-auto rounded-md border border-border-soft">
            {members.map((m) => (
              <button
                key={m.studentId}
                onClick={() => setSelected(m.studentId)}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors border-b border-border-soft/60 last:border-0 ${selected === m.studentId ? 'bg-gold/10 font-semibold text-gold' : 'text-text-secondary hover:bg-surface-sunken hover:text-text-primary'}`}
              >
                <span className="font-semibold">{m.fullName}</span>
                <span className="font-plex text-xs text-text-muted" dir="ltr">{m.studentCode}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-border-soft py-8 text-center text-sm text-text-muted">
            {!selectedStage
              ? 'اختار المرحلة الأول عشان تظهر المجموعات.'
              : !selectedGroupId
                ? groups.length > 0
                  ? 'اختار المجموعة اللي فيها الطالب عشان تشوف أعضائها.'
                  : 'مفيش مجموعات للمرحلة دي — أنشئ مجموعة في «المجموعات والشعب» الأول.'
                : 'مفيش طلاب في المجموعة دي.'}
          </p>
        )}

        {selected !== null && groupDetail?.members.some((m) => m.studentId === selected) && (
          <div className="mt-5 border-t border-border-soft pt-5">
            <StudentDetail studentId={selected} />
          </div>
        )}
      </Card>
    </div>
  );
}
