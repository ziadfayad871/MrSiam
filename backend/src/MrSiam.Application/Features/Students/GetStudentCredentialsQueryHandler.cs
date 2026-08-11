using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;

namespace MrSiam.Application.Features.Students;

public class GetStudentCredentialsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetStudentCredentialsQuery, ApiResponse<StudentCredentialsDto>>
{
    public async Task<ApiResponse<StudentCredentialsDto>> Handle(GetStudentCredentialsQuery request, CancellationToken ct)
    {
        var student = await db.Students
            .AsNoTracking()
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == request.StudentId, ct);

        if (student is null)
            return ApiResponse<StudentCredentialsDto>.Fail("الطالب غير موجود");

        if (string.IsNullOrWhiteSpace(student.User?.StoredPassword))
            return ApiResponse<StudentCredentialsDto>.Fail("مفيش باسورد محفوظ — عدّل باسورد الطالب من زر التعديل الأول");

        return ApiResponse<StudentCredentialsDto>.Ok(new StudentCredentialsDto(student.User.Username, student.User.StoredPassword));
    }
}
