using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Entities;

namespace MrSiam.Application.Features.Content;

public record AssignmentDto
{
    public int Id { get; init; }
    public int CourseId { get; init; }
    public int? LessonId { get; init; }
    public required string Title { get; init; }
    public required string Description { get; init; }
    public DateTime? DueDate { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record GetCourseAssignmentsQuery(int CourseId) : IRequest<ApiResponse<IReadOnlyList<AssignmentDto>>>;

public class GetCourseAssignmentsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetCourseAssignmentsQuery, ApiResponse<IReadOnlyList<AssignmentDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<AssignmentDto>>> Handle(GetCourseAssignmentsQuery request, CancellationToken ct)
    {
        var assignments = await db.Assignments
            .AsNoTracking()
            .Where(a => a.CourseId == request.CourseId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new AssignmentDto
            {
                Id = a.Id,
                CourseId = a.CourseId,
                LessonId = a.LessonId,
                Title = a.Title,
                Description = a.Description,
                DueDate = a.DueDate,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync(ct);

        return ApiResponse<IReadOnlyList<AssignmentDto>>.Ok(assignments);
    }
}

public record CreateAssignmentCommand(
    int CourseId,
    int? LessonId,
    string Title,
    string Description,
    DateTime? DueDate) : IRequest<ApiResponse<int>>;

public record UpdateAssignmentCommand(
    int Id,
    int? LessonId,
    string? Title,
    string? Description,
    DateTime? DueDate) : IRequest<ApiResponse<bool>>;

public record DeleteAssignmentCommand(int Id) : IRequest<ApiResponse<bool>>;

public class CreateAssignmentCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CreateAssignmentCommand, ApiResponse<int>>
{
    public async Task<ApiResponse<int>> Handle(CreateAssignmentCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return ApiResponse<int>.Fail("عنوان الواجب مطلوب");

        if (!await db.Courses.AnyAsync(c => c.Id == request.CourseId, ct))
            return ApiResponse<int>.Fail("الكورس غير موجود");

        if (request.LessonId is not null &&
            !await db.Lessons.AnyAsync(l => l.Id == request.LessonId && l.CourseId == request.CourseId, ct))
            return ApiResponse<int>.Fail("الحصة المختارة مش في الكورس ده");

        var assignment = new Assignment
        {
            CourseId = request.CourseId,
            LessonId = request.LessonId,
            Title = request.Title.Trim(),
            Description = (request.Description ?? string.Empty).Trim(),
            DueDate = request.DueDate,
            CreatedAt = DateTime.UtcNow
        };

        db.Assignments.Add(assignment);
        await db.SaveChangesAsync(ct);
        return ApiResponse<int>.Ok(assignment.Id, "تم إضافة الواجب");
    }
}

public class UpdateAssignmentCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateAssignmentCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(UpdateAssignmentCommand request, CancellationToken ct)
    {
        var assignment = await db.Assignments.FirstOrDefaultAsync(a => a.Id == request.Id, ct);
        if (assignment is null)
            return ApiResponse<bool>.Fail("الواجب غير موجود");

        // LessonId null = فك الارتباط بالحصة (يظهر في "عام")
        if (request.LessonId is not null &&
            !await db.Lessons.AnyAsync(l => l.Id == request.LessonId && l.CourseId == assignment.CourseId, ct))
            return ApiResponse<bool>.Fail("الحصة المختارة مش في الكورس ده");
        assignment.LessonId = request.LessonId;

        if (!string.IsNullOrWhiteSpace(request.Title))
            assignment.Title = request.Title.Trim();
        if (request.Description is not null)
            assignment.Description = request.Description.Trim();
        if (request.DueDate is not null)
            assignment.DueDate = request.DueDate;

        await db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true, "تم تعديل الواجب");
    }
}

public class DeleteAssignmentCommandHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteAssignmentCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(DeleteAssignmentCommand request, CancellationToken ct)
    {
        var assignment = await db.Assignments.FirstOrDefaultAsync(a => a.Id == request.Id, ct);
        if (assignment is null)
            return ApiResponse<bool>.Fail("الواجب غير موجود");

        db.Assignments.Remove(assignment);
        await db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true, "تم حذف الواجب");
    }
}
