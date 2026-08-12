import ContentTab from '../../components/teacher/ContentTab';

export default function TeacherContentPage() {
  return (
    <div className="teacher-workspace flex flex-col gap-6 p-2 sm:p-4">
      <header>
        <p className="text-xs font-bold tracking-[.16em] text-gold">إدارة المنصة</p>
        <h1 className="display-serif mt-2 text-3xl font-extrabold text-text-primary">المحتوى والدروس</h1>
        <p className="mt-2 text-sm text-text-muted">أضف المقررات والدروس والاختبارات من صفحة مستقلة.</p>
      </header>
      <ContentTab />
    </div>
  );
}
