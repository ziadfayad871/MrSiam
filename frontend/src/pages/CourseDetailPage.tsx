import { Bookmark, BookOpen, ClipboardList, FileText, PlayCircle, Plus, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CompassLoader } from '../design-system/components/CompassLoader';
import { Badge } from '../design-system/ui/Badge';
import { Card } from '../design-system/ui/Card';
import { EmptyState } from '../design-system/ui/EmptyState';
import { ErrorState } from '../design-system/ui/ErrorState';
import { Modal } from '../design-system/ui/Modal';
import { Progress } from '../design-system/ui/Progress';
import { api } from '../lib/api';
import type { AssignmentDto, CourseDto, ExamListItemDto, LessonDto, NoteDto } from '../lib/types';

function embedUrl(url: string): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

function VideoPlayer({ url, lessonId, onClose }: { url: string; lessonId: number; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSaved = useRef(0);
  const [saving, setSaving] = useState(false);

  const save = useCallback(async (position: number, duration: number) => {
    if (position <= 0 || duration <= 0) return;
    setSaving(true);
    try {
      await api.put(`/student/watch/${lessonId}`, { positionSeconds: Math.floor(position), durationSeconds: Math.floor(duration) });
    } catch {
      // silent — tracking is best effort
    } finally {
      setSaving(false);
    }
  }, [lessonId]);

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.currentTime - lastSaved.current >= 10) {
      lastSaved.current = v.currentTime;
      void save(v.currentTime, v.duration);
    }
  };

  const handlePause = () => {
    const v = videoRef.current;
    if (!v) return;
    void save(v.currentTime, v.duration);
  };

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
        <video
          ref={videoRef}
          src={url}
          controls
          className="aspect-video w-full rounded-lg border border-border-soft bg-black"
          onTimeUpdate={handleTimeUpdate}
          onPause={handlePause}
        />
      )}
      {saving && <span className="mt-1 inline-block text-[10px] text-text-muted">بنحفظ تقدمك…</span>}
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

  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());
  const [notes, setNotes] = useState<NoteDto[]>([]);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [courses, lessonsList, examsList, assignmentsList, bookmarks] = await Promise.all([
          api.get<CourseDto[]>('/courses'),
          api.get<LessonDto[]>(`/courses/${courseId}/lessons`),
          api.get<ExamListItemDto[]>(`/exams/course/${courseId}`),
          api.get<AssignmentDto[]>(`/courses/${courseId}/assignments`),
          api.get<{ lessonId: number }[]>(`/student/bookmarks?kind=lesson&courseId=${courseId}`).catch(() => []),
        ]);
        setCourse(courses.find((c) => String(c.id) === courseId) ?? null);
        setLessons(lessonsList);
        setExams(examsList);
        setAssignments(assignmentsList);
        setBookmarked(new Set(bookmarks.filter((b) => b.lessonId).map((b) => b.lessonId as number)));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'فشل تحميل المادة');
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  const openLesson = async (l: LessonDto) => {
    setPlaying(l);
    setFeedback(null);
    setNoteText('');
    if (l.contentType === 'video' && l.videoUrl) {
      try {
        const list = await api.get<NoteDto[]>(`/student/lessons/${l.id}/notes`);
        setNotes(list);
      } catch {
        setNotes([]);
      }
    }
  };

  const toggleBookmark = async (l: LessonDto) => {
    const was = bookmarked.has(l.id);
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (was) next.delete(l.id);
      else next.add(l.id);
      return next;
    });
    try {
      await api.post('/student/bookmarks/toggle', { kind: 'lesson', lessonId: l.id });
    } catch {
      setBookmarked((prev) => {
        const next = new Set(prev);
        if (was) next.add(l.id);
        else next.delete(l.id);
        return next;
      });
      setFeedback('مقدرناش نحفظ الإشارة — جرب تاني');
    }
  };

  const addNote = async () => {
    if (!playing || !noteText.trim()) return;
    setSavingNote(true);
    try {
      await api.post('/student/notes', { lessonId: playing.id, text: noteText.trim() });
      const list = await api.get<NoteDto[]>(`/student/lessons/${playing.id}/notes`);
      setNotes(list);
      setNoteText('');
      setFeedback('اتسجلت الملاحظة ✓');
    } catch {
      setFeedback('مقدرناش نسجل الملاحظة — جرب تاني');
    } finally {
      setSavingNote(false);
    }
  };

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

      {feedback && (
        <p className="mt-4 rounded-md border border-gold/40 bg-gold/10 px-3 py-2 text-xs font-semibold text-gold">{feedback}</p>
      )}

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
                    if (l.contentType === 'video' && l.videoUrl) void openLesson(l);
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void toggleBookmark(l);
                    }}
                    className={`rounded-full p-1.5 transition-colors ${bookmarked.has(l.id) ? 'bg-gold/15 text-gold' : 'text-text-muted hover:bg-border-soft hover:text-text-primary'}`}
                    title={bookmarked.has(l.id) ? 'إزالة من الإشارات المرجعية' : 'أضف للإشارات المرجعية'}
                  >
                    <Bookmark size={15} fill={bookmarked.has(l.id) ? 'currentColor' : 'none'} />
                  </button>
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

      <Modal open={playing !== null} onClose={() => setPlaying(null)} title={playing?.title ?? ''} size="lg">
        {playing?.videoUrl && <VideoPlayer url={playing.videoUrl} lessonId={playing.id} onClose={() => setPlaying(null)} />}

        {/* Notes */}
        <div className="mt-5">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-text-primary">
            <BookOpen size={14} className="text-gold" /> ملاحظاتك على الدرس
          </h3>
          <div className="flex gap-2">
            <input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void addNote()}
              placeholder="اكتب ملاحظة.. ولو فيديو هنتذكر مكانها تلقائياً"
              className="min-w-0 flex-1 rounded-md border border-border-soft bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-gold/60"
            />
            <button
              onClick={() => void addNote()}
              disabled={savingNote || !noteText.trim()}
              className="flex shrink-0 items-center gap-1 rounded-md bg-gold px-3 py-2 text-xs font-bold text-navy-deep transition-colors hover:bg-gold/90 disabled:opacity-50"
            >
              <Plus size={14} /> {savingNote ? 'بنسجل...' : 'أضف'}
            </button>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {notes.length === 0 && <p className="text-xs text-text-muted">مفيش ملاحظات على الدرس ده.</p>}
            {notes.map((n) => (
              <div key={n.id} className="rounded-md border border-border-soft bg-parchment-soft px-3 py-2">
                <p className="text-xs leading-relaxed text-text-secondary">{n.text}</p>
                <p className="mt-1 text-[10px] text-text-muted">
                  {new Date(n.createdAt).toLocaleDateString('ar-EG')}
                  {n.videoTimestampSec !== undefined && n.videoTimestampSec > 0 && ` · عند الدقيقة ${Math.floor(n.videoTimestampSec / 60)}:${String(n.videoTimestampSec % 60).padStart(2, '0')}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
