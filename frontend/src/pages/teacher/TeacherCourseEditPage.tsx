import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CourseForm } from '../../components/teacher/CourseForm';
import { CompassLoader } from '../../design-system/components/CompassLoader';
import { Button } from '../../design-system/ui/Button';
import { ErrorState } from '../../design-system/ui/ErrorState';
import { api } from '../../lib/api';
import type { CourseDto } from '../../lib/types';

export default function TeacherCourseEditPage() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const back = () => navigate('/teacher/content');
  const [course, setCourse] = useState<CourseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<CourseDto[]>('/courses')
      .then((list) => {
        const found = list.find((c) => String(c.id) === courseId);
        if (found) {
          setCourse(found);
        } else {
          setError('مش لاقيين الكورس ده — اتأكد إنه لسه موجود.');
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'فشل تحميل الكورس'))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) return <CompassLoader text="بنجيب بيانات الكورس..." />;
  if (error || !course) return <ErrorState title={error ?? 'مش لاقيين الكورس'} onRetry={back} />;

  return (
    <div className="teacher-workspace flex flex-col gap-6 p-2 sm:p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[.16em] text-gold">إدارة المنصة</p>
          <h1 className="display-serif mt-2 text-3xl font-extrabold text-text-primary">تعديل الكورس</h1>
          <p className="mt-2 text-sm text-text-muted">عدّل بيانات الكورس، وبعدين احفظ — التغييرات هتظهر فورًا.</p>
        </div>
        <Button variant="ghost" icon={<ArrowRight size={15} />} onClick={back}>
          رجوع للمحتوى
        </Button>
      </header>

      <div className="rounded-xl border border-border-soft bg-surface p-5 sm:p-8">
        <CourseForm editing={course} onDone={back} onCancel={back} submitLabel="حفظ التعديلات" />
      </div>
    </div>
  );
}
