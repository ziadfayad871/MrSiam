using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Entities;
using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.StudyGroups;

public record StudyGroupListItemDto
{
    public int Id { get; init; }
    public required string Name { get; init; }
    public Stage Stage { get; init; }
    public required string StageAr { get; init; }
    public required string AcademicYear { get; init; }
    public bool IsActive { get; init; }
    public int MemberCount { get; init; }
    public DateTime CreatedAt { get; init; }
    public IReadOnlyList<int> ScheduleDays { get; init; } = Array.Empty<int>();
}

public record StudyGroupMemberDto
{
    public int StudentId { get; init; }
    public required string FullName { get; init; }
    public required string StudentCode { get; init; }
    public required string StageAr { get; init; }
    public DateTime AddedAt { get; init; }
}

public record StudyGroupDetailDto
{
    public int Id { get; init; }
    public required string Name { get; init; }
    public Stage Stage { get; init; }
    public required string StageAr { get; init; }
    public required string AcademicYear { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
    public IReadOnlyList<StudyGroupMemberDto> Members { get; init; } = Array.Empty<StudyGroupMemberDto>();
}

public record ListStudyGroupsQuery(bool IncludeInactive = false, Stage? Stage = null)
    : IRequest<ApiResponse<IReadOnlyList<StudyGroupListItemDto>>>;

public record GetStudyGroupQuery(int GroupId)
    : IRequest<ApiResponse<StudyGroupDetailDto>>;

public record CreateStudyGroupCommand(
    string Name,
    Stage Stage,
    string AcademicYear,
    IReadOnlyList<DayOfWeek>? ScheduleDays = null,
    TimeOnly? StartTime = null,
    TimeOnly? EndTime = null,
    string? Subject = null,
    string? Room = null) : IRequest<ApiResponse<int>>;

public record UpdateStudyGroupCommand(
    int GroupId,
    string? Name,
    Stage? Stage,
    string? AcademicYear,
    bool? IsActive,
    IReadOnlyList<DayOfWeek>? ScheduleDays = null,
    TimeOnly? StartTime = null,
    TimeOnly? EndTime = null,
    string? Subject = null) : IRequest<ApiResponse<bool>>;

public record DeleteStudyGroupCommand(int GroupId)
    : IRequest<ApiResponse<bool>>;

public record AddMemberCommand(int GroupId, int StudentId)
    : IRequest<ApiResponse<bool>>;

public record RemoveMemberCommand(int GroupId, int StudentId)
    : IRequest<ApiResponse<bool>>;

public class ListStudyGroupsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<ListStudyGroupsQuery, ApiResponse<IReadOnlyList<StudyGroupListItemDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<StudyGroupListItemDto>>> Handle(ListStudyGroupsQuery request, CancellationToken ct)
    {
        var query = db.StudyGroups.AsNoTracking();

        if (!request.IncludeInactive)
            query = query.Where(g => g.IsActive);
        if (request.Stage is not null)
            query = query.Where(g => g.Stage == request.Stage);

        var groups = await query
            .OrderBy(g => g.Stage)
            .ThenBy(g => g.Name)
            .Select(g => new StudyGroupListItemDto
            {
                Id = g.Id,
                Name = g.Name,
                Stage = g.Stage,
                StageAr = g.Stage.ToArabic(),
                AcademicYear = g.AcademicYear,
                IsActive = g.IsActive,
                MemberCount = g.Members.Count,
                CreatedAt = g.CreatedAt,
                ScheduleDays = g.Slots.Select(s => (int)s.Day).ToArray()
            })
            .ToListAsync(ct);

        return ApiResponse<IReadOnlyList<StudyGroupListItemDto>>.Ok(groups);
    }
}

public class GetStudyGroupQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetStudyGroupQuery, ApiResponse<StudyGroupDetailDto>>
{
    public async Task<ApiResponse<StudyGroupDetailDto>> Handle(GetStudyGroupQuery request, CancellationToken ct)
    {
        var group = await db.StudyGroups
            .Include(g => g.Members)
                .ThenInclude(m => m.Student)
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.Id == request.GroupId, ct);

