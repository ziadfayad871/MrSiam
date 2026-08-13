import SchedulePanel from '../../components/secretary/SchedulePanel';

export default function SecretarySchedulePage() {
  return (
    <div className="secretary-workspace flex flex-col gap-6 p-4 sm:p-6">
      <header>
        <p className="text-xs font-bold tracking-[.16em] text-gold">سجل الأمين</p>
        <h1 className="display-serif mt-2 text-3xl font-extrabold text-text-primary">الجدول الدراسي</h1>
        <p className="mt-2 text-sm text-text-muted">جدول الحصص الأسبوعي لكل مجموعة وشعبة.</p>
      </header>
      <SchedulePanel />
    </div>
  );
}