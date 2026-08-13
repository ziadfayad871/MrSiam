import {
  ArrowRight,
  ClipboardList,
  FileText,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Play,
  Plus,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CompassLoader } from '../../design-system/components/CompassLoader';
import { Badge } from '../../design-system/ui/Badge';
import { Button } from '../../design-system/ui/Button';
import { ErrorState } from '../../design-system/ui/ErrorState';
import { useToast } from '../../design-system/ui/Toast';
import { api } from '../../lib/api';
import type { AssignmentDto, CourseDto, ExamListItemDto, LessonDto } from '../../lib/types';

const TH = 'py-2 text-center font-medium';
const TD = 'py-2.5 text-center';

type Row =
  | { kind: 'lesson'; item: LessonDto }
  | { kind: 'exam'; item: ExamListItemDto }
  | { kind: 'assignment'; item: AssignmentDto };

function TypeBadge({ kind, contentType }: { kind: Row['kind']; contentType?: string }) {
  if (kind === 'lesson') {
    const isVideo = contentType === 'video';
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${isVideo ? 'bg-gold/10 text-gold' : 'bg-border-soft text-text-secondary'}`}>
        {isVideo ? <Play size={10} /> : <ImageIcon size={10} />}
        {isVideo ? 'فيديو' : 'درس'}
      </span>
    );
  }
  if (kind === 'exam') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
        <FileText size={10} /> اختبار
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-bold text-warning">
      <ClipboardList size={10} /> واجب
    </span>
  );
}

export default function TeacherCourseDetailPage() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const back = () => navigate('/teacher/content');
  const { toast } = useToast();

  const [course, setCourse] = useState<CourseDto | null>(null);
  const [lessons, setLessons] = useState<LessonDto[]>([]);
  const [exams, setExams] = useState<ExamListItemDto[]>([]);
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function loadContent() {
    if (!course) return;
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
      .catch(() => toast('فشل تحميل المحتوى', '', 'error'));
  }

  useEffect(() => {
    let cancelled = false;
    api
      .get<CourseDto[]>('/courses')
      .then((list) => {
        if (cancelled) return;
        const found = list.find((c) => String(c.id) === courseId);
        if (found) {
          setCourse(found);
        } else {
          setError('مش لاقيين الكورس ده — اتأكد إنه لسه موجود.');
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'فشل تحميل الكورس'))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  useEffect(() => {
    if (course) loadContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course]);

  async function remove(kind: string, id: number, label: string) {
    if (!window.confirm(`حذف ${label}؟`)) return;
    setBusyId(`${kind}-${id}`);
    try {
      await api.del(`/teacher-content/${kind}/${id}`);
      toast('تم الحذف', '', 'success');
      if (kind === 'courses') {
        back();
      } else {
        loadContent();
      }
    } catch (err) {
      toast('فشل الحذف', err instanceof Error ? err.message : 'خطأ', 'error');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <CompassLoader text="بنجيب بيانات الكورس..." />;
  if (error || !course) return <ErrorState title={error ?? 'مش لاقيين الكورس'} onRetry={back} />;

  const rows: Row[] = [
    ...lessons.map((item) => ({ kind: 'lesson' as const, item })),
    ...exams.map((item) => ({ kind: 'exam' as const, item })),
    ...assignments.map((item) => ({ kind: 'assignment' as const, item })),
  ];

  return (
    <div className="teacher-workspace flex flex-col gap-6 p-2 sm:p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[.16em] text-gold">إدارة المنصة</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="display-serif text-3xl font-extrabold text-text-primary">{course.title}</h1>
            <Badge variant={course.subject === 'History' ? 'gold' : course.subject === 'Geography' ? 'success' : 'warning'}>{course.subjectAr}</Badge>
            <span className="text-xs text-text-muted">{course.stageAr}</span>
          </div>
          {course.description && <p className="mt-2 max-w-2xl text-sm text-text-muted">{course.description}</p>}
          <p className="mt-1.5 text-[11px] text-text-muted">
            {lessons.length} درس · {exams.length} اختبار · {assignments.length} واجب
          </p>
        </div>
        <Button variant="ghost" icon={<ArrowRight size={15} />} onClick={back}>
          رجوع للمحتوى
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="gold" size="sm" icon={<Plus size={15} />} onClick={() => navigate(`/teacher/content/courses/${course.id}/lessons/new`)}>
          أضف درس/فيديو
        </Button>
        <Button variant="gold" size="sm" icon={<Plus size={15} />} onClick={() => navigate(`/teacher/content/courses/${course.id}/exams/new`)}>
          أضف اختبار
        </Button>
        <Button variant="gold" size="sm" icon={<Plus size={15} />} onClick={() => navigate(`/teacher/content/courses/${course.id}/assignments/new`)}>
          أضف واجب
        </Button>
        <span className="mx-1 hidden h-5 w-px bg-border-soft sm:block" />
        <Button variant="outline" size="sm" icon={<Pencil size={14} />} onClick={() => navigate(`/teacher/content/courses/${course.id}/edit`)}>
          تعديل الكورس
        </Button>
        <Button variant="danger" size="sm" icon={<Trash2 size={14} />} loading={busyId === `courses-${course.id}`} onClick={() => remove('courses', course.id, `الكورس "${course.title}" وكل محتواه`)}>
          حذف الكورس
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border-soft bg-surface">
        <div className="border-b border-border-soft px-4 py-3">
          <h2 className="text-sm font-bold text-text-primary">محتوى الكورس</h2>
          <p className="text-[11px] text-text-muted">جدول واحد بكل الدروس والفيديوهات والاختبارات والواجبات.</p>
        </div>

        {rows.length === 0 ? (
          <p className="rounded-md border border-dashed border-border-soft py-10 text-center text-sm text-text-muted">
            مفيش محتوى في الكورس ده — ابدأ بإضافة أول درس أو اختبار أو واجب من الزراير فوق.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border-soft text-[11px] text-text-muted">
                  <th className={TH}>النوع</th>
                  <th className={TH}>العنوان</th>
                  <th className={TH}>التفاصيل</th>
                  <th className={TH}>التحكم</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const key = `${row.kind}-${row.item.id}`;
                  if (row.kind === 'lesson') {
                    return (
                      <tr key={key} className="border-b border-border-soft/60 last:border-0">
                        <td className={TD}><TypeBadge kind="lesson" contentType={row.item.contentType} /></td>
                        <td className={`${TD} font-semibold text-text-primary`}>{row.item.title}</td>
                        <td className={`${TD} text-text-secondary`}>{row.item.durationMinutes} د · ترتيب {row.item.order}</td>
                        <td className={TD}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => navigate(`/teacher/content/courses/${course.id}/lessons/${row.item.id}/edit`)} title="تعديل" className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-gold/10 hover:text-gold">
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => remove('lessons', row.item.id, `"${row.item.title}"`)}
                              disabled={busyId === key}
                              title="حذف"
                              className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-error/10 hover:text-error disabled:opacity-40"
                            >
                              {busyId === key ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  if (row.kind === 'exam') {
                    return (
                      <tr key={key} className="border-b border-border-soft/60 last:border-0">
                        <td className={TD}><TypeBadge kind="exam" /></td>
                        <td className={`${TD} font-semibold text-text-primary`}>{row.item.title}</td>
                        <td className={`${TD} text-text-secondary`}>
                          <span className="flex flex-wrap items-center justify-center gap-1.5">
                            {row.item.typeAr} · {row.item.questionCount} أسئلة · {row.item.totalMarks} درجة
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${row.item.isPublished ? 'bg-success/10 text-success' : 'bg-border-soft text-text-secondary'}`}>
                              {row.item.isPublished ? 'منشور' : 'مسودة'}
                            </span>
                          </span>
                        </td>
                        <td className={TD}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => navigate(`/teacher/content/courses/${course.id}/exams/${row.item.id}/edit`)} title="تعديل" className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-gold/10 hover:text-gold">
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => remove('exams', row.item.id, `"${row.item.title}"`)}
                              disabled={busyId === key}
                              title="حذف"
                              className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-error/10 hover:text-error disabled:opacity-40"
                            >
                              {busyId === key ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={key} className="border-b border-border-soft/60 last:border-0">
                      <td className={TD}><TypeBadge kind="assignment" /></td>
                      <td className={`${TD} font-semibold text-text-primary`}>
                        {row.item.title}
                        {row.item.description && <p className="mt-0.5 text-[10px] font-normal text-text-muted">{row.item.description}</p>}
                      </td>
                      <td className={`${TD} text-text-secondary`}>
                        {row.item.dueDate ? `آخر موعد: ${new Date(row.item.dueDate).toLocaleDateString('ar-EG')}` : 'من غير موعد'}
                      </td>
                      <td className={TD}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => navigate(`/teacher/content/courses/${course.id}/assignments/${row.item.id}/edit`)} title="تعديل" className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-gold/10 hover:text-gold">
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => remove('assignments', row.item.id, `"${row.item.title}"`)}
                            disabled={busyId === key}
                            title="حذف"
                            className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-error/10 hover:text-error disabled:opacity-40"
                          >
                            {busyId === key ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
