using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Application.Features.StudentEngagement;
using MrSiam.Domain.Entities;
using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Parents;

public record ParentChildDto
{
    public int StudentId { get; init; }
    public required string FullName { get; init; }
    public required string StudentCode { get; init; }
    public required string StageAr { get; init; }
    public required string AcademicYear { get; init; }
    public int LessonsCompleted { get; init; }
    public int LessonsTotal { get; init; }
    public int ExamsTaken { get; init; }
    public int ExamsPassed { get; init; }
    public double PassRate { get; init; }
    public double AveragePercentage { get; init; }
    public int AttendancePresent { get; init; }
    public int AttendanceAbsent { get; init; }
    public bool HasActiveSubscription { get; init; }
    public string? SubscriptionPlan { get; init; }
    public DateTime? SubscriptionEndsAt { get; init; }
    public int XpTotal { get; init; }
    public int Level { get; init; }
    public string? LastExamTitle { get; init; }
    public double? LastExamPercentage { get; init; }
    public DateTime? LastExamAt { get; init; }
}

public record ParentDashboardDto
{
    public required string ParentName { get; init; }
    public string? Phone { get; init; }
    public IReadOnlyList<ParentChildDto> Children { get; init; } = new List<ParentChildDto>();
}

public record CreateParentCommand(string FullName, string? Phone, string Password, IReadOnlyList<int>? StudentIds = null)
    : IRequest<ApiResponse<ParentCreatedResult>>;

public record ParentCreatedResult(int ParentId, string Username);

public record LinkStudentToParentCommand(int ParentId, int StudentId) : IRequest<ApiResponse<bool>>;

public record GetParentDashboardQuery(int ParentId) : IRequest<ApiResponse<ParentDashboardDto>>;

public class CreateParentCommandHandler(IApplicationDbContext db, IPasswordHasher hasher)
    : IRequestHandler<CreateParentCommand, ApiResponse<ParentCreatedResult>>
{
    private const string UsernamePrefix = "WALI";

    public async Task<ApiResponse<ParentCreatedResult>> Handle(CreateParentCommand request, CancellationToken ct)
    {
        var fullName = request.FullName.Trim();
        if (fullName.Length < 5)
            return ApiResponse<ParentCreatedResult>.Fail("الاسم الكامل مطلوب (5 أحرف على الأقل)");
        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 4)
            return ApiResponse<ParentCreatedResult>.Fail("كلمة المرور 4 أحرف على الأقل");

        var username = await NextUsernameAsync(ct);

        var user = new AppUser
        {
            Username = username,
            FullName = fullName,
            PasswordHash = hasher.Hash(request.Password),
            StoredPassword = request.Password,
            Role = Role.Parent
        };
        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        var parent = new Parent
        {
            UserId = user.Id,
            FullName = fullName,
            Phone = request.Phone?.Trim()
        };
        db.Parents.Add(parent);
        await db.SaveChangesAsync(ct);

        if (request.StudentIds is not null && request.StudentIds.Count > 0)
        {
            var students = await db.Students.Where(s => request.StudentIds.Contains(s.Id)).ToListAsync(ct);
            foreach (var s in students)
                s.ParentId = parent.Id;
            await db.SaveChangesAsync(ct);
        }

        return ApiResponse<ParentCreatedResult>.Ok(
            new ParentCreatedResult(parent.Id, username),
            "تم إنشاء حساب ولي الأمر");
    }

    private async Task<string> NextUsernameAsync(CancellationToken ct)
    {
        var taken = await db.Users
            .AsNoTracking()
            .Where(u => u.Username.StartsWith(UsernamePrefix))
            .Select(u => u.Username)
            .ToListAsync(ct);

        var next = taken
            .Select(u => int.TryParse(u[UsernamePrefix.Length..], out var n) ? n : 0)
            .DefaultIfEmpty(0)
            .Max() + 1;

        return $"{UsernamePrefix}{next}";
    }
}

public class LinkStudentToParentCommandHandler(IApplicationDbContext db)
    : IRequestHandler<LinkStudentToParentCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(LinkStudentToParentCommand request, CancellationToken ct)
    {
        var parentExists = await db.Parents.AnyAsync(p => p.Id == request.ParentId, ct);
        if (!parentExists)
            return ApiResponse<bool>.Fail("ولي الأمر غير موجود");

        var student = await db.Students.FirstOrDefaultAsync(s => s.Id == request.StudentId, ct);
        if (student is null)
            return ApiResponse<bool>.Fail("الطالب غير موجود");

        student.ParentId = request.ParentId;
        await db.SaveChangesAsync(ct);

        return ApiResponse<bool>.Ok(true, "تم ربط الطالب بولي الأمر");
    }
}

