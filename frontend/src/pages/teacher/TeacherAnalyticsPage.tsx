import AnalyticsTab from '../../components/AnalyticsTab';

export default function TeacherAnalyticsPage() {
  return (
    <div className="teacher-workspace flex flex-col gap-6 p-2 sm:p-4">
      <header>
        <p className="text-xs font-bold tracking-[.16em] text-gold">قراءة الأداء</p>
        <h1 className="display-serif mt-2 text-3xl font-extrabold text-text-primary">التحليلات</h1>
        <p className="mt-2 text-sm text-text-muted">مؤشرات واضحة لمتابعة التفاعل والنتائج.</p>
      </header>
      <AnalyticsTab />
    </div>
  );
}
