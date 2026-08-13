using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;

namespace MrSiam.Application.Features.Courses;

public record GetCourseLessonsQuery(int CourseId, int? StudentId = null) : IRequest<ApiResponse<IReadOnlyList<LessonDto>>>;

public class GetCourseLessonsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetCourseLessonsQuery, ApiResponse<IReadOnlyList<LessonDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<LessonDto>>> Handle(GetCourseLessonsQuery request, CancellationToken ct)
    {
        var course = await db.Courses.AnyAsync(c => c.Id == request.CourseId && c.IsActive, ct);
        if (!course)
            return ApiResponse<IReadOnlyList<LessonDto>>.Fail("المقرر غير موجود");

        var lessons = await db.Lessons
            .AsNoTracking()
            .Where(l => l.CourseId == request.CourseId)
            .OrderBy(l => l.Order)
            .Select(l => new LessonDto
            {
                Id = l.Id,
                CourseId = l.CourseId,
                Title = l.Title,
                Summary = l.Summary,
                Order = l.Order,
                DurationMinutes = l.DurationMinutes,
                ContentType = l.ContentType,
                VideoUrl = l.VideoUrl,
                ImageUrl = l.ImageUrl
            })
            .ToListAsync(ct);

        if (request.StudentId is not null)
        {
            foreach (var lesson in lessons)
            {
                var best = await db.ExamAttempts
                    .Where(a => a.StudentId == request.StudentId
                                && a.Exam != null
                                && a.Exam.LessonId == lesson.Id)
                    .OrderByDescending(a => a.Percentage)
                    .FirstOrDefaultAsync(ct);

                if (best is not null)
                {
                    lesson.IsCompleted = best.Passed;
                    lesson.BestPercentage = best.Percentage;
                }
            }
        }

        return ApiResponse<IReadOnlyList<LessonDto>>.Ok(lessons);
    }
}
