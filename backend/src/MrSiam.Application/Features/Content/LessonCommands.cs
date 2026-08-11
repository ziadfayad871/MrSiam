using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Entities;

namespace MrSiam.Application.Features.Content;

public record CreateLessonCommand(
    int CourseId,
    string Title,
    string Summary,
    string ContentType,
    string? VideoUrl,
    int DurationMinutes,
    int Order) : IRequest<ApiResponse<int>>;

public record UpdateLessonCommand(
    int Id,
    string? Title,
    string? Summary,
    string? ContentType,
    string? VideoUrl,
    int? DurationMinutes,
    int? Order) : IRequest<ApiResponse<bool>>;

public record DeleteLessonCommand(int Id) : IRequest<ApiResponse<bool>>;

public class CreateLessonCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CreateLessonCommand, ApiResponse<int>>
{
    public async Task<ApiResponse<int>> Handle(CreateLessonCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return ApiResponse<int>.Fail("اسم الدرس/الفيديو مطلوب");

        if (!await db.Courses.AnyAsync(c => c.Id == request.CourseId, ct))
            return ApiResponse<int>.Fail("الكورس غير موجود");

        if (request.ContentType == "video" && string.IsNullOrWhiteSpace(request.VideoUrl))
            return ApiResponse<int>.Fail("لينك الفيديو مطلوب");

        var lesson = new Lesson
        {
            CourseId = request.CourseId,
            Title = request.Title.Trim(),
            Summary = (request.Summary ?? string.Empty).Trim(),
            ContentType = request.ContentType == "video" ? "video" : "lesson",
            VideoUrl = string.IsNullOrWhiteSpace(request.VideoUrl) ? null : request.VideoUrl.Trim(),
            DurationMinutes = request.DurationMinutes > 0 ? request.DurationMinutes : 40,
            Order = request.Order
        };

        db.Lessons.Add(lesson);
        await db.SaveChangesAsync(ct);
        return ApiResponse<int>.Ok(lesson.Id, "تمت الإضافة");
    }
}

public class UpdateLessonCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateLessonCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(UpdateLessonCommand request, CancellationToken ct)
    {
        var lesson = await db.Lessons.FirstOrDefaultAsync(l => l.Id == request.Id, ct);
        if (lesson is null)
            return ApiResponse<bool>.Fail("الدرس غير موجود");

        if (!string.IsNullOrWhiteSpace(request.Title))
            lesson.Title = request.Title.Trim();
        if (request.Summary is not null)
            lesson.Summary = request.Summary.Trim();
        if (request.ContentType is not null)
            lesson.ContentType = request.ContentType == "video" ? "video" : "lesson";
        if (request.VideoUrl is not null)
            lesson.VideoUrl = string.IsNullOrWhiteSpace(request.VideoUrl) ? null : request.VideoUrl.Trim();
        if (request.DurationMinutes is not null && request.DurationMinutes > 0)
            lesson.DurationMinutes = request.DurationMinutes.Value;
        if (request.Order is not null)
            lesson.Order = request.Order.Value;

        await db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true, "تم التعديل");
    }
}

public class DeleteLessonCommandHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteLessonCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(DeleteLessonCommand request, CancellationToken ct)
    {
        var lesson = await db.Lessons.FirstOrDefaultAsync(l => l.Id == request.Id, ct);
        if (lesson is null)
            return ApiResponse<bool>.Fail("الدرس غير موجود");

        db.Lessons.Remove(lesson);
        await db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true, "تم الحذف");
    }
}
