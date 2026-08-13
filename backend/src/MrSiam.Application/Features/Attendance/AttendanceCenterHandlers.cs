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

        var result = students.Select(s =>
        {
            records.TryGetValue(s.Id, out var record);
            return new DailyAttendanceStudentDto
            {
                StudentId = s.Id,
                FullName = s.FullName,
                StudentCode = s.StudentCode,
                Stage = s.Stage,
                StageAr = s.Stage.ToArabic(),
                Status = record?.Status,
                Notes = record?.Notes
            };
        }).ToList();

        return ApiResponse<IReadOnlyList<DailyAttendanceStudentDto>>.Ok(result);
    }
}

public class BulkMarkAttendanceCommandHandler(IApplicationDbContext db)
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
        return ApiResponse<bool>.Ok(true, "تم تسجيل الحضور");
    }
}