using MrSiam.Domain.Common;
using MrSiam.Domain.Enums;

namespace MrSiam.Domain.Entities;

public class Question : Entity
{
    public int? ExamId { get; set; }
    public int? LessonId { get; set; }
    public required string Text { get; set; }
    public QuestionType Type { get; set; }
    public decimal Marks { get; set; }
    public int Order { get; set; }

    public Exam? Exam { get; set; }
    public Lesson? Lesson { get; set; }
    public ICollection<AnswerOption> Options { get; set; } = new List<AnswerOption>();
}
