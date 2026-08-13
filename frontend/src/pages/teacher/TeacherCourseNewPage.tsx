import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CourseForm } from '../../components/teacher/CourseForm';
import { Button } from '../../design-system/ui/Button';

export default function TeacherCourseNewPage() {
  const navigate = useNavigate();
  const back = () => navigate('/teacher/content');

  return (
    <div className="teacher-workspace flex flex-col gap-6 p-2 sm:p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[.16em] text-gold">إدارة المنصة</p>
          <h1 className="display-serif mt-2 text-3xl font-extrabold text-text-primary">كورس جديد</h1>
          <p className="mt-2 text-sm text-text-muted">اكتب بيانات الكورس، وبعدين احفظ — هيظهر فورًا في صفحة المحتوى.</p>
        </div>
        <Button variant="ghost" icon={<ArrowRight size={15} />} onClick={back}>
          رجوع للمحتوى
        </Button>
      </header>

      <div className="rounded-xl border border-border-soft bg-surface p-5 sm:p-8">
        <CourseForm editing={null} onDone={back} onCancel={back} submitLabel="حفظ" />
      </div>
    </div>
  );
}