public class GetParentDashboardQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetParentDashboardQuery, ApiResponse<ParentDashboardDto>>
{
    public async Task<ApiResponse<ParentDashboardDto>> Handle(GetParentDashboardQuery request, CancellationToken ct)
    {
        var parent = await db.Parents
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.ParentId, ct);

        if (parent is null)
            return ApiResponse<ParentDashboardDto>.Fail("حساب ولي الأمر غير مكتمل");

        var studentIds = await db.Students.AsNoTracking()
            .Where(s => s.ParentId == request.ParentId)
            .Select(s => s.Id)
            .ToListAsync(ct);

        var children = new List<ParentChildDto>();
        foreach (var studentId in studentIds)
        {
            var student = await db.Students.AsNoTracking().FirstAsync(s => s.Id == studentId, ct);
            var lessonsTotal = await db.Lessons.AsNoTracking().CountAsync(l => l.Course != null && l.Course.IsActive, ct);
            var lessonsCompleted = await db.WatchProgress.AsNoTracking()
                .Where(w => w.StudentId == studentId)
                .Select(w => w.LessonId)
                .Distinct()
                .CountAsync(ct);

            var attempts = await db.ExamAttempts.AsNoTracking()
                .Where(a => a.StudentId == studentId && a.SubmittedAt != null)
                .OrderByDescending(a => a.SubmittedAt)
                .Select(a => new { a.Percentage, a.Passed, a.SubmittedAt, ExamTitle = a.Exam != null ? a.Exam.Title : string.Empty })
                .ToListAsync(ct);

            var attendance = await db.AttendanceRecords.AsNoTracking()
                .Where(a => a.StudentId == studentId)
                .GroupBy(a => a.Status)
                .Select(g => new { g.Key, Count = g.Count() })
                .ToListAsync(ct);

            var sub = await db.Subscriptions.AsNoTracking()
                .Where(s => s.StudentId == studentId && s.Status == SubscriptionStatus.Active && s.EndsAt >= DateTime.UtcNow)
                .OrderByDescending(s => s.EndsAt)
                .FirstOrDefaultAsync(ct);

            var xpTotal = await XpRules.GetTotalAsync(db, studentId, ct);
            var (level, _, _, _, _) = XpRules.Resolve(xpTotal);

            children.Add(new ParentChildDto
            {
                StudentId = student.Id,
                FullName = student.FullName,
                StudentCode = student.StudentCode,
                StageAr = student.Stage.ToArabic(),
                AcademicYear = student.AcademicYear,
                LessonsCompleted = lessonsCompleted,
                LessonsTotal = lessonsTotal,
                ExamsTaken = attempts.Count,
                ExamsPassed = attempts.Count(a => a.Passed),
                PassRate = attempts.Count > 0 ? Math.Round(attempts.Count(a => a.Passed) * 100.0 / attempts.Count, 1) : 0,
                AveragePercentage = attempts.Count > 0 ? Math.Round((double)attempts.Average(a => a.Percentage), 1) : 0,
                AttendancePresent = attendance.Where(a => a.Key == AttendanceStatus.Present).Sum(a => a.Count),
                AttendanceAbsent = attendance.Where(a => a.Key == AttendanceStatus.Absent).Sum(a => a.Count),
                HasActiveSubscription = sub is not null,
                SubscriptionPlan = sub?.Plan?.Name,
                SubscriptionEndsAt = sub?.EndsAt,
                XpTotal = xpTotal,
                Level = level,
                LastExamTitle = attempts.FirstOrDefault()?.ExamTitle,
                LastExamPercentage = attempts.FirstOrDefault()?.Percentage is not null ? (double)attempts.FirstOrDefault()!.Percentage : null,
                LastExamAt = attempts.FirstOrDefault()?.SubmittedAt
            });
        }

        return ApiResponse<ParentDashboardDto>.Ok(new ParentDashboardDto
        {
            ParentName = parent.FullName,
            Phone = parent.Phone,
            Children = children
        });
    }
}
