using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Courses;

public record CourseDto
{
    public int Id { get; init; }
    public required string Title { get; init; }
    public required string Description { get; init; }
    public Subject Subject { get; init; }
    public required string SubjectAr { get; init; }
    public Stage Stage { get; init; }
    public required string StageAr { get; init; }
    public int LessonCount { get; init; }
    public int ExamCount { get; init; }
    public int Order { get; init; }
}

public record LessonDto
{
    public int Id { get; init; }
    public int CourseId { get; init; }
    public required string Title { get; init; }
    public required string Summary { get; init; }
    public int Order { get; init; }
    public int DurationMinutes { get; init; }
    public required string ContentType { get; init; }
    public bool IsCompleted { get; set; }
    public decimal? BestPercentage { get; set; }
}
