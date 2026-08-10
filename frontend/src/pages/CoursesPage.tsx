import { BookOpen, FileText, Map } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CompassLoader } from '../design-system/components/CompassLoader';
import { HistoricalSectionHeader } from '../design-system/components/HistoricalSectionHeader';
import { Badge } from '../design-system/ui/Badge';
import { Card } from '../design-system/ui/Card';
import { EmptyState } from '../design-system/ui/EmptyState';
import { ErrorState } from '../design-system/ui/ErrorState';
import { Pagination } from '../design-system/ui/Pagination';
import { api } from '../lib/api';
import type { CourseDto, Subject } from '../lib/types';

const SUBJECT_FILTERS: { value: Subject | 'All'; label: string }[] = [
  { value: 'All', label: 'كل المواد' },
  { value: 'SocialStudies', label: 'الدراسات الاجتماعية' },
  { value: 'History', label: 'التاريخ' },
  { value: 'Geography', label: 'الجغرافيا' },
];

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState<Subject | 'All'>('All');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    const params = new URLSearchParams();
    if (subject !== 'All') params.set('subject', subject);

    api
      .get<CourseDto[]>(`/courses${params.size ? `?${params.toString()}` : ''}`)
      .then(setCourses)
      .catch((e) => setError(e instanceof Error ? e.message : 'فشل تحميل المواد'))
      .finally(() => setLoading(false));
  }, [subject]);

  const filtered = useMemo(() => courses, [courses]);
  const totalPages = Math.max(Math.ceil(filtered.length / pageSize), 1);
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => setPage(1), [subject]);

  if (loading) return <CompassLoader text="بنرسم خريطة المواد..." />;
  if (error) return <ErrorState title={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <HistoricalSectionHeader
        number="المواد"
        title="خريطة المواد"
        subtitle="COURSES"
        align="center"
      >
        اختار مادتك وابدأ رحلة المحطات — كل مادة فيها دروس وامتحانات بتكسب بيها ميداليات.
      </HistoricalSectionHeader>

      {/* Subject filter */}
      <div className="mt-10 flex flex-wrap justify-center gap-2">
        {SUBJECT_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setSubject(f.value)}
            className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-colors ${
              subject === f.value
                ? 'border-gold bg-gold text-navy-deep'
                : 'border-border-soft bg-surface text-text-secondary hover:border-gold/50 hover:text-gold'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {current.length === 0 ? (
        <EmptyState icon="map" title="مفيش مواد هنا" description="جرب فلتر تاني أو رجّع الصفحة." className="mt-16" />
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {current.map((c, i) => (
            <Link to={`/courses/${c.id}`} key={c.id}>
              <Card variant="course" hoverable className="group h-full">
                <div className="mb-4 flex items-start justify-between">
                  <Map size={26} className="text-gold transition-transform duration-500 group-hover:scale-110" strokeWidth={1.5} />
                <Badge variant={c.subject === 'History' ? 'gold' : c.subject === 'Geography' ? 'success' : 'warning'}>
                  {c.subjectAr}
                </Badge>
                </div>
                <h3 className="text-lg font-bold text-text-primary">{c.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-text-secondary">{c.description}</p>
                <div className="mt-5 flex items-center gap-4 border-t border-border-soft pt-4 text-xs text-text-muted">
                  <span className="flex items-center gap-1.5">
                    <BookOpen size={13} className="text-gold" /> {c.lessonCount} درس
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileText size={13} className="text-gold" /> {c.examCount} امتحان
                  </span>
                  <span className="ms-auto">{c.stageAr}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex justify-center">
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
