using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Dashboard;

public record GetStudentDashboardQuery(int StudentId) : IRequest<ApiResponse<StudentDashboardDto>>;

public class GetStudentDashboardQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetStudentDashboardQuery, ApiResponse<StudentDashboardDto>>
{
    public async Task<ApiResponse<StudentDashboardDto>> Handle(GetStudentDashboardQuery request, CancellationToken ct)
    {
        var student = await db.Students
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == request.StudentId && s.IsActive, ct);

        if (student is null)
            return ApiResponse<StudentDashboardDto>.Fail("الطالب غير موجود");

        var attempts = await db.ExamAttempts
            .AsNoTracking()
            .Include(a => a.Exam)
            .Where(a => a.StudentId == request.StudentId)
            .ToListAsync(ct);

        var attemptExamIds = attempts.Select(a => a.ExamId).Distinct().ToList();

        var exams = await db.Exams
            .AsNoTracking()
            .Include(e => e.Course)
            .Where(e => e.IsPublished)
            .OrderBy(e => e.Id)
            .ToListAsync(ct);

        var lessons = await db.Lessons
            .AsNoTracking()
            .OrderBy(l => l.Order)
            .ToListAsync(ct);

        var courses = exams.Select(e => e.Course!).Distinct().OrderBy(c => c.Stage).ThenBy(c => c.Order).ToList();

        var passedExamIds = attempts.Where(a => a.Passed).Select(a => a.ExamId).Distinct().ToHashSet();

        var journey = new List<JourneyStageDto>();
        foreach (var stage in Enum.GetValues<Stage>())
        {
            var stageExams = exams.Where(e => e.Course!.Stage == stage).ToList();
            var stagePassed = stageExams.Where(e => passedExamIds.Contains(e.Id)).Count();
            var stageAttempts = attempts.Where(a => stageExams.Any(e => e.Id == a.ExamId)).ToList();

            var status = stagePassed >= stageExams.Count && stageExams.Count > 0 ? "completed"
                : stage == student.Stage ? "current"
                : (int)stage < (int)student.Stage ? "in-progress"
                : "locked";

            if (stageExams.Count == 0) status = "locked";

            journey.Add(new JourneyStageDto
            {
                Stage = stage,
                Title = stage.ToArabic(),
                Status = status,
                CourseCount = stageExams.Select(e => e.CourseId).Distinct().Count(),
                PassedExams = stagePassed,
                TotalExams = stageExams.Count,
                Progress = stageExams.Count > 0 ? Math.Round(stagePassed / (decimal)stageExams.Count * 100, 1) : 0,
                Average = stageAttempts.Count > 0 ? Math.Round(stageAttempts.Average(a => a.Percentage), 1) : 0
            });
        }

        var currentStageExams = exams.Where(e => e.Course!.Stage == student.Stage).ToList();
        var currentPassed = currentStageExams.Where(e => passedExamIds.Contains(e.Id)).Count();
        var currentProgress = currentStageExams.Count > 0 ? Math.Round(currentPassed / (decimal)currentStageExams.Count * 100, 1) : 0;

        var passedCourseIds = attempts.Where(a => a.Passed).Select(a => a.Exam!.CourseId).Distinct().ToHashSet();

        var nextLesson = lessons.FirstOrDefault(l => !passedCourseIds.Contains(l.CourseId));
        var nextCourse = nextLesson is null ? null : courses.FirstOrDefault(c => c.Id == nextLesson!.CourseId);

        var nextCourseLessons = nextCourse is null ? new List<MrSiam.Domain.Entities.Lesson>() : lessons.Where(l => l.CourseId == nextCourse.Id).ToList();
        var passedLessonCount = nextCourse is null ? 0 : passedCourseIds.Count;

        var courseProgress = courses.Select(c =>
        {
            var courseLessons = lessons.Where(l => l.CourseId == c.Id).ToList();
            var passedCount = courseLessons.Count(l => passedCourseIds.Contains(c.Id));
            var progress = courseLessons.Count > 0 ? Math.Round(passedCount / (decimal)courseLessons.Count * 100, 1) : 0;
            return new CourseProgressDto
            {
                CourseId = c.Id,
                Title = c.Title,
                Subject = c.Subject,
                Progress = progress,
                PassedLessons = passedCount,
                TotalLessons = courseLessons.Count
            };
        }).OrderBy(c => c.Progress).ToList();

        var leaderboard = await GetLeaderboardAsync(ct);

        var studentRank = leaderboard.FindIndex(l => l.StudentId == request.StudentId) + 1;
        if (studentRank == 0) studentRank = leaderboard.Count + 1;

        var achievements = await db.StudentAchievements
            .AsNoTracking()
            .Where(sa => sa.StudentId == request.StudentId)
            .Include(sa => sa.Achievement)
            .OrderByDescending(sa => sa.UnlockedAt)
            .Select(sa => new AchievementMiniDto
            {
                Id = sa.Achievement!.Id,
                Title = sa.Achievement.Title,
                Icon = sa.Achievement.Icon,
                UnlockedAt = sa.UnlockedAt
            })
            .ToListAsync(ct);

        var attemptedExamIds = attemptExamIds.ToHashSet();
        var upcomingExams = exams
            .Where(e => !attemptedExamIds.Contains(e.Id))
            .OrderBy(e => e.Course!.Stage == student.Stage ? 0 : 1)
            .ThenBy(e => e.Course!.Stage)
            .Take(4)
            .Select(e => new ExamUpcomingDto
            {
                Id = e.Id,
                CourseId = e.CourseId,
                CourseTitle = e.Course!.Title,
                Title = e.Title,
                QuestionCount = e.Questions.Count
            })
            .ToList();

        var average = attempts.Count > 0 ? Math.Round(attempts.Average(a => a.Percentage), 1) : 0;

        return ApiResponse<StudentDashboardDto>.Ok(new StudentDashboardDto
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
            CurrentDestination = new CurrentDestinationDto
            {
                LessonId = nextLesson?.Id,
                CourseId = nextCourse?.Id,
                CourseTitle = nextCourse?.Title ?? "رحلتك بدأت للتو",
                LessonTitle = nextLesson?.Title ?? "استكشف المقررات المتاحة",
                LessonOrder = nextLesson?.Order ?? 0,
                LessonCount = nextCourseLessons.Count,
                CourseProgress = currentProgress,
                HasNextDestination = nextLesson is not null
            },
            Journey = journey,
            Leaderboard = leaderboard.Take(8).ToList(),
            RecentAchievements = achievements.Take(4).ToList(),
            UpcomingExams = upcomingExams,
            CourseProgress = courseProgress,
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
