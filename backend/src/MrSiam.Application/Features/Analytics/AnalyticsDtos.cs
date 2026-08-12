namespace MrSiam.Application.Features.Analytics;

public record StageAnalyticsDto
{
    public required string Stage { get; init; }
    public required string StageAr { get; init; }
    public int StudentCount { get; init; }
    public int AttemptCount { get; init; }
    public decimal AvgPercentage { get; init; }
    public decimal PassRate { get; init; }
}

public record CourseAnalyticsDto
{
    public int CourseId { get; init; }
    public required string Title { get; init; }
    public int ExamCount { get; init; }
    public int AttemptCount { get; init; }
    public decimal AvgPercentage { get; init; }
    public decimal PassRate { get; init; }
}

public record ExamAnalyticsDto
{
    public int ExamId { get; init; }
    public int CourseId { get; init; }
    public required string Title { get; init; }
    public int AttemptCount { get; init; }
    public decimal AvgPercentage { get; init; }
    public decimal PassRate { get; init; }
    public decimal BestPercentage { get; init; }
}

public record AnalyticsOverviewDto
{
    public int TotalStudents { get; init; }
    public int TotalCourses { get; init; }
    public int TotalExams { get; init; }
    public int TotalAttempts { get; init; }
    public decimal OverallAverage { get; init; }
    public decimal OverallPassRate { get; init; }
    public int AttemptsLastWeek { get; init; }
    public IReadOnlyList<StageAnalyticsDto> Stages { get; init; } = [];
    public IReadOnlyList<CourseAnalyticsDto> Courses { get; init; } = [];
    public IReadOnlyList<ExamAnalyticsDto> Exams { get; init; } = [];
}

public record AttemptSummaryDto
{
    public int ExamId { get; init; }
    public required string ExamTitle { get; init; }
    public decimal Score { get; init; }
    public decimal Percentage { get; init; }
    public bool Passed { get; init; }
    public DateTime? SubmittedAt { get; init; }
}

public record SubjectAnalyticsDto
{
    public required string Subject { get; init; }
    public required string SubjectAr { get; init; }
    public int AttemptCount { get; init; }
    public decimal AvgPercentage { get; init; }
}

public record StudentAnalyticsDto
{
    public int StudentId { get; init; }
    public required string FullName { get; init; }
    public required string StudentCode { get; init; }
    public required string StageAr { get; init; }
    public required string AcademicYear { get; init; }
    public DateTime JoinedAt { get; init; }
    public int ExamsTaken { get; init; }
    public int TotalAttempts { get; init; }
    public int PassedExams { get; init; }
    public decimal BestPercentage { get; init; }
    public decimal AvgPercentage { get; init; }
    public IReadOnlyList<AttemptSummaryDto> Attempts { get; init; } = [];
    public IReadOnlyList<SubjectAnalyticsDto> Subjects { get; init; } = [];
}

public record ClassStudentRowDto
{
    public int StudentId { get; init; }
    public required string FullName { get; init; }
    public required string StudentCode { get; init; }
    public required string StageAr { get; init; }
    public bool IsActive { get; init; }
    public int AttemptCount { get; init; }
    public int ExamsTaken { get; init; }
    public int PassedExams { get; init; }
    public decimal AvgPercentage { get; init; }
    public decimal BestPercentage { get; init; }
    public decimal PassRate { get; init; }
    public int LessonsCompleted { get; init; }
    public decimal AttendanceRate { get; init; }
    public DateTime? LastActiveAt { get; init; }
}

public record ClassAnalyticsDto
{
    public int TotalStudents { get; init; }
    public int ActiveStudents { get; init; }
    public int AttemptCount { get; init; }
    public decimal AvgPercentage { get; init; }
    public decimal PassRate { get; init; }
    public decimal AttendanceRate { get; init; }
    public IReadOnlyList<ClassStudentRowDto> Students { get; init; } = [];
}

public record EarlyWarningDto
{
    public int StudentId { get; init; }
    public required string FullName { get; init; }
    public required string StudentCode { get; init; }
    public required string StageAr { get; init; }
    public required string Severity { get; init; }
    public decimal AvgPercentage { get; init; }
    public DateTime? LastActiveAt { get; init; }
    public IReadOnlyList<string> Reasons { get; init; } = [];
}
