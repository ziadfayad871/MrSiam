using MediatR;
using Microsoft.EntityFrameworkCore;
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

public class MarkAttendanceCommandHandler(IApplicationDbContext db)
    : IRequestHandler<MarkAttendanceCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(MarkAttendanceCommand request, CancellationToken ct)
    {
        var studentExists = await db.Students.AnyAsync(s => s.Id == request.StudentId && s.IsActive, ct);
        if (!studentExists)
            return ApiResponse<bool>.Fail("الطالب غير موجود");

        var existing = await db.AttendanceRecords
            .FirstOrDefaultAsync(a => a.StudentId == request.StudentId && a.Date == request.Date, ct);

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
        return ApiResponse<bool>.Ok(true, "تم تسجيل الحضور");
    }
}
