using MrSiam.Domain.Enums;

namespace MrSiam.Application.Abstractions;

public interface ICurrentUserService
{
    int? UserId { get; }
    string? Username { get; }
    Role? Role { get; }
    bool IsAuthenticated { get; }
    bool IsInRole(Role role);
}
