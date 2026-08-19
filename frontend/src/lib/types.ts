/** API DTO types — mirror the .NET backend DTOs */

export type Role = 'Student' | 'Teacher' | 'Secretary' | 'Admin' | 'Parent';
export type Stage = 'PrepOne' | 'PrepTwo' | 'PrepThree' | 'SecOne' | 'SecTwo' | 'SecThree';
export type Subject = 'History' | 'Geography' | 'SocialStudies';
export type ExamType = 'Practice' | 'Lesson' | 'Unit' | 'Final' | 'Boss';

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
  imageUrl?: string;
  month?: number;
  monthAr?: string;
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
  imageUrl?: string;
  isCompleted: boolean;
  bestPercentage?: number;
}

export interface AssignmentDto {
  id: number;
  courseId: number;
  lessonId?: number;
  title: string;
  description: string;
  dueDate?: string;
  createdAt: string;
  questionCount?: number;
  choicesPerQuestion?: number;
  hasQuestions?: boolean;
  submitted?: boolean;
  submissionPercentage?: number;
}

export interface AssignmentQuestionDto {
  order: number;
  correctIndex: number;
  label: string;
  options: string[];
}

export interface AssignmentSubmissionAnswerDto {
  order: number;
  selectedIndex?: number;
  correctIndex: number;
  isCorrect: boolean;
  isSkipped: boolean;
  correctLetter: string;
  selectedLetter?: string;
}

export interface AssignmentSubmissionResultDto {
  submissionId: number;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  answers: AssignmentSubmissionAnswerDto[];
}

export interface AssignmentDetailDto {
  id: number;
  courseId: number;
  lessonId?: number;
  title: string;
  description: string;
  dueDate?: string;
  questionCount: number;
  choicesPerQuestion: number;
  questions: AssignmentQuestionDto[];
  submitted: boolean;
  mySubmission?: AssignmentSubmissionResultDto;
}

export interface AssignmentSubmissionListItemDto {
  studentId: number;
  studentName: string;
  studentCode: string;
  submittedAt: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
}

