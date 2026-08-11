import { BookOpen, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CompassLoader } from '../../design-system/components/CompassLoader';
import { Card } from '../../design-system/ui/Card';
import { EmptyState } from '../../design-system/ui/EmptyState';
import { ErrorState } from '../../design-system/ui/ErrorState';
import { api } from '../../lib/api';
import type { MistakeDto } from '../../lib/types';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'اليوم';
  if (days < 30) return `من ${days} يوم`;
  return new Date(iso).toLocaleDateString('ar-EG');
}

export default function MistakesPage() {
  const [mistakes, setMistakes] = useState<MistakeDto[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [explainingId, setExplainingId] = useState<number | null>(null);
  const [explained, setExplained] = useState<Record<number, string>>({});
  const [explainError, setExplainError] = useState<string | null>(null);

  const load = () => {
    api
      .get<MistakeDto[]>('/student/mistakes')
      .then((d) => setMistakes(d))
      .catch((e) => setError(e instanceof Error ? e.message : 'فشل تحميل الكراسة'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const remove = async (id: number) => {
    try {
      await api.del(`/student/mistakes/${id}`);
      setMistakes((m) => (m ? m.filter((x) => x.id !== id) : m));
    } catch {
      setExplainError('مقدرناش نحذف الخطأ — جرب تاني');
    }
  };

  const explain = async (id: number) => {
    setExplainingId(id);
    setExplainError(null);
    try {
      const text = await api.post<string>(`/student/mistakes/${id}/explain`);
      setExplained((e) => ({ ...e, [id]: text }));
    } catch (e) {
      setExplainError(e instanceof Error ? e.message : 'التوضيح مش متاح دلوقتي — جرب تاني بعد شوية');
    } finally {
      setExplainingId(null);
    }
  };

  if (loading) return <CompassLoader text="بنفتح كراسة أخطائك..." />;
  if (error) return <ErrorState title={error} onRetry={load} />;
  if (!mistakes) return null;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="rounded-lg border border-gold/20 bg-parchment-soft p-6 shadow-soft">
        <p className="text-xs font-semibold text-gold">سجل أخطائك هنا.. وطريقك للمراجعة يبدأ</p>
        <h1 className="display-serif mt-1 text-2xl font-bold text-text-primary">كراسة الأخطاء 📖</h1>
        <p className="mt-1 text-xs text-text-muted">
          كل سؤال غلطت فيه بيتسجل تلقائياً مع إجابتك والإجابة الصحيحة — ولو حبيت تفهم غلطتك، اضغط "اشرحلي غلطتي".
        </p>
      </div>

      {mistakes.length === 0 && (
        <EmptyState
          icon="scroll"
          title="الكراسة فاضية"
          description="مفيش أخطاء مسجلة — أنت كده كويس جداً! ولو غلطت، أول امتحان بيحط أول ورقة في الكراسة."
        />
      )}

      <div className="flex flex-col gap-4">
        {mistakes.map((m) => (
          <Card key={m.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold text-gold">{m.lessonTitle}</p>
                <h3 className="mt-1 text-sm font-bold text-text-primary">{m.questionText}</h3>
              </div>
              <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                غلطت فيها {m.wrongCount} مرة
              </span>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
                <p className="text-[10px] font-bold text-red-700">إجابتك</p>
                <p className="mt-0.5 text-xs text-text-secondary">{m.studentAnswer}</p>
              </div>
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
                <p className="text-[10px] font-bold text-emerald-700">الإجابة الصحيحة</p>
                <p className="mt-0.5 text-xs text-text-secondary">{m.correctAnswer}</p>
              </div>
            </div>

            <p className="mt-2.5 rounded-md bg-parchment-soft px-3 py-2 text-xs text-text-secondary">
              <span className="font-bold text-text-primary">لما يتقال: </span>
              {m.explanation}
            </p>

            {explained[m.id] && (
              <div className="mt-3 rounded-md border border-gold/30 bg-gold/5 px-3 py-2.5">
                <p className="flex items-center gap-1 text-[10px] font-bold text-gold">
                  <Sparkles size={12} /> شرح أبو كيان لغلطتك
                </p>
                <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-text-secondary">{explained[m.id]}</p>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] text-text-muted">{timeAgo(m.lastWrongAt)}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => explain(m.id)}
                  disabled={explainingId === m.id}
                  className="flex items-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-bold text-gold transition-colors hover:bg-gold hover:text-navy-deep disabled:opacity-50"
                >
                  <Sparkles size={13} />
                  {explainingId === m.id ? 'بنفكر...' : 'اشرحلي غلطتي'}
                </button>
                <button
                  onClick={() => remove(m.id)}
                  className="flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-100"
                >
                  <Trash2 size={13} /> احذف
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {explainError && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{explainError}</p>}
    </div>
  );
}
