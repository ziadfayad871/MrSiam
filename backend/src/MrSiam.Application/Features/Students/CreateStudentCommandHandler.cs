using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Entities;

namespace MrSiam.Application.Features.Students;

public class CreateStudentCommandHandler(IApplicationDbContext db, IPasswordHasher hasher)
    : IRequestHandler<CreateStudentCommand, ApiResponse<int>>
{
    public async Task<ApiResponse<int>> Handle(CreateStudentCommand request, CancellationToken ct)
    {
        var existing = await db.Users.FirstOrDefaultAsync(u => u.Username == request.Username.Trim(), ct);
        if (existing is not null)
            return ApiResponse<int>.Fail("اسم المستخدم موجود بالفعل");

        if (await db.Students.AnyAsync(s => s.StudentCode == request.StudentCode.Trim(), ct))
            return ApiResponse<int>.Fail("كود الطالب مستخدم من قبل");

        var user = new AppUser
        {
            Username = request.Username.Trim(),
            FullName = request.FullName.Trim(),
            PasswordHash = hasher.Hash(request.Password),
            Role = Domain.Enums.Role.Student
        };

        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        var student = new Student
        {
            UserId = user.Id,
            StudentCode = request.StudentCode.Trim(),
            FullName = request.FullName.Trim(),
            GuardianPhone = request.GuardianPhone.Trim(),
            AcademicYear = request.AcademicYear,
            Stage = request.Stage,
            JoinedAt = DateTime.UtcNow
        };

        db.Students.Add(student);
        await db.SaveChangesAsync(ct);

        return ApiResponse<int>.Ok(student.Id, "تم تسجيل الطالب بنجاح");
    }
}
