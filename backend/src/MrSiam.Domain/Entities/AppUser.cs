using MrSiam.Domain.Enums;

namespace MrSiam.Domain.Entities;

public class AppUser
{
    public int Id { get; set; }
    public required string Username { get; set; }
    public required string FullName { get; set; }
    public string? Email { get; set; }
    public required string PasswordHash { get; set; }
    public string? StoredPassword { get; set; }
    public Role Role { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }

    public Student? Student { get; set; }
    public Teacher? Teacher { get; set; }
}
