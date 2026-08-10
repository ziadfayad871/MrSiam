using Microsoft.AspNetCore.Identity;
using MrSiam.Application.Abstractions;
using MrSiam.Domain.Entities;

namespace MrSiam.Infrastructure.Security;

public class PasswordHasherService : IPasswordHasher
{
    private static readonly AppUser DummyUser = new()
    {
        Username = "__dummy__",
        FullName = "Dummy",
        PasswordHash = "__dummy__"
    };

    private readonly PasswordHasher<AppUser> _hasher = new();

    public string Hash(string password)
    {
        return _hasher.HashPassword(DummyUser, password);
    }

    public bool Verify(string passwordHash, string password)
    {
        var result = _hasher.VerifyHashedPassword(DummyUser, passwordHash, password);
        return result != PasswordVerificationResult.Failed;
    }
}
