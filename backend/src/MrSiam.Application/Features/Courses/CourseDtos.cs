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
    public string? ImageUrl { get; init; }
    public int? Month { get; init; }
    public string? MonthAr { get; init; }
}

public static class MonthNames
{
    public static string ToArabic(int? month) => month switch
    {
        1 => "يناير",
        2 => "فبراير",
        3 => "مارس",
        4 => "أبريل",
        5 => "مايو",
        6 => "يونيو",
        7 => "يوليو",
        8 => "أغسطس",
        9 => "سبتمبر",
        10 => "أكتوبر",
        11 => "نوفمبر",
        12 => "ديسمبر",
        _ => string.Empty
    };
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
    public string? VideoUrl { get; init; }
    public string? ImageUrl { get; init; }
    public bool IsCompleted { get; set; }
    public decimal? BestPercentage { get; set; }
}
