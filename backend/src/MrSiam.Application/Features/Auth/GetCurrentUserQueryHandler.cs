using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;

namespace MrSiam.Application.Features.Auth;

public record GetCurrentUserQuery : IRequest<ApiResponse<UserDto>>;

public class GetCurrentUserQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetCurrentUserQuery, ApiResponse<UserDto>>
{
    public async Task<ApiResponse<UserDto>> Handle(GetCurrentUserQuery request, CancellationToken ct)
    {
        if (currentUser.UserId is not int userId)
            return ApiResponse<UserDto>.Fail("غير مسجل دخول");

        var user = await db.Users
            .AsNoTracking()
            .Include(u => u.Student)
            .Include(u => u.Teacher)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user is null || !user.IsActive)
            return ApiResponse<UserDto>.Fail("هذا الحساب غير مفعل");

        return ApiResponse<UserDto>.Ok(new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            FullName = user.FullName,
            Role = user.Role,
            StudentId = user.Student?.Id,
            TeacherId = user.Teacher?.Id
        });
    }
}
