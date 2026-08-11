using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Entities;

namespace MrSiam.Application.Features.Auth;

public class LoginCommandHandler(IApplicationDbContext db, IJwtTokenService jwt, IPasswordHasher hasher, ILogger<LoginCommandHandler> logger)
    : IRequestHandler<LoginCommand, ApiResponse<AuthResult>>
{
    public async Task<ApiResponse<AuthResult>> Handle(LoginCommand request, CancellationToken ct)
    {
        var user = await db.Users
            .Include(u => u.Student)
            .Include(u => u.Teacher)
            .FirstOrDefaultAsync(u => u.Username == request.Username.Trim(), ct);

        if (user is null || !hasher.Verify(user.PasswordHash, request.Password))
            return ApiResponse<AuthResult>.Fail("اسم المستخدم أو كلمة المرور غير صحيحة");

        if (!user.IsActive)
            return ApiResponse<AuthResult>.Fail("هذا الحساب غير مفعل");

        user.LastLoginAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        db.AuditLogs.Add(new AuditLog
        {
            UserId = user.Id,
            Username = user.Username,
            Action = "login",
            Entity = "AppUser",
            EntityId = user.Id.ToString(),
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync(ct);

        logger.LogInformation("User {Username} logged in", user.Username);

        return ApiResponse<AuthResult>.Ok(new AuthResult
        {
            Token = jwt.GenerateToken(user),
            User = new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                FullName = user.FullName,
                Role = user.Role,
                StudentId = user.Student?.Id,
                TeacherId = user.Teacher?.Id
            }
        }, "أهلاً بيك في رحلتك التعليمية");
    }
}
