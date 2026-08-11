import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileText,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Play,
  Plus,
  Trash2,
  Video,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { CompassLoader } from '../../design-system/components/CompassLoader';
import { Badge } from '../../design-system/ui/Badge';
import { Button } from '../../design-system/ui/Button';
import { Card } from '../../design-system/ui/Card';
import Input from '../../design-system/ui/Field';
import { Modal } from '../../design-system/ui/Modal';
import { Tabs } from '../../design-system/ui/Tabs';
import AiToolsPanel from './AiToolsPanel';
import { useToast } from '../../design-system/ui/Toast';
import { api } from '../../lib/api';
import type { AssignmentDto, CourseDto, ExamListItemDto, ExamType, LessonDto, Stage, Subject } from '../../lib/types';

const STAGES = [
  { key: 'PrepOne', ar: 'أولى إعدادي' },
  { key: 'PrepTwo', ar: 'تانية إعدادي' },
  { key: 'PrepThree', ar: 'تالتة إعدادي' },
  { key: 'SecOne', ar: 'أولى ثانوي' },
  { key: 'SecTwo', ar: 'تانية ثانوي' },
  { key: 'SecThree', ar: 'تالتة ثانوي' },
] as const;

const SUBJECTS = [
  { key: 'SocialStudies', ar: 'دراسات اجتماعية' },
  { key: 'History', ar: 'تاريخ' },
  { key: 'Geography', ar: 'جغرافيا' },
] as const;

const EXAM_TYPES = [
  { key: 'Practice', ar: 'تدريبي' },
  { key: 'Lesson', ar: 'درس' },
  { key: 'Unit', ar: 'وحدة' },
  { key: 'Final', ar: 'نهائي' },
] as const;

const TH = 'py-2 text-center font-medium';
const TD = 'py-2.5 text-center';

type QuestionForm = {
  text: string;
  type: 'SingleChoice' | 'TrueFalse';
  marks: number;
  options: string[];
  correctIndex: number;
};

function emptyQuestion(): QuestionForm {
  return { text: '', type: 'SingleChoice', marks: 1, options: ['', '', '', ''], correctIndex: 0 };
}

