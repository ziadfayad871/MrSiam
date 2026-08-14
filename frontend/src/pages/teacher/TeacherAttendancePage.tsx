import AttendanceSheet from '../../components/secretary/AttendanceSheet';

export default function TeacherAttendancePage() {
  return (
    <div className="secretary-workspace flex flex-col gap-6 p-4 sm:p-6">
      <header>
        <p className="text-xs font-bold tracking-[.16em] text-gold">لوحة المدرس</p>
        <h1 className="display-serif mt-2 text-3xl font-extrabold text-text-primary">تحضير اليوم</h1>
        <p className="mt-2 text-sm text-text-muted">
          سجّل حضور مجموعتك يوميًا — اختار المرحلة والمجموعة، علّم الحضور، واحفظ الكشف.
        </p>
      </header>
      <AttendanceSheet />
    </div>
  );
}
