import { StudentsTab } from './SecretaryDashboard';

export default function SecretaryStudentsPage() {
  return (
    <div className="secretary-workspace flex flex-col gap-6 p-4 sm:p-6">
      <header>
        <p className="text-xs font-bold tracking-[.16em] text-gold">سجل الأمين</p>
        <h1 className="display-serif mt-2 text-3xl font-extrabold text-text-primary">إدارة الطلبة</h1>
        <p className="mt-2 text-sm text-text-muted">تسجيل الطلبة وتعديل بياناتهم في صفحة مستقلة.</p>
      </header>
      <StudentsTab />
    </div>
  );
}
