import { CalendarDays, Radio, Video, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Badge } from '../../design-system/ui/Badge';
import { Button } from '../../design-system/ui/Button';
import { Card } from '../../design-system/ui/Card';
import { Input, Select, Textarea } from '../../design-system/ui/Field';
import { api } from '../../lib/api';
import type { CourseDto, LiveLessonDto } from '../../lib/types';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ar-EG', { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
}

export function LiveLessonsPanel() {
  const [lessons, setLessons] = useState<LiveLessonDto[]>([]);
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [form, setForm] = useState({ title: '', description: '', scheduledAt: '', durationMinutes: 60, courseId: '', meetUrl: '' });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api
      .get<LiveLessonDto[]>('/live')
      .then(setLessons)
      .catch(() => setLessons([]));
  }, []);

  useEffect(() => {
    load();
    api
      .get<CourseDto[]>('/courses')
      .then(setCourses)
      .catch(() => setCourses([]));
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.title.trim() || !form.scheduledAt) {
      setError('العنوان والموعد مطلوبان');
      return;
    }
    setSaving(true);
    try {
      await api.post<number>('/live', {
        title: form.title.trim(),
        description: form.description.trim() || null,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        durationMinutes: Number(form.durationMinutes) || 60,
        courseId: form.courseId ? Number(form.courseId) : null,
        meetUrl: form.meetUrl.trim() || null,
      });
      setForm({ title: '', description: '', scheduledAt: '', durationMinutes: 60, courseId: '', meetUrl: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الجدولة');
    } finally {
      setSaving(false);
    }
  }

  async function toggleCancel(id: number) {
    try {
      await api.patch<boolean>(`/live/${id}/cancel`);
      await load();
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Radio size={17} className="text-gold" />
          <h2 className="text-lg font-bold text-text-primary">جدولة بث جديد</h2>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <Input
            label="عنوان البث"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="مثال: مراجعة ليلة الامتحان"
          />
          <Textarea
            label="الوصف"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="الموعد"
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
            />
            <Input
              label="المدة (دقيقة)"
              type="number"
              min={10}
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
            />
          </div>
          <Select label="المادة (اختياري)" value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
            <option value="">بدون مادة</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </Select>
          <Input
            label="رابط البث (Meet/Zoom)"
            dir="ltr"
            value={form.meetUrl}
            onChange={(e) => setForm({ ...form, meetUrl: e.target.value })}
            placeholder="https://meet.google.com/..."
          />
          {error && <p className="text-xs font-semibold text-error">{error}</p>}
          <Button type="submit" disabled={saving} icon={<Video size={15} />}>
            {saving ? 'جاري الجدولة...' : 'جدولة البث'}
          </Button>
        </form>
      </Card>

      <Card className="lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-text-primary">
            <CalendarDays size={17} className="text-gold" />
            كل البثوث
          </h2>
          <Badge variant="gold">{lessons.length} بث</Badge>
        </div>
        {lessons.length === 0 ? (
          <p className="text-sm text-text-muted">مفيش بث مجدول — ضيف أول بث من التاب التاني.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {lessons.map((l) => (
              <div
                key={l.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-md border border-border-soft px-4 py-3 ${
                  l.isCancelled ? 'opacity-50' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-text-primary">{l.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-text-muted">
                    <span className="flex items-center gap-1">
                      <CalendarDays size={12} />
                      {formatDateTime(l.scheduledAt)}
                    </span>
                    <span>{l.durationMinutes} دقيقة</span>
                    {l.courseTitle && <span>· {l.courseTitle}</span>}
                    {l.isCancelled && <Badge variant="error">ملغي</Badge>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {l.meetUrl && (
                    <a
                      href={l.meetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md bg-gold/15 px-3 py-1.5 text-xs font-bold text-gold transition-colors hover:bg-gold/25"
                    >
                      الرابط
                    </a>
                  )}
                  <Button variant="outline" size="sm" onClick={() => toggleCancel(l.id)} icon={<XCircle size={14} />}>
                    {l.isCancelled ? 'إعادة تفعيل' : 'إلغاء'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default LiveLessonsPanel;
