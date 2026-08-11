using MediatR;
using MrSiam.Application.Common;
using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Students;

public record StudentListItemDto
{
    public int Id { get; init; }
    public required string FullName { get; init; }
    public required string StudentCode { get; init; }
    public required string Username { get; init; }
    public Stage Stage { get; init; }
    public required string StageAr { get; init; }
    public required string GuardianPhone { get; init; }
    public required string AcademicYear { get; init; }
    public DateTime JoinedAt { get; init; }
    public bool IsActive { get; init; }
    public decimal Average { get; set; }
    public int ExamsTaken { get; set; }
}

public record StudentDetailDto
{
    public int Id { get; init; }
    public int UserId { get; init; }
    public required string FullName { get; init; }
    public required string StudentCode { get; init; }
    public required string GuardianPhone { get; init; }
    public Stage Stage { get; init; }
    public required string StageAr { get; init; }
    public required string AcademicYear { get; init; }
    public DateTime JoinedAt { get; init; }
    public decimal Average { get; init; }
    public int ExamsTaken { get; init; }
    public int PassedExams { get; init; }
    public int Rank { get; init; }
    public IReadOnlyList<string> Achievements { get; init; } = Array.Empty<string>();
}

public record CreateStudentCommand(
    string FullName,
    string GuardianPhone,
    Stage Stage,
    string AcademicYear,
    string Password) : IRequest<ApiResponse<CreateStudentResult>>;

public record CreateStudentResult(int StudentId, string Username, string StudentCode);

public record DeleteStudentCommand(int StudentId) : IRequest<ApiResponse<bool>>;

public record UpdateStudentCommand(
    int Id,
    string? FullName,
    string? GuardianPhone,
    Stage? Stage,
    string? AcademicYear,
    bool? IsActive) : IRequest<ApiResponse<bool>>;

public record SearchStudentsQuery(string? Search = null, Stage? Stage = null, int Page = 1, int PageSize = 20)
    : IRequest<MrSiam.Application.Common.ApiResponse<MrSiam.Application.Common.PagedResult<StudentListItemDto>>>;
