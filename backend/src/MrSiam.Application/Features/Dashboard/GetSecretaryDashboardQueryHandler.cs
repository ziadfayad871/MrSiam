using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Dashboard;

public record GetSecretaryDashboardQuery : IRequest<ApiResponse<SecretaryDashboardDto>>;

public class GetSecretaryDashboardQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetSecretaryDashboardQuery, ApiResponse<SecretaryDashboardDto>>
{
    public async Task<ApiResponse<SecretaryDashboardDto>> Handle(GetSecretaryDashboardQuery request, CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var totalStudents = await db.Students.CountAsync(s => s.IsActive, ct);
        var activeCourses = await db.Courses.CountAsync(c => c.IsActive, ct);
        var todayAttendance = await db.AttendanceRecords.Where(a => a.Date == today).ToListAsync(ct);
        var presentToday = todayAttendance.Count(a => a.Status == Domain.Enums.AttendanceStatus.Present);
        var absentToday = todayAttendance.Count(a => a.Status == Domain.Enums.AttendanceStatus.Absent);

        var payments = await db.Payments
            .AsNoTracking()
            .Where(p => p.Month == currentMonthName())
            .ToListAsync(ct);

        var collected = payments.Where(p => p.Status == Domain.Enums.PaymentStatus.Paid).Sum(p => p.Amount);
        var pending = payments.Where(p => p.Status != Domain.Enums.PaymentStatus.Paid).Sum(p => p.Amount);

        var recentStudents = await db.Students
            .AsNoTracking()
            .OrderByDescending(s => s.JoinedAt)
            .Take(8)
            .Select(s => new RecentStudentDto
            {
                Id = s.Id,
                FullName = s.FullName,
                StudentCode = s.StudentCode,
                StageAr = s.Stage.ToArabic(),
                AcademicYear = s.AcademicYear,
                JoinedAt = s.JoinedAt
            })
            .ToListAsync(ct);

        foreach (var student in recentStudents)
        {
            student.HasPaymentIssue = await db.Payments
                .AnyAsync(p => p.StudentId == student.Id && p.Month == currentMonthName() && p.Status == Domain.Enums.PaymentStatus.Overdue, ct);
        }

        var paymentSummary = await db.Payments
            .AsNoTracking()
            .GroupBy(p => p.Month)
            .OrderByDescending(g => g.Key)
            .Take(6)
            .Select(g => new PaymentSummaryDto
            {
                Month = g.Key,
                Total = g.Count(),
                Paid = g.Count(p => p.Status == Domain.Enums.PaymentStatus.Paid),
                Pending = g.Count(p => p.Status == Domain.Enums.PaymentStatus.Pending),
                Overdue = g.Count(p => p.Status == Domain.Enums.PaymentStatus.Overdue),
                Collected = g.Where(p => p.Status == Domain.Enums.PaymentStatus.Paid).Sum(p => p.Amount)
            })
            .ToListAsync(ct);

        var stats = new List<SecretaryStatDto>
        {
            new() { Key = "students", Label = "الطلاب", Value = totalStudents.ToString("N0"), Icon = "users" },
            new() { Key = "courses", Label = "المقررات", Value = activeCourses.ToString("N0"), Icon = "book" },
            new() { Key = "present", Label = "الحاضرون اليوم", Value = presentToday.ToString(), Icon = "check" },
            new() { Key = "absent", Label = "الغائبون اليوم", Value = absentToday.ToString(), Icon = "x" },
            new() { Key = "collected", Label = "المحصّل هذا الشهر", Value = collected.ToString("N0"), Icon = "coins" },
            new() { Key = "pending", Label = "مستحق الدفع", Value = pending.ToString("N0"), Icon = "clock" }
        };

        return ApiResponse<SecretaryDashboardDto>.Ok(new SecretaryDashboardDto
        {
            Stats = stats,
            RecentStudents = recentStudents,
            PaymentsSummary = paymentSummary,
            AttendanceToday = presentToday,
            AbsentToday = absentToday,
            CollectedThisMonth = collected,
            PendingThisMonth = pending
        });
    }

    private static string currentMonthName() => DateTime.UtcNow.ToString("yyyy-MM");
}
