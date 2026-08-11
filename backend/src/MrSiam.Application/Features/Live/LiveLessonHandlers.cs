using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Entities;

namespace MrSiam.Application.Features.Live;

public record LiveLessonDto
{
    public int Id { get; init; }
    public int? CourseId { get; init; }
    public string? CourseTitle { get; init; }
    public required string Title { get; init; }
    public string? Description { get; init; }
    public DateTime ScheduledAt { get; init; }
    public int DurationMinutes { get; init; }
    public string? MeetUrl { get; init; }
    public bool IsCancelled { get; init; }
}

public record GetUpcomingLiveLessonsQuery(bool IncludePast = false) : IRequest<ApiResponse<IReadOnlyList<LiveLessonDto>>>;
public record ListAllLiveLessonsQuery : IRequest<ApiResponse<IReadOnlyList<LiveLessonDto>>>;

public record CreateLiveLessonCommand(string Title, string? Description, DateTime ScheduledAt, int DurationMinutes = 60, int? CourseId = null, string? MeetUrl = null)
    : IRequest<ApiResponse<int>>;

public record CancelLiveLessonCommand(int LiveLessonId) : IRequest<ApiResponse<bool>>;

public class GetUpcomingLiveLessonsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetUpcomingLiveLessonsQuery, ApiResponse<IReadOnlyList<LiveLessonDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<LiveLessonDto>>> Handle(GetUpcomingLiveLessonsQuery request, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var query = db.LiveLessons.AsNoTracking().Where(l => !l.IsCancelled);

        if (!request.IncludePast)
            query = query.Where(l => l.ScheduledAt >= now.AddMinutes(-l.DurationMinutes));

        var lessons = await query
            .OrderBy(l => l.ScheduledAt)
            .Select(l => new LiveLessonDto
            {
                Id = l.Id,
                CourseId = l.CourseId,
                CourseTitle = l.Course != null ? l.Course.Title : null,
                Title = l.Title,
                Description = l.Description,
                ScheduledAt = l.ScheduledAt,
                DurationMinutes = l.DurationMinutes,
                MeetUrl = l.MeetUrl,
                IsCancelled = l.IsCancelled
            })
            .ToListAsync(ct);

        return ApiResponse<IReadOnlyList<LiveLessonDto>>.Ok(lessons);
    }
}

public class ListAllLiveLessonsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<ListAllLiveLessonsQuery, ApiResponse<IReadOnlyList<LiveLessonDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<LiveLessonDto>>> Handle(ListAllLiveLessonsQuery request, CancellationToken ct)
    {
        var lessons = await db.LiveLessons.AsNoTracking()
            .OrderByDescending(l => l.ScheduledAt)
            .Select(l => new LiveLessonDto
            {
                Id = l.Id,
                CourseId = l.CourseId,
                CourseTitle = l.Course != null ? l.Course.Title : null,
                Title = l.Title,
                Description = l.Description,
                ScheduledAt = l.ScheduledAt,
                DurationMinutes = l.DurationMinutes,
                MeetUrl = l.MeetUrl,
                IsCancelled = l.IsCancelled
            })
            .ToListAsync(ct);

        return ApiResponse<IReadOnlyList<LiveLessonDto>>.Ok(lessons);
    }
}

public class CreateLiveLessonCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CreateLiveLessonCommand, ApiResponse<int>>
{
    public async Task<ApiResponse<int>> Handle(CreateLiveLessonCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return ApiResponse<int>.Fail("عنوان البث مطلوب");
        if (request.ScheduledAt <= DateTime.UtcNow)
            return ApiResponse<int>.Fail("موعد البث يجب أن يكون في المستقبل");
        if (request.DurationMinutes <= 0)
            return ApiResponse<int>.Fail("المدة غير صالحة");
        if (request.CourseId is not null)
        {
            var courseExists = await db.Courses.AnyAsync(c => c.Id == request.CourseId, ct);
            if (!courseExists)
                return ApiResponse<int>.Fail("المادة غير موجودة");
        }

        var live = new LiveLesson
        {
            CourseId = request.CourseId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            ScheduledAt = request.ScheduledAt.ToUniversalTime(),
            DurationMinutes = request.DurationMinutes,
            MeetUrl = request.MeetUrl?.Trim()
        };

        db.LiveLessons.Add(live);
        await db.SaveChangesAsync(ct);

        return ApiResponse<int>.Ok(live.Id, "تم جدولة البث المباشر");
    }
}

public class CancelLiveLessonCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CancelLiveLessonCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(CancelLiveLessonCommand request, CancellationToken ct)
    {
        var live = await db.LiveLessons.FirstOrDefaultAsync(l => l.Id == request.LiveLessonId, ct);
        if (live is null)
            return ApiResponse<bool>.Fail("البث غير موجود");

        live.IsCancelled = !live.IsCancelled;
        await db.SaveChangesAsync(ct);

        return ApiResponse<bool>.Ok(true, live.IsCancelled ? "تم إلغاء البث" : "تم إعادة تفعيل البث");
    }
}
