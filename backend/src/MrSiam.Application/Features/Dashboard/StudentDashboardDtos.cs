using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Dashboard;

public record StudentDashboardDto
{
    public required StudentSummaryDto Student { get; init; }
    public required CurrentDestinationDto CurrentDestination { get; init; }
    public IReadOnlyList<JourneyStageDto> Journey { get; init; } = Array.Empty<JourneyStageDto>();
    public IReadOnlyList<LeaderboardEntryDto> Leaderboard { get; init; } = Array.Empty<LeaderboardEntryDto>();
    public IReadOnlyList<AchievementMiniDto> RecentAchievements { get; init; } = Array.Empty<AchievementMiniDto>();
    public IReadOnlyList<ExamUpcomingDto> UpcomingExams { get; init; } = Array.Empty<ExamUpcomingDto>();
    public IReadOnlyList<CourseProgressDto> CourseProgress { get; init; } = Array.Empty<CourseProgressDto>();
    public required StudentStatsDto Stats { get; init; }
}

public record StudentSummaryDto
{
    public int Id { get; init; }
    public required string FullName { get; init; }
    public required string StudentCode { get; init; }
    public Stage Stage { get; init; }
    public required string StageAr { get; init; }
    public required string AcademicYear { get; init; }
}

public record CurrentDestinationDto
{
    public int? LessonId { get; init; }
    public int? CourseId { get; init; }
    public required string CourseTitle { get; init; }
    public required string LessonTitle { get; init; }
    public int LessonOrder { get; init; }
    public int LessonCount { get; init; }
    public decimal CourseProgress { get; init; }
    public bool HasNextDestination { get; init; }
}

public record JourneyStageDto
{
    public Stage Stage { get; init; }
    public required string Title { get; init; }
    public required string Status { get; init; }
    public int CourseCount { get; init; }
    public int PassedExams { get; init; }
    public int TotalExams { get; init; }
    public decimal Progress { get; init; }
    public decimal Average { get; init; }
}

public record LeaderboardEntryDto
{
    public int Rank { get; init; }
    public int StudentId { get; init; }
    public required string FullName { get; init; }
    public required string StageAr { get; init; }
    public decimal Average { get; init; }
    public int ExamsTaken { get; init; }
}

public record AchievementMiniDto
{
    public int Id { get; init; }
    public required string Title { get; init; }
    public required string Icon { get; init; }
    public DateTime UnlockedAt { get; init; }
}

public record ExamUpcomingDto
{
    public int Id { get; init; }
    public int CourseId { get; init; }
    public required string CourseTitle { get; init; }
    public required string Title { get; init; }
    public int QuestionCount { get; init; }
}

public record CourseProgressDto
{
    public int CourseId { get; init; }
    public required string Title { get; init; }
    public Subject Subject { get; init; }
    public decimal Progress { get; init; }
    public int PassedLessons { get; init; }
    public int TotalLessons { get; init; }
}

public record StudentStatsDto
{
    public int ExamsTaken { get; init; }
    public int PassedExams { get; init; }
    public decimal Average { get; init; }
    public int AchievementsCount { get; init; }
    public int Rank { get; init; }
    public int TotalStudents { get; init; }
}
