using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Entities;

namespace MrSiam.Application.Features.Students;

public class CreateStudentCommandHandler(IApplicationDbContext db, IPasswordHasher hasher, ICurrentUserService currentUser)
    : IRequestHandler<CreateStudentCommand, ApiResponse<CreateStudentResult>>
{
    private const string UsernamePrefix = "SIMO";

    public async Task<ApiResponse<CreateStudentResult>> Handle(CreateStudentCommand request, CancellationToken ct)
    {
        var fullName = request.FullName.Trim();
        if (fullName.Length < 5)
            return ApiResponse<CreateStudentResult>.Fail("الاسم الكامل مطلوب (5 أحرف على الأقل)");

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 4)
            return ApiResponse<CreateStudentResult>.Fail("كلمة المرور 4 أحرف على الأقل");

        if (string.IsNullOrWhiteSpace(request.AcademicYear))
            return ApiResponse<CreateStudentResult>.Fail("العام الدراسي مطلوب");

        var username = await NextUsernameAsync(ct);
        var studentCode = username;

        var user = new AppUser
        {
            Username = username,
            FullName = fullName,
            PasswordHash = hasher.Hash(request.Password),
            StoredPassword = request.Password,
            Role = Domain.Enums.Role.Student
        };

        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        var student = new Student
        {
            UserId = user.Id,
            StudentCode = studentCode,
            FullName = fullName,
            GuardianPhone = (request.GuardianPhone ?? string.Empty).Trim(),
            AcademicYear = request.AcademicYear.Trim(),
            Stage = request.Stage,
            JoinedAt = DateTime.UtcNow
        };

        db.Students.Add(student);
        await db.SaveChangesAsync(ct);

        AuditLogWriter.Add(db, currentUser, "create", "Student", student.Id.ToString(), $"تسجيل طالب جديد {fullName} — {studentCode}");
        await db.SaveChangesAsync(ct);

        return ApiResponse<CreateStudentResult>.Ok(
            new CreateStudentResult(student.Id, username, studentCode),
            "تم تسجيل الطالب بنجاح");
    }

    private async Task<string> NextUsernameAsync(CancellationToken ct)
    {
        var taken = await db.Users
            .AsNoTracking()
            .Where(u => u.Username.StartsWith(UsernamePrefix))
            .Select(u => u.Username)
            .ToListAsync(ct);

        var next = taken
            .Select(u => int.TryParse(u[UsernamePrefix.Length..], out var n) ? n : 0)
            .DefaultIfEmpty(0)
            .Max() + 1;

        return $"{UsernamePrefix}{next}";
    }
}
