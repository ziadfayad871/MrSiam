import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AssignmentForm } from '../../components/teacher/AssignmentForm';
import { CompassLoader } from '../../design-system/components/CompassLoader';
import { Button } from '../../design-system/ui/Button';
import { ErrorState } from '../../design-system/ui/ErrorState';
import { api } from '../../lib/api';
import { useUnsavedGuard } from '../../lib/useUnsavedGuard';
import type { AssignmentDetailDto, AssignmentDto, CourseDto } from '../../lib/types';

export default function TeacherAssignmentFormPage() {
  const navigate = useNavigate();
  const { courseId, assignmentId } = useParams();
  const [searchParams] = useSearchParams();
  const defaultLessonId = searchParams.get('lesson') ? Number(searchParams.get('lesson')) : undefined;
  const [dirty, setDirty] = useState(false);
  const { disarm, navigateGuarded } = useUnsavedGuard(dirty);
  const back = () => navigateGuarded('/teacher/content');
  const editing = assignmentId != null;

  const [course, setCourse] = useState<CourseDto | null>(null);
  const [assignment, setAssignment] = useState<AssignmentDto | null>(null);
  const [initialCorrectAnswers, setInitialCorrectAnswers] = useState<number[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get<CourseDto[]>('/courses'),
      editing ? api.get<AssignmentDto[]>(`/courses/${courseId}/assignments`) : Promise.resolve<AssignmentDto[]>([]),
    ])
      .then(([courses, assignments]) => {
        if (cancelled) return;
        const foundCourse = courses.find((c) => String(c.id) === courseId);
        if (!foundCourse) {
          setError('مش لاقيين الكورس ده — اتأكد إنه لسه موجود.');
          return;
        }
        setCourse(foundCourse);
        if (editing) {
          const foundAssignment = assignments.find((a) => String(a.id) === assignmentId);
          if (!foundAssignment) {
            setError('مش لاقيين الواجب ده — اتأكد إنه لسه موجود.');
            return;
          }
          setAssignment(foundAssignment);
          if (foundAssignment.hasQuestions) {
            api
              .get<AssignmentDetailDto>(`/assignments/${foundAssignment.id}`)
              .then((d) => {
                if (!cancelled) setInitialCorrectAnswers(d.questions.map((q) => q.correctIndex));
              })
              .catch(() => {});
          }
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'فشل تحميل البيانات'))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, assignmentId, editing]);

  if (loading) return <CompassLoader text="بنجيب البيانات..." />;
  if (error || !course) return <ErrorState title={error ?? 'حصل خطأ'} onRetry={back} />;

  return (
    <div className="teacher-workspace flex flex-col gap-6 p-2 sm:p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[.16em] text-gold">إدارة المنصة</p>
          <h1 className="display-serif mt-2 text-3xl font-extrabold text-text-primary">{editing ? 'تعديل الواجب' : 'إضافة واجب'}</h1>
          <p className="mt-2 text-sm text-text-muted">
            {editing ? 'عدّل بيانات الواجب، وبعدين احفظ.' : 'اكتب بيانات الواجب، وبعدين احفظ — هيظهر فورًا في المحتوى.'}
          </p>
          <p className="mt-1 text-xs text-gold">كورس: {course.title}</p>
        </div>
        <Button variant="ghost" icon={<ArrowRight size={15} />} onClick={back}>
          رجوع للمحتوى
        </Button>
      </header>

      <div className="rounded-xl border border-border-soft bg-surface p-5 sm:p-8">
        <AssignmentForm courseId={course.id} editing={editing ? assignment : null} defaultLessonId={defaultLessonId} initialCorrectAnswers={initialCorrectAnswers} onDone={() => { disarm(); navigate('/teacher/content'); }} onCancel={back} onDirtyChange={setDirty} submitLabel={editing ? 'حفظ التعديلات' : 'حفظ'} />
      </div>
    </div>
  );
}
