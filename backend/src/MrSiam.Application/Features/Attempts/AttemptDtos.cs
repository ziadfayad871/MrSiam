using MediatR;
using MrSiam.Application.Common;

namespace MrSiam.Application.Features.Attempts;

public record SubmitAttemptCommand(int ExamId, int StudentId, IReadOnlyList<AnswerSubmission> Answers)
    : IRequest<ApiResponse<AttemptResultDto>>;

public record AnswerSubmission(int QuestionId, int? SelectedOptionId);

public record AttemptResultDto
{
    public int AttemptId { get; init; }
    public int ExamId { get; init; }
    public required string ExamTitle { get; init; }
    public decimal Score { get; init; }
    public decimal TotalMarks { get; init; }
    public decimal Percentage { get; init; }
    public int CorrectCount { get; init; }
    public int WrongCount { get; init; }
    public int SkippedCount { get; init; }
    public bool Passed { get; init; }
    public int Rank { get; init; }
    public IReadOnlyList<AchievementUnlockedDto> UnlockedAchievements { get; init; } = Array.Empty<AchievementUnlockedDto>();
    public required string NextStop { get; init; }
}

public record AchievementUnlockedDto
{
    public int Id { get; init; }
    public required string Title { get; init; }
    public required string Description { get; init; }
    public required string Icon { get; init; }
}