        if (group is null)
            return ApiResponse<StudyGroupDetailDto>.Fail("المجموعة غير موجودة");

        var dto = new StudyGroupDetailDto
        {
            Id = group.Id,
            Name = group.Name,
            Stage = group.Stage,
            StageAr = group.Stage.ToArabic(),
            AcademicYear = group.AcademicYear,
            IsActive = group.IsActive,
            CreatedAt = group.CreatedAt,
            Members = group.Members
                .OrderBy(m => m.Student != null ? m.Student.FullName : string.Empty)
                .Select(m => new StudyGroupMemberDto
                {
                    StudentId = m.StudentId,
                    FullName = m.Student?.FullName ?? string.Empty,
                    StudentCode = m.Student?.StudentCode ?? string.Empty,
                    StageAr = m.Student != null ? m.Student.Stage.ToArabic() : string.Empty,
                    AddedAt = m.AddedAt
                })
                .ToArray()
        };

        return ApiResponse<StudyGroupDetailDto>.Ok(dto);
    }
}

public class CreateStudyGroupCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<CreateStudyGroupCommand, ApiResponse<int>>
{
    public async Task<ApiResponse<int>> Handle(CreateStudyGroupCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return ApiResponse<int>.Fail("اسم المجموعة مطلوب");

        var group = new StudyGroup
        {
            Name = request.Name.Trim(),
            Stage = request.Stage,
            AcademicYear = string.IsNullOrWhiteSpace(request.AcademicYear)
                ? DateTime.UtcNow.Year.ToString()
                : request.AcademicYear.Trim()
        };

        if (request.ScheduleDays is { Count: > 0 })
        {
            var start = request.StartTime ?? new TimeOnly(17, 0);
            var end = request.EndTime ?? start.AddHours(1.5);
            if (end <= start)
                return ApiResponse<int>.Fail("وقت النهاية لازم ييجي بعد وقت البداية");

            var subject = request.Subject?.Trim();
            var room = request.Room?.Trim();
            foreach (var day in request.ScheduleDays.Distinct())
            {
                group.Slots.Add(new ScheduleSlot
                {
                    Day = day,
                    StartTime = start,
                    EndTime = end,
                    Subject = string.IsNullOrWhiteSpace(subject) ? null : subject,
                    Room = string.IsNullOrWhiteSpace(room) ? null : room
                });
            }
        }

        db.StudyGroups.Add(group);
        await db.SaveChangesAsync(ct);

        AuditLogWriter.Add(db, currentUser, "create", "StudyGroup", group.Id.ToString(), $"إنشاء مجموعة {group.Name}");
        await db.SaveChangesAsync(ct);

        return ApiResponse<int>.Ok(group.Id, "تم إنشاء المجموعة");
    }
}

public class UpdateStudyGroupCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<UpdateStudyGroupCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(UpdateStudyGroupCommand request, CancellationToken ct)
    {
        var group = await db.StudyGroups.FirstOrDefaultAsync(g => g.Id == request.GroupId, ct);
        if (group is null)
            return ApiResponse<bool>.Fail("المجموعة غير موجودة");

        if (!string.IsNullOrWhiteSpace(request.Name))
            group.Name = request.Name.Trim();
        if (request.Stage is not null)
            group.Stage = request.Stage.Value;
        if (!string.IsNullOrWhiteSpace(request.AcademicYear))
            group.AcademicYear = request.AcademicYear.Trim();
        if (request.IsActive is not null)
            group.IsActive = request.IsActive.Value;

        // لو ScheduleDays موجود (حتى لو فاضي) بنستبدل حصص المجموعة كلها بالأيام دي.
        if (request.ScheduleDays is not null)
        {
            var start = request.StartTime ?? new TimeOnly(17, 0);
            var end = request.EndTime ?? start.AddHours(1.5);
            if (end <= start)
                return ApiResponse<bool>.Fail("وقت النهاية لازم ييجي بعد وقت البداية");

            var subject = request.Subject?.Trim();
            var oldSlots = await db.ScheduleSlots.Where(s => s.GroupId == group.Id).ToListAsync(ct);
            db.ScheduleSlots.RemoveRange(oldSlots);
            foreach (var day in request.ScheduleDays.Distinct())
            {
                group.Slots.Add(new ScheduleSlot
                {
                    Day = day,
                    StartTime = start,
                    EndTime = end,
                    Subject = string.IsNullOrWhiteSpace(subject) ? null : subject,
                    Room = null
                });
            }
        }

        await db.SaveChangesAsync(ct);

        AuditLogWriter.Add(db, currentUser, "update", "StudyGroup", group.Id.ToString(), $"تعديل مجموعة {group.Name}");
        await db.SaveChangesAsync(ct);

        return ApiResponse<bool>.Ok(true, "تم تحديث المجموعة");
    }
}

