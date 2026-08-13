import { BrainCircuit, Check, Database, FileUp, Loader2, Plus, RefreshCw, Search, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '../../design-system/ui/Toast';
import { Badge } from '../../design-system/ui/Badge';
import { Modal } from '../../design-system/ui/Modal';
import { Input } from '../../design-system/ui/Field';
import { api } from '../../lib/api';
import type { AiExamDraftDto, CourseDto, ExamType, LessonDto, QuestionBankItemDto } from '../../lib/types';

interface Props {
  courses: CourseDto[];
  onContentChanged: () => void;
}

export default function AiToolsPanel({ courses, onContentChanged }: Props) {
  const { toast } = useToast();
  const [tab, setTab] = useState<'ai' | 'bank'>('ai');

  // AI generator state
  const [courseId, setCourseId] = useState<number | 0>(0);
  const [lessonIds, setLessonIds] = useState<number[]>([]);
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState('متوسط');
  const [draft, setDraft] = useState<AiExamDraftDto | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // PDF upload state
  const [pdf, setPdf] = useState<File | null>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  // Save-as-exam state
  const [saveModal, setSaveModal] = useState(false);
  const [saveForm, setSaveForm] = useState<{ title: string; type: ExamType; durationMinutes: number; attemptsAllowed: number; isPublished: boolean; lessonId: number }>({
    title: '',
    type: 'Lesson',
    durationMinutes: 10,
    attemptsAllowed: 3,
    isPublished: false,
    lessonId: 0,
  });
  const [saving, setSaving] = useState(false);

  // Bank state
  const [bankCourseId, setBankCourseId] = useState<number | 0>(0);
  const [search, setSearch] = useState('');
  const [bank, setBank] = useState<QuestionBankItemDto[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankLessons, setBankLessons] = useState<LessonDto[]>([]);
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ lessonId: 0, text: '', option1: '', option2: '', option3: '', option4: '', correct: 1 });
  const [randomModal, setRandomModal] = useState(false);
  const [randomForm, setRandomForm] = useState({ count: 5, title: '', durationMinutes: 10, attemptsAllowed: 3, isPublished: false });

  const activeCourse = courses.find((c) => c.id === courseId) ?? null;
  const [lessons, setLessons] = useState<LessonDto[]>([]);

  useEffect(() => {
    setLessonIds([]);
    setDraft(null);
    setLessons([]);
    if (!courseId) return;
    api
      .get<LessonDto[]>(`/courses/${courseId}/lessons`)
      .then(setLessons)
      .catch(() => setLessons([]));
  }, [courseId]);

  function toggleLesson(id: number) {
    setLessonIds((ls) => (ls.includes(id) ? ls.filter((x) => x !== id) : [...ls, id]));
  }

  async function generate() {
    if (!courseId) {
      toast('اختار المادة الأول', '', 'error');
      return;
    }
    if (!topic.trim()) {
      toast('اكتب الموضوع اللي تريد أسئلته', '', 'error');
      return;
    }
    setGenerating(true);
    setGenError(null);
    try {
      if (pdf) {
        const fd = new FormData();
        fd.append('courseId', String(courseId));
        lessonIds.forEach((id) => fd.append('lessonIds', String(id)));
        fd.append('topic', topic.trim());
        fd.append('questionCount', String(count));
        fd.append('difficulty', difficulty);
        fd.append('pdf', pdf);
        const d = await api.upload<AiExamDraftDto>('/teacher-content/ai/exams/generate-from-pdf', fd);
        setDraft(d);
        setSaveForm((f) => ({ ...f, title: d.title }));
        toast(`اتولّد ${d.questions.length} سؤال من الملف`, '', 'success');
      } else {
        const d = await api.post<AiExamDraftDto>('/teacher-content/ai/exams/generate', {
          courseId,
          lessonIds,
          topic: topic.trim(),
          questionCount: count,
          difficulty,
        });
        setDraft(d);
        setSaveForm((f) => ({ ...f, title: d.title }));
        toast(`اتولّد ${d.questions.length} سؤال من المنهج`, '', 'success');
      }
    } catch (err) {
      setDraft(null);
      setGenError(err instanceof Error ? err.message : 'فشل التوليد');
      toast('فشل التوليد', err instanceof Error ? err.message : 'خطأ', 'error');
    } finally {
      setGenerating(false);
    }
  }

  async function saveDraft() {
    if (!draft || !courseId) return;
    setSaving(true);
    try {
      const examId = await api.post<number>('/teacher-content/ai/exams/save', {
        courseId,
        lessonId: saveForm.lessonId || (draft.questions.find((q) => q.lessonId)?.lessonId ?? null),
        title: saveForm.title,
        type: saveForm.type,
        durationMinutes: Number(saveForm.durationMinutes) || 10,
        attemptsAllowed: Number(saveForm.attemptsAllowed) || 3,
        isPublished: saveForm.isPublished,
        questions: draft.questions,
      });
      toast(saveForm.isPublished ? 'اتنشر الامتحان للطلاب ✓' : 'اتحفظ كمسودة — افتحه من قائمة الامتحانات لتعديله', '', 'success');
      setSaveModal(false);
      setDraft(null);
      setTopic('');
      onContentChanged();
      return examId;
    } catch (err) {
      toast('فشل الحفظ', err instanceof Error ? err.message : 'خطأ', 'error');
      return null;
    } finally {
      setSaving(false);
    }
  }

  function loadBank() {
    setBankLoading(true);
    const params = new URLSearchParams({ pageSize: '30' });
    if (bankCourseId) params.set('courseId', String(bankCourseId));
    if (search.trim()) params.set('q', search.trim());
    api
      .get<{ items: QuestionBankItemDto[] }>(`/question-bank?${params}`)
      .then((d) => setBank(d.items))
      .catch(() => toast('فشل تحميل البنك', '', 'error'))
      .finally(() => setBankLoading(false));
  }

  useEffect(() => {
    if (tab === 'bank') loadBank();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    setAddForm((f) => ({ ...f, lessonId: 0 }));
    if (!bankCourseId) {
      setBankLessons([]);
      return;
    }
    api
      .get<LessonDto[]>(`/courses/${bankCourseId}/lessons`)
      .then(setBankLessons)
      .catch(() => setBankLessons([]));
  }, [bankCourseId]);

  async function deleteQuestion(id: number) {
    if (!window.confirm('حذف السؤال من البنك؟')) return;
    try {
      await api.del(`/question-bank/${id}`);
      toast('اتحذف السؤال', '', 'success');
      loadBank();
    } catch (err) {
      toast('فشل الحذف', err instanceof Error ? err.message : 'خطأ', 'error');
    }
  }

  async function addQuestion() {
    const options = [addForm.option1, addForm.option2, addForm.option3, addForm.option4].filter((o) => o.trim());
    if (!addForm.text.trim() || options.length < 2) {
      toast('نص السؤال + خيارين على الأقل', '', 'error');
      return;
    }
    try {
      await api.post('/question-bank', {
        lessonId: addForm.lessonId || null,
        text: addForm.text.trim(),
        options,
        correctIndex: Math.min(addForm.correct - 1, options.length - 1),
      });
      toast('اتضاف السؤال للبنك', '', 'success');
      setAddModal(false);
      setAddForm({ lessonId: 0, text: '', option1: '', option2: '', option3: '', option4: '', correct: 1 });
      loadBank();
    } catch (err) {
      toast('فشل الإضافة', err instanceof Error ? err.message : 'خطأ', 'error');
    }
  }

  async function randomExam() {
    if (!bankCourseId) {
      toast('اختار المادة الأول', '', 'error');
      return;
    }
    try {
      const id = await api.post<number>('/question-bank/random-exam', {
        courseId: bankCourseId,
        title: randomForm.title.trim() || 'اختبار من البنك',
        type: 'Lesson',
        durationMinutes: Number(randomForm.durationMinutes) || 10,
        attemptsAllowed: Number(randomForm.attemptsAllowed) || 3,
        count: Number(randomForm.count) || 5,
        isPublished: randomForm.isPublished,
      });
      toast('اتعمل الامتحان العشوائي ✓', '', 'success');
      setRandomModal(false);
      onContentChanged();
      return id;
    } catch (err) {
      toast('فشل التوليد', err instanceof Error ? err.message : 'خطأ', 'error');
      return null;
    }
  }

  return (
    <div className="rounded-lg border border-gold/25 bg-parchment-soft p-4 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-text-primary">
            <BrainCircuit size={17} className="text-gold" /> الأدوات الذكية
          </h3>
          <p className="text-[11px] text-text-muted">مولّد امتحانات بالذكاء الاصطناعي من محتوى المنهج فقط + بنك الأسئلة.</p>
        </div>
        <div className="flex gap-1 rounded-md border border-border-soft bg-surface p-1">
          <button
            onClick={() => setTab('ai')}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold transition-colors ${tab === 'ai' ? 'bg-gold text-navy-deep' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <Wand2 size={13} /> مولّد الامتحانات
          </button>
          <button
            onClick={() => setTab('bank')}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold transition-colors ${tab === 'bank' ? 'bg-gold text-navy-deep' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <Database size={13} /> بنك الأسئلة
          </button>
        </div>
      </div>

      {tab === 'ai' && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {/* Generator form */}
          <div className="flex flex-col gap-3 rounded-md border border-border-soft bg-surface p-4">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-text-secondary">المادة</label>
              <select
                value={courseId}
                onChange={(e) => {
                  setCourseId(Number(e.target.value));
                  setLessonIds([]);
                  setDraft(null);
                }}
                className="w-full rounded-md border border-border-soft bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-gold/60"
              >
                <option value={0}>اختار المادة...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            {activeCourse && (
              <div>
                <label className="mb-1 block text-[11px] font-bold text-text-secondary">
                  الدروس (اختياري — اترك الكل إن المادة كلها)
                </label>
                <div className="max-h-28 overflow-y-auto rounded-md border border-border-soft p-2">
                  {lessons.length === 0 && <p className="text-xs text-text-muted">مفيش دروس للمادة دي</p>}
                  {lessons.map((l) => (
                    <label key={l.id} className="flex cursor-pointer items-center gap-2 text-xs text-text-secondary">
                      <input
                        type="checkbox"
                        className="accent-[#b98a2f]"
                        checked={lessonIds.includes(l.id)}
                        onChange={() => toggleLesson(l.id)}
                      />
                      {l.order}. {l.title}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-[11px] font-bold text-text-secondary">الموضوع</label>
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="مثال: توحيد القطرين وعصر الأسرات" />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold text-text-secondary">ملف المحاضرة PDF (اختياري)</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => pdfRef.current?.click()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md border border-dashed border-gold/40 bg-gold/5 px-3 py-2 text-xs font-semibold text-gold transition-colors hover:bg-gold/10"
                >
                  <FileUp size={14} />
                  {pdf ? pdf.name : 'ارفع الشريحة PDF وخلّي الذكاء الاصطناعي يقراها'}
                </button>
                {pdf && (
                  <button
                    type="button"
                    onClick={() => { setPdf(null); if (pdfRef.current) pdfRef.current.value = ''; }}
                    className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-error/10 hover:text-error"
                    aria-label="حذف الملف"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <input ref={pdfRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => setPdf(e.target.files?.[0] ?? null)} />
              <p className="mt-1 text-[10px] text-text-muted">ارفع ملف المحاضرة — الذكاء الاصطناعي هيقراه هيولّد الأسئلة منه مباشرة.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-text-secondary">عدد الأسئلة</label>
                <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full rounded-md border border-border-soft bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-gold/60">
                  {[3, 5, 8, 10, 15, 20].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-text-secondary">المستوى</label>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full rounded-md border border-border-soft bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-gold/60">
                  <option>سهل</option>
                  <option>متوسط</option>
                  <option>صعب</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => void generate()}
              disabled={generating}
              className="mt-1 flex items-center justify-center gap-2 rounded-md bg-gold px-4 py-2.5 text-sm font-bold text-navy-deep transition-colors hover:bg-gold/90 disabled:opacity-50"
            >
              {generating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {generating ? 'الذكاء الاصطناعي بيفكر في المنهج...' : 'ولّد امتحان من المنهج'}
            </button>

            <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-text-muted">
              <Check size={12} className="mt-0.5 shrink-0 text-success" />
              الأسئلة بتتولّد من محتوى المنهج الموجود على المنصة فقط + فحص تلقائي لاستبعاد أي سؤال مصدره مش موجود في المحتوى. النشر بموافقتك يدوياً.
            </p>
          </div>

          {/* Preview */}
          <div className="flex flex-col gap-2 rounded-md border border-border-soft bg-surface p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-text-primary">معاينة الأسئلة</h4>
              {draft && (
                <button onClick={() => setSaveModal(true)} className="flex items-center gap-1.5 rounded-md bg-gold px-3 py-1.5 text-xs font-bold text-navy-deep transition-colors hover:bg-gold/90">
                  <Plus size={13} /> احفظ كامتحان
                </button>
              )}
            </div>
            {genError && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{genError}</p>}
            {!draft && !generating && !genError && (
              <p className="py-8 text-center text-xs text-text-muted">اختار المادة واكتب الموضوع واضغط توليد — المعاينة تظهر هنا مع المصدر والشرح.</p>
            )}
            {draft && (
              <>
                <p className="text-xs font-bold text-gold">{draft.title} — {draft.questions.length} سؤال</p>
                <div className="flex max-h-96 flex-col gap-2 overflow-y-auto pe-1">
                  {draft.questions.map((q, i) => (
                    <div key={i} className="rounded-md border border-border-soft bg-parchment-soft/60 p-3">
                      <p className="text-xs font-bold text-text-primary">
                        {i + 1}. {q.text}
                        {q.supported && <span className="ms-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">موثوق</span>}
                      </p>
                      <div className="mt-1.5 flex flex-col gap-1">
                        {q.options.map((o, oi) => (
                          <p key={oi} className={`rounded px-2 py-0.5 text-[11px] ${oi === q.correctIndex ? 'bg-emerald-100 font-bold text-emerald-800' : 'text-text-secondary'}`}>
                            {oi === q.correctIndex ? '✓ ' : ''}{o}
                          </p>
                        ))}
                      </div>
                      {q.explanation && <p className="mt-1.5 text-[10px] leading-relaxed text-text-secondary">💡 {q.explanation}</p>}
                      {q.source && <p className="mt-1 text-[10px] font-semibold text-gold">المصدر: {q.source}</p>}
                    </div>
                  ))}
                </div>
                <button onClick={() => void generate()} disabled={generating} className="flex items-center justify-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-bold text-gold transition-colors hover:bg-gold hover:text-navy-deep disabled:opacity-50">
                  <RefreshCw size={13} /> ولّد مجموعة تانية
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'bank' && (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-52 flex-1">
              <label className="mb-1 block text-[11px] font-bold text-text-secondary">بحث</label>
              <div className="relative">
                <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadBank()}
                  placeholder="ابحث بنص السؤال أو اسم الدرس..."
                  className="w-full rounded-md border border-border-soft bg-surface ps-9 pe-3 py-2 text-sm text-text-primary outline-none focus:border-gold/60"
                />
              </div>
            </div>
            <div className="w-56">
              <label className="mb-1 block text-[11px] font-bold text-text-secondary">المادة</label>
              <select value={bankCourseId} onChange={(e) => setBankCourseId(Number(e.target.value))} className="w-full rounded-md border border-border-soft bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-gold/60">
                <option value={0}>كل المواد</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <button onClick={loadBank} className="flex items-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 px-3 py-2 text-xs font-bold text-gold transition-colors hover:bg-gold hover:text-navy-deep">
              <Search size={13} /> بحث
            </button>
            <button onClick={() => setAddModal(true)} className="flex items-center gap-1.5 rounded-md bg-gold px-3 py-2 text-xs font-bold text-navy-deep transition-colors hover:bg-gold/90">
              <Plus size={13} /> أضف سؤال
            </button>
            <button onClick={() => setRandomModal(true)} className="flex items-center gap-1.5 rounded-md border border-border-soft bg-surface px-3 py-2 text-xs font-bold text-text-primary transition-colors hover:border-gold/50">
              <Wand2 size={13} /> امتحان عشوائي
            </button>
          </div>

          {bankLoading ? (
            <div className="py-6 text-center"><Loader2 size={18} className="mx-auto animate-spin text-gold" /></div>
          ) : bank.length === 0 ? (
            <p className="rounded-md border border-dashed border-border-soft py-8 text-center text-xs text-text-muted">
              مفيش أسئلة في البنك — ولّد امتحان بالذكاء الاصطناعي أو أضف سؤال يدوي.
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto rounded-md border border-border-soft">
              {bank.map((q) => (
                <div key={q.id} className="flex flex-col gap-2 border-b border-border-soft/60 px-3 py-2.5 last:border-0 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-text-primary">{q.text}</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                      {q.options.map((o) => (
                        <span key={o.id} className={`text-[10px] ${o.isCorrect ? 'font-bold text-emerald-700' : 'text-text-muted'}`}>
                          {o.isCorrect ? '✓ ' : ''}{o.text}
                        </span>
                      ))}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {q.lessonTitle && <Badge variant="neutral">{q.lessonTitle}</Badge>}
                      {q.sourceExamTitle && <Badge variant="warning">{q.sourceExamTitle}</Badge>}
                      {!q.lessonTitle && !q.sourceExamTitle && <Badge variant="neutral">سؤال مستقل</Badge>}
                    </div>
                  </div>
                  <button onClick={() => void deleteQuestion(q.id)} title="حذف" className="shrink-0 rounded-md p-1.5 text-text-muted transition-colors hover:bg-error/10 hover:text-error">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Save AI exam modal */}
      <Modal open={saveModal} onClose={() => setSaveModal(false)} title="احفظ الامتحان المُولّد">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[11px] font-bold text-text-secondary">اسم الامتحان</label>
            <Input value={saveForm.title} onChange={(e) => setSaveForm({ ...saveForm, title: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[11px] font-bold text-text-secondary">المحاضرة اللي هتروح ليها الأسئلة</label>
            <select value={saveForm.lessonId} onChange={(e) => setSaveForm({ ...saveForm, lessonId: Number(e.target.value) })} className="w-full rounded-md border border-border-soft bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-gold/60">
              <option value={0}>— من غير ما أحطها لمحاضرة محددة —</option>
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>{l.order}. {l.title}</option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-text-muted">اختر المحاضرة ثم اضغط موافق — الأسئلة هتتسجل على المحاضرة دي.</p>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold text-text-secondary">النوع</label>
            <select value={saveForm.type} onChange={(e) => setSaveForm({ ...saveForm, type: e.target.value as ExamType })} className="w-full rounded-md border border-border-soft bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-gold/60">
              <option value="Lesson">درس</option>
              <option value="Unit">وحدة</option>
              <option value="Practice">تدريب</option>
              <option value="Final">نهائي</option>
              <option value="Boss">بوس ⚔️</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold text-text-secondary">المدة (دقائق)</label>
            <Input type="number" value={saveForm.durationMinutes} onChange={(e) => setSaveForm({ ...saveForm, durationMinutes: Number(e.target.value) })} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold text-text-secondary">المحاولات</label>
            <Input type="number" value={saveForm.attemptsAllowed} onChange={(e) => setSaveForm({ ...saveForm, attemptsAllowed: Number(e.target.value) })} />
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border-soft px-3 py-2 text-xs text-text-secondary">
            <input type="checkbox" className="accent-[#b98a2f]" checked={saveForm.isPublished} onChange={(e) => setSaveForm({ ...saveForm, isPublished: e.target.checked })} />
            انشر للطلاب فوراً (موصى به: راجع الأول)
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setSaveModal(false)} className="rounded-md border border-border-soft px-4 py-2 text-xs font-bold text-text-secondary hover:bg-surface-sunken">إلغاء</button>
          <button onClick={() => void saveDraft()} disabled={saving} className="flex items-center gap-1.5 rounded-md bg-gold px-4 py-2 text-xs font-bold text-navy-deep transition-colors hover:bg-gold/90 disabled:opacity-50">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} موافق
          </button>
        </div>
      </Modal>

      {/* Add question modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="أضف سؤال لبنك الأسئلة">
        <div className="grid gap-3">
          <div>
            <label className="mb-1 block text-[11px] font-bold text-text-secondary">الدرس (اختياري)</label>
            <select value={addForm.lessonId} onChange={(e) => setAddForm({ ...addForm, lessonId: Number(e.target.value) })} className="w-full rounded-md border border-border-soft bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-gold/60">
              <option value={0}>بدون درس — سؤال مستقل</option>
              {bankLessons.map((l) => (
                <option key={l.id} value={l.id}>{l.order}. {l.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold text-text-secondary">نص السؤال</label>
            <Input value={addForm.text} onChange={(e) => setAddForm({ ...addForm, text: e.target.value })} />
          </div>
          {[['option1', 'الخيار الأول', 1], ['option2', 'الخيار الثاني', 2], ['option3', 'الخيار الثالث (اختياري)', 3], ['option4', 'الخيار الرابع (اختياري)', 4]].map(([key, label, num]) => (
            <div key={key as string}>
              <label className="mb-1 block text-[11px] font-bold text-text-secondary">{label as string}</label>
              <div className="flex items-center gap-2">
                <Input value={addForm[key as keyof typeof addForm] as string} onChange={(e) => setAddForm({ ...addForm, [key]: e.target.value })} />
                <label className="flex shrink-0 cursor-pointer items-center gap-1 text-[10px] text-text-secondary">
                  <input type="radio" name="correct" className="accent-[#b98a2f]" checked={addForm.correct === (num as number)} onChange={() => setAddForm({ ...addForm, correct: num as number })} />
                  صح
                </label>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setAddModal(false)} className="rounded-md border border-border-soft px-4 py-2 text-xs font-bold text-text-secondary hover:bg-surface-sunken">إلغاء</button>
          <button onClick={() => void addQuestion()} className="rounded-md bg-gold px-4 py-2 text-xs font-bold text-navy-deep transition-colors hover:bg-gold/90">أضف</button>
        </div>
      </Modal>

      {/* Random exam modal */}
      <Modal open={randomModal} onClose={() => setRandomModal(false)} title="امتحان عشوائي من بنك الأسئلة">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[11px] font-bold text-text-secondary">المادة (فلاتر البنك أعلاه)</label>
            <p className="rounded-md border border-border-soft bg-parchment-soft/60 px-3 py-2 text-xs text-text-secondary">
              {courses.find((c) => c.id === bankCourseId)?.title ?? 'كل المواد'}
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[11px] font-bold text-text-secondary">اسم الامتحان</label>
            <Input value={randomForm.title} onChange={(e) => setRandomForm({ ...randomForm, title: e.target.value })} placeholder="مثال: مراجعة شاملة" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold text-text-secondary">عدد الأسئلة</label>
            <Input type="number" value={randomForm.count} onChange={(e) => setRandomForm({ ...randomForm, count: Number(e.target.value) })} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold text-text-secondary">المدة (دقائق)</label>
            <Input type="number" value={randomForm.durationMinutes} onChange={(e) => setRandomForm({ ...randomForm, durationMinutes: Number(e.target.value) })} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[11px] font-bold text-text-secondary">المحاولات</label>
            <Input type="number" value={randomForm.attemptsAllowed} onChange={(e) => setRandomForm({ ...randomForm, attemptsAllowed: Number(e.target.value) })} />
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border-soft px-3 py-2 text-xs text-text-secondary sm:col-span-2">
            <input type="checkbox" className="accent-[#b98a2f]" checked={randomForm.isPublished} onChange={(e) => setRandomForm({ ...randomForm, isPublished: e.target.checked })} />
            انشر للطلاب فوراً
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setRandomModal(false)} className="rounded-md border border-border-soft px-4 py-2 text-xs font-bold text-text-secondary hover:bg-surface-sunken">إلغاء</button>
          <button onClick={() => void randomExam()} className="rounded-md bg-gold px-4 py-2 text-xs font-bold text-navy-deep transition-colors hover:bg-gold/90">ولّد</button>
        </div>
      </Modal>
    </div>
  );
}
