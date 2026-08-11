using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;

namespace MrSiam.Application.Features.Analytics;

public record GetAnalyticsOverviewQuery : IRequest<ApiResponse<AnalyticsOverviewDto>>;

public class GetAnalyticsOverviewQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetAnalyticsOverviewQuery, ApiResponse<AnalyticsOverviewDto>>
{
    public async Task<ApiResponse<AnalyticsOverviewDto>> Handle(GetAnalyticsOverviewQuery request, CancellationToken ct)
    {
        var attempts = await db.ExamAttempts
            .AsNoTracking()
            .Where(a => a.SubmittedAt != null)
            .Select(a => new
            {
                a.StudentId,
                a.ExamId,
                a.Percentage,
                a.Passed,
                a.SubmittedAt,
                ExamTitle = a.Exam != null ? a.Exam.Title : string.Empty,
                CourseId = a.Exam != null ? a.Exam.CourseId : 0,
                CourseTitle = a.Exam != null && a.Exam.Course != null ? a.Exam.Course.Title : string.Empty,
                Subject = a.Exam != null ? a.Exam.Course.Subject : 0,
                SubjectAr = a.Exam != null ? a.Exam.Course.Subject.ToString() : string.Empty,
                Stage = a.Student != null ? a.Student.Stage : 0,
                StageAr = a.Student != null ? a.Student.Stage.ToString() : string.Empty
            })
            .ToListAsync(ct);

        var totalStudents = await db.Students.CountAsync(s => s.IsActive, ct);
        var totalCourses = await db.Courses.CountAsync(c => c.IsActive, ct);
        var totalExams = await db.Exams.CountAsync(ct);

        var bestPerExam = attempts
            .GroupBy(a => new { a.StudentId, a.ExamId })
            .Select(g => g.OrderByDescending(x => x.Percentage).First())
            .ToList();

        var now = DateTime.UtcNow;
        var overview = new AnalyticsOverviewDto
        {
            TotalStudents = totalStudents,
            TotalCourses = totalCourses,
            TotalExams = totalExams,
            TotalAttempts = attempts.Count,
            OverallAverage = bestPerExam.Count == 0 ? 0 : bestPerExam.Average(a => a.Percentage),
            OverallPassRate = bestPerExam.Count == 0 ? 0
                : (decimal)bestPerExam.Count(a => a.Passed) / bestPerExam.Count() * 100m,
            AttemptsLastWeek = attempts.Count(a => a.SubmittedAt >= now.AddDays(-7)),
            Stages = bestPerExam
                .GroupBy(a => a.Stage)
                .Select(g => new StageAnalyticsDto
                {
                    Stage = g.Key.ToString(),
                    StageAr = g.Key.ToString(),
                    StudentCount = g.Select(x => x.StudentId).Distinct().Count(),
                    AttemptCount = g.Count(),
                    AvgPercentage = g.Average(x => x.Percentage),
                    PassRate = (decimal)g.Count(x => x.Passed) / g.Count() * 100m
                })
                .OrderByDescending(s => s.AttemptCount)
                .ToList(),
            Courses = bestPerExam
                .GroupBy(a => a.CourseId)
                .Select(g => new CourseAnalyticsDto
                {
                    CourseId = g.Key,
                    Title = g.First().CourseTitle,
                    ExamCount = g.Select(x => x.ExamId).Distinct().Count(),
                    AttemptCount = g.Count(),
                    AvgPercentage = g.Average(x => x.Percentage),
                    PassRate = (decimal)g.Count(x => x.Passed) / g.Count() * 100m
                })
                .OrderByDescending(c => c.AttemptCount)
                .ToList(),
            Exams = bestPerExam
                .GroupBy(a => a.ExamId)
                .Select(g => new ExamAnalyticsDto
                {
                    ExamId = g.Key,
                    CourseId = g.First().CourseId,
                    Title = g.First().ExamTitle,
                    AttemptCount = g.Count(),
                    AvgPercentage = g.Average(x => x.Percentage),
                    PassRate = (decimal)g.Count(x => x.Passed) / g.Count() * 100m,
                    BestPercentage = g.Max(x => x.Percentage)
                })
                .OrderByDescending(e => e.AttemptCount)
                .Take(10)
                .ToList()
        };

        return ApiResponse<AnalyticsOverviewDto>.Ok(overview);
    }
}