export interface LessonResourceDto {
  id: number;
  lessonId: number;
  title: string;
  kind: string;
  fileUrl: string;
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

export interface ClassStudentRowDto {
  studentId: number;
  fullName: string;
  studentCode: string;
  stageAr: string;
  isActive: boolean;
  attemptCount: number;
  examsTaken: number;
  passedExams: number;
  avgPercentage: number;
  bestPercentage: number;
  passRate: number;
  lessonsCompleted: number;
  attendanceRate: number;
  lastActiveAt?: string;
}

export interface ClassAnalyticsDto {
  totalStudents: number;
  activeStudents: number;
  attemptCount: number;
  avgPercentage: number;
  passRate: number;
  attendanceRate: number;
  students: ClassStudentRowDto[];
}

export interface EarlyWarningDto {
  studentId: number;
  fullName: string;
  studentCode: string;
  stageAr: string;
  severity: 'Critical' | 'Warning';
  avgPercentage: number;
  lastActiveAt?: string;
  reasons: string[];
}

export interface CourseExamStatsDto {
  examId: number;
  attemptCount: number;
  studentsCount: number;
  avgPercentage: number;
  bestPercentage: number;
  passRate: number;
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
  isBoss: boolean;
  bossLocked: boolean;
  lessonsTotal: number;
  lessonsCompleted: number;
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

export interface XpInfoDto {
  total: number;
  level: number;
  levelTitle: string;
  nextLevelTitle: string;
  nextThreshold: number;
  progressPercent: number;
}

export interface StreakDto {
  current: number;
  longest: number;
}

export interface ContinueWatchingDto {
  lessonId: number;
  courseId: number;
  courseTitle: string;
  lessonTitle: string;
  contentType?: string;
  videoUrl?: string;
  positionSeconds: number;
  durationSeconds: number;
  percent: number;
}

export interface WeakTopicDto {
  courseId: number;
  title: string;
  subjectAr: string;
  wrongCount: number;
}

export interface RecommendedLessonDto {
  lessonId: number;
  courseId: number;
  courseTitle: string;
  lessonTitle: string;
  order: number;
}

export interface NotificationDto {
  id: number;
  title: string;
  body: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface RecentResultDto {
  attemptId: number;
  examId: number;
  examTitle: string;
  percentage: number;
  passed: boolean;
  submittedAt?: string;
}

export interface StudentDashboardV2Dto {
  student: {
    id: number;
    fullName: string;
    studentCode: string;
    stage: Stage;
    stageAr: string;
    academicYear: string;
  };
  xp: XpInfoDto;
  streak: StreakDto;
  continueWatching?: ContinueWatchingDto;
  upcomingExams: { id: number; courseId: number; courseTitle: string; title: string; questionCount: number }[];
  recentResults: RecentResultDto[];
  weakTopics: WeakTopicDto[];
  recommendedLessons: RecommendedLessonDto[];
  notifications: NotificationDto[];
  recentAchievements: { id: number; title: string; icon: string; unlockedAt: string }[];
  leaderboard: LeaderboardEntryDto[];
  completedCourses: number;
  totalCourses: number;
  stats: {
    examsTaken: number;
    passedExams: number;
    average: number;
    achievementsCount: number;
    rank: number;
    totalStudents: number;
  };
}

export interface NoteDto {
  id: number;
  lessonId: number;
  lessonTitle: string;
  text: string;
  videoTimestampSec?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookmarkDto {
  id: number;
  kind?: string;
  lessonId?: number;
  lessonTitle?: string;
  lessonType?: string;
  examId?: number;
  examTitle?: string;
  createdAt: string;
}

export interface MistakeDto {
  id: number;
  questionId: number;
  examId?: number;
  questionText: string;
  studentAnswer: string;
  correctAnswer: string;
  explanation: string;
  lessonTitle: string;
  topic?: string;
  wrongCount: number;
  lastWrongAt: string;
}

export interface PassportStampDto {
  kind: string;
  title: string;
  detail: string;
  icon?: string;
  date?: string;
}

export interface PassportDto {
  studentName: string;
  studentCode: string;
  stageAr: string;
  academicYear: string;
  stamps: PassportStampDto[];
}

export interface ExamReviewItemDto {
  questionId: number;
  questionText: string;
  studentAnswer: string;
  correctAnswer: string;
  explanation?: string;
  lessonTitle: string;
  isCorrect: boolean;
  isSkipped: boolean;
  marks: number;
  studentAnswerText?: string;
  correctAnswerText?: string;
}

export interface ExamReviewDto {
  attemptId: number;
  examId: number;
  examTitle: string;
  score: number;
  percentage: number;
  passed: boolean;
  submittedAt?: string;
  allowReview: boolean;
  showCorrectAnswers: boolean;
  items: ExamReviewItemDto[];
}

export interface AiQuestionDraftDto {
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  source: string;
  lessonId?: number;
  supported: boolean;
}

export interface AiExamDraftDto {
  title: string;
  questions: AiQuestionDraftDto[];
}

export interface QuestionBankOptionDto {
  id: number;
  text: string;
  isCorrect: boolean;
}

export interface QuestionBankItemDto {
  id: number;
  text: string;
  type: string;
  marks: number;
  lessonId?: number;
  lessonTitle?: string;
  sourceExamTitle?: string;
  options: QuestionBankOptionDto[];
}

export interface SearchHitDto {
  id: number;
  title: string;
  subtitle: string;
  kind: string;
  courseId: number;
  courseTitle: string;
  examTitle: string;
  text: string;
}

export interface SearchResultsDto {
  courses: SearchHitDto[];
  lessons: SearchHitDto[];
  exams: SearchHitDto[];
  questions: SearchHitDto[];
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
  groupId?: number | null;
  groupName?: string | null;
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

export interface StudentTestimonialDto {
  id: number;
  fullName: string;
  quote: string;
  stageAr?: string;
  photoUrl?: string;
}

export interface StudySummaryResultDto {
  title: string;
  bullets: string[];
}

export interface FlashcardDto {
  front: string;
  back: string;
}

export interface ComparePointDto {
  aspect: string;
  first: string;
  second: string;
}

export interface CompareResultDto {
  topicA: string;
  topicB: string;
  points: ComparePointDto[];
}

export interface CertificateDto {
  id: number;
  studentName: string;
  examTitle: string;
  courseTitle: string;
  grade: string;
  percentage: number;
  code: string;
  issuedAt: string;
}

export interface SubscriptionPlanDto {
  id: number;
  name: string;
  months: number;
  price: number;
  description?: string;
  isActive: boolean;
}

export interface MySubscriptionDto {
  hasActiveSubscription: boolean;
  planName?: string;
  amountPaid?: number;
  startsAt?: string;
  endsAt?: string;
  daysLeft?: number;
}

export interface CouponDto {
  id: number;
  code: string;
  discountPercent: number;
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
}

export interface SubscriptionDto {
  id: number;
  studentId: number;
  studentName: string;
  planName: string;
  amountPaid: number;
  couponCode?: string;
  startsAt: string;
  endsAt: string;
  status: string;
}

export interface LiveLessonDto {
  id: number;
  courseId?: number;
  courseTitle?: string;
  title: string;
  description?: string;
  scheduledAt: string;
  durationMinutes: number;
  meetUrl?: string;
  isCancelled: boolean;
}

export interface ParentChildDto {
  studentId: number;
  fullName: string;
  studentCode: string;
  stageAr: string;
  academicYear: string;
  lessonsCompleted: number;
  lessonsTotal: number;
  examsTaken: number;
  examsPassed: number;
  passRate: number;
  averagePercentage: number;
  attendancePresent: number;
  attendanceAbsent: number;
  hasActiveSubscription: boolean;
  subscriptionPlan?: string;
  subscriptionEndsAt?: string;
  xpTotal: number;
  level: number;
  lastExamTitle?: string;
  lastExamPercentage?: number;
  lastExamAt?: string;
}

export interface ParentDashboardDto {
  parentName: string;
  phone?: string;
  children: ParentChildDto[];
}

export type AttendanceStatusType = 'Present' | 'Absent' | 'Late' | 'Excused';

export interface DailyAttendanceStudentDto {
  studentId: number;
  fullName: string;
  studentCode: string;
  stage: Stage;
  stageAr: string;
  groupId?: number | null;
  groupName?: string | null;
  status?: AttendanceStatusType | null;
  notes?: string | null;
}

export interface PaymentDto {
  id: number;
  studentId: number;
  studentName: string;
  amount: number;
  month: string;
  status: 'Pending' | 'Paid' | 'Overdue';
  paidAt?: string | null;
  method?: string | null;
}

export interface PaymentReceiptDto {
  id: number;
  studentId: number;
  studentName: string;
  username: string;
  studentCode: string;
  stageAr: string;
  amount: number;
  month: string;
  method: string | null;
  paidAt: string;
}

export interface MonthlyAttendanceDayDto {
  day: number;
  isSession?: boolean;
  status?: AttendanceStatusType | null;
}

export interface MonthlyAttendanceStudentDto {
  studentId: number;
  fullName: string;
  studentCode: string;
  stage: Stage;
  stageAr: string;
  groupId?: number | null;
  groupName?: string | null;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  markedCount: number;
  sessionCount: number;
  days: MonthlyAttendanceDayDto[];
}

export interface StudyGroupListItemDto {
  id: number;
  name: string;
  stage: Stage;
  stageAr: string;
  academicYear: string;
  isActive: boolean;
  memberCount: number;
  createdAt: string;
  scheduleDays: number[];
}

export interface StudyGroupMemberDto {
  studentId: number;
  fullName: string;
  studentCode: string;
  stageAr: string;
  addedAt: string;
}

export interface StudyGroupDetailDto {
  id: number;
  name: string;
  stage: Stage;
  stageAr: string;
  academicYear: string;
  isActive: boolean;
  createdAt: string;
  members: StudyGroupMemberDto[];
}

export interface ScheduleSlotDto {
  id: number;
  groupId: number;
  groupName: string;
  stage: Stage;
  stageAr: string;
  day: number;
  startTime: string;
  endTime: string;
  subject?: string | null;
  room?: string | null;
}

export interface UserListItemDto {
  id: number;
  username: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
  storedPassword?: string | null;
}

export interface AuditLogListItemDto {
  id: number;
  userId?: number | null;
  username?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
  createdAt: string;
}
