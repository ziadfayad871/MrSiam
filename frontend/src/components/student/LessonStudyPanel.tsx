import { BookOpen, Check, Copy, Lightbulb, ListTree, RotateCcw, Shuffle } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../../design-system/ui/Toast';
import { Badge } from '../../design-system/ui/Badge';
import { api } from '../../lib/api';
import type { CompareResultDto, FlashcardDto, LessonDto, StudySummaryResultDto } from '../../lib/types';

type Tab = 'summary' | 'flashcards' | 'compare';

export default function LessonStudyPanel({ lesson, courseLessons }: { lesson: LessonDto | null; courseLessons: LessonDto[] }) {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('summary');

  // Summary
  const [summary, setSummary] = useState<StudySummaryResultDto | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Flashcards
  const [cards, setCards] = useState<FlashcardDto[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [flip, setFlip] = useState<number | null>(null);
  const [known, setKnown] = useState<Set<number>>(new Set());

  // Compare
  const [topicA, setTopicA] = useState('');
  const [topicB, setTopicB] = useState('');
  const [compare, setCompare] = useState<CompareResultDto | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  async function loadSummary() {
    if (!lesson) return;
    setSummaryLoading(true);
    setSummary(null);
    try {
      const r = await api.post<StudySummaryResultDto>('/study/summary', { lessonId: lesson.id, maxWords: 200 });
      setSummary(r);
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'مش عارف ألخص الدرس دلوقتي');
    } finally {
      setSummaryLoading(false);
    }
  }

  async function loadCards() {
    if (!lesson) return;
    setCardsLoading(true);
    setCards([]);
    setFlip(null);
    setKnown(new Set());
    try {
      const r = await api.post<FlashcardDto[]>('/study/flashcards', { lessonId: lesson.id, count: 8 });
      setCards(r);
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'مش عارف أبني البطاقات دلوقتي');
    } finally {
      setCardsLoading(false);
    }
  }

  async function runCompare() {
    if (!topicA.trim() || !topicB.trim()) {
      toast('error', 'اكتب الموضوعين اللي عايز تقارنهم');
      return;
    }
    setCompareLoading(true);
    setCompare(null);
    try {
      const r = await api.post<CompareResultDto>('/study/compare', {
        courseId: courseLessons[0]?.courseId ?? 0,
        topicA: topicA.trim(),
        topicB: topicB.trim(),
      });
      setCompare(r);
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'مش عارف أقارن دلوقتي');
    } finally {
      setCompareLoading(false);
    }
  }

  const courseTitle = lesson?.title ?? '';

  return (
    <div className="mt-5 rounded-lg border border-border-soft bg-surface/50 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-text-primary">
          <BookOpen size={15} className="text-gold" /> المساعد الدراسي
        </h3>
        <div className="flex gap-1">
          {(
            [
              { key: 'summary', label: 'ملخص', icon: <ListTree size={13} /> },
              { key: 'flashcards', label: 'بطاقات تعلم', icon: <Shuffle size={13} /> },
              { key: 'compare', label: 'قارن موضوعين', icon: <Lightbulb size={13} /> },
            ] as { key: Tab; label: string; icon: React.ReactNode }[]
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-bold transition-colors ${
                tab === t.key
                  ? 'border-gold bg-gold text-navy-deep'
                  : 'border-border-soft bg-surface text-text-secondary hover:border-gold/50 hover:text-gold'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'summary' && (
        <div>
          <p className="mb-3 text-xs text-text-muted">
            الملخص بيتولد من محتوى الدرس نفسه بالذكاء الاصطناعي — من غير إضافات من بره المنهج.
          </p>
          {summaryLoading ? (
            <div className="flex items-center gap-2 py-6 text-xs text-text-muted">
              <RotateCcw size={14} className="animate-spin text-gold" /> بنلخص الدرس...
            </div>
          ) : summary ? (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-bold text-gold">{summary.title}</p>
                <button
                  onClick={() => void loadSummary()}
                  className="flex items-center gap-1 text-[11px] text-text-muted hover:text-gold"
                >
                  <RotateCcw size={12} /> لخّص تاني
                </button>
              </div>
              <ul className="flex flex-col gap-1.5">
                {summary.bullets.map((b, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-relaxed text-text-secondary">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <button
              onClick={() => void loadSummary()}
              disabled={!lesson}
              className="rounded-full border border-gold/50 px-5 py-1.5 text-xs font-bold text-gold transition-colors hover:bg-gold hover:text-navy-deep disabled:opacity-50"
            >
              ولّد الملخص
            </button>
          )}
        </div>
      )}

      {tab === 'flashcards' && (
        <div>
          <p className="mb-3 text-xs text-text-muted">
            بطاقات ذاكرة من الدرس — افتح البطاقة وجاوب من دماغك الأول.
          </p>
          {cardsLoading ? (
            <div className="flex items-center gap-2 py-6 text-xs text-text-muted">
              <RotateCcw size={14} className="animate-spin text-gold" /> بنبني البطاقات...
            </div>
          ) : cards.length > 0 ? (
            <div>
              <div className="grid gap-2 sm:grid-cols-2">
                {cards.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setFlip(flip === i ? null : i)}
                    className={`min-h-28 rounded-lg border p-3 text-start transition-colors ${
                      flip === i ? 'border-gold/60 bg-gold/10' : 'border-border-soft bg-surface hover:border-gold/40'
                    }`}
                  >
                    {flip === i ? (
                      <p className="text-sm leading-relaxed text-text-primary">
                        <span className="font-bold text-gold">الإجابة: </span>
                        {c.back}
                      </p>
                    ) : (
                      <p className="text-sm font-bold text-text-primary">{c.front}</p>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setKnown(new Set(cards.map((_, i) => i)))}
                  className="flex items-center gap-1 rounded-full border border-border-soft px-4 py-1 text-[11px] font-bold text-text-secondary hover:border-gold/50 hover:text-gold"
                >
                  <Check size={12} /> كلها معايا ({known.size}/{cards.length})
                </button>
                <button
                  onClick={() => void loadCards()}
                  className="flex items-center gap-1 rounded-full border border-gold/50 px-4 py-1 text-[11px] font-bold text-gold hover:bg-gold hover:text-navy-deep"
                >
                  <Shuffle size={12} /> بطاقات جديدة
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => void loadCards()}
              disabled={!lesson}
              className="rounded-full border border-gold/50 px-5 py-1.5 text-xs font-bold text-gold transition-colors hover:bg-gold hover:text-navy-deep disabled:opacity-50"
            >
              ولّد البطاقات
            </button>
          )}
        </div>
      )}

      {tab === 'compare' && (
        <div>
          <p className="mb-3 text-xs text-text-muted">
            قارن أي موضوعين موجودين في مادة «{courseTitle || 'الدرس الحالي'}» — المقارنة من محتوى الدروس بس.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={topicA}
              onChange={(e) => setTopicA(e.target.value)}
              placeholder="الموضوع الأول (مثلاً: الآلة البخارية)"
              className="min-w-0 flex-1 rounded-md border border-border-soft bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-gold/60"
            />
            <input
              value={topicB}
              onChange={(e) => setTopicB(e.target.value)}
              placeholder="الموضوع الثاني (مثلاً: السكك الحديدية)"
              className="min-w-0 flex-1 rounded-md border border-border-soft bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-gold/60"
            />
            <button
              onClick={() => void runCompare()}
              disabled={compareLoading || !lesson}
              className="shrink-0 rounded-md border border-gold/50 px-5 py-2 text-xs font-bold text-gold transition-colors hover:bg-gold hover:text-navy-deep disabled:opacity-50"
            >
              {compareLoading ? 'بنقارن...' : 'قارن'}
            </button>
          </div>
          {compare && (
            <div className="mt-4">
              <div className="mb-3 flex items-center gap-2">
                <Badge variant="gold">{compare.topicA}</Badge>
                <span className="text-xs text-text-muted">مقابل</span>
                <Badge variant="warning">{compare.topicB}</Badge>
              </div>
              <div className="flex flex-col gap-2">
                {compare.points.map((p, i) => (
                  <div key={i} className="rounded-md border border-border-soft p-3">
                    <p className="mb-1.5 text-[11px] font-bold text-gold">{p.aspect}</p>
                    <div className="grid gap-1 text-xs leading-relaxed text-text-secondary sm:grid-cols-2">
                      <p>
                        <span className="font-bold text-text-primary">{compare.topicA}: </span>
                        {p.first}
                      </p>
                      <p>
                        <span className="font-bold text-text-primary">{compare.topicB}: </span>
                        {p.second}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const lines = compare.points.map((p) => `${p.aspect}: ${compare.topicA} = ${p.first} | ${compare.topicB} = ${p.second}`).join('\n');
                  void navigator.clipboard.writeText(lines);
                  toast('success', 'تم نسخ المقارنة');
                }}
                className="mt-3 flex items-center gap-1 text-[11px] text-text-muted hover:text-gold"
              >
                <Copy size={12} /> انسخ المقارنة
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
