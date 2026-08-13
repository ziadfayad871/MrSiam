import { Navigate, Route, Routes } from 'react-router-dom';
import { CompassLoader } from './design-system/components/CompassLoader';
import { PageTransition } from './design-system/motion/PageTransition';
import { ParchmentTransition } from './design-system/motion/ParchmentTransition';
import { useAuth } from './lib/auth';
import type { Role } from './lib/types';
import SiteLayout from './layouts/SiteLayout';
import DashboardLayout from './layouts/DashboardLayout';
import LandingPage from './pages/LandingPage';
import PortalLoginPage from './pages/PortalLoginPage';
import StudentDashboard from './pages/student/StudentDashboard';
import MistakesPage from './pages/student/MistakesPage';
import PassportPage from './pages/student/PassportPage';
import CertificatesPage from './pages/student/CertificatesPage';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherContentPage from './pages/teacher/TeacherContentPage';
import TeacherCourseNewPage from './pages/teacher/TeacherCourseNewPage';
import TeacherCourseEditPage from './pages/teacher/TeacherCourseEditPage';
import TeacherCourseDetailPage from './pages/teacher/TeacherCourseDetailPage';
import TeacherLessonFormPage from './pages/teacher/TeacherLessonFormPage';
import TeacherExamFormPage from './pages/teacher/TeacherExamFormPage';
import TeacherAssignmentFormPage from './pages/teacher/TeacherAssignmentFormPage';
import TeacherClassPage from './pages/teacher/TeacherClassPage';
import TeacherAnalyticsPage from './pages/teacher/TeacherAnalyticsPage';
import TeacherLivePage from './pages/teacher/TeacherLivePage';
import TeacherTestimonialsPage from './pages/teacher/TeacherTestimonialsPage';
import SecretaryDashboard from './pages/secretary/SecretaryDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminUserFormPage from './pages/admin/AdminUserFormPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';
import MasterCoursesPage from './pages/admin/MasterCoursesPage';
import MasterCourseNewPage from './pages/admin/MasterCourseNewPage';
import MasterTopStudentsPage from './pages/admin/MasterTopStudentsPage';
import SecretaryStudentsPage from './pages/secretary/SecretaryStudentsPage';
import SecretaryBillingPage from './pages/secretary/SecretaryBillingPage';
import SecretaryAnalyticsPage from './pages/secretary/SecretaryAnalyticsPage';
import SecretaryAttendancePage from './pages/secretary/SecretaryAttendancePage';
import SecretaryPaymentsPage from './pages/secretary/SecretaryPaymentsPage';
import SecretaryGroupsPage from './pages/secretary/SecretaryGroupsPage';
import SecretarySchedulePage from './pages/secretary/SecretarySchedulePage';
import TeacherProfile from './pages/TeacherProfile';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import ExamPage from './pages/ExamPage';
import ResultsPage from './pages/ResultsPage';
import AchievementsPage from './pages/AchievementsPage';
import HistoryTimelinePage from './pages/HistoryTimelinePage';
import ParentDashboardPage from './pages/parent/ParentDashboardPage';
import SearchPage from './pages/SearchPage';

function homeForRole(role: Role): string {
  if (role === 'Student') return '/dashboard';
  if (role === 'Teacher') return '/teacher';
  if (role === 'Admin') return '/admin/users';
  if (role === 'Secretary') return '/secretary';
  return '/parent';
}

function RequireAuth({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <CompassLoader text="بنرجع الجلسة..." />
      </div>
    );
  }
  if (!user) return <Navigate to={roles?.includes('Student') ? '/login' : '/staff-login'} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeForRole(user.role)} replace />;
  return <>{children}</>;
}

function RequireStudent({ children }: { children: React.ReactNode }) {
  return <RequireAuth roles={['Student']}>{children}</RequireAuth>;
}

function RequireTeacher({ children }: { children: React.ReactNode }) {
  return <RequireAuth roles={['Teacher', 'Admin']}>{children}</RequireAuth>;
}

