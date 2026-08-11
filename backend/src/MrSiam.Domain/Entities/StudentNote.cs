using MrSiam.Domain.Common;

namespace MrSiam.Domain.Entities;

public class StudentNote : Entity
{
    public int StudentId { get; set; }
    public int LessonId { get; set; }
    public required string Text { get; set; }
    public int? VideoTimestampSec { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
