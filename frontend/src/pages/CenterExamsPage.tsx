import { ArrowRight, ClipboardCheck, Loader2, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { CompassLoader } from '../design-system/components/CompassLoader';
import { Badge } from '../design-system/ui/Badge';
import { Button } from '../design-system/ui/Button';
import { Card } from '../design-system/ui/Card';
import { ErrorState } from '../design-system/ui/ErrorState';
import Input from '../design-system/ui/Field';
import { Modal } from '../design-system/ui/Modal';
import { useToast } from '../design-system/ui/Toast';
import { api } from '../lib/api';
import type { CenterExamDto, CenterExamResultRowDto, CourseDto } from '../lib/types';

interface ExamFormState {
  title: string;
  examDate: string;
  totalMarks: string;
  passMark: string;
  notes: string;
}

const emptyForm = (): ExamFormState => ({
  title: '',
  examDate: new Date().toISOString().slice(0, 10),
  totalMarks: '100',
  passMark: '50',
  notes: '',
});

function CenterExamFormModal({
  open,
  courseId,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  courseId: number;
  editing: CenterExamDto | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<ExamFormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        editing
          ? {
              title: editing.title,
              examDate: editing.examDate.slice(0, 10),
              totalMarks: String(editing.totalMarks),
              passMark: String(editing.passMark),
              notes: editing.notes ?? '',
            }
          : emptyForm(),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast('اسم الامتحان مطلوب', '', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        examDate: new Date(form.examDate).toISOString(),
        totalMarks: Number(form.totalMarks) || 0,
        passMark: Number(form.passMark) || 0,
        notes: form.notes || null,
      };
      if (editing) {
        await api.put(`/center-exams/${editing.id}`, payload);
        toast('تم التعديل', '', 'success');
      } else {
        await api.post<number>('/center-exams', { ...payload, courseId });
        toast('تمت الإضافة', '', 'success');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast('فشل الحفظ', err instanceof Error ? err.message : 'خطأ', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'تعديل امتحان السنتر' : 'إضافة امتحان سنتر'}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input label="اسم الامتحان" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: امتحان شهر أكتوبر" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="تاريخ الامتحان" type="date" dir="ltr" required value={form.examDate} onChange={(e) => setForm({ ...form, examDate: e.target.value })} />
          <Input label="الدرجة الكلية" type="number" dir="ltr" required value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="درجة النجاح" type="number" dir="ltr" required value={form.passMark} onChange={(e) => setForm({ ...form, passMark: e.target.value })} />
        </div>
        <Input label="ملاحظات (اختياري)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="أي تفاصيل عن الامتحان" />
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            إلغاء
          </Button>
          <Button type="submit" variant="gold" loading={saving}>
            {editing ? 'حفظ التعديلات' : 'أضف الامتحان'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function GradeSheetModal({
  exam,
  onClose,
  onSaved,
}: {
  exam: CenterExamDto;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [rows, setRows] = useState<CenterExamResultRowDto[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<Record<number, string>>({});
  const [absent, setAbsent] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<CenterExamResultRowDto[]>(`/center-exams/${exam.id}/results`)
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
  }, [exam.id, toast]);

  const filled = useMemo(
    () => (rows ?? []).filter((r) => absent[r.studentId] || scores[r.studentId]?.trim() !== '').length,
    [rows, scores, absent],
  );

  async function save() {
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
      onSaved();
      onClose();
    } catch (err) {
      toast('فشل الحفظ', err instanceof Error ? err.message : 'خطأ', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`درجات «${exam.title}»`} size="lg">
      <p className="mb-3 text-xs text-text-muted">
        {exam.courseTitle} · {new Date(exam.examDate).toLocaleDateString('ar-EG')} · من {exam.totalMarks} درجة · النجاح من {exam.passMark}
      </p>
      {loading ? (
        <div className="py-10 text-center text-sm text-text-muted">بنجيب الطلاب...</div>
      ) : !rows || rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-text-muted">مفيش طلاب نشطين في الوقت الحالي.</p>
      ) : (
        <div className="flex max-h-[60vh] flex-col gap-1.5 overflow-y-auto">
          {rows.map((r) => (
            <div key={r.studentId} className="flex items-center gap-3 rounded-md border border-border-soft/70 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-text-primary">{r.studentName}</p>
                <p className="text-[10px] text-text-muted">
                  {r.studentCode}{r.groupName ? ` · ${r.groupName}` : ''}
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
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border-soft pt-3">
        <p className="text-xs text-text-muted">سجّلت {filled} من {(rows ?? []).length} طالب</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            إغلاق
          </Button>
          <Button variant="gold" loading={saving} disabled={filled === 0} onClick={save}>
            حفظ الدرجات
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function CenterExamsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isSecretary = user?.role === 'Secretary';
  const backTo = isSecretary ? '/secretary' : '/teacher';

  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [courseId, setCourseId] = useState<number | ''>('');
  const [exams, setExams] = useState<CenterExamDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CenterExamDto | null>(null);
  const [gradeExam, setGradeExam] = useState<CenterExamDto | null>(null);

  function loadExams() {
    if (courseId === '') {
      setExams([]);
      return;
    }
    api
      .get<CenterExamDto[]>(`/center-exams?courseId=${courseId}`)
      .then(setExams)
      .catch((e) => toast('فشل تحميل الامتحانات', e instanceof Error ? e.message : 'خطأ', 'error'));
  }

  useEffect(() => {
    api
      .get<CourseDto[]>('/courses')
      .then((list) => {
        setCourses(list);
        if (list.length > 0) setCourseId(list[0].id);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'فشل تحميل المواد'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (courseId !== '') loadExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  async function remove(exam: CenterExamDto) {
    if (!window.confirm(`حذف امتحان «${exam.title}» وكل درجاته؟`)) return;
    setBusyId(`exam-${exam.id}`);
    try {
      await api.del(`/center-exams/${exam.id}`);
      toast('تم الحذف', '', 'success');
      loadExams();
    } catch (err) {
      toast('فشل الحذف', err instanceof Error ? err.message : 'خطأ', 'error');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <CompassLoader text="بنجيب المواد..." />;
  if (error) return <ErrorState title={error} onRetry={() => window.location.reload()} />;

  return (
    <div className={`${isSecretary ? '' : 'teacher-workspace'} flex flex-col gap-6 p-2 sm:p-4`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[.16em] text-gold">امتحانات السنتر</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="display-serif text-3xl font-extrabold text-text-primary">امتحانات السنتر</h1>
            <Badge variant="gold">ورقي</Badge>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-text-muted">
            سجل درجات الامتحانات الورقية اللي بتتعمل في السنتر — النتيجة بتظهر للطالب وبتوصل لولي الأمر واتساب.
          </p>
        </div>
        <Button variant="ghost" icon={<ArrowRight size={15} />} onClick={() => navigate(backTo)}>
          رجوع
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[220px] flex-1 sm:max-w-xs">
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full rounded-md border border-border-soft bg-surface px-3 py-2.5 text-center text-sm text-text-primary outline-none focus:border-gold/60"
          >
            <option value="" disabled>
              اختر المادة
            </option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} — {c.stageAr}
              </option>
            ))}
          </select>
        </div>
        <Button variant="gold" size="sm" icon={<Plus size={15} />} disabled={courseId === ''} onClick={() => { setEditing(null); setFormOpen(true); }}>
          إضافة امتحان
        </Button>
      </div>

      {courseId === '' ? (
        <Card className="border-dashed">
          <p className="py-10 text-center text-sm text-text-muted">اختر مادة عشان تشوف امتحاناتها.</p>
        </Card>
      ) : exams.length === 0 ? (
        <Card className="border-dashed">
          <p className="py-10 text-center text-sm text-text-muted">مفيش امتحانات للسنتر في المادة دي — أضف أول امتحان.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {exams.map((exam) => (
            <div key={exam.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-soft bg-surface px-4 py-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-bold text-text-primary">{exam.title}</p>
                  <span className="rounded-full bg-border-soft px-2 py-0.5 text-[10px] font-bold text-text-secondary">
                    {new Date(exam.examDate).toLocaleDateString('ar-EG')}
                  </span>
                  {exam.resultsCount > 0 && (
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
                      متوسط {exam.averagePercentage}٪
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-text-muted">
                  {exam.courseTitle} · من {exam.totalMarks} درجة · النجاح من {exam.passMark} · {exam.resultsCount} طالب سُجلت درجته
                  {exam.notes ? ` · ${exam.notes}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button onClick={() => setGradeExam(exam)} title="سجل الدرجات" className="flex items-center gap-1.5 rounded-md bg-gold px-3 py-1.5 text-xs font-bold text-navy-deep transition-opacity hover:opacity-90">
                  <ClipboardCheck size={13} /> الدرجات
                </button>
                <button onClick={() => { setEditing(exam); setFormOpen(true); }} title="تعديل" className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-gold/10 hover:text-gold">
                  <Pencil size={15} />
                </button>
                <button onClick={() => remove(exam)} disabled={busyId === `exam-${exam.id}`} title="حذف" className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-error/10 hover:text-error disabled:opacity-40">
                  {busyId === `exam-${exam.id}` ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="flex items-center gap-1.5 text-[11px] text-text-muted">
        <Users size={13} /> عند حفظ الدرجات: النتيجة بتوصل لولي الأمر واتساب + إشعار للطالب داخل المنصة.
      </p>

      <CenterExamFormModal open={formOpen} courseId={courseId === '' ? 0 : courseId} editing={editing} onClose={() => setFormOpen(false)} onSaved={loadExams} />
      {gradeExam && <GradeSheetModal exam={gradeExam} onClose={() => setGradeExam(null)} onSaved={loadExams} />}
    </div>
  );
}