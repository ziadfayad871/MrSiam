import { CheckCircle2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CompassLoader } from '../../design-system/components/CompassLoader';
import { Badge } from '../../design-system/ui/Badge';
import { Card } from '../../design-system/ui/Card';
import { EmptyState } from '../../design-system/ui/EmptyState';
import { ErrorState } from '../../design-system/ui/ErrorState';
import { api } from '../../lib/api';
import type { MyCenterExamResultDto } from '../../lib/types';

export default function StudentCenterResultsPage() {
  const [results, setResults] = useState<MyCenterExamResultDto[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<MyCenterExamResultDto[]>('/center-exams/my')
      .then(setResults)
      .catch((e) => setError(e instanceof Error ? e.message : 'فشل تحميل النتايج'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CompassLoader text="بنجيب نتايجك..." />;
  if (error) return <ErrorState title={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[.16em] text-gold">نتائجي</p>
          <h1 className="display-serif mt-2 text-3xl font-extrabold text-text-primary">نتائجي</h1>
          <p className="mt-2 text-sm text-text-muted">درجات امتحانات السنتر (الورقية) اللي اتسجلت باسمك.</p>
        </div>
      </header>

      {!results || results.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon="map" title="مفيش نتايج لسه" description="لما المدرسة تسجل درجاتك في امتحان سنتر، هتظهر هنا فورًا." />
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-3">
          {results.map((r) => (
            <Card key={r.examId}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-text-primary">{r.examTitle}</p>
                    <span className="rounded-full bg-border-soft px-2 py-0.5 text-[10px] font-bold text-text-secondary">
                      {new Date(r.examDate).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-text-muted">
                    {r.courseTitle}
                    {r.notes ? ` · ${r.notes}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-center">
                    <p className="text-lg font-extrabold text-text-primary">
                      {r.score}<span className="text-xs font-normal text-text-muted">/{r.totalMarks}</span>
                    </p>
                    <p className="text-[10px] text-text-muted">{r.percentage}٪</p>
                  </div>
                  <Badge variant={r.passed ? 'success' : 'warning'}>
                    {r.passed ? 'ناجح' : 'يحتاج مراجعة'}
                  </Badge>
                  <span className={r.passed ? 'text-success' : 'text-error'}>
                    {r.passed ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link to="/courses" className="text-sm font-semibold text-gold underline underline-offset-2">
          ارجع للمقررات
        </Link>
      </div>
    </div>
  );
}