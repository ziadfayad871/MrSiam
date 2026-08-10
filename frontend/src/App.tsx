import { Navigate, Route, Routes } from 'react-router-dom';
import { PageTransition } from './design-system/motion/PageTransition';
import { useAuth } from './lib/auth';
import SiteLayout from './layouts/SiteLayout';
import DashboardLayout from './layouts/DashboardLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/student/StudentDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import SecretaryDashboard from './pages/secretary/SecretaryDashboard';
import TeacherProfile from './pages/TeacherProfile';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import ExamPage from './pages/ExamPage';
import ResultsPage from './pages/ResultsPage';
import AchievementsPage from './pages/AchievementsPage';
import HistoryTimelinePage from './pages/HistoryTimelinePage';

function RequireAuth({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
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
            <LoginPage />
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
            <PageTransition>
              <HistoryTimelinePage />
            </PageTransition>
          </SiteLayout>
        }
      />

      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardLayout>
              <PageTransition>
                <RoleRedirect />
              </PageTransition>
            </DashboardLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/courses"
        element={
          <RequireAuth>
            <DashboardLayout>
              <PageTransition>
                <CoursesPage />
              </PageTransition>
            </DashboardLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/courses/:courseId"
        element={
          <RequireAuth>
            <DashboardLayout>
              <PageTransition>
                <CourseDetailPage />
              </PageTransition>
            </DashboardLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/exam/:examId"
        element={
          <RequireAuth>
            <DashboardLayout>
              <PageTransition>
                <ExamPage />
              </PageTransition>
            </DashboardLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/results/:attemptId"
        element={
          <RequireAuth>
            <PageTransition>
              <ResultsPage />
            </PageTransition>
          </RequireAuth>
        }
      />
      <Route
        path="/achievements"
        element={
          <RequireAuth>
            <DashboardLayout>
              <PageTransition>
                <AchievementsPage />
              </PageTransition>
            </DashboardLayout>
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === 'Student') return <StudentDashboard />;
  if (user.role === 'Teacher') return <TeacherDashboard />;
  return <SecretaryDashboard />;
}
