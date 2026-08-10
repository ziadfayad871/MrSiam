using MrSiam.Domain.Common;

namespace MrSiam.Domain.Entities;

public class ExamAttempt : Entity
{
    public int ExamId { get; set; }
    public int StudentId { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? SubmittedAt { get; set; }
    public decimal Score { get; set; }
    public int CorrectCount { get; set; }
    public int WrongCount { get; set; }
    public int SkippedCount { get; set; }
    public bool Passed { get; set; }
    public decimal Percentage { get; set; }

    public Exam? Exam { get; set; }
    public Student? Student { get; set; }
    public ICollection<AttemptAnswer> Answers { get; set; } = new List<AttemptAnswer>();
}
