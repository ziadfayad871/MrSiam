using MrSiam.Domain.Common;

namespace MrSiam.Domain.Entities;

public class AnswerOption : Entity
{
    public int QuestionId { get; set; }
    public required string Text { get; set; }
    public bool IsCorrect { get; set; }
    public int Order { get; set; }

    public Question? Question { get; set; }
}
