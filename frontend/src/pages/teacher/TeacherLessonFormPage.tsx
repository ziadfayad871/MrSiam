import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LessonForm } from '../../components/teacher/LessonForm';
import { CompassLoader } from '../../design-system/components/CompassLoader';
import { Button } from '../../design-system/ui/Button';
import { ErrorState } from '../../design-system/ui/ErrorState';
import { api } from '../../lib/api';
import type { CourseDto, LessonDto } from '../../lib/types';

export default function TeacherLessonFormPage() {
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams();
  const back = () => navigate('/teacher/content');
  const editing = lessonId != null;

  const [course, setCourse] = useState<CourseDto | null>(null);
  const [lesson, setLesson] = useState<LessonDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get<CourseDto[]>('/courses'),
      editing ? api.get<LessonDto[]>(`/courses/${courseId}/lessons`) : Promise.resolve<LessonDto[]>([]),
    ])
      .then(([courses, lessons]) => {
        if (cancelled) return;
        const foundCourse = courses.find((c) => String(c.id) === courseId);
        if (!foundCourse) {
          setError('مش لاقيين الكورس ده — اتأكد إنه لسه موجود.');
          return;
        }
        setCourse(foundCourse);
        if (editing) {
          const foundLesson = lessons.find((l) => String(l.id) === lessonId);
          if (!foundLesson) {
            setError('مش لاقيين الدرس ده — اتأكد إنه لسه موجود.');
            return;
          }
          setLesson(foundLesson);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'فشل تحميل البيانات'))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, lessonId, editing]);

  if (loading) return <CompassLoader text="بنجيب البيانات..." />;
  if (error || !course) return <ErrorState title={error ?? 'حصل خطأ'} onRetry={back} />;

  return (
    <div className="teacher-workspace flex flex-col gap-6 p-2 sm:p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[.16em] text-gold">إدارة المنصة</p>
          <h1 className="display-serif mt-2 text-3xl font-extrabold text-text-primary">{editing ? 'تعديل الدرس' : 'إضافة درس/فيديو'}</h1>
          <p className="mt-2 text-sm text-text-muted">
            {editing ? 'عدّل بيانات الدرس، وبعدين احفظ.' : 'اكتب بيانات الدرس أو الفيديو، وبعدين احفظ — هيظهر فورًا في المحتوى.'}
          </p>
          <p className="mt-1 text-xs text-gold">كورس: {course.title}</p>
        </div>
        <Button variant="ghost" icon={<ArrowRight size={15} />} onClick={back}>
          رجوع للمحتوى
        </Button>
      </header>

      <div className="rounded-xl border border-border-soft bg-surface p-5 sm:p-8">
        <LessonForm courseId={course.id} editing={editing ? lesson : null} onDone={back} onCancel={back} submitLabel={editing ? 'حفظ التعديلات' : 'حفظ'} />
      </div>
    </div>
  );
}
