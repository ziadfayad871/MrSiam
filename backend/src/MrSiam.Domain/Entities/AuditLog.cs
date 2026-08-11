using MrSiam.Domain.Common;

namespace MrSiam.Domain.Entities;

public class AuditLog : Entity
{
    public int? UserId { get; set; }
    public string? Username { get; set; }
    public required string Action { get; set; }
    public required string Entity { get; set; }
    public string? EntityId { get; set; }
    public string? Details { get; set; }
    public string? IpAddress { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
