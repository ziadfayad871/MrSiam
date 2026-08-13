using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;

namespace MrSiam.Application.Features.Analytics;

public record GetCourseExamStatsQuery(int CourseId) : IRequest<ApiResponse<IReadOnlyList<CourseExamStatsDto>>>;

public class GetCourseExamStatsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetCourseExamStatsQuery, ApiResponse<IReadOnlyList<CourseExamStatsDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<CourseExamStatsDto>>> Handle(GetCourseExamStatsQuery request, CancellationToken ct)
    {
        var attempts = await db.ExamAttempts
            .AsNoTracking()
            .Where(a => a.Exam != null && a.Exam.CourseId == request.CourseId && a.SubmittedAt != null)
            .Select(a => new { a.ExamId, a.StudentId, a.Percentage, a.Passed })
            .ToListAsync(ct);

        var stats = attempts
            .GroupBy(a => a.ExamId)
            .Select(g =>
            {
                // أفضل محاولة لكل طالب — عشان المتوسط ميتكررش لمين حاول كذا مرة
                var bestPerStudent = g
                    .GroupBy(x => x.StudentId)
                    .Select(sg => sg.OrderByDescending(x => x.Percentage).First())
                    .ToList();

                return new CourseExamStatsDto
                {
                    ExamId = g.Key,
                    AttemptCount = g.Count(),
                    StudentsCount = bestPerStudent.Count,
                    AvgPercentage = bestPerStudent.Count == 0 ? 0 : bestPerStudent.Average(x => x.Percentage),
                    BestPercentage = bestPerStudent.Count == 0 ? 0 : bestPerStudent.Max(x => x.Percentage),
                    PassRate = bestPerStudent.Count == 0 ? 0 : (decimal)bestPerStudent.Count(x => x.Passed) / bestPerStudent.Count * 100m
                };
            })
            .ToList();

        return ApiResponse<IReadOnlyList<CourseExamStatsDto>>.Ok(stats);
    }
}