function RequireSecretary({ children }: { children: React.ReactNode }) {
  return <RequireAuth roles={['Secretary', 'Admin']}>{children}</RequireAuth>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  return <RequireAuth roles={['Admin']}>{children}</RequireAuth>;
}

function RequireParent({ children }: { children: React.ReactNode }) {
  return <RequireAuth roles={['Parent']}>{children}</RequireAuth>;
}

function PortalRoute({ portal }: { portal: 'student' | 'staff' }) {
  const { user } = useAuth();
  if (user) return <Navigate to={homeForRole(user.role)} replace />;
  return <PortalLoginPage portal={portal} />;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <SiteLayout>
            <PageTransition>
              <LandingPage />
            </PageTransition>
          </SiteLayout>
        }
      />
      <Route
        path="/login"
        element={
          <PageTransition>
            <PortalRoute portal="student" />
          </PageTransition>
        }
      />
      <Route
        path="/staff-login"
        element={
          <PageTransition>
            <PortalRoute portal="staff" />
          </PageTransition>
        }
      />
      <Route
        path="/teacher-profile"
        element={
          <SiteLayout>
            <PageTransition>
              <TeacherProfile />
            </PageTransition>
          </SiteLayout>
        }
      />
      <Route
        path="/timeline"
        element={
          <SiteLayout>
            <ParchmentTransition motif="history">
              <HistoryTimelinePage />
            </ParchmentTransition>
          </SiteLayout>
        }
      />

      <Route
        path="/dashboard"
        element={
          <RequireStudent>
            <DashboardLayout>
              <ParchmentTransition motif="map">
                <StudentDashboard />
              </ParchmentTransition>
            </DashboardLayout>
          </RequireStudent>
        }
      />
      <Route
        path="/teacher"
        element={
          <RequireTeacher>
            <DashboardLayout>
              <ParchmentTransition motif="map">
                <TeacherDashboard />
              </ParchmentTransition>
            </DashboardLayout>
          </RequireTeacher>
        }
      />
      <Route
        path="/teacher/content"
        element={
          <RequireTeacher>
            <DashboardLayout>
              <PageTransition>
                <TeacherContentPage />
              </PageTransition>
            </DashboardLayout>
          </RequireTeacher>
        }
      />
      <Route
        path="/teacher/content/courses/new"
        element={
          <RequireTeacher>
            <DashboardLayout>
              <PageTransition>
                <TeacherCourseNewPage />
              </PageTransition>
            </DashboardLayout>
          </RequireTeacher>
        }
      />
      <Route
        path="/teacher/content/courses/:courseId"
        element={
          <RequireTeacher>
            <DashboardLayout>
              <PageTransition>
                <TeacherCourseDetailPage />
              </PageTransition>
            </DashboardLayout>
          </RequireTeacher>
        }
      />
      <Route
        path="/teacher/content/courses/:courseId/edit"
        element={
          <RequireTeacher>
            <DashboardLayout>
              <PageTransition>
                <TeacherCourseEditPage />
              </PageTransition>
            </DashboardLayout>
          </RequireTeacher>
        }
      />
      <Route
        path="/teacher/content/courses/:courseId/lessons/new"
        element={
          <RequireTeacher>
            <DashboardLayout>
              <PageTransition>
                <TeacherLessonFormPage />
              </PageTransition>
            </DashboardLayout>
          </RequireTeacher>
        }
      />
      <Route
        path="/teacher/content/courses/:courseId/lessons/:lessonId/edit"
        element={
          <RequireTeacher>
            <DashboardLayout>
              <PageTransition>
                <TeacherLessonFormPage />
              </PageTransition>
            </DashboardLayout>
          </RequireTeacher>
        }
      />
      <Route
        path="/teacher/content/courses/:courseId/exams/new"
        element={
          <RequireTeacher>
            <DashboardLayout>
              <PageTransition>
                <TeacherExamFormPage />
              </PageTransition>
            </DashboardLayout>
          </RequireTeacher>
        }
      />
      <Route
        path="/teacher/content/courses/:courseId/exams/:examId/edit"
        element={
          <RequireTeacher>
            <DashboardLayout>
              <PageTransition>
                <TeacherExamFormPage />
              </PageTransition>
            </DashboardLayout>
          </RequireTeacher>
        }
      />
      <Route
        path="/teacher/content/courses/:courseId/assignments/new"
        element={
          <RequireTeacher>
            <DashboardLayout>
              <PageTransition>
                <TeacherAssignmentFormPage />
              </PageTransition>
            </DashboardLayout>
          </RequireTeacher>
        }
      />
      <Route
        path="/teacher/content/courses/:courseId/assignments/:assignmentId/edit"
        element={
          <RequireTeacher>
            <DashboardLayout>
              <PageTransition>
                <TeacherAssignmentFormPage />
              </PageTransition>
            </DashboardLayout>
          </RequireTeacher>
        }
      />
      <Route
        path="/teacher/analytics"
        element={
          <RequireTeacher>
            <DashboardLayout>
              <PageTransition>
                <TeacherAnalyticsPage />
              </PageTransition>
            </DashboardLayout>
          </RequireTeacher>
        }
      />
      <Route
        path="/teacher/live"
        element={
          <RequireTeacher>
            <DashboardLayout>
              <PageTransition>
                <TeacherLivePage />
              </PageTransition>
            </DashboardLayout>
          </RequireTeacher>
        }
      />
      <Route path="/teacher/testimonials" element={<RequireTeacher><DashboardLayout><PageTransition><TeacherTestimonialsPage /></PageTransition></DashboardLayout></RequireTeacher>} />
      <Route
        path="/teacher/class"
        element={
          <RequireTeacher>
            <DashboardLayout>
              <PageTransition>
                <TeacherClassPage />
              </PageTransition>
            </DashboardLayout>
          </RequireTeacher>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RequireAdmin>
            <DashboardLayout>
              <PageTransition>
                <AdminUsersPage />
              </PageTransition>
            </DashboardLayout>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/users/new"
        element={
          <RequireAdmin>
            <DashboardLayout>
              <PageTransition>
                <AdminUserFormPage />
              </PageTransition>
            </DashboardLayout>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/users/:id/edit"
        element={
          <RequireAdmin>
            <DashboardLayout>
              <PageTransition>
                <AdminUserFormPage />
              </PageTransition>
            </DashboardLayout>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/audit-logs"
        element={
          <RequireAdmin>
            <DashboardLayout>
              <PageTransition>
                <AdminAuditLogsPage />
              </PageTransition>
            </DashboardLayout>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/courses"
        element={
          <RequireAdmin>
            <DashboardLayout>
              <PageTransition>
                <MasterCoursesPage />
              </PageTransition>
            </DashboardLayout>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/courses/new"
        element={
          <RequireAdmin>
            <DashboardLayout>
              <PageTransition>
                <MasterCourseNewPage />
              </PageTransition>
            </DashboardLayout>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/top-students"
        element={
          <RequireAdmin>
            <DashboardLayout>
              <PageTransition>
                <MasterTopStudentsPage />
              </PageTransition>
            </DashboardLayout>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/testimonials"
        element={
          <RequireAdmin>
            <DashboardLayout>
              <PageTransition>
                <TeacherTestimonialsPage />
              </PageTransition>
            </DashboardLayout>
          </RequireAdmin>
        }
      />
      <Route
        path="/secretary"
        element={
          <RequireSecretary>
            <DashboardLayout>
              <ParchmentTransition motif="map">
                <SecretaryDashboard />
              </ParchmentTransition>
            </DashboardLayout>
          </RequireSecretary>
        }
      />
      <Route
        path="/secretary/students"
        element={
          <RequireSecretary>
            <DashboardLayout>
              <PageTransition>
                <SecretaryStudentsPage />
              </PageTransition>
            </DashboardLayout>
          </RequireSecretary>
        }
      />
      <Route
        path="/secretary/billing"
        element={
          <RequireSecretary>
            <DashboardLayout>
              <PageTransition>
                <SecretaryBillingPage />
              </PageTransition>
            </DashboardLayout>
          </RequireSecretary>
        }
      />
      <Route
        path="/secretary/analytics"
        element={
          <RequireSecretary>
            <DashboardLayout>
              <PageTransition>
                <SecretaryAnalyticsPage />
              </PageTransition>
            </DashboardLayout>
          </RequireSecretary>
        }
      />
      <Route
        path="/secretary/attendance"
        element={
          <RequireSecretary>
            <DashboardLayout>
              <PageTransition>
                <SecretaryAttendancePage />
              </PageTransition>
            </DashboardLayout>
          </RequireSecretary>
        }
      />
      <Route
        path="/secretary/payments"
        element={
          <RequireSecretary>
            <DashboardLayout>
              <PageTransition>
                <SecretaryPaymentsPage />
              </PageTransition>
            </DashboardLayout>
          </RequireSecretary>
        }
      />
      <Route
        path="/secretary/groups"
        element={
          <RequireSecretary>
            <DashboardLayout>
              <PageTransition>
                <SecretaryGroupsPage />
              </PageTransition>
            </DashboardLayout>
          </RequireSecretary>
        }
      />
      <Route
        path="/secretary/schedule"
        element={
          <RequireSecretary>
            <DashboardLayout>
              <PageTransition>
                <SecretarySchedulePage />
              </PageTransition>
            </DashboardLayout>
          </RequireSecretary>
        }
      />
      <Route
        path="/courses"
        element={
          <RequireStudent>
            <DashboardLayout>
              <ParchmentTransition motif="map">
                <CoursesPage />
              </ParchmentTransition>
            </DashboardLayout>
          </RequireStudent>
        }
      />
      <Route
        path="/courses/:courseId"
        element={
          <RequireStudent>
            <DashboardLayout>
              <PageTransition>
                <CourseDetailPage />
              </PageTransition>
            </DashboardLayout>
          </RequireStudent>
        }
      />
      <Route
        path="/exam/:examId"
        element={
          <RequireStudent>
            <DashboardLayout>
              <ParchmentTransition motif="exams">
                <ExamPage />
              </ParchmentTransition>
            </DashboardLayout>
          </RequireStudent>
        }
      />
      <Route
        path="/results/:attemptId"
        element={
          <RequireStudent>
            <ParchmentTransition motif="exams">
              <ResultsPage />
            </ParchmentTransition>
          </RequireStudent>
        }
      />
      <Route
        path="/achievements"
        element={
          <RequireStudent>
            <DashboardLayout>
              <ParchmentTransition motif="achievements">
                <AchievementsPage />
              </ParchmentTransition>
            </DashboardLayout>
          </RequireStudent>
        }
      />
      <Route
        path="/mistakes"
        element={
          <RequireStudent>
            <DashboardLayout>
              <ParchmentTransition motif="map">
                <MistakesPage />
              </ParchmentTransition>
            </DashboardLayout>
          </RequireStudent>
        }
      />
      <Route
        path="/passport"
        element={
          <RequireStudent>
            <DashboardLayout>
              <ParchmentTransition motif="map">
                <PassportPage />
              </ParchmentTransition>
            </DashboardLayout>
          </RequireStudent>
        }
      />
      <Route
        path="/certificates"
        element={
          <RequireStudent>
            <DashboardLayout>
              <ParchmentTransition motif="achievements">
                <CertificatesPage />
              </ParchmentTransition>
            </DashboardLayout>
          </RequireStudent>
        }
      />

      <Route
        path="/search"
        element={
          <RequireStudent>
            <DashboardLayout>
              <PageTransition>
                <SearchPage />
              </PageTransition>
            </DashboardLayout>
          </RequireStudent>
        }
      />

      <Route
        path="/parent"
        element={
          <RequireParent>
            <DashboardLayout>
              <ParchmentTransition motif="map">
                <ParentDashboardPage />
              </ParchmentTransition>
            </DashboardLayout>
          </RequireParent>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
