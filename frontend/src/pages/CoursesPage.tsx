import { BookOpen, FileText, Map, Search, SearchX, X } from 'lucide-react';
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
import type { CourseDto, SearchResultsDto, Subject } from '../lib/types';

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
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResultsDto | null>(null);
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

  const searchingActive = query.trim().length > 0;

  function runSearch() {
    const q = query.trim();
    if (!q || searching) return;
    setSearching(true);
    api
      .get<SearchResultsDto>(`/search?q=${encodeURIComponent(q)}`)
      .then(setResults)
      .catch(() => setResults(null))
      .finally(() => setSearching(false));
  }

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

      {/* Search */}
      <div className="mx-auto mt-8 max-w-2xl">
        <div className="relative">
          <Search size={17} className="absolute start-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!e.target.value.trim()) setResults(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') runSearch();
            }}
            placeholder="دوّر على أي حاجة — مواد، دروس، امتحانات، أسئلة..."
            className="w-full rounded-full border border-border-soft bg-surface py-3 ps-11 pe-10 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-gold/60"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults(null);
              }}
              className="absolute end-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-gold"
              aria-label="مسح البحث"
            >
              <X size={15} />
            </button>
          )}
        </div>
        <div className="mt-2 flex justify-center">
          <button
            onClick={runSearch}
            disabled={searching}
            className="rounded-full border border-gold/50 px-6 py-1.5 text-xs font-bold text-gold transition-colors hover:bg-gold hover:text-navy-deep disabled:opacity-50"
          >
            {searching ? 'بندوّر...' : 'ابحث'}
          </button>
        </div>
      </div>

      {searchingActive && results && (
        <div className="mx-auto mt-8 max-w-3xl rounded-xl border border-border-soft bg-surface/60 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-primary">نتائج البحث «{query.trim()}»</h3>
            <button
              onClick={() => {
                setQuery('');
                setResults(null);
              }}
              className="text-xs text-text-muted hover:text-gold"
            >
              رجّع للمواد
            </button>
          </div>

          {results.courses.length === 0 && results.lessons.length === 0 && results.exams.length === 0 && results.questions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-text-muted">
              <SearchX size={32} strokeWidth={1.5} className="text-gold/60" />
              <p className="text-sm">مفيش نتايج — جرب كلمة تانية</p>
            </div>
          ) : (
            <div className="flex max-h-96 flex-col gap-2 overflow-y-auto pe-1">
              {results.courses.map((c) => (
                <Link
                  key={`c${c.id}`}
                  to={`/courses/${c.id}`}
                  className="flex items-center justify-between rounded-lg border border-border-soft px-3 py-2 text-sm transition-colors hover:border-gold/50"
                >
                  <span className="font-bold text-text-primary">{c.title}</span>
                  <Badge variant="gold">مادة</Badge>
                </Link>
              ))}
              {results.lessons.map((l) => (
                <Link
                  key={`l${l.id}`}
                  to={`/courses/${l.courseId}?lesson=${l.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border-soft px-3 py-2 text-sm transition-colors hover:border-gold/50"
                >
                  <span className="truncate text-text-primary">{l.title}</span>
                  <Badge variant="warning">درس</Badge>
                </Link>
              ))}
              {results.exams.map((x) => (
                <Link
                  key={`e${x.id}`}
                  to={`/exams/${x.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border-soft px-3 py-2 text-sm transition-colors hover:border-gold/50"
                >
                  <span className="truncate text-text-primary">{x.title}</span>
                  <Badge variant="success">امتحان</Badge>
                </Link>
              ))}
              {results.questions.map((q) => (
                <div key={`q${q.id}`} className="rounded-lg border border-border-soft px-3 py-2 text-sm">
                  <p className="truncate text-text-primary">{q.text}</p>
                  <p className="mt-1 text-[11px] text-text-muted">سؤال بنك الأسئلة{q.examTitle ? ` — من «${q.examTitle}»` : ''}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
