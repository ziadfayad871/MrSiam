import { BookOpen, ClipboardList, FileText, PlayCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CompassLoader } from '../design-system/components/CompassLoader';
import { Badge } from '../design-system/ui/Badge';
import { Card } from '../design-system/ui/Card';
import { EmptyState } from '../design-system/ui/EmptyState';
import { ErrorState } from '../design-system/ui/ErrorState';
import { Modal } from '../design-system/ui/Modal';
import { Progress } from '../design-system/ui/Progress';
import { api } from '../lib/api';
import type { AssignmentDto, CourseDto, ExamListItemDto, LessonDto } from '../lib/types';

function embedUrl(url: string): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

function VideoPlayer({ url, onClose }: { url: string; onClose: () => void }) {
  const embed = embedUrl(url);
  return (
    <div className="relative">
      <button
        onClick={onClose}
        className="absolute -top-9 end-0 rounded-full p-1.5 text-text-muted transition-colors hover:bg-border-soft hover:text-text-primary"
        aria-label="إغلاق"
      >
        <X size={18} />
      </button>
      {embed ? (
        <iframe
          src={embed}
          title="فيديو الدرس"
          className="aspect-video w-full rounded-lg border border-border-soft"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video src={url} controls className="aspect-video w-full rounded-lg border border-border-soft bg-black" />
      )}
    </div>
  );
}

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<CourseDto | null>(null);
  const [lessons, setLessons] = useState<LessonDto[]>([]);
  const [exams, setExams] = useState<ExamListItemDto[]>([]);
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [playing, setPlaying] = useState<LessonDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [courses, lessonsList, examsList, assignmentsList] = await Promise.all([
          api.get<CourseDto[]>('/courses'),
          api.get<LessonDto[]>(`/courses/${courseId}/lessons`),
          api.get<ExamListItemDto[]>(`/exams/course/${courseId}`),
          api.get<AssignmentDto[]>(`/courses/${courseId}/assignments`),
        ]);
        setCourse(courses.find((c) => String(c.id) === courseId) ?? null);
        setLessons(lessonsList);
        setExams(examsList);
        setAssignments(assignmentsList);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'فشل تحميل المادة');
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  if (loading) return <CompassLoader text="بنرسم خريطة المادة..." />;
  if (error) return <ErrorState title={error} onRetry={() => window.location.reload()} />;
  if (!course) return <EmptyState icon="map" title="مفيش مادة" description="مفيش مادة بالكود ده." />;

  const completedLessons = lessons.filter((l) => l.isCompleted).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-lg border border-gold/20 bg-parchment-soft p-6 shadow-soft sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant={course.subject === 'History' ? 'gold' : course.subject === 'Geography' ? 'success' : 'warning'}>
                {course.subjectAr}
              </Badge>
              <span className="text-xs text-text-muted">{course.stageAr}</span>
            </div>
            <h1 className="display-serif mt-3 text-2xl font-bold text-text-primary sm:text-3xl">{course.title}</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-secondary">{course.description}</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gold">{lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0}%</p>
            <p className="text-[11px] text-text-muted">إنجاز المادة</p>
          </div>
        </div>
        <div className="mt-6">
          <Progress value={lessons.length > 0 ? (completedLessons / lessons.length) * 100 : 0} />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Lessons */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-text-primary">
            <BookOpen size={18} className="text-gold" /> الدروس ({lessons.length})
          </h2>
          {lessons.length === 0 ? (
            <EmptyState icon="scroll" title="مفيش دروس" description="الدرس الأول جاي قريب." />
          ) : (
            <div className="flex flex-col gap-2.5">
              {lessons.map((l) => (
                <div
                  key={l.id}
                  className={`flex items-center gap-3 rounded-md border border-border-soft bg-surface px-4 py-3 ${l.contentType === 'video' && l.videoUrl ? 'cursor-pointer transition-colors hover:border-gold/50 hover:bg-gold/5' : ''}`}
                  onClick={() => {
                    if (l.contentType === 'video' && l.videoUrl) setPlaying(l);
                  }}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${l.isCompleted ? 'bg-success/15 text-success' : l.contentType === 'video' ? 'bg-gold/10 text-gold' : 'bg-border-soft text-text-muted'}`}>
                    {l.isCompleted ? <PlayCircle size={16} /> : l.contentType === 'video' ? <PlayCircle size={16} /> : <span className="text-xs font-bold">{l.order}</span>}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text-primary">{l.title}</p>
                    <p className="truncate text-[11px] text-text-muted">
                      {l.contentType === 'video' ? 'فيديو' : `${l.durationMinutes} دقيقة`}
                      {l.bestPercentage !== undefined && l.bestPercentage > 0 ? ` · أفضل نتيجة ${l.bestPercentage}%` : ''}
                    </p>
                  </div>
                  {l.isCompleted && <Badge variant="success">خلصت</Badge>}
                  {l.contentType === 'video' && l.videoUrl && <span className="text-[10px] font-bold text-gold">شاهد ▶</span>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Exams */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-text-primary">
            <FileText size={18} className="text-gold" /> الامتحانات ({exams.length})
          </h2>
          {exams.length === 0 ? (
            <EmptyState icon="scroll" title="مفيش امتحانات" description="الامتحان الأول جاي قريب." />
          ) : (
            <div className="flex flex-col gap-2.5">
              {exams.map((e) => (
                <Link
                  key={e.id}
                  to={`/exam/${e.id}`}
                  className="group flex items-center justify-between rounded-md border border-border-soft bg-surface px-4 py-3 transition-colors hover:border-gold/50 hover:bg-gold/5"
                >
                  <div>
                    <p className="text-sm font-bold text-text-primary group-hover:text-gold">{e.title}</p>
                    <p className="mt-0.5 text-[11px] text-text-muted">
                      {e.questionCount} سؤال · {e.totalMarks} درجة · {e.durationMinutes} دقيقة
                      {e.hasAttempt ? ` · أفضل نتيجة ${e.bestPercentage}%` : ''}
                    </p>
                  </div>
                  <Badge variant={e.type === 'Final' ? 'gold' : e.type === 'Unit' ? 'warning' : 'neutral'}>{e.typeAr}</Badge>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Assignments */}
      <section className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-text-primary">
          <ClipboardList size={18} className="text-gold" /> الواجبات ({assignments.length})
        </h2>
        {assignments.length === 0 ? (
          <Card className="border-dashed">
            <p className="py-6 text-center text-sm text-text-muted">مفيش واجبات لسه — الواجب الجاي هيظهر هنا.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            {assignments.map((a) => (
              <Card key={a.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-text-primary">{a.title}</p>
                    {a.description && <p className="mt-1 text-xs leading-relaxed text-text-secondary">{a.description}</p>}
                  </div>
                  {a.dueDate && (
                    <span className="shrink-0 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] font-bold text-gold">
                      آخر موعد: {new Date(a.dueDate).toLocaleDateString('ar-EG')}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Modal open={playing !== null} onClose={() => setPlaying(null)} title={playing?.title ?? ''}>
        {playing?.videoUrl && <VideoPlayer url={playing.videoUrl} onClose={() => setPlaying(null)} />}
      </Modal>
    </div>
  );
}
