using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Entities;

namespace MrSiam.Application.Features.Auth;

public class RegisterStudentCommandHandler(IApplicationDbContext db, IPasswordHasher hasher, IJwtTokenService jwt)
    : IRequestHandler<RegisterStudentCommand, ApiResponse<AuthResult>>
{
    public async Task<ApiResponse<AuthResult>> Handle(RegisterStudentCommand request, CancellationToken ct)
    {
        var existing = await db.Users.FirstOrDefaultAsync(u => u.Username == request.Username.Trim(), ct);
        if (existing is not null)
            return ApiResponse<AuthResult>.Fail("اسم المستخدم موجود بالفعل");

        var codeTaken = await db.Students.AnyAsync(s => s.StudentCode == request.StudentCode.Trim(), ct);
        if (codeTaken)
            return ApiResponse<AuthResult>.Fail("كود الطالب مستخدم من قبل");

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

        return ApiResponse<AuthResult>.Ok(new AuthResult
        {
            Token = jwt.GenerateToken(user),
            User = new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                FullName = user.FullName,
                Role = user.Role,
                StudentId = student.Id
            }
        }, "تم إنشاء حسابك، ابدأ رحلتك");
    }
}
