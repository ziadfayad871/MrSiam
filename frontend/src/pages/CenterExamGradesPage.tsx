import { ArrowRight, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { CompassLoader } from '../design-system/components/CompassLoader';
import { Badge } from '../design-system/ui/Badge';
import { Button } from '../design-system/ui/Button';
import { Card } from '../design-system/ui/Card';
import { ErrorState } from '../design-system/ui/ErrorState';
import { useToast } from '../design-system/ui/Toast';
import { api } from '../lib/api';
import type { CenterExamDto, CenterExamResultRowDto } from '../lib/types';

export default function CenterExamGradesPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isSecretary = user?.role === 'Secretary';
  const backTo = isSecretary ? '/secretary/center-exams' : '/teacher/center-exams';

  const [exam, setExam] = useState<CenterExamDto | null>(null);
  const [rows, setRows] = useState<CenterExamResultRowDto[] | null>(null);
  const [scores, setScores] = useState<Record<number, string>>({});
  const [absent, setAbsent] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!examId) return;
    api
      .get<CenterExamDto>(`/center-exams/${examId}`)
      .then(setExam)
      .catch((e) => setError(e instanceof Error ? e.message : 'فشل تحميل الامتحان'));
  }, [examId]);

  useEffect(() => {
    if (!examId) return;
    api
      .get<CenterExamResultRowDto[]>(`/center-exams/${examId}/results`)
      .then((list) => {
        setRows(list);
        const s: Record<number, string> = {};
        const a: Record<number, boolean> = {};
        for (const r of list) {
          s[r.studentId] = r.score != null ? String(r.score) : '';
          a[r.studentId] = r.isAbsent;
        }
        setScores(s);
        setAbsent(a);
      })
      .catch((e) => toast('فشل تحميل الطلاب', e instanceof Error ? e.message : 'خطأ', 'error'))
      .finally(() => setLoading(false));
  }, [examId, toast]);

  const filled = useMemo(
    () => (rows ?? []).filter((r) => absent[r.studentId] || scores[r.studentId]?.trim() !== '').length,
    [rows, scores, absent],
  );

  async function save() {
    if (!exam) return;
    const items = (rows ?? [])
      .filter((r) => absent[r.studentId] || scores[r.studentId]?.trim() !== '')
      .map((r) => ({
        studentId: r.studentId,
        score: absent[r.studentId] ? 0 : Number(scores[r.studentId]) || 0,
        isAbsent: absent[r.studentId],
        notes: null,
      }));
    if (items.length === 0) {
      toast('سجّل درجة طالب واحد على الأقل', '', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/center-exams/${exam.id}/results`, { centerExamId: exam.id, items });
      toast('تم حفظ الدرجات', '', 'success');
      navigate(backTo);
    } catch (err) {
      toast('فشل الحفظ', err instanceof Error ? err.message : 'خطأ', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <CompassLoader text="بنجيب الكشف..." />;
  if (error) return <ErrorState title={error} onRetry={() => window.location.reload()} />;
  if (!exam) return null;

  return (
    <div className={`${isSecretary ? '' : 'teacher-workspace'} flex min-h-screen flex-col gap-6 p-2 sm:p-4`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[.16em] text-gold">امتحانات السنتر</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="display-serif text-2xl font-extrabold text-text-primary">{exam.title}</h1>
            <Badge variant="gold">درجات الطلاب</Badge>
          </div>
          <p className="mt-2 text-sm text-text-muted">
            {exam.courseTitle} · {new Date(exam.examDate).toLocaleDateString('ar-EG')} · من {exam.totalMarks} درجة · النجاح من {exam.passMark}
          </p>
        </div>
        <Button variant="ghost" icon={<ArrowRight size={15} />} onClick={() => navigate(backTo)}>
          رجوع
        </Button>
      </header>

      <Card className="p-4">
        {!rows || rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-text-muted">مفيش طلاب نشطين في الوقت الحالي.</p>
        ) : (
          <div className="flex max-h-[65vh] flex-col gap-1.5 overflow-y-auto">
            {rows.map((r) => (
              <div key={r.studentId} className="flex items-center gap-3 rounded-md border border-border-soft/70 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-text-primary">{r.studentName}</p>
                  <p className="text-[10px] text-text-muted">
                    {r.studentCode}
                    {r.groupName ? ` · ${r.groupName}` : ''}
                  </p>
                </div>
                <label className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-text-secondary">
                  <input type="checkbox" checked={!!absent[r.studentId]} onChange={(e) => setAbsent({ ...absent, [r.studentId]: e.target.checked })} className="h-4 w-4 accent-error" />
                  غياب
                </label>
                <input
                  type="number"
                  dir="ltr"
                  min={0}
                  max={exam.totalMarks}
                  disabled={!!absent[r.studentId]}
                  value={absent[r.studentId] ? '' : (scores[r.studentId] ?? '')}
                  onChange={(e) => setScores({ ...scores, [r.studentId]: e.target.value })}
                  placeholder="الدرجة"
                  className="w-24 shrink-0 rounded-md border border-border-soft bg-surface px-2 py-1.5 text-center text-sm text-text-primary outline-none focus:border-gold/60 disabled:opacity-40"
                />
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border-soft pt-3">
          <p className="flex items-center gap-1.5 text-xs text-text-muted">
            <Users size={13} /> سجّلت {filled} من {(rows ?? []).length} طالب — عند الحفظ: النتيجة أو الغياب يوصلوا ولي الأمر واتساب.
          </p>
          <Button variant="gold" loading={saving} disabled={filled === 0} onClick={save}>
            حفظ الدرجات
          </Button>
        </div>
      </Card>
    </div>
  );
}