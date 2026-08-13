import { BookOpen, CalendarDays, ChevronLeft, FileText, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CompassLoader } from '../../design-system/components/CompassLoader';
import { Badge } from '../../design-system/ui/Badge';
import { Button } from '../../design-system/ui/Button';
import { EmptyState } from '../../design-system/ui/EmptyState';
import { Input } from '../../design-system/ui/Field';
import { api, resolveFileUrl } from '../../lib/api';
import type { CourseDto, Stage } from '../../lib/types';
import { STAGES } from '../../components/teacher/CourseForm';

export default function MasterCoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<Stage | 'all'>('all');
  const [search, setSearch] = useState('');

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

  const filtered = useMemo(() => {
    const term = search.trim();
    return courses.filter((c) => {
      if (stage !== 'all' && c.stage !== stage) return false;
      if (term) {
        const haystack = `${c.title} ${c.stageAr} ${c.subjectAr} ${c.monthAr ?? ''}`;
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [courses, stage, search]);

  return (
    <div className="admin-workspace flex flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[.16em] text-gold">إدارة الكورسات</p>
          <h1 className="display-serif mt-2 text-3xl font-extrabold text-text-primary">الكورسات</h1>
          <p className="mt-2 text-sm text-text-muted">كل الكورسات اللي موجودة — دوس على أي كورس تدخل على اللي جواه (دروس، امتحانات، واجبات).</p>
        </div>
        <Button variant="gold" icon={<Plus size={16} />} onClick={() => navigate('/admin/courses/new')}>
          إضافة كورس
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="دور على كورس..." className="ps-9" />
        </div>
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value as Stage | 'all')}
          className="rounded-md border border-border-soft bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-gold/60"
        >
          <option value="all">كل المراحل</option>
          {STAGES.map((s) => (
            <option key={s.key} value={s.key}>{s.ar}</option>
          ))}
        </select>
        <p className="text-sm text-text-muted">{filtered.length} كورس</p>
      </div>

      {loading ? (
        <CompassLoader text="بنجيب الكورسات..." />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-soft bg-surface/50 p-10">
          <EmptyState
            icon="map"
            title="مفيش كورسات"
            description="ابدأ بإضافة أول كورس وحدد له الشهر والمرحلة والصورة."
            actionLabel="إضافة كورس"
            onAction={() => navigate('/admin/courses/new')}
          />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => navigate(`/teacher/content/courses/${c.id}`)}
              className="group flex flex-col overflow-hidden rounded-xl border border-border-soft bg-surface text-start shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-[0_8px_30px_rgba(201,162,39,.10)]"
            >
              <div className="relative h-36 overflow-hidden bg-surface-sunken">
                {c.imageUrl ? (
                  <img src={resolveFileUrl(c.imageUrl)} alt={c.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="grid h-full w-full place-items-center">
                    <BookOpen size={40} className="text-gold/50" strokeWidth={1.5} />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-navy-deep/85 to-transparent p-3">
                  {c.monthAr ? (
                    <Badge variant="gold" icon={<CalendarDays size={11} />}>{c.monthAr}</Badge>
                  ) : (
                    <Badge variant="outline">بدون شهر</Badge>
                  )}
                  <Badge variant={c.subject === 'History' ? 'gold' : c.subject === 'Geography' ? 'success' : 'warning'}>{c.subjectAr}</Badge>
                </div>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold leading-snug text-text-primary">{c.title}</h3>
                </div>
                <p className="mt-1 text-xs text-text-muted">{c.stageAr}</p>
                <p className="mt-2 line-clamp-2 text-sm text-text-secondary">{c.description || 'كورس بدون وصف.'}</p>
                <div className="mt-auto flex items-center gap-4 border-t border-border-soft pt-3 text-xs text-text-muted">
                  <span className="flex items-center gap-1.5">
                    <BookOpen size={13} className="text-gold" /> {c.lessonCount} درس
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileText size={13} className="text-gold" /> {c.examCount} امتحان
                  </span>
                  <span className="ms-auto flex items-center gap-1 text-[11px] font-semibold text-gold">
                    ادخل المحتوى <ChevronLeft size={13} />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
