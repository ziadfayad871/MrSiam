using System.Security.Claims;
using MrSiam.Application.Abstractions;
using MrSiam.Domain.Enums;

namespace MrSiam.Api.Services;

public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    private ClaimsPrincipal? User => httpContextAccessor.HttpContext?.User;

    public int? UserId
    {
        get
        {
            var value = User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? User?.FindFirstValue("sub");
            return int.TryParse(value, out var id) ? id : null;
        }
    }

    public string? Username => User?.FindFirstValue(ClaimTypes.Name);

    public Role? Role =>
        Enum.TryParse<Role>(User?.FindFirstValue(ClaimTypes.Role), out var role) ? role : null;

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated == true;

    public bool IsInRole(Role role) => Role == role;
}
