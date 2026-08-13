using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Entities;
using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Schedule;

public record ScheduleSlotDto
{
    public int Id { get; init; }
    public int GroupId { get; init; }
    public required string GroupName { get; init; }
    public Stage Stage { get; init; }
    public required string StageAr { get; init; }
    public DayOfWeek Day { get; init; }
    public TimeOnly StartTime { get; init; }
    public TimeOnly EndTime { get; init; }
    public string? Subject { get; init; }
    public string? Room { get; init; }
}

public record ListScheduleQuery(DayOfWeek? Day = null, Stage? Stage = null)
    : IRequest<ApiResponse<IReadOnlyList<ScheduleSlotDto>>>;

public record CreateScheduleSlotCommand(
    int GroupId,
    DayOfWeek Day,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string? Subject,
    string? Room) : IRequest<ApiResponse<int>>;

public record UpdateScheduleSlotCommand(
    int SlotId,
    DayOfWeek? Day,
    TimeOnly? StartTime,
    TimeOnly? EndTime,
    string? Subject,
    string? Room) : IRequest<ApiResponse<bool>>;

public record DeleteScheduleSlotCommand(int SlotId) : IRequest<ApiResponse<bool>>;

public class ListScheduleQueryHandler(IApplicationDbContext db)
    : IRequestHandler<ListScheduleQuery, ApiResponse<IReadOnlyList<ScheduleSlotDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<ScheduleSlotDto>>> Handle(ListScheduleQuery request, CancellationToken ct)
    {
        var query = db.ScheduleSlots.AsNoTracking();

        if (request.Day is not null)
            query = query.Where(s => s.Day == request.Day);
        if (request.Stage is not null)
            query = query.Where(s => s.Group != null && s.Group.Stage == request.Stage);

        var slots = await query
            .OrderBy(s => s.Day)
            .ThenBy(s => s.StartTime)
            .Select(s => new ScheduleSlotDto
            {
                Id = s.Id,
                GroupId = s.GroupId,
                GroupName = s.Group != null ? s.Group.Name : string.Empty,
                Stage = s.Group != null ? s.Group.Stage : Stage.PrepOne,
                StageAr = s.Group != null ? s.Group.Stage.ToArabic() : string.Empty,
                Day = s.Day,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                Subject = s.Subject,
                Room = s.Room
            })
            .ToListAsync(ct);

        return ApiResponse<IReadOnlyList<ScheduleSlotDto>>.Ok(slots);
    }
}

public class CreateScheduleSlotCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CreateScheduleSlotCommand, ApiResponse<int>>
{
    public async Task<ApiResponse<int>> Handle(CreateScheduleSlotCommand request, CancellationToken ct)
    {
        var groupExists = await db.StudyGroups.AnyAsync(g => g.Id == request.GroupId && g.IsActive, ct);
        if (!groupExists)
            return ApiResponse<int>.Fail("المجموعة غير موجودة");

        if (request.EndTime <= request.StartTime)
            return ApiResponse<int>.Fail("وقت النهاية لازم ييجي بعد وقت البداية");

        var slot = new ScheduleSlot
        {
            GroupId = request.GroupId,
            Day = request.Day,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Subject = request.Subject?.Trim(),
            Room = request.Room?.Trim()
        };

        db.ScheduleSlots.Add(slot);
        await db.SaveChangesAsync(ct);

        return ApiResponse<int>.Ok(slot.Id, "تمت إضافة الحصة");
    }
}

public class UpdateScheduleSlotCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateScheduleSlotCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(UpdateScheduleSlotCommand request, CancellationToken ct)
    {
        var slot = await db.ScheduleSlots.FirstOrDefaultAsync(s => s.Id == request.SlotId, ct);
        if (slot is null)
            return ApiResponse<bool>.Fail("الحصة غير موجودة");

        if (request.Day is not null)
            slot.Day = request.Day.Value;
        if (request.StartTime is not null)
            slot.StartTime = request.StartTime.Value;
        if (request.EndTime is not null)
            slot.EndTime = request.EndTime.Value;
        if (request.Subject is not null)
            slot.Subject = request.Subject.Trim();

        if (request.Room is not null)
            slot.Room = request.Room.Trim();

        if (slot.EndTime <= slot.StartTime)
            return ApiResponse<bool>.Fail("وقت النهاية لازم ييجي بعد وقت البداية");

        await db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true, "تم تحديث الحصة");
    }
}

public class DeleteScheduleSlotCommandHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteScheduleSlotCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(DeleteScheduleSlotCommand request, CancellationToken ct)
    {
        var slot = await db.ScheduleSlots.FirstOrDefaultAsync(s => s.Id == request.SlotId, ct);
        if (slot is null)
            return ApiResponse<bool>.Fail("الحصة غير موجودة");

        db.ScheduleSlots.Remove(slot);
        await db.SaveChangesAsync(ct);

        return ApiResponse<bool>.Ok(true, "تم حذف الحصة");
    }
}