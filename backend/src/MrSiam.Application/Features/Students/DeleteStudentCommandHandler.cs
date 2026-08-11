using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;

namespace MrSiam.Application.Features.Students;

public class DeleteStudentCommandHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteStudentCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(DeleteStudentCommand request, CancellationToken ct)
    {
        var student = await db.Students
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == request.StudentId, ct);

        if (student is null)
            return ApiResponse<bool>.Fail("الطالب غير موجود");

        var userId = student.UserId;

        db.Students.Remove(student);
        await db.SaveChangesAsync(ct);

        if (userId > 0)
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
            if (user is not null)
            {
                db.Users.Remove(user);
                await db.SaveChangesAsync(ct);
            }
        }

        db.AuditLogs.Add(new Domain.Entities.AuditLog
        {
            Action = "delete",
            Entity = "Student",
            EntityId = request.StudentId.ToString(),
            Details = $"حذف الطالب {student.FullName}",
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync(ct);

        return ApiResponse<bool>.Ok(true, "تم حذف الطالب");
    }
}
