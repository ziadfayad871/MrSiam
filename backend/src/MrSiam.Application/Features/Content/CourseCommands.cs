using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Entities;
using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Content;

public record CreateCourseCommand(
    string Title,
    string Description,
    Subject Subject,
    Stage Stage,
    int Order) : IRequest<ApiResponse<int>>;

public record UpdateCourseCommand(
    int Id,
    string? Title,
    string? Description,
    Subject? Subject,
    Stage? Stage,
    int? Order,
    bool? IsActive) : IRequest<ApiResponse<bool>>;

public record DeleteCourseCommand(int Id) : IRequest<ApiResponse<bool>>;

public class CreateCourseCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<CreateCourseCommand, ApiResponse<int>>
{
    public async Task<ApiResponse<int>> Handle(CreateCourseCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return ApiResponse<int>.Fail("اسم الكورس مطلوب");

        var teacher = currentUser.UserId is not null
            ? await db.Teachers.FirstOrDefaultAsync(t => t.UserId == currentUser.UserId, ct)
            : null;
        teacher ??= await db.Teachers.FirstOrDefaultAsync(ct);
        if (teacher is null)
            return ApiResponse<int>.Fail("مفيش حساب مدرس مرتبط");

        var course = new Course
        {
            Title = request.Title.Trim(),
            Description = (request.Description ?? string.Empty).Trim(),
            Subject = request.Subject,
            Stage = request.Stage,
            TeacherId = teacher.Id,
            Order = request.Order,
            IsActive = true
        };

        db.Courses.Add(course);
        await db.SaveChangesAsync(ct);
        return ApiResponse<int>.Ok(course.Id, "تم إنشاء الكورس");
    }
}

public class UpdateCourseCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateCourseCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(UpdateCourseCommand request, CancellationToken ct)
    {
        var course = await db.Courses.FirstOrDefaultAsync(c => c.Id == request.Id, ct);
        if (course is null)
            return ApiResponse<bool>.Fail("الكورس غير موجود");

        if (!string.IsNullOrWhiteSpace(request.Title))
            course.Title = request.Title.Trim();
        if (request.Description is not null)
            course.Description = request.Description.Trim();
        if (request.Subject is not null)
            course.Subject = request.Subject.Value;
        if (request.Stage is not null)
            course.Stage = request.Stage.Value;
        if (request.Order is not null)
            course.Order = request.Order.Value;
        if (request.IsActive is not null)
            course.IsActive = request.IsActive.Value;

        await db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true, "تم تعديل الكورس");
    }
}

public class DeleteCourseCommandHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteCourseCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(DeleteCourseCommand request, CancellationToken ct)
    {
        var course = await db.Courses.FirstOrDefaultAsync(c => c.Id == request.Id, ct);
        if (course is null)
            return ApiResponse<bool>.Fail("الكورس غير موجود");

        db.Courses.Remove(course);
        await db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true, "تم حذف الكورس");
    }
}
