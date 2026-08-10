using MrSiam.Domain.Entities;

namespace MrSiam.Application.Abstractions;

public interface IJwtTokenService
{
    string GenerateToken(AppUser user);
}
