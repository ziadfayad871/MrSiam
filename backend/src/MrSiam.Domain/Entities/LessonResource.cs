using MrSiam.Domain.Common;

namespace MrSiam.Domain.Entities;

public class LessonResource : Entity
{
    public int LessonId { get; set; }
    public required string Title { get; set; }
    public required string Kind { get; set; }
    public required string FileUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Lesson? Lesson { get; set; }
}
