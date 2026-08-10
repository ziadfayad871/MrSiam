using MrSiam.Domain.Common;
using MrSiam.Domain.Enums;

namespace MrSiam.Domain.Entities;

public class Exam : Entity
{
    public int CourseId { get; set; }
    public int? LessonId { get; set; }
    public required string Title { get; set; }
    public ExamType Type { get; set; }
    public int DurationMinutes { get; set; }
    public decimal TotalMarks { get; set; }
    public decimal PassMark { get; set; }
    public bool IsPublished { get; set; } = true;
    public int AttemptsAllowed { get; set; } = 3;

    public Course? Course { get; set; }
    public Lesson? Lesson { get; set; }
    public ICollection<Question> Questions { get; set; } = new List<Question>();
    public ICollection<ExamAttempt> Attempts { get; set; } = new List<ExamAttempt>();
}
