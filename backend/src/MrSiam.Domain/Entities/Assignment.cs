using MrSiam.Domain.Common;

namespace MrSiam.Domain.Entities;

public class Assignment : Entity
{
    public int CourseId { get; set; }
    public int? LessonId { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? DeadlineNotifiedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // واجب بأسئلة: لو اتحدد عدد الأسئلة، النظام يولّد أسئلة بخيارات ويصحح تلقائيًا
    public int? QuestionCount { get; set; }
    public int? ChoicesPerQuestion { get; set; }

    public Course? Course { get; set; }
    public Lesson? Lesson { get; set; }
    public ICollection<AssignmentQuestion> Questions { get; set; } = [];
    public ICollection<AssignmentSubmission> Submissions { get; set; } = [];
}

public class AssignmentQuestion : Entity
{
    public int AssignmentId { get; set; }
    public int Order { get; set; }
    public int CorrectIndex { get; set; }

    public Assignment? Assignment { get; set; }
}

public class AssignmentSubmission : Entity
{
    public int AssignmentId { get; set; }
    public int StudentId { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public int Score { get; set; }
    public int TotalQuestions { get; set; }
    public string AnswersJson { get; set; } = "[]";

    public Assignment? Assignment { get; set; }
    public Student? Student { get; set; }
}