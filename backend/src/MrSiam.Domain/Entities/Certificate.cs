using MrSiam.Domain.Common;

namespace MrSiam.Domain.Entities;

public class Certificate : Entity
{
    public int StudentId { get; set; }
    public int ExamId { get; set; }
    public int CourseId { get; set; }
    public required string Title { get; set; }
    public required string Grade { get; set; }
    public decimal Percentage { get; set; }
    public required string Code { get; set; }
    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;

    public Student? Student { get; set; }
    public Exam? Exam { get; set; }
    public Course? Course { get; set; }
}
