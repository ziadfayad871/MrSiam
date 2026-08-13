import { BookOpen, ChevronLeft, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CompassLoader } from '../../design-system/components/CompassLoader';
import { Badge } from '../../design-system/ui/Badge';
import { Button } from '../../design-system/ui/Button';
import AiToolsPanel from './AiToolsPanel';
import { useToast } from '../../design-system/ui/Toast';
import { api } from '../../lib/api';
import type { CourseDto } from '../../lib/types';

function CourseSection({ course, onChanged }: { course: CourseDto; onChanged: () => void }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [busyId, setBusyId] = useState<number | null>(null);

  async function remove(kind: string, id: number, label: string) {
    if (!window.confirm(`حذف ${label}؟`)) return;
    setBusyId(id);
    try {
      await api.del(`/teacher-content/${kind}/${id}`);
      toast('تم الحذف', '', 'success');
      onChanged();
    } catch (err) {
      toast('فشل الحذف', err instanceof Error ? err.message : 'خطأ', 'error');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div
      onClick={() => navigate(`/teacher/content/courses/${course.id}`)}
      className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border-soft bg-surface px-4 py-3 transition-colors hover:border-gold/40 hover:bg-gold/5"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-bold text-text-primary">{course.title}</p>
          <Badge variant={course.subject === 'History' ? 'gold' : course.subject === 'Geography' ? 'success' : 'warning'}>{course.subjectAr}</Badge>
          <span className="text-[10px] text-text-muted">{course.stageAr}</span>
        </div>
        <p className="mt-0.5 text-[11px] text-text-muted">
          {course.lessonCount} درس · {course.examCount} اختبار
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => navigate(`/teacher/content/courses/${course.id}/edit`)} title="تعديل الكورس" className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-gold/10 hover:text-gold">
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
        <span className="flex items-center gap-1 ps-1 text-[11px] font-semibold text-gold">
          التفاصيل <ChevronLeft size={14} />
        </span>
      </div>
    </div>
  );
}

export default function ContentTab() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [loading, setLoading] = useState(true);

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
        <Button variant="gold" icon={<Plus size={15} />} onClick={() => navigate('/teacher/content/courses/new')}>
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
          <Button variant="gold" icon={<Plus size={15} />} onClick={() => navigate('/teacher/content/courses/new')}>
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
    </div>
  );
}
