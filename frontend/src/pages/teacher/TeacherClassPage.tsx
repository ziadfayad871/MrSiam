import ClassAnalyticsTab from '../../components/teacher/ClassAnalyticsTab';

export default function TeacherClassPage() {
  return (
    <div className="teacher-workspace flex flex-col gap-6 p-2 sm:p-4">
      <header>
        <p className="text-xs font-bold tracking-[.16em] text-gold">متابعة الطلبة</p>
        <h1 className="display-serif mt-2 text-3xl font-extrabold text-text-primary">الفصول والتنبيهات</h1>
        <p className="mt-2 text-sm text-text-muted">متابعة أداء الفصول والحالات التي تحتاج تدخّلًا.</p>
      </header>
      <ClassAnalyticsTab />
    </div>
  );
}
