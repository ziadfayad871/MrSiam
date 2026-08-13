using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Entities;
using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Users;

public record UserListItemDto
{
    public int Id { get; init; }
    public required string Username { get; init; }
    public required string FullName { get; init; }
    public Role Role { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? LastLoginAt { get; init; }
    public string? StoredPassword { get; init; }
}

public record ListUsersQuery(string? Search = null, Role? Role = null, int Page = 1, int PageSize = 20)
    : IRequest<ApiResponse<PagedResult<UserListItemDto>>>;

public record CreateUserCommand(string Username, string FullName, string Password, Role Role, bool IsActive = true)
    : IRequest<ApiResponse<int>>;

public record UpdateUserCommand(int Id, string? FullName = null, Role? Role = null, bool? IsActive = null, string? NewPassword = null)
    : IRequest<ApiResponse<bool>>;

public record DeleteUserCommand(int Id) : IRequest<ApiResponse<bool>>;

public class ListUsersQueryHandler(IApplicationDbContext db)
    : IRequestHandler<ListUsersQuery, ApiResponse<PagedResult<UserListItemDto>>>
{
    public async Task<ApiResponse<PagedResult<UserListItemDto>>> Handle(ListUsersQuery request, CancellationToken ct)
    {
        var query = db.Users.AsNoTracking()
            .Where(u => u.Role == Role.Secretary || u.Role == Role.Admin);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(u => u.Username.Contains(term) || u.FullName.Contains(term));
        }
        if (request.Role is not null)
            query = query.Where(u => u.Role == request.Role.Value);

        var projected = query
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new UserListItemDto
            {
                Id = u.Id,
                Username = u.Username,
                FullName = u.FullName,
                Role = u.Role,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt,
                LastLoginAt = u.LastLoginAt,
                StoredPassword = u.StoredPassword
            });

        var paged = PagedResult<UserListItemDto>.From(projected, request.Page, request.PageSize);
        return ApiResponse<PagedResult<UserListItemDto>>.Ok(paged);
    }
}

public class CreateUserCommandHandler(IApplicationDbContext db, IPasswordHasher hasher, ICurrentUserService currentUser)
    : IRequestHandler<CreateUserCommand, ApiResponse<int>>
{
    public async Task<ApiResponse<int>> Handle(CreateUserCommand request, CancellationToken ct)
    {
        var username = request.Username?.Trim() ?? string.Empty;
        if (username.Length < 3)
            return ApiResponse<int>.Fail("اسم المستخدم 3 أحرف على الأقل");

        if (string.IsNullOrWhiteSpace(request.FullName) || request.FullName.Trim().Length < 3)
            return ApiResponse<int>.Fail("الاسم الكامل مطلوب (3 أحرف على الأقل)");

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 4)
            return ApiResponse<int>.Fail("كلمة المرور 4 أحرف على الأقل");

        if (request.Role is not Role.Secretary and not Role.Admin)
            return ApiResponse<int>.Fail("الدور غير صالح — اختر أمين أو مدير");

        var exists = await db.Users.AnyAsync(u => u.Username == username, ct);
        if (exists)
            return ApiResponse<int>.Fail("اسم المستخدم موجود بالفعل");

        var user = new AppUser
        {
            Username = username,
            FullName = request.FullName.Trim(),
            PasswordHash = hasher.Hash(request.Password),
            StoredPassword = request.Password,
            Role = request.Role,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        db.AuditLogs.Add(new AuditLog
        {
            UserId = currentUser.UserId,
            Username = currentUser.Username,
            Action = "create",
            Entity = "User",
            EntityId = user.Id.ToString(),
            Details = $"إنشاء حساب {user.FullName} ({user.Username}) — {user.Role}",
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync(ct);

        return ApiResponse<int>.Ok(user.Id, "تم إنشاء الحساب");
    }
}

public class UpdateUserCommandHandler(IApplicationDbContext db, IPasswordHasher hasher, ICurrentUserService currentUser)
    : IRequestHandler<UpdateUserCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(UpdateUserCommand request, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == request.Id, ct);
        if (user is null)
            return ApiResponse<bool>.Fail("الحساب غير موجود");

        if (request.Role is not null and not Role.Secretary and not Role.Admin)
            return ApiResponse<bool>.Fail("الدور غير صالح");

        if (!string.IsNullOrWhiteSpace(request.FullName))
            user.FullName = request.FullName.Trim();
        if (request.Role is not null)
            user.Role = request.Role.Value;
        if (request.IsActive is not null)
            user.IsActive = request.IsActive.Value;
        if (!string.IsNullOrWhiteSpace(request.NewPassword))
        {
            if (request.NewPassword.Length < 4)
                return ApiResponse<bool>.Fail("كلمة المرور الجديدة 4 أحرف على الأقل");
            user.PasswordHash = hasher.Hash(request.NewPassword);
            user.StoredPassword = request.NewPassword;
        }

        await db.SaveChangesAsync(ct);

        db.AuditLogs.Add(new AuditLog
        {
            UserId = currentUser.UserId,
            Username = currentUser.Username,
            Action = "update",
            Entity = "User",
            EntityId = user.Id.ToString(),
            Details = $"تعديل حساب {user.FullName} ({user.Username})",
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync(ct);

        return ApiResponse<bool>.Ok(true, "تم تحديث الحساب");
    }
}

public class DeleteUserCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<DeleteUserCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(DeleteUserCommand request, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == request.Id, ct);
        if (user is null)
            return ApiResponse<bool>.Fail("الحساب غير موجود");

        if (currentUser.UserId == user.Id)
            return ApiResponse<bool>.Fail("لا يمكنك حذف حسابك الحالي");

        var details = $"حذف حساب {user.FullName} ({user.Username})";

        db.Users.Remove(user);
        await db.SaveChangesAsync(ct);

        db.AuditLogs.Add(new AuditLog
        {
            UserId = currentUser.UserId,
            Username = currentUser.Username,
            Action = "delete",
            Entity = "User",
            EntityId = request.Id.ToString(),
            Details = details,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync(ct);

        return ApiResponse<bool>.Ok(true, "تم حذف الحساب");
    }
}
