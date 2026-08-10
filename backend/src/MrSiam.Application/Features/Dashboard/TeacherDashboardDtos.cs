using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Dashboard;

public record TeacherDashboardDto
{
    public required IReadOnlyList<CommandCenterStatDto> Stats { get; init; }
    public required IReadOnlyList<PerformanceTrendPointDto> PerformanceTrend { get; init; }
    public required IReadOnlyList<CoursePerformanceDto> CoursePerformance { get; init; }
    public required IReadOnlyList<LeaderboardEntryDto> Podium { get; init; }
    public required IReadOnlyList<RecentAttemptDto> RecentAttempts { get; init; }
}

public record CommandCenterStatDto
{
    public required string Key { get; init; }
    public required string Label { get; init; }
    public required string Value { get; init; }
    public required string Unit { get; init; }
    public required string Icon { get; init; }
    public decimal Trend { get; init; }
}

public record PerformanceTrendPointDto
{
    public required string Period { get; init; }
    public decimal Average { get; init; }
    public int Attempts { get; init; }
}

public record CoursePerformanceDto
{
    public int CourseId { get; init; }
    public required string Title { get; init; }
    public Subject Subject { get; init; }
    public decimal SuccessRate { get; init; }
    public decimal Average { get; init; }
    public int Attempts { get; init; }
    public int StudentsCount { get; init; }
}

public record RecentAttemptDto
{
    public int Id { get; init; }
    public required string StudentName { get; init; }
    public required string ExamTitle { get; init; }
    public decimal Percentage { get; init; }
    public bool Passed { get; init; }
    public DateTime SubmittedAt { get; init; }
}
