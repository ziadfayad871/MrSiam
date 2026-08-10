using MrSiam.Domain.Common;

namespace MrSiam.Domain.Entities;

public class AttemptAnswer : Entity
{
    public int AttemptId { get; set; }
    public int QuestionId { get; set; }
    public int? SelectedOptionId { get; set; }
    public bool IsCorrect { get; set; }
    public bool IsSkipped { get; set; }

    public ExamAttempt? Attempt { get; set; }
    public Question? Question { get; set; }
}
