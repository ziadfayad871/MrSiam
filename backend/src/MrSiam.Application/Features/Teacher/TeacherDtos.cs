using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Teacher;

public record TeacherProfileDto
{
    public int Id { get; init; }
    public required string FullName { get; init; }
    public required string Title { get; init; }
    public required string Bio { get; init; }
    public required string Philosophy { get; init; }
    public int ExperienceYears { get; init; }
    public required string GraduatedFrom { get; init; }
    public string? PortraitUrl { get; init; }
    public required IReadOnlyList<TeacherMilestoneDto> Milestones { get; init; }
    public required TeacherStatsDto Stats { get; init; }
}

public record TeacherMilestoneDto
{
    public int Year { get; init; }
    public required string Title { get; init; }
    public required string Description { get; init; }
}

public record TeacherStatsDto
{
    public int StudentsCount { get; init; }
    public int CoursesCount { get; init; }
    public int ExamsCount { get; init; }
    public decimal SuccessRate { get; init; }
}
