using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Application.Features.Dashboard;
using MrSiam.Application.Features.StudentEngagement;
using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Dashboard;

public record GetStudentDashboardV2Query(int StudentId) : IRequest<ApiResponse<StudentDashboardV2Dto>>;

public class GetStudentDashboardV2QueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetStudentDashboardV2Query, ApiResponse<StudentDashboardV2Dto>>
{
    public async Task<ApiResponse<StudentDashboardV2Dto>> Handle(GetStudentDashboardV2Query request, CancellationToken ct)
    {
        var student = await db.Students
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == request.StudentId && s.IsActive, ct);
        if (student is null)
            return ApiResponse<StudentDashboardV2Dto>.Fail("الطالب غير موجود");

        var attempts = await db.ExamAttempts
            .AsNoTracking()
            .Where(a => a.StudentId == request.StudentId)
            .Select(a => new { a.Id, a.ExamId, a.Percentage, a.Passed, a.SubmittedAt, ExamTitle = a.Exam != null ? a.Exam.Title : string.Empty })
            .ToListAsync(ct);

        var attemptExamIds = attempts.Select(a => a.ExamId).Distinct().ToList();
        var passedExamIds = attempts.Where(a => a.Passed).Select(a => a.ExamId).Distinct().ToHashSet();

        var exams = await db.Exams
            .AsNoTracking()
            .Where(e => e.IsPublished)
            .Select(e => new { e.Id, e.CourseId, e.Title, e.Questions.Count, CourseTitle = e.Course != null ? e.Course.Title : string.Empty, CourseStage = e.Course != null ? e.Course.Stage : Stage.PrepOne })
            .ToListAsync(ct);

        var xpTotal = await XpRules.GetTotalAsync(db, request.StudentId, ct);
        var (level, levelTitle, nextLevelTitle, nextThreshold, progressPercent) = XpRules.Resolve(xpTotal);

        var continueWatching = await db.WatchProgress
            .AsNoTracking()
            .Where(w => w.StudentId == request.StudentId)
            .OrderByDescending(w => w.UpdatedAt)
            .Select(w => new ContinueWatchingDto
            {
                LessonId = w.LessonId,
                CourseId = w.Lesson != null ? w.Lesson.CourseId : 0,
                CourseTitle = w.Lesson != null && w.Lesson.Course != null ? w.Lesson.Course.Title : string.Empty,
                LessonTitle = w.Lesson != null ? w.Lesson.Title : string.Empty,
                ContentType = w.Lesson != null ? w.Lesson.ContentType : null,
                VideoUrl = w.Lesson != null ? w.Lesson.VideoUrl : null,
                PositionSeconds = w.PositionSeconds,
                DurationSeconds = w.DurationSeconds,
                Percent = w.DurationSeconds > 0 ? (int)Math.Min(100, (double)w.PositionSeconds / w.DurationSeconds * 100) : 0
            })
            .FirstOrDefaultAsync(ct);

        var weakTopics = await db.MistakeNotebook
            .AsNoTracking()
            .Where(m => m.StudentId == request.StudentId && m.Exam != null)
            .GroupBy(m => m.Exam!.CourseId)
            .Select(g => new WeakTopicDto
            {
                CourseId = g.Key,
                Title = g.First().Exam != null && g.First().Exam.Course != null ? g.First().Exam.Course.Title : string.Empty,
                SubjectAr = g.First().Exam != null && g.First().Exam.Course != null ? g.First().Exam.Course.Subject.ToString() : string.Empty,
                WrongCount = g.Count()
            })
            .OrderByDescending(w => w.WrongCount)
            .Take(4)
            .ToListAsync(ct);

        var weakCourseIds = weakTopics.Select(w => w.CourseId).ToList();
        var recommendedLessons = new List<RecommendedLessonDto>();
        if (weakCourseIds.Count > 0)
        {
            recommendedLessons = await db.Lessons
                .AsNoTracking()
                .Where(l => weakCourseIds.Contains(l.CourseId))
                .Select(l => new RecommendedLessonDto
                {
                    LessonId = l.Id,
                    CourseId = l.CourseId,
                    CourseTitle = l.Course != null ? l.Course.Title : string.Empty,
                    LessonTitle = l.Title,
                    Order = l.Order
                })
                .OrderBy(r => r.CourseId)
                .ToListAsync(ct);

            var courseCompletion = await db.ExamAttempts
                .Where(a => a.StudentId == request.StudentId && a.Passed && a.Exam != null && weakCourseIds.Contains(a.Exam.CourseId))
                .Select(a => a.Exam!.LessonId)
                .Distinct()
                .ToListAsync(ct);

            recommendedLessons = recommendedLessons
                .Where(r => r.LessonId != null && !courseCompletion.Contains(r.LessonId))
                .Take(3)
                .ToList();
        }

        var recentResults = attempts
            .OrderByDescending(a => a.SubmittedAt)
            .Take(5)
            .Select(a => new RecentResultDto
            {
                AttemptId = a.Id,
                ExamId = a.ExamId,
                ExamTitle = a.ExamTitle,
                Percentage = a.Percentage,
                Passed = a.Passed,
                SubmittedAt = a.SubmittedAt
            })
            .ToList();

