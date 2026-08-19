using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
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

public class BulkMarkAttendanceCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser,
    IServiceScopeFactory scopeFactory)
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

        var newlyAbsentIds = new List<int>();

        foreach (var item in request.Items)
        {
            if (existing.TryGetValue(item.StudentId, out var record))
            {
                var wasAbsent = record.Status == AttendanceStatus.Absent;
                record.Status = item.Status;
                record.Notes = item.Notes;
                if (item.Status == AttendanceStatus.Absent && !wasAbsent)
                    newlyAbsentIds.Add(item.StudentId);
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
                if (item.Status == AttendanceStatus.Absent)
                    newlyAbsentIds.Add(item.StudentId);
            }
        }

        await db.SaveChangesAsync(ct);

        AuditLogWriter.Add(db, currentUser, "bulk", "Attendance", request.Date.ToString("yyyy-MM-dd"), $"تسجيل حضور جماعي — {request.Items.Count} طالب ({request.Date})");
        await db.SaveChangesAsync(ct);

        if (newlyAbsentIds.Count > 0)
        {
            var absentIds = newlyAbsentIds.ToList();
            var date = request.Date;
            BackgroundJob.Run(scopeFactory, (scopedDb, scopedWhatsApp, logger, backgroundCt) =>
                AbsenceNotifier.SendIfAbsentAsync(logger, scopedDb, scopedWhatsApp, absentIds, date, backgroundCt));
        }

        return ApiResponse<bool>.Ok(true, "تم تسجيل الحضور");
    }
}

public record AttendanceRecordSlice(int StudentId, DateOnly Date, AttendanceStatus Status);

public record MonthlyAttendanceDayDto
{
    public int Day { get; init; }
    public bool IsSession { get; init; }
    public AttendanceStatus? Status { get; init; }
}

public record MonthlyAttendanceStudentDto
{
    public int StudentId { get; init; }
    public required string FullName { get; init; }
    public required string StudentCode { get; init; }
    public Stage Stage { get; init; }
    public required string StageAr { get; init; }
    public int? GroupId { get; init; }
    public string? GroupName { get; init; }
    public int PresentCount { get; init; }
    public int AbsentCount { get; init; }
    public int LateCount { get; init; }
    public int ExcusedCount { get; init; }
    public int MarkedCount { get; init; }
    public int SessionCount { get; init; }
    public IReadOnlyList<MonthlyAttendanceDayDto> Days { get; init; } = Array.Empty<MonthlyAttendanceDayDto>();
}

public record GetMonthlyAttendanceQuery(string Month, int? GroupId = null, Stage? Stage = null)
    : IRequest<ApiResponse<IReadOnlyList<MonthlyAttendanceStudentDto>>>;

public class GetMonthlyAttendanceQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetMonthlyAttendanceQuery, ApiResponse<IReadOnlyList<MonthlyAttendanceStudentDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<MonthlyAttendanceStudentDto>>> Handle(GetMonthlyAttendanceQuery request, CancellationToken ct)
    {
        if (!DateOnly.TryParseExact($"{request.Month}-01", "yyyy-MM-dd", out var monthStart))
            return ApiResponse<IReadOnlyList<MonthlyAttendanceStudentDto>>.Fail("صيغة الشهر غير صحيحة — استخدم YYYY-MM");

        var daysInMonth = DateTime.DaysInMonth(monthStart.Year, monthStart.Month);

        // أيام الحصص الفعلية للمجموعة من جدولها (يوم + موعد) — لو مفيش جدول، كل الأيام سشن.
        var sessionDowSet = new HashSet<int>();
        if (request.GroupId is not null)
        {
            var slotDays = await db.ScheduleSlots.AsNoTracking()
                .Where(s => s.GroupId == request.GroupId.Value)
                .Select(s => (int)s.Day)
                .Distinct()
                .ToListAsync(ct);
            sessionDowSet = slotDays.ToHashSet();
        }

        var sessionDates = Enumerable.Range(1, daysInMonth)
            .Select(d => new
            {
                Day = d,
                IsSession = sessionDowSet.Count > 0 &&
                            sessionDowSet.Contains((int)new DateOnly(monthStart.Year, monthStart.Month, d).DayOfWeek)
            })
            .ToList();
        var sessionCount = sessionDowSet.Count > 0 ? sessionDates.Count(x => x.IsSession) : 0;

        var studentsQuery = db.Students.AsNoTracking().Where(s => s.IsActive);
        if (request.Stage is not null)
            studentsQuery = studentsQuery.Where(s => s.Stage == request.Stage.Value);
        if (request.GroupId is not null)
        {
            var groupId = request.GroupId.Value;
            studentsQuery = studentsQuery.Where(s =>
                db.StudyGroupMembers.Any(m => m.GroupId == groupId && m.StudentId == s.Id));
        }

        var students = await studentsQuery
            .OrderBy(s => s.Stage)
            .ThenBy(s => s.FullName)
            .ToListAsync(ct);

        var records = await db.AttendanceRecords.AsNoTracking()
            .Where(a => a.Date.Year == monthStart.Year && a.Date.Month == monthStart.Month)
            .Select(a => new AttendanceRecordSlice(a.StudentId, a.Date, a.Status))
            .ToListAsync(ct);

        var recordsByStudent = records
            .GroupBy(r => r.StudentId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var memberships = await db.StudyGroupMembers.AsNoTracking()
            .Where(m => m.Group != null && m.Group.IsActive)
            .Select(m => new { m.StudentId, m.Group!.Id, m.Group!.Name })
            .ToListAsync(ct);

        var groupByStudent = memberships
            .GroupBy(m => m.StudentId)
            .ToDictionary(g => g.Key, g => g.OrderBy(x => x.Id).First());

        var result = students.Select(s =>
        {
            recordsByStudent.TryGetValue(s.Id, out var list);
            var items = list ?? new List<AttendanceRecordSlice>();
            var byDay = items.ToDictionary(x => x.Date.Day, x => x.Status);

            groupByStudent.TryGetValue(s.Id, out var group);
            return new MonthlyAttendanceStudentDto
            {
                StudentId = s.Id,
                FullName = s.FullName,
                StudentCode = s.StudentCode,
                Stage = s.Stage,
                StageAr = s.Stage.ToArabic(),
                GroupId = group?.Id,
                GroupName = group?.Name,
                PresentCount = items.Count(x => x.Status == AttendanceStatus.Present),
                AbsentCount = items.Count(x => x.Status == AttendanceStatus.Absent),
                LateCount = items.Count(x => x.Status == AttendanceStatus.Late),
                ExcusedCount = items.Count(x => x.Status == AttendanceStatus.Excused),
                MarkedCount = items.Count,
                SessionCount = sessionCount,
                Days = sessionDates
                    .Select(x => new MonthlyAttendanceDayDto
                    {
                        Day = x.Day,
                        IsSession = x.IsSession,
                        Status = byDay.TryGetValue(x.Day, out var status) ? status : null
                    })
                    .ToArray()
            };
        }).ToList();

        return ApiResponse<IReadOnlyList<MonthlyAttendanceStudentDto>>.Ok(result);
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