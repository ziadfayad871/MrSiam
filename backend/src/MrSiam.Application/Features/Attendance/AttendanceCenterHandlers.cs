using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Attendance;

public record DailyAttendanceStudentDto
{
    public int StudentId { get; init; }
    public required string FullName { get; init; }
    public required string StudentCode { get; init; }
    public Stage Stage { get; init; }
    public required string StageAr { get; init; }
    public int? GroupId { get; init; }
    public string? GroupName { get; init; }
    public AttendanceStatus? Status { get; init; }
    public string? Notes { get; init; }
}

public record GetDailyAttendanceQuery(DateOnly Date)
    : IRequest<ApiResponse<IReadOnlyList<DailyAttendanceStudentDto>>>;

public record BulkAttendanceItemDto(int StudentId, AttendanceStatus Status, string? Notes = null);

public record BulkMarkAttendanceCommand(DateOnly Date, List<BulkAttendanceItemDto> Items)
    : IRequest<ApiResponse<bool>>;

public class GetDailyAttendanceQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetDailyAttendanceQuery, ApiResponse<IReadOnlyList<DailyAttendanceStudentDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<DailyAttendanceStudentDto>>> Handle(GetDailyAttendanceQuery request, CancellationToken ct)
    {
        var students = await db.Students.AsNoTracking()
            .Where(s => s.IsActive)
            .OrderBy(s => s.Stage)
            .ThenBy(s => s.FullName)
            .ToListAsync(ct);

        var records = await db.AttendanceRecords.AsNoTracking()
            .Where(a => a.Date == request.Date)
            .ToDictionaryAsync(a => a.StudentId, ct);

        var memberships = await db.StudyGroupMembers.AsNoTracking()
            .Where(m => m.Group != null && m.Group.IsActive)
            .Select(m => new { m.StudentId, m.Group!.Id, m.Group!.Name })
            .ToListAsync(ct);

        var groupByStudent = memberships
            .GroupBy(m => m.StudentId)
            .ToDictionary(g => g.Key, g => g.OrderBy(x => x.Id).First());

        var result = students.Select(s =>
        {
            records.TryGetValue(s.Id, out var record);
            groupByStudent.TryGetValue(s.Id, out var group);
            return new DailyAttendanceStudentDto
            {
                StudentId = s.Id,
                FullName = s.FullName,
                StudentCode = s.StudentCode,
                Stage = s.Stage,
                StageAr = s.Stage.ToArabic(),
                GroupId = group?.Id,
                GroupName = group?.Name,
                Status = record?.Status,
                Notes = record?.Notes
            };
        }).ToList();

        return ApiResponse<IReadOnlyList<DailyAttendanceStudentDto>>.Ok(result);
    }
}

public class BulkMarkAttendanceCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<BulkMarkAttendanceCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(BulkMarkAttendanceCommand request, CancellationToken ct)
    {
        if (request.Items.Count == 0)
            return ApiResponse<bool>.Fail("اختر حالة الحضور لطالب واحد على الأقل");

        var studentIds = request.Items.Select(i => i.StudentId).ToHashSet();
        var existing = await db.AttendanceRecords
            .Where(a => a.Date == request.Date && studentIds.Contains(a.StudentId))
            .ToDictionaryAsync(a => a.StudentId, ct);

        foreach (var item in request.Items)
        {
            if (existing.TryGetValue(item.StudentId, out var record))
            {
                record.Status = item.Status;
                record.Notes = item.Notes;
            }
            else
            {
                db.AttendanceRecords.Add(new Domain.Entities.AttendanceRecord
                {
                    StudentId = item.StudentId,
                    Date = request.Date,
                    Status = item.Status,
                    Notes = item.Notes
                });
            }
        }

        await db.SaveChangesAsync(ct);

        AuditLogWriter.Add(db, currentUser, "bulk", "Attendance", request.Date.ToString("yyyy-MM-dd"), $"تسجيل حضور جماعي — {request.Items.Count} طالب ({request.Date})");
        await db.SaveChangesAsync(ct);

        return ApiResponse<bool>.Ok(true, "تم تسجيل الحضور");
    }
}

public record DeleteAttendanceRecordCommand(int StudentId, DateOnly Date)
    : IRequest<ApiResponse<bool>>;

public class DeleteAttendanceRecordCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<DeleteAttendanceRecordCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(DeleteAttendanceRecordCommand request, CancellationToken ct)
    {
        var record = await db.AttendanceRecords
            .FirstOrDefaultAsync(a => a.StudentId == request.StudentId && a.Date == request.Date, ct);
        if (record is null)
            return ApiResponse<bool>.Fail("لا يوجد تسجيل حضور لهذا الطالب في هذا اليوم");

        db.AttendanceRecords.Remove(record);
        await db.SaveChangesAsync(ct);

        AuditLogWriter.Add(db, currentUser, "delete", "Attendance", request.StudentId.ToString(), $"حذف تسجيل حضور {request.Date} — طالب رقم {request.StudentId}");
        await db.SaveChangesAsync(ct);

        return ApiResponse<bool>.Ok(true, "تم حذف تسجيل الحضور");
    }
}