function CourseForm({ editing, onDone }: { editing: CourseDto | null; onDone: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState<{ title: string; description: string; subject: Subject; stage: Stage; order: number }>({
    title: editing?.title ?? '',
    description: editing?.description ?? '',
    subject: editing?.subject ?? 'SocialStudies',
    stage: editing?.stage ?? 'PrepOne',
    order: editing?.order ?? 0,
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast('اسم الكورس مطلوب', '', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/teacher-content/courses/${editing.id}`, { title: form.title, description: form.description, subject: form.subject, stage: form.stage, order: Number(form.order) || 0 });
        toast('تم التعديل', 'اتحدثت بيانات الكورس', 'success');
      } else {
        await api.post<number>('/teacher-content/courses', { title: form.title, description: form.description, subject: form.subject, stage: form.stage, order: Number(form.order) || 0 });
        toast('تم إنشاء الكورس', 'ظاهر دلوقتي للطلبة', 'success');
      }
      onDone();
    } catch (err) {
      toast('فشل الحفظ', err instanceof Error ? err.message : 'خطأ', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Input label="اسم الكورس" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: الدراسات الاجتماعية - أولى إعدادي" />
      </div>
      <div className="sm:col-span-2">
        <Input label="الوصف" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="وصف مختصر للكورس" />
      </div>
      <div>
        <label className="mb-1.5 block text-center text-xs font-semibold text-text-secondary">المادة</label>
        <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value as Subject })} className="w-full rounded-md border border-border-soft bg-surface px-3 py-2.5 text-center text-sm text-text-primary outline-none focus:border-gold/60">
          {SUBJECTS.map((s) => (
            <option key={s.key} value={s.key}>{s.ar}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-center text-xs font-semibold text-text-secondary">المرحلة</label>
        <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value as Stage })} className="w-full rounded-md border border-border-soft bg-surface px-3 py-2.5 text-center text-sm text-text-primary outline-none focus:border-gold/60">
          {STAGES.map((s) => (
            <option key={s.key} value={s.key}>{s.ar}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <Input label="الترتيب" type="number" value={String(form.order)} onChange={(e) => setForm({ ...form, order: Number(e.target.value) || 0 })} />
      </div>
      <div className="flex justify-end gap-3 sm:col-span-2">
        <Button type="submit" variant="gold" loading={saving}>{editing ? 'حفظ التعديلات' : 'أنشئ الكورس'}</Button>
      </div>
    </form>
  );
}

function LessonForm({ courseId, editing, onDone }: { courseId: number; editing: LessonDto | null; onDone: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: editing?.title ?? '',
    summary: editing?.summary ?? '',
    contentType: editing?.contentType ?? 'lesson',
    videoUrl: editing?.videoUrl ?? '',
    durationMinutes: editing?.durationMinutes ?? 40,
    order: editing?.order ?? 0,
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/teacher-content/lessons/${editing.id}`, { ...form, durationMinutes: Number(form.durationMinutes) || 40, order: Number(form.order) || 0 });
        toast('تم التعديل', '', 'success');
      } else {
        await api.post<number>(`/teacher-content/courses/${courseId}/lessons`, { ...form, durationMinutes: Number(form.durationMinutes) || 40, order: Number(form.order) || 0 });
        toast('تمت الإضافة', '', 'success');
      }
      onDone();
    } catch (err) {
      toast('فشل الحفظ', err instanceof Error ? err.message : 'خطأ', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Input label="العنوان" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: الدرس الأول: مفهوم التاريخ" />
      </div>
      <div className="sm:col-span-2">
        <Input label="ملخص مختصر" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="سطر واحد يلخص الدرس" />
      </div>
      <div>
        <label className="mb-1.5 block text-center text-xs font-semibold text-text-secondary">النوع</label>
        <select value={form.contentType} onChange={(e) => setForm({ ...form, contentType: e.target.value })} className="w-full rounded-md border border-border-soft bg-surface px-3 py-2.5 text-center text-sm text-text-primary outline-none focus:border-gold/60">
          <option value="lesson">درس نصي</option>
          <option value="video">فيديو</option>
        </select>
      </div>
      <div>
        <Input label="المدة (دقيقة)" type="number" value={String(form.durationMinutes)} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) || 0 })} />
      </div>
      {form.contentType === 'video' && (
        <div className="sm:col-span-2">
          <Input
            label="لينك الفيديو"
            dir="ltr"
            required={form.contentType === 'video'}
            value={form.videoUrl}
            onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
            placeholder="https://youtube.com/watch?v=... أو رابط مباشر mp4"
          />
        </div>
      )}
      <div className="sm:col-span-2">
        <Input label="الترتيب" type="number" value={String(form.order)} onChange={(e) => setForm({ ...form, order: Number(e.target.value) || 0 })} />
      </div>
      <div className="flex justify-end gap-3 sm:col-span-2">
        <Button type="submit" variant="gold" loading={saving}>{editing ? 'حفظ التعديلات' : 'أضف'}</Button>
      </div>
    </form>
  );
}

