import AnalyticsTab from '../../components/AnalyticsTab';

export default function SecretaryAnalyticsPage() {
  return (
    <div className="secretary-workspace flex flex-col gap-6 p-4 sm:p-6">
      <header>
        <p className="text-xs font-bold tracking-[.16em] text-gold">سجل الأمين</p>
        <h1 className="display-serif mt-2 text-3xl font-extrabold text-text-primary">التحليلات</h1>
        <p className="mt-2 text-sm text-text-muted">راجع الأرقام والمؤشرات في صفحة مستقلة.</p>
      </header>
      <AnalyticsTab />
    </div>
  );
}
