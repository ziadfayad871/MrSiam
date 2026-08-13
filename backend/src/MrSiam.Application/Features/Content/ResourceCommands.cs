using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Entities;

namespace MrSiam.Application.Features.Content;

public record LessonResourceDto
{
    public int Id { get; init; }
    public int LessonId { get; init; }
    public required string Title { get; init; }
    public required string Kind { get; init; }
    public required string FileUrl { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record GetCourseResourcesQuery(int CourseId) : IRequest<ApiResponse<IReadOnlyList<LessonResourceDto>>>;

public class GetCourseResourcesQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetCourseResourcesQuery, ApiResponse<IReadOnlyList<LessonResourceDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<LessonResourceDto>>> Handle(GetCourseResourcesQuery request, CancellationToken ct)
    {
        var resources = await db.LessonResources
            .AsNoTracking()
            .Where(r => r.Lesson != null && r.Lesson.CourseId == request.CourseId)
            .OrderBy(r => r.LessonId).ThenBy(r => r.CreatedAt)
            .Select(r => new LessonResourceDto
            {
                Id = r.Id,
                LessonId = r.LessonId,
                Title = r.Title,
                Kind = r.Kind,
                FileUrl = r.FileUrl,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync(ct);

        return ApiResponse<IReadOnlyList<LessonResourceDto>>.Ok(resources);
    }
}

public record UploadLessonResourceCommand(
    int LessonId,
    string Title,
    string Kind,
    string FileUrl) : IRequest<ApiResponse<int>>;

public class UploadLessonResourceCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UploadLessonResourceCommand, ApiResponse<int>>
{
    public async Task<ApiResponse<int>> Handle(UploadLessonResourceCommand request, CancellationToken ct)
    {
        if (!await db.Lessons.AnyAsync(l => l.Id == request.LessonId, ct))
            return ApiResponse<int>.Fail("الحصة غير موجودة");

        var resource = new LessonResource
        {
            LessonId = request.LessonId,
            Title = string.IsNullOrWhiteSpace(request.Title) ? "ملف" : request.Title.Trim(),
            Kind = request.Kind,
            FileUrl = request.FileUrl,
            CreatedAt = DateTime.UtcNow
        };

        db.LessonResources.Add(resource);
        await db.SaveChangesAsync(ct);
        return ApiResponse<int>.Ok(resource.Id, "تم رفع الملف");
    }
}

public record DeleteLessonResourceCommand(int Id) : IRequest<ApiResponse<bool>>;

public class DeleteLessonResourceCommandHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteLessonResourceCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(DeleteLessonResourceCommand request, CancellationToken ct)
    {
        var resource = await db.LessonResources.FirstOrDefaultAsync(r => r.Id == request.Id, ct);
        if (resource is null)
            return ApiResponse<bool>.Fail("الملف غير موجود");

        db.LessonResources.Remove(resource);
        await db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true, "تم حذف الملف");
    }
}
