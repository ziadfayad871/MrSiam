using MrSiam.Domain.Common;

namespace MrSiam.Domain.Entities;

public class Notification : Entity
{
    public int UserId { get; set; }
    public required string Title { get; set; }
    public required string Body { get; set; }
    public required string Type { get; set; }
    public string? Link { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
