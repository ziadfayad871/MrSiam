using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Exams;

public record ExamListItemDto
{
    public int Id { get; init; }
    public int CourseId { get; init; }
    public int? LessonId { get; init; }
    public required string CourseTitle { get; init; }
    public required string Title { get; init; }
    public ExamType Type { get; init; }
    public required string TypeAr { get; init; }
    public int DurationMinutes { get; init; }
    public decimal TotalMarks { get; init; }
    public int QuestionCount { get; init; }
    public bool IsPublished { get; init; }
    public bool HasAttempt { get; set; }
    public decimal? BestPercentage { get; set; }
    public int AttemptsUsed { get; set; }
}

public record ExamDetailDto
{
    public int Id { get; init; }
    public int CourseId { get; init; }
    public required string Title { get; init; }
    public ExamType Type { get; init; }
    public int DurationMinutes { get; init; }
    public decimal TotalMarks { get; init; }
    public IReadOnlyList<QuestionDto> Questions { get; init; } = Array.Empty<QuestionDto>();
}

public record QuestionDto
{
    public int Id { get; init; }
    public required string Text { get; init; }
    public QuestionType Type { get; init; }
    public decimal Marks { get; init; }
    public IReadOnlyList<OptionDto> Options { get; init; } = Array.Empty<OptionDto>();
}

public record OptionDto
{
    public int Id { get; init; }
    public required string Text { get; init; }
}
