using MrSiam.Domain.Common;

namespace MrSiam.Domain.Entities;

public class StudentTestimonial : Entity
{
    public required string FullName { get; set; }
    public required string Quote { get; set; }
    public string? StageAr { get; set; }
    public string? PhotoUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
