using MrSiam.Domain.Common;

namespace MrSiam.Domain.Entities;

public class WatchProgress : Entity
{
    public int StudentId { get; set; }
    public int LessonId { get; set; }
    public int PositionSeconds { get; set; }
    public int DurationSeconds { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Lesson? Lesson { get; set; }
}
