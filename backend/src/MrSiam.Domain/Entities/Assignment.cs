using MrSiam.Domain.Common;

namespace MrSiam.Domain.Entities;

public class Assignment : Entity
{
    public int CourseId { get; set; }
    public int? LessonId { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Course? Course { get; set; }
    public Lesson? Lesson { get; set; }
}
