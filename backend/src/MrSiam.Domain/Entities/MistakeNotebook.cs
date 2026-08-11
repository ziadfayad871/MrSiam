using MrSiam.Domain.Common;

namespace MrSiam.Domain.Entities;

public class MistakeNotebook : Entity
{
    public int StudentId { get; set; }
    public int QuestionId { get; set; }
    public int? ExamId { get; set; }
    public int AttemptId { get; set; }
    public required string QuestionText { get; set; }
    public required string StudentAnswer { get; set; }
    public required string CorrectAnswer { get; set; }
    public required string Explanation { get; set; }
    public required string LessonTitle { get; set; }
    public string? Topic { get; set; }
    public int WrongCount { get; set; } = 1;
    public DateTime LastWrongAt { get; set; } = DateTime.UtcNow;

    public Exam? Exam { get; set; }
}
