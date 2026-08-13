using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Courses;

public record GetCoursesQuery(Stage? Stage = null, Subject? Subject = null) : IRequest<ApiResponse<IReadOnlyList<CourseDto>>>;
public class GetCoursesQueryHandler(IApplicationDbContext db) : IRequestHandler<GetCoursesQuery, ApiResponse<IReadOnlyList<CourseDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<CourseDto>>> Handle(GetCoursesQuery request, CancellationToken ct)
    {
        var query = db.Courses.AsNoTracking().Where(c => c.IsActive);

        if (request.Stage is not null)
            query = query.Where(c => c.Stage == request.Stage);
        if (request.Subject is not null)
            query = query.Where(c => c.Subject == request.Subject);

        var courses = await query
            .OrderBy(c => c.Stage).ThenBy(c => c.Order)
            .Select(c => new CourseDto
            {
                Id = c.Id,
                Title = c.Title,
                Description = c.Description,
                Subject = c.Subject,
                SubjectAr = c.Subject.ToArabic(),
                Stage = c.Stage,
                StageAr = c.Stage.ToArabic(),
                LessonCount = c.Lessons.Count,
                ExamCount = c.Exams.Count,
                Order = c.Order,
                ImageUrl = c.ImageUrl,
                Month = c.Month,
                MonthAr = MonthNames.ToArabic(c.Month)
            })
            .ToListAsync(ct);

        return ApiResponse<IReadOnlyList<CourseDto>>.Ok(courses);
    }
}
