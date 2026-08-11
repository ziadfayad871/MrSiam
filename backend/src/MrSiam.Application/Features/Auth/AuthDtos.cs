using MediatR;
using MrSiam.Application.Common;
using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Auth;

public record LoginCommand(string Username, string Password) : IRequest<ApiResponse<AuthResult>>;

public record AuthResult
{
    public required string Token { get; init; }
    public required UserDto User { get; init; }
}

public record UserDto
{
    public int Id { get; init; }
    public required string Username { get; init; }
    public required string FullName { get; init; }
    public Role Role { get; init; }
    public int? StudentId { get; init; }
    public int? TeacherId { get; init; }
}
