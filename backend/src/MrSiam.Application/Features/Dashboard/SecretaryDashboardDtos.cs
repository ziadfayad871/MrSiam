using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Dashboard;

public record SecretaryDashboardDto
{
    public required IReadOnlyList<SecretaryStatDto> Stats { get; init; }
    public required IReadOnlyList<RecentStudentDto> RecentStudents { get; init; }
    public required IReadOnlyList<PaymentSummaryDto> PaymentsSummary { get; init; }
    public int AttendanceToday { get; init; }
    public int AbsentToday { get; init; }
    public decimal CollectedThisMonth { get; init; }
    public decimal PendingThisMonth { get; init; }
}

public record SecretaryStatDto
{
    public required string Key { get; init; }
    public required string Label { get; init; }
    public required string Value { get; init; }
    public required string Icon { get; init; }
}

public record RecentStudentDto
{
    public int Id { get; init; }
    public required string FullName { get; init; }
    public required string StudentCode { get; init; }
    public required string StageAr { get; init; }
    public required string AcademicYear { get; init; }
    public DateTime JoinedAt { get; init; }
    public bool HasPaymentIssue { get; set; }
}

public record PaymentSummaryDto
{
    public required string Month { get; init; }
    public int Total { get; init; }
    public int Paid { get; init; }
    public int Pending { get; init; }
    public int Overdue { get; init; }
    public decimal Collected { get; init; }
}
