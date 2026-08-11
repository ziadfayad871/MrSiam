using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Entities;

namespace MrSiam.Application.Features.StudentEngagement;

public record SaveWatchProgressCommand(int StudentId, int LessonId, int PositionSeconds, int DurationSeconds) : IRequest<ApiResponse<bool>>;

public record GetContinueWatchingQuery(int StudentId) : IRequest<ApiResponse<ContinueWatchingDto?>>;

public class SaveWatchProgressCommandHandler(IApplicationDbContext db)
    : IRequestHandler<SaveWatchProgressCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(SaveWatchProgressCommand request, CancellationToken ct)
    {
        if (!await db.Lessons.AnyAsync(l => l.Id == request.LessonId, ct))
            return ApiResponse<bool>.Fail("الدرس غير موجود");

        var progress = await db.WatchProgress.FirstOrDefaultAsync(
            w => w.StudentId == request.StudentId && w.LessonId == request.LessonId, ct);

        if (progress is null)
        {
            progress = new WatchProgress
            {
                StudentId = request.StudentId,
                LessonId = request.LessonId,
                PositionSeconds = request.PositionSeconds,
                DurationSeconds = request.DurationSeconds,
                UpdatedAt = DateTime.UtcNow
            };
            db.WatchProgress.Add(progress);
        }
        else
        {
            progress.PositionSeconds = request.PositionSeconds;
            progress.DurationSeconds = request.DurationSeconds;
            progress.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}

public class GetContinueWatchingQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetContinueWatchingQuery, ApiResponse<ContinueWatchingDto?>>
{
    public async Task<ApiResponse<ContinueWatchingDto?>> Handle(GetContinueWatchingQuery request, CancellationToken ct)
    {
        var progress = await db.WatchProgress
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

        return ApiResponse<ContinueWatchingDto?>.Ok(progress);
    }
}
