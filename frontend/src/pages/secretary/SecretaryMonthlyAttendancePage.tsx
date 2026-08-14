import MonthlyAttendanceSheet from '../../components/secretary/MonthlyAttendanceSheet';

export default function SecretaryMonthlyAttendancePage() {
  return (
    <div className="secretary-workspace flex flex-col gap-6 p-4 sm:p-6">
      <header>
        <p className="text-xs font-bold tracking-[.16em] text-gold">سجل الأمين</p>
        <h1 className="display-serif mt-2 text-3xl font-extrabold text-text-primary">تقرير الحضور الشهري</h1>
        <p className="mt-2 text-sm text-text-muted">
          شبكة حضور كل طالب على أيام الشهر مع نسب الحضور والغياب — وطباعة الكشف.
        </p>
      </header>
      <MonthlyAttendanceSheet />
    </div>
  );
}
