'use client';

import { Award, BookOpen, FileText, GraduationCap, Map, Search, Sparkles, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card } from '@/design-system/ui/Card';
import { Button } from '@/design-system/ui/Button';
import { Badge } from '@/design-system/ui/Badge';
import { CompassLoader } from '@/design-system/components/CompassLoader';
import { EmptyState } from '@/design-system/ui/EmptyState';
import { api } from '@/lib/api';
import type { CourseDto, ExamListItemDto, AchievementDto } from '@/lib/types';

interface SearchResult {
  courses: CourseDto[];
  exams: ExamListItemDto[];
  achievements: AchievementDto[];
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localQuery, setLocalQuery] = useState(query);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ courses: [], exams: [], achievements: [] });
      return;
    }
    setLoading(true);
    setError(null);
    api
      .get<SearchResult>(`/search?q=${encodeURIComponent(query.trim())}`)
      .then(setResults)
      .catch((e: Error) => setError(e instanceof Error ? e.message : 'فشل البحث'))
      .finally(() => setLoading(false));
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      setSearchParams({ q: localQuery.trim() });
    }
  };

  const highlight = (text: string) => {
    if (!query.trim()) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${query.trim()})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.trim().toLowerCase() ? (
            <mark key={i} className="search-highlight">{part}</mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="display-serif text-2xl font-bold text-text-primary">نتائج البحث</h1>
        <p className="mt-1 text-sm text-text-muted">
          {query ? `نتائج لـ "${query}"` : 'ابدأ بالبحث لاكتشاف المحتوى'}
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search size={20} className="absolute inset-y-0 start-4 flex items-center text-text-muted" aria-hidden />
          <input
            type="search"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="ابحث في المقررات، الامتحانات، الميداليات..."
            className="w-full rounded-md border border-border-soft bg-surface pl-10 pr-4 py-3 text-sm text-text-primary outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
            autoFocus
          />
        </div>
        <Button type="submit" variant="gold" icon={<Search size={18} />} disabled={!localQuery.trim()}>
          بحث
        </Button>
      </form>

      {loading ? (
        <CompassLoader text="نبحث في الخرائط..." />
      ) : error ? (
        <EmptyState icon="compass" title="خطأ في البحث" description={error} />
      ) : results ? (
        <>
          {(results.courses.length > 0 || results.exams.length > 0 || results.achievements.length > 0) ? (
            <>
              {results.courses.length > 0 && (
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-text-primary">
                      <Map size={20} className="text-gold" />
                      المقررات ({results.courses.length})
                    </h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {results.courses.map((course) => (
                      <Link key={course.id} to={`/courses/${course.id}`} className="block">
                        <Card hoverable className="h-full">
                          <div className="flex items-start gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                              <BookOpen size={20} className="text-gold" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-text-primary">{highlight(course.title)}</h3>
                              <p className="mt-1 text-sm text-text-muted">{course.description}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Badge variant="neutral" icon={<Target size={12} />}>
                                  {course.lessonCount} درس
                                </Badge>
                                <Badge variant="neutral" icon={<FileText size={12} />}>
                                  {course.examCount} امتحان
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {results.exams.length > 0 && (
                <section className="mt-8">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-text-primary">
                      <FileText size={20} className="text-gold" />
                      الامتحانات ({results.exams.length})
                    </h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {results.exams.map((exam) => (
                      <Link key={exam.id} to={`/exam/${exam.id}`} className="block">
                        <Card hoverable className="h-full border-gold/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-error/10">
                                <FileText size={18} className="text-error" />
                              </div>
                              <div>
                                <h3 className="font-bold text-text-primary">{highlight(exam.title)}</h3>
                                <p className="text-sm text-text-muted">{exam.courseTitle}</p>
                              </div>
                            </div>
                            <Badge variant="gold" icon={<Sparkles size={12} />}>
                              {exam.questionCount} سؤال
                            </Badge>
                          </div>
                          <div className="mt-3 flex items-center gap-4 text-sm text-text-muted">
                            <span className="flex items-center gap-1">
                              <GraduationCap size={14} />
                              {exam.durationMinutes} دقيقة
                            </span>
                            <span className="flex items-center gap-1">
                              <Target size={14} />
                              {exam.questionCount} سؤال
                            </span>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {results.achievements.length > 0 && (
                <section className="mt-8">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-text-primary">
                      <Award size={20} className="text-gold" />
                      الميداليات ({results.achievements.length})
                    </h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {results.achievements.map((achievement) => (
                      <Link key={achievement.id} to={`/achievements`} className="block">
                        <Card hoverable className="h-full">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold/10">
                              <span className="text-2xl">{achievement.icon}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-text-primary">{highlight(achievement.title)}</h3>
                              <p className="mt-1 text-sm text-text-muted">{highlight(achievement.description)}</p>
                              <Badge variant="gold" icon={<Sparkles size={12} />}>
                                {achievement.title} — {achievement.order} من {results.achievements.length}
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <EmptyState
              icon="compass"
              title="لا توجد نتائج"
              description={`لم نجد أي نتائج مطابقة لـ "${query}"`}
            />
          )}
        </>
      ) : null}
    </div>
  );
}