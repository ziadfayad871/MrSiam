using MrSiam.Domain.Common;

namespace MrSiam.Domain.Entities;

public class Bookmark : Entity
{
    public int StudentId { get; set; }
    public int? LessonId { get; set; }
    public int? ExamId { get; set; }
    public required string Kind { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Lesson? Lesson { get; set; }
    public Exam? Exam { get; set; }
}
