import LiveLessonsPanel from '../../components/teacher/LiveLessonsPanel';

export default function TeacherLivePage() {
  return (
    <div className="teacher-workspace flex flex-col gap-6 p-2 sm:p-4">
      <header>
        <p className="text-xs font-bold tracking-[.16em] text-gold">التواصل المباشر</p>
        <h1 className="display-serif mt-2 text-3xl font-extrabold text-text-primary">البث المباشر</h1>
        <p className="mt-2 text-sm text-text-muted">أنشئ وأدر مواعيد البث من صفحة مستقلة.</p>
      </header>
      <LiveLessonsPanel />
    </div>
  );
}