public class DeleteStudyGroupCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<DeleteStudyGroupCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(DeleteStudyGroupCommand request, CancellationToken ct)
    {
        var group = await db.StudyGroups.FirstOrDefaultAsync(g => g.Id == request.GroupId, ct);
        if (group is null)
            return ApiResponse<bool>.Fail("المجموعة غير موجودة");

        var name = group.Name;
        db.StudyGroups.Remove(group);
        await db.SaveChangesAsync(ct);

        AuditLogWriter.Add(db, currentUser, "delete", "StudyGroup", request.GroupId.ToString(), $"حذف مجموعة {name}");
        await db.SaveChangesAsync(ct);

        return ApiResponse<bool>.Ok(true, "تم حذف المجموعة");
    }
}

public class AddMemberCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<AddMemberCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(AddMemberCommand request, CancellationToken ct)
    {
        var group = await db.StudyGroups.AnyAsync(g => g.Id == request.GroupId, ct);
        if (!group)
            return ApiResponse<bool>.Fail("المجموعة غير موجودة");

        var student = await db.Students.AnyAsync(s => s.Id == request.StudentId, ct);
        if (!student)
            return ApiResponse<bool>.Fail("الطالب غير موجود");

        var exists = await db.StudyGroupMembers
            .AnyAsync(m => m.GroupId == request.GroupId && m.StudentId == request.StudentId, ct);
        if (exists)
            return ApiResponse<bool>.Fail("الطالب موجود بالفعل في المجموعة");

        db.StudyGroupMembers.Add(new StudyGroupMember
        {
            GroupId = request.GroupId,
            StudentId = request.StudentId
        });

        await db.SaveChangesAsync(ct);

        AuditLogWriter.Add(db, currentUser, "create", "StudyGroupMember", request.GroupId.ToString(), $"إضافة طالب (رقم {request.StudentId}) للمجموعة {request.GroupId}");
        await db.SaveChangesAsync(ct);

        return ApiResponse<bool>.Ok(true, "تمت إضافة الطالب للمجموعة");
    }
}

public class RemoveMemberCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<RemoveMemberCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(RemoveMemberCommand request, CancellationToken ct)
    {
        var member = await db.StudyGroupMembers
            .FirstOrDefaultAsync(m => m.GroupId == request.GroupId && m.StudentId == request.StudentId, ct);
        if (member is null)
            return ApiResponse<bool>.Fail("الطالب ليس عضوًا في المجموعة");

        db.StudyGroupMembers.Remove(member);
        await db.SaveChangesAsync(ct);

        AuditLogWriter.Add(db, currentUser, "delete", "StudyGroupMember", request.GroupId.ToString(), $"إزالة طالب (رقم {request.StudentId}) من المجموعة {request.GroupId}");
        await db.SaveChangesAsync(ct);

        return ApiResponse<bool>.Ok(true, "تمت إزالة الطالب من المجموعة");
    }
}