function ExamForm({ courseId, editing, onDone }: { courseId: number; editing: ExamListItemDto | null; onDone: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState<{ title: string; type: ExamType; durationMinutes: number; attemptsAllowed: number; isPublished: boolean }>({
    title: editing?.title ?? '',
    type: editing?.type ?? 'Lesson',
    durationMinutes: editing?.durationMinutes ?? 10,
    attemptsAllowed: 3,
    isPublished: editing ? editing.isPublished : true,
  });
  const [questions, setQuestions] = useState<QuestionForm[]>([emptyQuestion()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      api
        .get<{ questions: { text: string; type: 'SingleChoice' | 'TrueFalse'; marks: number; options: { text: string }[] }[] }>(`/exams/${editing.id}`)
        .then((d) =>
          setQuestions(
            d.questions.map((q) => ({
              text: q.text,
              type: q.type,
              marks: q.marks,
              options: q.type === 'TrueFalse' ? ['صواب', 'خطأ'] : q.options.map((o) => o.text),
              correctIndex: 0,
            })),
          ),
        )
        .catch(() => setQuestions([emptyQuestion()]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  function setQ(i: number, patch: Partial<QuestionForm>) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast('اسم الاختبار مطلوب', '', 'error');
      return;
    }
    const clean = questions
      .filter((q) => q.text.trim())
      .map((q) => ({
        text: q.text.trim(),
        type: q.type,
        marks: Number(q.marks) > 0 ? Number(q.marks) : 1,
        options: q.type === 'TrueFalse' ? ['صواب', 'خطأ'] : q.options,
        correctIndex: q.type === 'TrueFalse' ? q.correctIndex : q.correctIndex,
      }));
    if (clean.length === 0) {
      toast('الاختبار لازم فيه سؤال واحد على الأقل', '', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, durationMinutes: Number(form.durationMinutes) || 10, attemptsAllowed: Number(form.attemptsAllowed) || 3, questions: clean };
      if (editing) {
        await api.put(`/teacher-content/exams/${editing.id}`, payload);
        toast('تم التعديل', '', 'success');
      } else {
        await api.post<number>(`/teacher-content/courses/${courseId}/exams`, payload);
        toast('تم إنشاء الاختبار', '', 'success');
      }
      onDone();
    } catch (err) {
      toast('فشل الحفظ', err instanceof Error ? err.message : 'خطأ', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Input label="اسم الاختبار" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: اختبار الوحدة الأولى" />
      </div>
      <div>
        <label className="mb-1.5 block text-center text-xs font-semibold text-text-secondary">النوع</label>
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ExamType })} className="w-full rounded-md border border-border-soft bg-surface px-3 py-2.5 text-center text-sm text-text-primary outline-none focus:border-gold/60">
          {EXAM_TYPES.map((t) => (
            <option key={t.key} value={t.key}>{t.ar}</option>
          ))}
        </select>
      </div>
      <div>
        <Input label="المدة (دقيقة)" type="number" value={String(form.durationMinutes)} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) || 0 })} />
      </div>
      <div>
        <Input label="عدد المحاولات المسموحة" type="number" value={String(form.attemptsAllowed)} onChange={(e) => setForm({ ...form, attemptsAllowed: Number(e.target.value) || 0 })} />
      </div>
      <div className="flex items-end pb-1">
        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-text-secondary">
          <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="h-4 w-4 accent-gold" />
          منشور (يظهر للطلبة)
        </label>
      </div>

      <div className="flex flex-col gap-4 sm:col-span-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-primary">الأسئلة ({questions.length})</h3>
          <button
            type="button"
            onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])}
            className="flex items-center gap-1.5 rounded-md border border-gold/40 bg-gold/5 px-3 py-1.5 text-xs font-semibold text-gold transition-colors hover:bg-gold/10"
          >
            <Plus size={13} /> سؤال جديد
          </button>
        </div>
        {questions.map((q, i) => (
          <div key={i} className="rounded-md border border-border-soft p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input label={`سؤال ${i + 1}`} value={q.text} onChange={(e) => setQ(i, { text: e.target.value })} placeholder="نص السؤال" />
              </div>
              <div>
                <label className="mb-1.5 block text-center text-xs font-semibold text-text-secondary">النوع</label>
                <select
                  value={q.type}
                  onChange={(e) => setQ(i, { type: e.target.value as QuestionForm['type'], correctIndex: 0 })}
                  className="w-full rounded-md border border-border-soft bg-surface px-3 py-2.5 text-center text-sm text-text-primary outline-none focus:border-gold/60"
                >
                  <option value="SingleChoice">اختيار من متعدد</option>
                  <option value="TrueFalse">صح / خطأ</option>
                </select>
              </div>
              <div>
                <Input label="الدرجة" type="number" value={String(q.marks)} onChange={(e) => setQ(i, { marks: Number(e.target.value) || 0 })} />
              </div>
              {q.type === 'SingleChoice' ? (
                <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
                  {q.options.map((opt, oi) => (
                    <label key={oi} className="flex cursor-pointer items-center gap-2 rounded-md border border-border-soft px-3 py-2">
                      <input type="radio" name={`correct-${i}`} checked={q.correctIndex === oi} onChange={() => setQ(i, { correctIndex: oi })} className="h-3.5 w-3.5 accent-gold" />
                      <input
                        value={opt}
                        onChange={(e) => setQ(i, { options: q.options.map((o, x) => (x === oi ? e.target.value : o)) })}
                        placeholder={`اختيار ${oi + 1}`}
                        className="w-full bg-transparent text-sm text-text-primary outline-none"
                      />
                    </label>
                  ))}
                  <p className="col-span-2 text-[10px] text-text-muted">الاختيار المحدد بنقطة هو الإجابة الصحيحة.</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 sm:col-span-2">
                  <span className="text-xs text-text-muted">الإجابة الصحيحة:</span>
                  {['صواب', 'خطأ'].map((label, oi) => (
                    <label key={label} className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-text-secondary">
                      <input type="radio" name={`tf-${i}`} checked={q.correctIndex === oi} onChange={() => setQ(i, { correctIndex: oi })} className="h-3.5 w-3.5 accent-gold" />
                      {label}
                    </label>
                  ))}
                </div>
              )}
            </div>
            {questions.length > 1 && (
              <button
                type="button"
                onClick={() => setQuestions((qs) => qs.filter((_, idx) => idx !== i))}
                className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-error hover:underline"
              >
                <Trash2 size={12} /> احذف السؤال
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3 sm:col-span-2">
        <Button type="submit" variant="gold" loading={saving}>{editing ? 'حفظ التعديلات' : 'أنشئ الاختبار'}</Button>
      </div>
    </form>
  );
}

function AssignmentForm({ courseId, editing, onDone }: { courseId: number; editing: AssignmentDto | null; onDone: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: editing?.title ?? '',
    description: editing?.description ?? '',
    dueDate: editing?.dueDate ? editing.dueDate.slice(0, 10) : '',
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast('عنوان الواجب مطلوب', '', 'error');
      return;
    }
    setSaving(true);
    try {
      const dueDate = form.dueDate ? new Date(form.dueDate).toISOString() : null;
      if (editing) {
        await api.put(`/teacher-content/assignments/${editing.id}`, { title: form.title, description: form.description, dueDate });
        toast('تم التعديل', '', 'success');
      } else {
        await api.post<number>(`/teacher-content/courses/${courseId}/assignments`, { title: form.title, description: form.description, dueDate });
        toast('تمت الإضافة', '', 'success');
      }
      onDone();
    } catch (err) {
      toast('فشل الحفظ', err instanceof Error ? err.message : 'خطأ', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Input label="عنوان الواجب" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: واجب الوحدة الأولى" />
      </div>
      <div className="sm:col-span-2">
        <Input label="وصف الواجب" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="المطلوب من الطالب يعمله" />
      </div>
      <div className="sm:col-span-2">
        <Input label="آخر موعد (اختياري)" type="date" dir="ltr" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
      </div>
      <div className="flex justify-end gap-3 sm:col-span-2">
        <Button type="submit" variant="gold" loading={saving}>{editing ? 'حفظ التعديلات' : 'أضف الواجب'}</Button>
      </div>
    </form>
  );
}

function CourseSection({ course, onChanged }: { course: CourseDto; onChanged: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<'lessons' | 'exams' | 'assignments'>('lessons');
  const [lessons, setLessons] = useState<LessonDto[]>([]);
  const [exams, setExams] = useState<ExamListItemDto[]>([]);
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [lessonModal, setLessonModal] = useState<'none' | 'create' | LessonDto>('none');
  const [examModal, setExamModal] = useState<'none' | 'create' | ExamListItemDto>('none');
  const [assignmentModal, setAssignmentModal] = useState<'none' | 'create' | AssignmentDto>('none');
  const [courseModal, setCourseModal] = useState<false | CourseDto>(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  function load() {
    setLoading(true);
    Promise.all([
      api.get<LessonDto[]>(`/courses/${course.id}/lessons`),
      api.get<ExamListItemDto[]>(`/exams/course/${course.id}?includeUnpublished=true`),
      api.get<AssignmentDto[]>(`/courses/${course.id}/assignments`),
    ])
      .then(([l, e, a]) => {
        setLessons(l);
        setExams(e);
        setAssignments(a);
      })
      .catch(() => toast('فشل تحميل المحتوى', '', 'error'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function remove(kind: string, id: number, label: string) {
    if (!window.confirm(`حذف ${label}؟`)) return;
    setBusyId(id);
    try {
      await api.del(`/teacher-content/${kind}/${id}`);
      toast('تم الحذف', '', 'success');
      load();
      onChanged();
    } catch (err) {
      toast('فشل الحذف', err instanceof Error ? err.message : 'خطأ', 'error');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-lg border border-border-soft bg-surface">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-bold text-text-primary">{course.title}</p>
            <Badge variant={course.subject === 'History' ? 'gold' : course.subject === 'Geography' ? 'success' : 'warning'}>{course.subjectAr}</Badge>
            <span className="text-[10px] text-text-muted">{course.stageAr}</span>
          </div>
          <p className="mt-0.5 text-[11px] text-text-muted">
            {lessons.length} درس · {exams.length} اختبار · {assignments.length} واجب
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button onClick={() => setCourseModal(course)} title="تعديل الكورس" className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-gold/10 hover:text-gold">
            <Pencil size={15} />
          </button>
          <button
            onClick={() => {
              if (window.confirm(`حذف الكورس "${course.title}" وكل محتواه؟`)) remove('courses', course.id, 'الكورس');
            }}
            disabled={busyId === course.id}
            title="حذف الكورس"
            className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-error/10 hover:text-error disabled:opacity-40"
          >
            {busyId === course.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
          </button>
          <button onClick={() => setOpen((o) => !o)} title={open ? 'إغلاق' : 'إدارة المحتوى'} className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-gold/10 hover:text-gold">
            {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border-soft p-4">
          <Tabs
            active={section}
            onChange={(k) => setSection(k as typeof section)}
            items={[
              { key: 'lessons', label: 'الدروس والفيديوهات', icon: <Video size={14} /> },
              { key: 'exams', label: 'الامتحانات', icon: <FileText size={14} /> },
              { key: 'assignments', label: 'الواجبات', icon: <ClipboardList size={14} /> },
            ]}
          />

          {loading ? (
            <div className="py-8"><CompassLoader text="بنجيب المحتوى..." /></div>
          ) : (
            <div className="mt-4">
              {section === 'lessons' && (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-end">
                    <button onClick={() => setLessonModal('create')} className="flex items-center gap-1.5 rounded-md bg-gold px-3 py-1.5 text-xs font-bold text-navy-deep transition-opacity hover:opacity-90">
                      <Plus size={13} /> أضف درس/فيديو
                    </button>
                  </div>
                  {lessons.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border-soft py-6 text-center text-sm text-text-muted">مفيش دروس — أضف أول درس.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] text-sm">
                        <thead>
                          <tr className="border-b border-border-soft text-[11px] text-text-muted">
                            <th className={TH}>#</th>
                            <th className={TH}>العنوان</th>
                            <th className={TH}>النوع</th>
                            <th className={TH}>المدة</th>
                            <th className={TH}>التحكم</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lessons.map((l) => (
                            <tr key={l.id} className="border-b border-border-soft/60 last:border-0">
                              <td className={`${TD} text-text-muted`}>{l.order}</td>
                              <td className={`${TD} font-semibold text-text-primary`}>{l.title}</td>
                              <td className={TD}>
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${l.contentType === 'video' ? 'bg-gold/10 text-gold' : 'bg-border-soft text-text-secondary'}`}>
                                  {l.contentType === 'video' ? <Play size={10} /> : <ImageIcon size={10} />}
                                  {l.contentType === 'video' ? 'فيديو' : 'درس'}
                                </span>
                              </td>
                              <td className={`${TD} text-text-secondary`}>{l.durationMinutes} د</td>
                              <td className={TD}>
                                <div className="flex items-center justify-center gap-1.5">
                                  <button onClick={() => setLessonModal(l)} title="تعديل" className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-gold/10 hover:text-gold">
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    onClick={() => remove('lessons', l.id, `"${l.title}"`)}
                                    disabled={busyId === l.id}
                                    title="حذف"
                                    className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-error/10 hover:text-error disabled:opacity-40"
                                  >
                                    {busyId === l.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {section === 'exams' && (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-end">
                    <button onClick={() => setExamModal('create')} className="flex items-center gap-1.5 rounded-md bg-gold px-3 py-1.5 text-xs font-bold text-navy-deep transition-opacity hover:opacity-90">
                      <Plus size={13} /> أضف اختبار
                    </button>
                  </div>
                  {exams.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border-soft py-6 text-center text-sm text-text-muted">مفيش امتحانات — أضف أول اختبار.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] text-sm">
                        <thead>
                          <tr className="border-b border-border-soft text-[11px] text-text-muted">
                            <th className={TH}>الاختبار</th>
                            <th className={TH}>النوع</th>
                            <th className={TH}>أسئلة</th>
                            <th className={TH}>الدرجات</th>
                            <th className={TH}>الحالة</th>
                            <th className={TH}>التحكم</th>
                          </tr>
                        </thead>
                        <tbody>
                          {exams.map((e) => (
                            <tr key={e.id} className="border-b border-border-soft/60 last:border-0">
                              <td className={`${TD} font-semibold text-text-primary`}>{e.title}</td>
                              <td className={`${TD} text-text-secondary`}>{e.typeAr}</td>
                              <td className={`${TD} text-text-secondary`}>{e.questionCount}</td>
                              <td className={`${TD} text-text-secondary`}>{e.totalMarks}</td>
                              <td className={TD}>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${e.isPublished ? 'bg-success/10 text-success' : 'bg-border-soft text-text-secondary'}`}>
                                  {e.isPublished ? 'منشور' : 'مسودة'}
                                </span>
                              </td>
                              <td className={TD}>
                                <div className="flex items-center justify-center gap-1.5">
                                  <button onClick={() => setExamModal(e)} title="تعديل" className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-gold/10 hover:text-gold">
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    onClick={() => remove('exams', e.id, `"${e.title}"`)}
                                    disabled={busyId === e.id}
                                    title="حذف"
                                    className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-error/10 hover:text-error disabled:opacity-40"
                                  >
                                    {busyId === e.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {section === 'assignments' && (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-end">
                    <button onClick={() => setAssignmentModal('create')} className="flex items-center gap-1.5 rounded-md bg-gold px-3 py-1.5 text-xs font-bold text-navy-deep transition-opacity hover:opacity-90">
                      <Plus size={13} /> أضف واجب
                    </button>
                  </div>
                  {assignments.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border-soft py-6 text-center text-sm text-text-muted">مفيش واجبات — أضف أول واجب.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[560px] text-sm">
                        <thead>
                          <tr className="border-b border-border-soft text-[11px] text-text-muted">
                            <th className={TH}>الواجب</th>
                            <th className={TH}>آخر موعد</th>
                            <th className={TH}>التحكم</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assignments.map((a) => (
                            <tr key={a.id} className="border-b border-border-soft/60 last:border-0">
                              <td className={`${TD} font-semibold text-text-primary`}>
                                {a.title}
                                {a.description && <p className="mt-0.5 text-[10px] text-text-muted">{a.description}</p>}
                              </td>
                              <td className={`${TD} text-text-secondary`}>{a.dueDate ? new Date(a.dueDate).toLocaleDateString('ar-EG') : '—'}</td>
                              <td className={TD}>
                                <div className="flex items-center justify-center gap-1.5">
                                  <button onClick={() => setAssignmentModal(a)} title="تعديل" className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-gold/10 hover:text-gold">
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    onClick={() => remove('assignments', a.id, `"${a.title}"`)}
                                    disabled={busyId === a.id}
                                    title="حذف"
                                    className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-error/10 hover:text-error disabled:opacity-40"
                                  >
                                    {busyId === a.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Modal open={courseModal !== false} onClose={() => setCourseModal(false)} title={courseModal ? `تعديل — ${courseModal.title}` : ''}>
        {courseModal && <CourseForm editing={courseModal} onDone={() => { setCourseModal(false); onChanged(); }} />}
      </Modal>

      <Modal open={lessonModal !== 'none'} onClose={() => setLessonModal('none')} title={lessonModal === 'create' ? 'أضف درس/فيديو' : `تعديل — ${typeof lessonModal === 'object' ? lessonModal.title : ''}`}>
        {lessonModal !== 'none' && <LessonForm courseId={course.id} editing={lessonModal === 'create' ? null : lessonModal} onDone={() => { setLessonModal('none'); load(); }} />}
      </Modal>

      <Modal open={examModal !== 'none'} onClose={() => setExamModal('none')} title={examModal === 'create' ? 'أضف اختبار' : `تعديل — ${typeof examModal === 'object' ? examModal.title : ''}`}>
        {examModal !== 'none' && <ExamForm courseId={course.id} editing={examModal === 'create' ? null : examModal} onDone={() => { setExamModal('none'); load(); }} />}
      </Modal>

      <Modal open={assignmentModal !== 'none'} onClose={() => setAssignmentModal('none')} title={assignmentModal === 'create' ? 'أضف واجب' : `تعديل — ${typeof assignmentModal === 'object' ? assignmentModal.title : ''}`}>
        {assignmentModal !== 'none' && <AssignmentForm courseId={course.id} editing={assignmentModal === 'create' ? null : assignmentModal} onDone={() => { setAssignmentModal('none'); load(); }} />}
      </Modal>
    </div>
  );
}

export default function ContentTab() {
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  function load() {
    api
      .get<CourseDto[]>('/courses')
      .then(setCourses)
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-text-primary">إدارة المحتوى التعليمي</h2>
          <p className="text-xs text-text-muted">الكورسات والدروس والفيديوهات والامتحانات والواجبات — كل حاجة بقت في إيدك.</p>
        </div>
        <Button variant="gold" icon={<Plus size={15} />} onClick={() => setShowCreate(true)}>
          كورس جديد
        </Button>
      </div>

      <AiToolsPanel courses={courses} onContentChanged={load} />

      {loading ? (
        <CompassLoader text="بنجيب الكورسات..." />
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border-soft py-12 text-center">
          <BookOpen size={28} className="text-text-muted" />
          <p className="text-sm text-text-muted">مفيش كورسات — أنشئ أول كورس من الزرار فوق.</p>
          <Button variant="gold" icon={<Plus size={15} />} onClick={() => setShowCreate(true)}>
            أنشئ كورس
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {courses.map((c) => (
            <CourseSection key={c.id} course={c} onChanged={load} />
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="كورس جديد">
        <CourseForm editing={null} onDone={() => { setShowCreate(false); load(); }} />
      </Modal>
    </div>
  );
}
