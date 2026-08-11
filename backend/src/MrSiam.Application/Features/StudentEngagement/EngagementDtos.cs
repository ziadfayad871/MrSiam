namespace MrSiam.Application.Features.StudentEngagement;

public record XpInfoDto
{
    public int Total { get; init; }
    public int Level { get; init; }
    public required string LevelTitle { get; init; }
    public required string NextLevelTitle { get; init; }
    public int NextThreshold { get; init; }
    public int ProgressPercent { get; init; }
}

public record StreakDto
{
    public int Current { get; init; }
    public int Longest { get; init; }
}

public record NoteDto
{
    public int Id { get; init; }
    public int LessonId { get; init; }
    public required string LessonTitle { get; init; }
    public required string Text { get; init; }
    public int? VideoTimestampSec { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public record BookmarkDto
{
    public int Id { get; init; }
    public string? Kind { get; init; }
    public int? LessonId { get; init; }
    public string? LessonTitle { get; init; }
    public string? LessonType { get; init; }
    public int? ExamId { get; init; }
    public string? ExamTitle { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record ContinueWatchingDto
{
    public int LessonId { get; init; }
    public int CourseId { get; init; }
    public required string CourseTitle { get; init; }
    public required string LessonTitle { get; init; }
    public string? ContentType { get; init; }
    public string? VideoUrl { get; init; }
    public int PositionSeconds { get; init; }
    public int DurationSeconds { get; init; }
    public int Percent { get; init; }
}

public record MistakeDto
{
    public int Id { get; init; }
    public int QuestionId { get; init; }
    public int? ExamId { get; init; }
    public required string QuestionText { get; init; }
    public required string StudentAnswer { get; init; }
    public required string CorrectAnswer { get; init; }
    public required string Explanation { get; init; }
    public required string LessonTitle { get; init; }
    public string? Topic { get; init; }
    public int WrongCount { get; init; }
    public DateTime LastWrongAt { get; init; }
}

public record NotificationDto
{
    public int Id { get; init; }
    public required string Title { get; init; }
    public required string Body { get; init; }
    public required string Type { get; init; }
    public string? Link { get; init; }
    public bool IsRead { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record WeakTopicDto
{
    public int CourseId { get; init; }
    public required string Title { get; init; }
    public required string SubjectAr { get; init; }
    public int WrongCount { get; init; }
}

public record RecommendedLessonDto
{
    public int LessonId { get; init; }
    public int CourseId { get; init; }
    public required string CourseTitle { get; init; }
    public required string LessonTitle { get; init; }
    public int Order { get; init; }
}

public record RecentResultDto
{
    public int AttemptId { get; init; }
    public int ExamId { get; init; }
    public required string ExamTitle { get; init; }
    public decimal Percentage { get; init; }
    public bool Passed { get; init; }
    public DateTime? SubmittedAt { get; init; }
}

public record PassportStampDto
{
    public required string Kind { get; init; }
    public required string Title { get; init; }
    public required string Detail { get; init; }
    public string? Icon { get; init; }
    public DateTime? Date { get; init; }
}

public record PassportDto
{
    public required string StudentName { get; init; }
    public required string StudentCode { get; init; }
    public required string StageAr { get; init; }
    public required string AcademicYear { get; init; }
    public IReadOnlyList<PassportStampDto> Stamps { get; init; } = [];
}

public record ExamReviewItemDto
{
    public int QuestionId { get; init; }
    public required string QuestionText { get; init; }
    public required string StudentAnswer { get; init; }
    public required string CorrectAnswer { get; init; }
    public string? Explanation { get; init; }
    public required string LessonTitle { get; init; }
    public bool IsCorrect { get; init; }
    public bool IsSkipped { get; init; }
    public decimal Marks { get; init; }
    public string? StudentAnswerText { get; init; }
    public string? CorrectAnswerText { get; init; }
}

public record ExamReviewDto
{
    public int AttemptId { get; init; }
    public int ExamId { get; init; }
    public required string ExamTitle { get; init; }
    public decimal Score { get; init; }
    public decimal Percentage { get; init; }
    public bool Passed { get; init; }
    public DateTime? SubmittedAt { get; init; }
    public bool AllowReview { get; init; }
    public bool ShowCorrectAnswers { get; init; }
    public IReadOnlyList<ExamReviewItemDto> Items { get; init; } = [];
}
