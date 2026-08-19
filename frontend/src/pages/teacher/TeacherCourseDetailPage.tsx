import {
  ArrowRight,
  ChevronDown,
  ClipboardList,
  FileText,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CompassLoader } from '../../design-system/components/CompassLoader';
import { Badge } from '../../design-system/ui/Badge';
import { Button } from '../../design-system/ui/Button';
import { ErrorState } from '../../design-system/ui/ErrorState';
import Input from '../../design-system/ui/Field';
import { Modal } from '../../design-system/ui/Modal';
import { useToast } from '../../design-system/ui/Toast';
import { api, resolveFileUrl } from '../../lib/api';
import type { AssignmentDto, AssignmentSubmissionListItemDto, CourseDto, CourseExamStatsDto, ExamListItemDto, LessonDto, LessonResourceDto } from '../../lib/types';

function fileKindLabel(kind: string, url: string): string {
  if (kind === 'pdf') return 'PDF';
  const ext = url.split('.').pop()?.toUpperCase() ?? '';
  return ext === 'PDF' ? 'PDF' : ext || 'ملف';
}

function AssignmentSubmissionsModal({ assignment, onClose }: { assignment: AssignmentDto; onClose: () => void }) {
  const [list, setList] = useState<AssignmentSubmissionListItemDto[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<AssignmentSubmissionListItemDto[]>(`/assignments/${assignment.id}/submissions`)
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [assignment.id]);

  return (
    <Modal open onClose={onClose} title={`نتايج واجب «${assignment.title}»`}>
      {loading ? (
        <div className="py-10 text-center text-sm text-text-muted">بنجيب النتايج...</div>
      ) : !list || list.length === 0 ? (
        <p className="py-10 text-center text-sm text-text-muted">مفيش حد سلم الواجب لسه.</p>
      ) : (
        <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
          {list.map((s) => (
            <div key={s.studentId} className="flex items-center justify-between gap-3 rounded-md border border-border-soft/70 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-text-primary">{s.studentName}</p>
                <p className="text-[10px] text-text-muted">{s.studentCode} · {new Date(s.submittedAt).toLocaleDateString('ar-EG')}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${s.passed ? 'bg-success/10 text-success' : 'bg-gold/10 text-gold'}`}>
                {s.score}/{s.totalQuestions} · {s.percentage}٪
              </span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

function ResourceUploadButton({ lessonId, onUploaded }: { lessonId: number; onUploaded: () => void }) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('title', file.name);
      fd.append('file', file);
      await api.upload<number>(`/teacher-content/lessons/${lessonId}/resources`, fd);
      toast('تم رفع الملف', '', 'success');
      onUploaded();
    } catch (err) {
      toast('فشل رفع الملف', err instanceof Error ? err.message : 'خطأ', 'error');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.ppt,.pptx"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1.5 rounded-md border border-gold/40 bg-gold/5 px-3 py-1.5 text-xs font-semibold text-gold transition-colors hover:bg-gold/10 disabled:opacity-50"
      >
        {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
        {uploading ? 'بترفع...' : 'رفع ملف (PDF)'}
      </button>
    </>
  );
}

function SessionCard({
  courseId,
  lesson,
  exams,
  assignments,
  resources,
  statsByExam,
  busyId,
  onBusy,
  onChanged,
  onViewSubmissions,
}: {
  courseId: number;
  lesson: LessonDto;
  exams: ExamListItemDto[];
  assignments: AssignmentDto[];
  resources: LessonResourceDto[];
  statsByExam: Map<number, CourseExamStatsDto>;
  busyId: string | null;
  onBusy: (id: string | null) => void;
  onChanged: () => void;
  onViewSubmissions: (a: AssignmentDto) => void;
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const isVideo = lesson.contentType === 'video';

  async function remove(kind: string, id: number, label: string) {
    if (!window.confirm(`حذف ${label}؟`)) return;
    onBusy(`${kind}-${id}`);
    try {
      await api.del(`/teacher-content/${kind}/${id}`);
      toast('تم الحذف', '', 'success');
      onChanged();
    } catch (err) {
      toast('فشل الحذف', err instanceof Error ? err.message : 'خطأ', 'error');
    } finally {
      onBusy(null);
    }
  }

  async function deleteResource(r: LessonResourceDto) {
    if (!window.confirm(`حذف الملف "${r.title}"؟`)) return;
    onBusy(`resource-${r.id}`);
    try {
      await api.del(`/teacher-content/resources/${r.id}`);
      toast('تم حذف الملف', '', 'success');
      onChanged();
    } catch (err) {
      toast('فشل الحذف', err instanceof Error ? err.message : 'خطأ', 'error');
    } finally {
      onBusy(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border-soft bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {lesson.imageUrl ? (
            <img src={resolveFileUrl(lesson.imageUrl)} alt={lesson.title} className="h-11 w-16 shrink-0 rounded-md border border-border-soft object-cover" />
          ) : (
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black ${isVideo ? 'bg-gold/10 text-gold' : 'bg-border-soft text-text-secondary'}`}>
              {lesson.order}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-bold text-text-primary">{lesson.title}</p>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${isVideo ? 'bg-gold/10 text-gold' : 'bg-border-soft text-text-secondary'}`}>
                {isVideo ? <Play size={10} /> : <ImageIcon size={10} />}
                {isVideo ? 'فيديو' : 'درس'}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-text-muted">
              {lesson.durationMinutes} د · {exams.length} اختبار · {assignments.length} واجب · {resources.length} ملف
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button onClick={() => navigate(`/teacher/content/courses/${courseId}/lessons/${lesson.id}/edit`)} title="تعديل الحصة" className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-gold/10 hover:text-gold">
            <Pencil size={15} />
          </button>
          <button
            onClick={() => remove('lessons', lesson.id, `الحصة "${lesson.title}"`)}
            disabled={busyId === `lessons-${lesson.id}`}
            title="حذف الحصة"
            className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-error/10 hover:text-error disabled:opacity-40"
          >
            {busyId === `lessons-${lesson.id}` ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
          </button>
          <button onClick={() => setOpen((o) => !o)} title={open ? 'إغلاق' : 'فتح محتوى الحصة'} className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-gold/10 hover:text-gold">
            <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {open && (
        <div className="flex flex-col gap-4 border-t border-border-soft p-4">
          {lesson.summary && <p className="text-xs leading-relaxed text-text-secondary">{lesson.summary}</p>}
          {isVideo && lesson.videoUrl && (
            <a href={lesson.videoUrl} target="_blank" rel="noreferrer" dir="ltr" className="truncate text-xs text-gold underline underline-offset-2">
              {lesson.videoUrl}
            </a>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => navigate(`/teacher/content/courses/${courseId}/exams/new?lesson=${lesson.id}`)} className="flex items-center gap-1.5 rounded-md bg-gold px-3 py-1.5 text-xs font-bold text-navy-deep transition-opacity hover:opacity-90">
              <Plus size={13} /> اختبار للحصة
            </button>
            <button onClick={() => navigate(`/teacher/content/courses/${courseId}/assignments/new?lesson=${lesson.id}`)} className="flex items-center gap-1.5 rounded-md bg-gold px-3 py-1.5 text-xs font-bold text-navy-deep transition-opacity hover:opacity-90">
              <Plus size={13} /> واجب للحصة
            </button>
            <ResourceUploadButton lessonId={lesson.id} onUploaded={onChanged} />
          </div>

          {exams.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                <FileText size={13} className="text-gold" /> اختبارات الحصة ({exams.length})
              </h4>
              {exams.map((e) => {
                const stats = statsByExam.get(e.id);
                return (
                  <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border-soft/70 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-text-primary">{e.title}</p>
                      <p className="mt-0.5 text-[10px] text-text-muted">
                        {e.typeAr} · {e.questionCount} أسئلة · {e.totalMarks} درجة
                        {stats && stats.studentsCount > 0
                          ? ` · ${stats.attemptCount} محاولة · متوسط ${Math.round(stats.avgPercentage)}٪`
                          : ' · مفيش محاولات بعد'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${e.isPublished ? 'bg-success/10 text-success' : 'bg-border-soft text-text-secondary'}`}>
                        {e.isPublished ? 'منشور' : 'مسودة'}
                      </span>
                      <button onClick={() => navigate(`/teacher/content/courses/${courseId}/exams/${e.id}/edit`)} title="تعديل" className="rounded-md p-1 text-text-secondary transition-colors hover:bg-gold/10 hover:text-gold">
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => remove('exams', e.id, `"${e.title}"`)}
                        disabled={busyId === `exams-${e.id}`}
                        title="حذف"
                        className="rounded-md p-1 text-text-secondary transition-colors hover:bg-error/10 hover:text-error disabled:opacity-40"
                      >
                        {busyId === `exams-${e.id}` ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {assignments.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                <ClipboardList size={13} className="text-gold" /> واجبات الحصة ({assignments.length})
              </h4>
              {assignments.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border-soft/70 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-text-primary">{a.title}</p>
                    <p className="mt-0.5 text-[10px] text-text-muted">
                      {a.dueDate ? `آخر موعد: ${new Date(a.dueDate).toLocaleDateString('ar-EG')}` : 'من غير موعد'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {a.hasQuestions && (
                      <button onClick={() => onViewSubmissions(a)} title="نتايج الطلاب" className="rounded-md p-1 text-text-secondary transition-colors hover:bg-success/10 hover:text-success">
                        <Users size={13} />
                      </button>
                    )}
                    <button onClick={() => navigate(`/teacher/content/courses/${courseId}/assignments/${a.id}/edit`)} title="تعديل" className="rounded-md p-1 text-text-secondary transition-colors hover:bg-gold/10 hover:text-gold">
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => remove('assignments', a.id, `"${a.title}"`)}
                      disabled={busyId === `assignments-${a.id}`}
                      title="حذف"
                      className="rounded-md p-1 text-text-secondary transition-colors hover:bg-error/10 hover:text-error disabled:opacity-40"
                    >
                      {busyId === `assignments-${a.id}` ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {resources.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                <FileText size={13} className="text-gold" /> ملفات الحصة ({resources.length})
              </h4>
              {resources.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border-soft/70 px-3 py-2">
                  <a href={resolveFileUrl(r.fileUrl)} target="_blank" rel="noreferrer" className="min-w-0 truncate text-xs font-semibold text-gold hover:underline">
                    {r.title}
                  </a>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="rounded-full bg-border-soft px-2 py-0.5 text-[10px] font-bold text-text-secondary">
                      {fileKindLabel(r.kind, r.fileUrl)}
                    </span>
                    <button
                      onClick={() => deleteResource(r)}
                      disabled={busyId === `resource-${r.id}`}
                      title="حذف الملف"
                      className="rounded-md p-1 text-text-secondary transition-colors hover:bg-error/10 hover:text-error disabled:opacity-40"
                    >
                      {busyId === `resource-${r.id}` ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {exams.length === 0 && assignments.length === 0 && resources.length === 0 && (
            <p className="rounded-md border border-dashed border-border-soft py-5 text-center text-xs text-text-muted">
              الحصة دي لسه مفيش عليها حاجة — أضف اختبار أو واجب أو ارفع ملف.
            </p>
          )}
        </div>
      )}
    </div>
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
  const [resources, setResources] = useState<LessonResourceDto[]>([]);
  const [examStats, setExamStats] = useState<CourseExamStatsDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [subsAssignment, setSubsAssignment] = useState<AssignmentDto | null>(null);
  const [q, setQ] = useState('');

  function loadContent() {
    if (!course) return;
    Promise.allSettled([
      api.get<LessonDto[]>(`/courses/${course.id}/lessons`),
      api.get<ExamListItemDto[]>(`/exams/course/${course.id}?includeUnpublished=true`),
      api.get<AssignmentDto[]>(`/courses/${course.id}/assignments`),
      api.get<CourseExamStatsDto[]>(`/analytics/courses/${course.id}/exam-stats`),
      api.get<LessonResourceDto[]>(`/courses/${course.id}/resources`),
    ]).then((results) => {
      if (results[0].status === 'fulfilled') setLessons(results[0].value);
      if (results[1].status === 'fulfilled') setExams(results[1].value);
      if (results[2].status === 'fulfilled') setAssignments(results[2].value);
      if (results[3].status === 'fulfilled') setExamStats(results[3].value);
      if (results[4].status === 'fulfilled') setResources(results[4].value);

      const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
      if (failed.length > 0) {
        const reason = failed[0].reason;
        toast(reason instanceof Error && reason.message ? reason.message : 'فشل تحميل جزء من المحتوى', '', 'error');
      }
    });
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

  const statsByExam = new Map(examStats.map((s) => [s.examId, s]));

  const query = q.trim().toLowerCase();
  const matches = (text: string) => !query || text.toLowerCase().includes(query);

  const visibleLessons = lessons.filter((l) => {
    if (matches(l.title) || matches(l.summary ?? '')) return true;
    if (exams.some((e) => e.lessonId === l.id && matches(e.title))) return true;
    if (assignments.some((a) => a.lessonId === l.id && matches(a.title))) return true;
    if (resources.some((r) => r.lessonId === l.id && matches(r.title))) return true;
    return false;
  });

  const generalExams = exams.filter((e) => e.lessonId == null && matches(e.title));
  const generalAssignments = assignments.filter((a) => a.lessonId == null && matches(a.title));

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
            {lessons.length} حصة · {exams.length} اختبار · {assignments.length} واجب · {resources.length} ملف
          </p>
        </div>
        <Button variant="ghost" icon={<ArrowRight size={15} />} onClick={back}>
          رجوع للمحتوى
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="gold" size="sm" icon={<Plus size={15} />} onClick={() => navigate(`/teacher/content/courses/${course.id}/lessons/new`)}>
          أضف حصة
        </Button>
        <Button variant="outline" size="sm" icon={<Plus size={15} />} onClick={() => navigate(`/teacher/content/courses/${course.id}/exams/new`)}>
          اختبار عام
        </Button>
        <Button variant="outline" size="sm" icon={<Plus size={15} />} onClick={() => navigate(`/teacher/content/courses/${course.id}/assignments/new`)}>
          واجب عام
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
        <div className="flex flex-col gap-3 border-b border-border-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-text-primary">حصص الكورس</h2>
            <p className="text-[11px] text-text-muted">كل حصة ليها محتواها — اختباراتها وواجباتها وملفاتها.</p>
          </div>
          <Input
            icon={<Search size={14} />}
            placeholder="دور على حصة أو عنصر..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full sm:w-64"
          />
        </div>

        <div className="flex flex-col gap-3 p-4">
          {lessons.length === 0 ? (
            <p className="rounded-md border border-dashed border-border-soft py-10 text-center text-sm text-text-muted">
              مفيش حصص في الكورس ده — ابدأ بإضافة أول حصة.
            </p>
          ) : visibleLessons.length === 0 ? (
            <p className="rounded-md border border-dashed border-border-soft py-10 text-center text-sm text-text-muted">
              مفيش نتائج مطابقة للبحث ده.
            </p>
          ) : (
            visibleLessons.map((l) => (
              <SessionCard
                key={l.id}
                courseId={course.id}
                lesson={l}
                exams={exams.filter((e) => e.lessonId === l.id)}
                assignments={assignments.filter((a) => a.lessonId === l.id)}
                resources={resources.filter((r) => r.lessonId === l.id)}
                statsByExam={statsByExam}
                busyId={busyId}
                onBusy={setBusyId}
                onChanged={loadContent}
                onViewSubmissions={setSubsAssignment}
              />
            ))
          )}

          {(generalExams.length > 0 || generalAssignments.length > 0) && (
            <div className="mt-2 rounded-lg border border-dashed border-border-soft p-4">
              <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-text-primary">
                <FileText size={14} className="text-gold" /> محتوى عام (من غير حصة)
              </h3>
              <div className="flex flex-col gap-2">
                {generalExams.map((e) => {
                  const stats = statsByExam.get(e.id);
                  return (
                    <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border-soft/70 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-text-primary">{e.title}</p>
                        <p className="mt-0.5 text-[10px] text-text-muted">
                          {e.typeAr} · {e.questionCount} أسئلة · {e.totalMarks} درجة
                          {stats && stats.studentsCount > 0
                            ? ` · ${stats.attemptCount} محاولة · متوسط ${Math.round(stats.avgPercentage)}٪`
                            : ' · مفيش محاولات بعد'}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${e.isPublished ? 'bg-success/10 text-success' : 'bg-border-soft text-text-secondary'}`}>
                          {e.isPublished ? 'منشور' : 'مسودة'}
                        </span>
                        <button onClick={() => navigate(`/teacher/content/courses/${course.id}/exams/${e.id}/edit`)} title="تعديل" className="rounded-md p-1 text-text-secondary transition-colors hover:bg-gold/10 hover:text-gold">
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => remove('exams', e.id, `"${e.title}"`)}
                          disabled={busyId === `exams-${e.id}`}
                          title="حذف"
                          className="rounded-md p-1 text-text-secondary transition-colors hover:bg-error/10 hover:text-error disabled:opacity-40"
                        >
                          {busyId === `exams-${e.id}` ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {generalAssignments.map((a) => (
                  <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border-soft/70 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-text-primary">{a.title}</p>
                      <p className="mt-0.5 text-[10px] text-text-muted">
                        {a.dueDate ? `آخر موعد: ${new Date(a.dueDate).toLocaleDateString('ar-EG')}` : 'من غير موعد'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {a.hasQuestions && (
                        <button onClick={() => setSubsAssignment(a)} title="نتايج الطلاب" className="rounded-md p-1 text-text-secondary transition-colors hover:bg-success/10 hover:text-success">
                          <Users size={13} />
                        </button>
                      )}
                      <button onClick={() => navigate(`/teacher/content/courses/${course.id}/assignments/${a.id}/edit`)} title="تعديل" className="rounded-md p-1 text-text-secondary transition-colors hover:bg-gold/10 hover:text-gold">
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => remove('assignments', a.id, `"${a.title}"`)}
                        disabled={busyId === `assignments-${a.id}`}
                        title="حذف"
                        className="rounded-md p-1 text-text-secondary transition-colors hover:bg-error/10 hover:text-error disabled:opacity-40"
                      >
                        {busyId === `assignments-${a.id}` ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {subsAssignment && <AssignmentSubmissionsModal assignment={subsAssignment} onClose={() => setSubsAssignment(null)} />}
    </div>
  );
}
