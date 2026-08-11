using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;

namespace MrSiam.Application.Features.Students;

public class UpdateStudentCommandHandler(IApplicationDbContext db, IPasswordHasher hasher)
    : IRequestHandler<UpdateStudentCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(UpdateStudentCommand request, CancellationToken ct)
    {
        var student = await db.Students.FirstOrDefaultAsync(s => s.Id == request.Id, ct);
        if (student is null)
            return ApiResponse<bool>.Fail("الطالب غير موجود");

        if (!string.IsNullOrWhiteSpace(request.FullName))
            student.FullName = request.FullName.Trim();
        if (!string.IsNullOrWhiteSpace(request.GuardianPhone))
            student.GuardianPhone = request.GuardianPhone.Trim();
        if (request.Stage is not null)
            student.Stage = request.Stage.Value;
        if (!string.IsNullOrWhiteSpace(request.AcademicYear))
            student.AcademicYear = request.AcademicYear;
        if (request.IsActive is not null)
            student.IsActive = request.IsActive.Value;

        if (!string.IsNullOrWhiteSpace(request.NewPassword))
        {
            if (request.NewPassword.Length < 4)
                return ApiResponse<bool>.Fail("كلمة المرور الجديدة 4 أحرف على الأقل");

            var user = await db.Users.FirstOrDefaultAsync(u => u.Id == student.UserId, ct);
            if (user is null)
                return ApiResponse<bool>.Fail("حساب الطالب غير موجود");

            user.PasswordHash = hasher.Hash(request.NewPassword);
        }

        await db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true, "تم تحديث بيانات الطالب");
    }
}