        var notifications = await db.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == student.UserId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(5)
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Title = n.Title,
                Body = n.Body,
                Type = n.Type,
                Link = n.Link,
                IsRead = n.ReadAt != null,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync(ct);

        var achievements = await db.StudentAchievements
            .AsNoTracking()
            .Where(sa => sa.StudentId == request.StudentId)
            .Select(sa => new { sa.UnlockedAt, Title = sa.Achievement != null ? sa.Achievement.Title : string.Empty, Icon = sa.Achievement != null ? sa.Achievement.Icon : string.Empty })
            .OrderByDescending(sa => sa.UnlockedAt)
            .ToListAsync(ct);

        var leaderboard = await GetLeaderboardAsync(ct);
        var studentRank = leaderboard.FindIndex(l => l.StudentId == request.StudentId) + 1;
        if (studentRank == 0) studentRank = leaderboard.Count + 1;

        var attemptedExamIds = attemptExamIds.ToHashSet();
        var upcomingExams = exams
            .Where(e => !attemptedExamIds.Contains(e.Id))
            .OrderBy(e => e.CourseStage == student.Stage ? 0 : 1)
            .ThenBy(e => e.CourseStage)
            .Take(3)
            .Select(e => new ExamUpcomingDto
            {
                Id = e.Id,
                CourseId = e.CourseId,
                CourseTitle = e.CourseTitle,
                Title = e.Title,
                QuestionCount = e.Count
            })
            .ToList();

        var average = attempts.Count > 0 ? Math.Round(attempts.Average(a => a.Percentage), 1) : 0;
        var completedCourseIds = attempts
            .GroupBy(a => a.ExamId)
            .Where(g => g.Any(x => x.Passed))
            .Select(g => g.Key)
            .ToHashSet();

        var courseIds = exams.Select(e => e.CourseId).Distinct().ToList();
        var allCourseExamIds = exams
            .GroupBy(e => e.CourseId)
            .Where(g => courseIds.Contains(g.Key))
            .ToDictionary(g => g.Key, g => g.Select(e => e.Id).ToHashSet());

        var fullyCompletedCourses = allCourseExamIds
            .Where(kv => kv.Value.Count > 0 && kv.Value.All(completedCourseIds.Contains))
            .Select(kv => kv.Key)
            .ToList();

        return ApiResponse<StudentDashboardV2Dto>.Ok(new StudentDashboardV2Dto
        {
            Student = new StudentSummaryDto
            {
                Id = student.Id,
                FullName = student.FullName,
                StudentCode = student.StudentCode,
                Stage = student.Stage,
                StageAr = student.Stage.ToArabic(),
                AcademicYear = student.AcademicYear
            },
            Xp = new XpInfoDto
            {
                Total = xpTotal,
                Level = level,
                LevelTitle = levelTitle,
                NextLevelTitle = nextLevelTitle,
                NextThreshold = nextThreshold,
                ProgressPercent = progressPercent
            },
            Streak = new StreakDto { Current = student.StreakCurrent, Longest = student.StreakLongest },
            ContinueWatching = continueWatching,
            UpcomingExams = upcomingExams,
            RecentResults = recentResults,
            WeakTopics = weakTopics,
            RecommendedLessons = recommendedLessons,
            Notifications = notifications,
            RecentAchievements = achievements.Take(4).Select(a => new AchievementMiniDto { Id = 0, Title = a.Title, Icon = a.Icon, UnlockedAt = a.UnlockedAt }).ToList(),
            Leaderboard = leaderboard.Take(5).ToList(),
            CompletedCourses = fullyCompletedCourses.Count,
            TotalCourses = courseIds.Count,
            Stats = new StudentStatsDto
            {
                ExamsTaken = attempts.Count,
                PassedExams = attempts.Count(a => a.Passed),
                Average = average,
                AchievementsCount = achievements.Count,
                Rank = studentRank,
                TotalStudents = await db.Students.CountAsync(s => s.IsActive, ct)
            }
        });
    }

    private async Task<List<LeaderboardEntryDto>> GetLeaderboardAsync(CancellationToken ct)
    {
        var students = await db.Students
            .AsNoTracking()
            .Where(s => s.IsActive)
            .Select(s => new { s.Id, s.FullName, s.Stage })
            .ToListAsync(ct);

        var attempts = await db.ExamAttempts
            .AsNoTracking()
            .GroupBy(a => a.StudentId)
            .Select(g => new { StudentId = g.Key, Avg = g.Average(a => a.Percentage), Count = g.Count() })
            .ToListAsync(ct);

        var entries = students.Select(s =>
        {
            var attempt = attempts.FirstOrDefault(a => a.StudentId == s.Id);
            return new LeaderboardEntryDto
            {
                StudentId = s.Id,
                FullName = s.FullName,
                StageAr = s.Stage.ToArabic(),
                Average = attempt is null ? 0 : Math.Round(attempt.Avg, 1),
                ExamsTaken = attempt?.Count ?? 0
            };
        })
        .Where(e => e.ExamsTaken > 0)
        .OrderByDescending(e => e.Average)
        .ThenByDescending(e => e.ExamsTaken)
        .Select((e, i) => e with { Rank = i + 1 })
        .ToList();

        return entries;
    }
}
