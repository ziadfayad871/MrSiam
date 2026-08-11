import { Navigate, Route, Routes } from 'react-router-dom';
import { PageTransition } from './design-system/motion/PageTransition';
import { ParchmentTransition } from './design-system/motion/ParchmentTransition';
import { useAuth } from './lib/auth';
import SiteLayout from './layouts/SiteLayout';
import DashboardLayout from './layouts/DashboardLayout';
import LandingPage from './pages/LandingPage';
import PortalLoginPage from './pages/PortalLoginPage';
import StudentDashboard from './pages/student/StudentDashboard';
import MistakesPage from './pages/student/MistakesPage';
import PassportPage from './pages/student/PassportPage';
import CertificatesPage from './pages/student/CertificatesPage';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import SecretaryDashboard from './pages/secretary/SecretaryDashboard';
import TeacherProfile from './pages/TeacherProfile';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import ExamPage from './pages/ExamPage';
import ResultsPage from './pages/ResultsPage';
import AchievementsPage from './pages/AchievementsPage';
import HistoryTimelinePage from './pages/HistoryTimelinePage';
import ParentDashboardPage from './pages/parent/ParentDashboardPage';
import SearchPage from './pages/SearchPage';

function RequireAuth({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user } = useAuth();
  if (!user) return <Navigate to={role === 'Student' ? '/login' : '/staff-login'} replace />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function RequireStudent({ children }: { children: React.ReactNode }) {
  return <RequireAuth role="Student">{children}</RequireAuth>;
}

function RequireTeacher({ children }: { children: React.ReactNode }) {
  return <RequireAuth role="Teacher">{children}</RequireAuth>;
}

function RequireSecretary({ children }: { children: React.ReactNode }) {
  return <RequireAuth role="Secretary">{children}</RequireAuth>;
}

function RequireParent({ children }: { children: React.ReactNode }) {
  return <RequireAuth role="Parent">{children}</RequireAuth>;
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
            <PortalLoginPage portal="student" />
          </PageTransition>
        }
      />
      <Route
        path="/staff-login"
        element={
          <PageTransition>
            <PortalLoginPage portal="staff" />
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
          <RequireAuth>
            <DashboardLayout>
              <ParchmentTransition motif="map">
                <StudentDashboard />
              </ParchmentTransition>
            </DashboardLayout>
          </RequireAuth>
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
                <TeacherDashboard defaultTab="content" />
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
                <TeacherDashboard defaultTab="analytics" />
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
                <TeacherDashboard defaultTab="live" />
              </PageTransition>
            </DashboardLayout>
          </RequireTeacher>
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
                <SecretaryDashboard defaultTab="students" />
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
                <SecretaryDashboard defaultTab="billing" />
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
                <SecretaryDashboard defaultTab="analytics" />
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
          <RequireAuth>
            <DashboardLayout>
              <PageTransition>
                <SearchPage />
              </PageTransition>
            </DashboardLayout>
          </RequireAuth>
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
