using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Entities;
using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Attendance;

public record AttendanceRecordDto
{
    public int Id { get; init; }
    public int StudentId { get; init; }
    public required string StudentName { get; init; }
    public DateOnly Date { get; init; }
    public AttendanceStatus Status { get; init; }
    public string? Notes { get; init; }
}

public record GetAttendanceQuery(DateOnly? Date = null, int Page = 1, int PageSize = 50)
    : IRequest<ApiResponse<PagedResult<AttendanceRecordDto>>>;

public record MarkAttendanceCommand(int StudentId, DateOnly Date, AttendanceStatus Status, string? Notes = null)
    : IRequest<ApiResponse<bool>>;

public class GetAttendanceQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetAttendanceQuery, ApiResponse<PagedResult<AttendanceRecordDto>>>
{
    public async Task<ApiResponse<PagedResult<AttendanceRecordDto>>> Handle(GetAttendanceQuery request, CancellationToken ct)
    {
        var query = db.AttendanceRecords.AsNoTracking();

        var date = request.Date ?? DateOnly.FromDateTime(DateTime.UtcNow);
        query = query.Where(a => a.Date == date);

        var projected = query
            .OrderBy(a => a.Student != null ? a.Student.FullName : string.Empty)
            .Select(a => new AttendanceRecordDto
            {
                Id = a.Id,
                StudentId = a.StudentId,
                StudentName = a.Student != null ? a.Student.FullName : string.Empty,
                Date = a.Date,
                Status = a.Status,
                Notes = a.Notes
            });

        var paged = PagedResult<AttendanceRecordDto>.From(projected, request.Page, request.PageSize);
        return ApiResponse<PagedResult<AttendanceRecordDto>>.Ok(paged);
    }
}

public class MarkAttendanceCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser,
    IServiceScopeFactory scopeFactory)
    : IRequestHandler<MarkAttendanceCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(MarkAttendanceCommand request, CancellationToken ct)
    {
        var studentExists = await db.Students.AnyAsync(s => s.Id == request.StudentId && s.IsActive, ct);
        if (!studentExists)
            return ApiResponse<bool>.Fail("الطالب غير موجود");

        var existing = await db.AttendanceRecords
            .FirstOrDefaultAsync(a => a.StudentId == request.StudentId && a.Date == request.Date, ct);

        var wasAbsent = existing?.Status == AttendanceStatus.Absent;

        if (existing is not null)
        {
            existing.Status = request.Status;
            existing.Notes = request.Notes;
        }
        else
        {
            db.AttendanceRecords.Add(new AttendanceRecord
            {
                StudentId = request.StudentId,
                Date = request.Date,
                Status = request.Status,
                Notes = request.Notes
            });
        }

        await db.SaveChangesAsync(ct);

        AuditLogWriter.Add(db, currentUser, existing is not null ? "update" : "create", "Attendance", request.StudentId.ToString(), $"تسجيل حضور {request.Date} — {request.Status}");
        await db.SaveChangesAsync(ct);

        if (request.Status == AttendanceStatus.Absent && !wasAbsent)
        {
            var studentId = request.StudentId;
            var date = request.Date;
            BackgroundJob.Run(scopeFactory, (scopedDb, scopedWhatsApp, logger, backgroundCt) =>
                AbsenceNotifier.SendIfAbsentAsync(logger, scopedDb, scopedWhatsApp, [studentId], date, backgroundCt));
        }

        return ApiResponse<bool>.Ok(true, "تم تسجيل الحضور");
    }
}

/// <summary>
/// يبعت لأولياء أمور الطلاب اللي اتحط حالتهم "غائب" رسالة إشعار واحدة موحدة.
/// </summary>
internal static class AbsenceNotifier
{
    public static async Task SendIfAbsentAsync(
        ILogger logger,
        IApplicationDbContext db,
        IWhatsAppService whatsApp,
        IEnumerable<int> studentIds,
        DateOnly date,
        CancellationToken ct)
    {
        var students = await db.Students.AsNoTracking()
            .Where(s => studentIds.Contains(s.Id) && s.IsActive && !string.IsNullOrWhiteSpace(s.GuardianPhone))
            .Select(s => new { s.Id, s.FullName, s.GuardianPhone })
            .ToListAsync(ct);

        logger.LogInformation("إشعار غياب حصة: بتجهز إرسال لـ {Count} ولي أمر في تاريخ {Date}", students.Count, date);

        foreach (var student in students)
        {
            try
            {
                var msg =
                    $"مستر محمد صيام 🏫\n" +
                    $"مع أبو كيان .. الدراسات في أمان 🙏\n\n" +
                    $"عزيزي ولي أمر الطالب/ة {student.FullName} 👋\n\n" +
                    $"نخطركم أن {student.FullName} لم يحضر حصة اليوم بتاريخ {date:dd/MM/yyyy}.\n" +
                    $"نرجو الاطمئنان عليه ومتابعته، وتواصلكم معنا لأي استفسار 💬";

                var sent = await whatsApp.SendAsync(student.GuardianPhone!, msg, ct);
                logger.LogInformation("إشعار غياب حصة: إرسال لولي أمر {Name} = {Result}", student.FullName, sent ? "تم" : "فشل");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "إشعار غياب حصة: استثناء أثناء إرسال لولي أمر {Name}", student.FullName);
            }
        }
    }
}
