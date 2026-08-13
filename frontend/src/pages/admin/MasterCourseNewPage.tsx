import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CourseForm } from '../../components/teacher/CourseForm';
import { Button } from '../../design-system/ui/Button';
import { useUnsavedGuard } from '../../lib/useUnsavedGuard';

export default function MasterCourseNewPage() {
  const navigate = useNavigate();
  const [dirty, setDirty] = useState(false);
  const { disarm, navigateGuarded } = useUnsavedGuard(dirty);
  const back = () => navigateGuarded('/admin/courses');

  return (
    <div className="admin-workspace flex flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[.16em] text-gold">إدارة الكورسات</p>
          <h1 className="display-serif mt-2 text-3xl font-extrabold text-text-primary">إضافة كورس</h1>
          <p className="mt-2 text-sm text-text-muted">حدد الشهر والمرحلة، سمّي الكورس، واختار له صورة — وبعدين احفظ.</p>
        </div>
        <Button variant="ghost" icon={<ArrowRight size={15} />} onClick={back}>
          رجوع للكورسات
        </Button>
      </header>

      <div className="rounded-xl border border-border-soft bg-surface p-5 sm:p-8">
        <CourseForm editing={null} onDone={() => { disarm(); navigate('/admin/courses'); }} onCancel={back} onDirtyChange={setDirty} submitLabel="حفظ" />
      </div>
    </div>
  );
}