/** API DTO types — mirror the .NET backend DTOs */

export type Role = 'Student' | 'Teacher' | 'Secretary' | 'Admin';
export type Stage = 'PrepOne' | 'PrepTwo' | 'PrepThree' | 'SecOne' | 'SecTwo' | 'SecThree';
export type Subject = 'History' | 'Geography' | 'SocialStudies';
export type ExamType = 'Practice' | 'Lesson' | 'Unit' | 'Final';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface UserDto {
  id: number;
  username: string;
  fullName: string;
  role: Role;
  studentId?: number;
  teacherId?: number;
}

export interface AuthResult {
  token: string;
  user: UserDto;
}

export interface CourseDto {
  id: number;
  title: string;
  description: string;
  subject: Subject;
  subjectAr: string;
  stage: Stage;
  stageAr: string;
  lessonCount: number;
  examCount: number;
  order: number;
}

export interface LessonDto {
  id: number;
  courseId: number;
  title: string;
  summary: string;
  order: number;
  durationMinutes: number;
  contentType: string;
  videoUrl?: string;
  isCompleted: boolean;
  bestPercentage?: number;
}

export interface AssignmentDto {
  id: number;
  courseId: number;
  title: string;
  description: string;
  dueDate?: string;
  createdAt: string;
}

export interface AnalyticsOverviewDto {
  totalStudents: number;
  totalCourses: number;
  totalExams: number;
  totalAttempts: number;
  overallAverage: number;
  overallPassRate: number;
  attemptsLastWeek: number;
  stages: { stage: string; stageAr: string; studentCount: number; attemptCount: number; avgPercentage: number; passRate: number }[];
  courses: { courseId: number; title: string; examCount: number; attemptCount: number; avgPercentage: number; passRate: number }[];
  exams: { examId: number; courseId: number; title: string; attemptCount: number; avgPercentage: number; passRate: number; bestPercentage: number }[];
}

export interface StudentAnalyticsDto {
  studentId: number;
  fullName: string;
  studentCode: string;
  stageAr: string;
  academicYear: string;
  joinedAt: string;
  examsTaken: number;
  totalAttempts: number;
  passedExams: number;
  bestPercentage: number;
  avgPercentage: number;
  attempts: { examId: number; examTitle: string; score: number; percentage: number; passed: boolean; submittedAt?: string }[];
  subjects: { subject: string; subjectAr: string; attemptCount: number; avgPercentage: number }[];
}

export interface ExamListItemDto {
  id: number;
  courseId: number;
  lessonId?: number;
  courseTitle: string;
  title: string;
  type: ExamType;
  typeAr: string;
  durationMinutes: number;
  totalMarks: number;
  questionCount: number;
  isPublished: boolean;
  hasAttempt: boolean;
  bestPercentage?: number;
  attemptsUsed: number;
}

export interface ExamDetailDto {
  id: number;
  courseId: number;
  title: string;
  type: ExamType;
  durationMinutes: number;
  totalMarks: number;
  questions: QuestionDto[];
}

export interface QuestionDto {
  id: number;
  text: string;
  type: 'SingleChoice' | 'TrueFalse';
  marks: number;
  options: OptionDto[];
}

export interface OptionDto {
  id: number;
  text: string;
}

export interface AttemptResultDto {
  attemptId: number;
  examId: number;
  examTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  passed: boolean;
  rank: number;
  unlockedAchievements: AchievementUnlockedDto[];
  nextStop: string;
}

export interface AchievementUnlockedDto {
  id: number;
  title: string;
  description: string;
  icon: string;
}

export interface AchievementDto {
  id: number;
  code: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  isUnlocked: boolean;
  unlockedAt?: string;
}

export interface JourneyStageDto {
  stage: Stage;
  title: string;
  status: 'completed' | 'current' | 'in-progress' | 'locked';
  courseCount: number;
  passedExams: number;
  totalExams: number;
  progress: number;
  average: number;
}

export interface CurrentDestinationDto {
  lessonId?: number;
  courseId?: number;
  courseTitle: string;
  lessonTitle: string;
  lessonOrder: number;
  lessonCount: number;
  courseProgress: number;
  hasNextDestination: boolean;
}

export interface LeaderboardEntryDto {
  rank: number;
  studentId: number;
  fullName: string;
  stageAr: string;
  average: number;
  examsTaken: number;
}

export interface StudentDashboardDto {
  student: {
    id: number;
    fullName: string;
    studentCode: string;
    stage: Stage;
    stageAr: string;
    academicYear: string;
  };
  currentDestination: CurrentDestinationDto;
  journey: JourneyStageDto[];
  leaderboard: LeaderboardEntryDto[];
  recentAchievements: { id: number; title: string; icon: string; unlockedAt: string }[];
  upcomingExams: { id: number; courseId: number; courseTitle: string; title: string; questionCount: number }[];
  courseProgress: { courseId: number; title: string; subject: Subject; progress: number; passedLessons: number; totalLessons: number }[];
  stats: {
    examsTaken: number;
    passedExams: number;
    average: number;
    achievementsCount: number;
    rank: number;
    totalStudents: number;
  };
}

export interface TeacherDashboardDto {
  stats: { key: string; label: string; value: string; unit: string; icon: string; trend: number }[];
  performanceTrend: { period: string; average: number; attempts: number }[];
  coursePerformance: { courseId: number; title: string; subject: Subject; successRate: number; average: number; attempts: number; studentsCount: number }[];
  podium: LeaderboardEntryDto[];
  recentAttempts: { id: number; studentName: string; examTitle: string; percentage: number; passed: boolean; submittedAt: string }[];
}

export interface StudentListItemDto {
  id: number;
  fullName: string;
  studentCode: string;
  username: string;
  stage: Stage;
  stageAr: string;
  guardianPhone: string;
  academicYear: string;
  joinedAt: string;
  isActive: boolean;
  average: number;
  examsTaken: number;
}

export interface CreateStudentResult {
  studentId: number;
  username: string;
  studentCode: string;
}

export interface StudentCredentialsDto {
  username: string;
  password: string;
}

export interface SecretaryDashboardDto {
  stats: { key: string; label: string; value: string; icon: string }[];
  recentStudents: { id: number; fullName: string; studentCode: string; stageAr: string; academicYear: string; joinedAt: string; hasPaymentIssue: boolean }[];
  paymentsSummary: { month: string; total: number; paid: number; pending: number; overdue: number; collected: number }[];
  attendanceToday: number;
  absentToday: number;
  collectedThisMonth: number;
  pendingThisMonth: number;
}

export interface TeacherProfileDto {
  id: number;
  fullName: string;
  title: string;
  bio: string;
  philosophy: string;
  experienceYears: number;
  graduatedFrom: string;
  portraitUrl?: string;
  milestones: { year: number; title: string; description: string }[];
  stats: { studentsCount: number; coursesCount: number; examsCount: number; successRate: number };
}

export interface TopStudentDto {
  id: number;
  fullName: string;
  stageAr: string;
  achievement: string;
  score?: number;
  year?: string;
  photoUrl?: string;
  createdAt: string;
}
