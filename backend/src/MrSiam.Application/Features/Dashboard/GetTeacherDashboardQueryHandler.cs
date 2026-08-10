using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Dashboard;

public record GetTeacherDashboardQuery : IRequest<ApiResponse<TeacherDashboardDto>>;

public class GetTeacherDashboardQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetTeacherDashboardQuery, ApiResponse<TeacherDashboardDto>>
{
    public async Task<ApiResponse<TeacherDashboardDto>> Handle(GetTeacherDashboardQuery request, CancellationToken ct)
    {
        var totalStudents = await db.Students.CountAsync(s => s.IsActive, ct);
        var totalCourses = await db.Courses.CountAsync(c => c.IsActive, ct);
        var totalLessons = await db.Lessons.CountAsync(ct);
        var totalExams = await db.Exams.CountAsync(e => e.IsPublished, ct);
        var attempts = await db.ExamAttempts
            .AsNoTracking()
            .Include(a => a.Student)
            .Include(a => a.Exam)
            .ToListAsync(ct);

        var attemptsCount = attempts.Count;
        var passedCount = attempts.Count(a => a.Passed);
        var successRate = attemptsCount > 0 ? Math.Round(passedCount / (decimal)attemptsCount * 100, 1) : 0;
        var avgScore = attemptsCount > 0 ? Math.Round(attempts.Average(a => a.Percentage), 1) : 0;

        var stats = new List<CommandCenterStatDto>
        {
            new() { Key = "students", Label = "الطلاب", Value = totalStudents.ToString("N0"), Unit = "طالب", Icon = "users", Trend = 12.4m },
            new() { Key = "courses", Label = "المقررات", Value = totalCourses.ToString("N0"), Unit = "مقرر", Icon = "book", Trend = 0 },
            new() { Key = "lessons", Label = "الدروس", Value = totalLessons.ToString("N0"), Unit = "درس", Icon = "map-pin", Trend = 0 },
            new() { Key = "exams", Label = "الامتحانات", Value = totalExams.ToString("N0"), Unit = "امتحان", Icon = "scroll", Trend = 0 },
            new() { Key = "attempts", Label = "المحاولات", Value = attemptsCount.ToString("N0"), Unit = "محاولة", Icon = "route", Trend = 18.2m },
            new() { Key = "success", Label = "نسبة النجاح", Value = successRate.ToString("0.#"), Unit = "%", Icon = "flag", Trend = 3.1m },
            new() { Key = "average", Label = "متوسط الدرجات", Value = avgScore.ToString("0.#"), Unit = "%", Icon = "target", Trend = 1.8m }
        };

        var trend = attempts
            .Where(a => a.SubmittedAt.HasValue)
            .GroupBy(a => a.SubmittedAt!.Value.Date)
            .OrderBy(g => g.Key)
            .Select(g => new PerformanceTrendPointDto
            {
                Period = g.Key.ToString("dd MMM"),
                Average = Math.Round(g.Average(a => a.Percentage), 1),
                Attempts = g.Count()
            })
            .TakeLast(14)
            .ToList();

        var coursePerformance = await db.Exams
            .AsNoTracking()
            .Include(e => e.Course)
            .GroupBy(e => e.CourseId)
            .Select(g => new
            {
                CourseId = g.Key,
                Course = g.First().Course!,
                ExamIds = g.Select(e => e.Id).ToList()
            })
            .ToListAsync(ct);

        var attemptByExam = attempts.GroupBy(a => a.ExamId).ToDictionary(g => g.Key, g => g.ToList());

        var performance = coursePerformance.Select(cp =>
        {
            var examAttempts = cp.ExamIds.SelectMany(id => attemptByExam.GetValueOrDefault(id) ?? new List<MrSiam.Domain.Entities.ExamAttempt>()).ToList();
            var passRate = examAttempts.Count > 0 ? Math.Round(examAttempts.Count(a => a.Passed) / (decimal)examAttempts.Count * 100, 1) : 0;
            var avg = examAttempts.Count > 0 ? Math.Round(examAttempts.Average(a => a.Percentage), 1) : 0;
            return new CoursePerformanceDto
            {
                CourseId = cp.CourseId,
                Title = cp.Course.Title,
                Subject = cp.Course.Subject,
                SuccessRate = passRate,
                Average = avg,
                Attempts = examAttempts.Count,
                StudentsCount = examAttempts.Select(a => a.StudentId).Distinct().Count()
            };
        }).OrderByDescending(p => p.Attempts).ToList();

        var podium = await BuildPodiumAsync(ct);

        var recentAttempts = attempts
            .Where(a => a.SubmittedAt.HasValue)
            .OrderByDescending(a => a.SubmittedAt)
            .Take(10)
            .Select(a => new RecentAttemptDto
            {
                Id = a.Id,
                StudentName = a.Student != null ? a.Student.FullName : $"طالب {a.StudentId}",
                ExamTitle = a.Exam != null ? a.Exam.Title : $"امتحان {a.ExamId}",
                Percentage = a.Percentage,
                Passed = a.Passed,
                SubmittedAt = a.SubmittedAt!.Value
            })
            .ToList();

        return ApiResponse<TeacherDashboardDto>.Ok(new TeacherDashboardDto
        {
            Stats = stats,
            PerformanceTrend = trend,
            CoursePerformance = performance,
            Podium = podium,
            RecentAttempts = recentAttempts
        });
    }

    private async Task<List<LeaderboardEntryDto>> BuildPodiumAsync(CancellationToken ct)
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

        return students
            .Select(s =>
            {
                var a = attempts.FirstOrDefault(x => x.StudentId == s.Id);
                return new LeaderboardEntryDto
                {
                    StudentId = s.Id,
                    FullName = s.FullName,
                    StageAr = s.Stage.ToArabic(),
                    Average = a is null ? 0 : Math.Round(a.Avg, 1),
                    ExamsTaken = a?.Count ?? 0
                };
            })
            .Where(e => e.ExamsTaken > 0)
            .OrderByDescending(e => e.Average)
            .Take(10)
            .Select((e, i) => e with { Rank = i + 1 })
            .ToList();
    }
}
