using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;

namespace MrSiam.Application.Features.Exams;

public record GetCourseExamsQuery(int CourseId, int? StudentId = null) : IRequest<ApiResponse<IReadOnlyList<ExamListItemDto>>>;

public class GetCourseExamsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetCourseExamsQuery, ApiResponse<IReadOnlyList<ExamListItemDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<ExamListItemDto>>> Handle(GetCourseExamsQuery request, CancellationToken ct)
    {
        var exams = await db.Exams
            .AsNoTracking()
            .Where(e => e.CourseId == request.CourseId && e.IsPublished)
            .OrderBy(e => e.LessonId == null ? 0 : e.LessonId).ThenBy(e => e.Id)
            .Select(e => new ExamListItemDto
            {
                Id = e.Id,
                CourseId = e.CourseId,
                LessonId = e.LessonId,
                CourseTitle = e.Course != null ? e.Course.Title : string.Empty,
                Title = e.Title,
                Type = e.Type,
                TypeAr = e.Type.ToString(),
                DurationMinutes = e.DurationMinutes,
                TotalMarks = e.TotalMarks,
                QuestionCount = e.Questions.Count
            })
            .ToListAsync(ct);

        if (request.StudentId is not null)
        {
            foreach (var exam in exams)
            {
                var attempts = await db.ExamAttempts
                    .Where(a => a.StudentId == request.StudentId && a.ExamId == exam.Id)
                    .OrderByDescending(a => a.Percentage)
                    .ToListAsync(ct);

                exam.HasAttempt = attempts.Count > 0;
                exam.BestPercentage = attempts.FirstOrDefault()?.Percentage;
                exam.AttemptsUsed = attempts.Count;
            }
        }

        return ApiResponse<IReadOnlyList<ExamListItemDto>>.Ok(exams);
    }
}
