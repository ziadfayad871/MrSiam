using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Entities;

namespace MrSiam.Application.Features.StudentEngagement;

public record GetNotificationsQuery(int UserId, int Take = 20, bool UnreadOnly = false)
    : IRequest<ApiResponse<IReadOnlyList<NotificationDto>>>;

public record MarkNotificationsReadCommand(int UserId, int? Id) : IRequest<ApiResponse<bool>>;

public static class NotificationService
{
    public static async Task PushAsync(IApplicationDbContext db, int userId, string title, string body, string type, string? link = null, CancellationToken ct = default)
    {
        db.Notifications.Add(new Notification
        {
            UserId = userId,
            Title = title,
            Body = body,
            Type = type,
            Link = link,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync(ct);
    }

    public static async Task PushToStudentsAsync(IApplicationDbContext db, string title, string body, string type, string? link = null, CancellationToken ct = default)
    {
        var studentUserIds = await db.Students.AsNoTracking().Select(s => s.UserId).ToListAsync(ct);
        foreach (var userId in studentUserIds)
        {
            db.Notifications.Add(new Notification
            {
                UserId = userId,
                Title = title,
                Body = body,
                Type = type,
                Link = link,
                CreatedAt = DateTime.UtcNow
            });
        }
        await db.SaveChangesAsync(ct);
    }
}

public class GetNotificationsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetNotificationsQuery, ApiResponse<IReadOnlyList<NotificationDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<NotificationDto>>> Handle(GetNotificationsQuery request, CancellationToken ct)
    {
        var query = db.Notifications.AsNoTracking().Where(n => n.UserId == request.UserId);
        if (request.UnreadOnly)
            query = query.Where(n => n.ReadAt == null);

        var notifications = await query
            .OrderByDescending(n => n.CreatedAt)
            .Take(request.Take)
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Title = n.Title,
                Body = n.Body,
                Type = n.Type,
                Link = n.Link,
                IsRead = n.ReadAt != null,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync(ct);

        return ApiResponse<IReadOnlyList<NotificationDto>>.Ok(notifications);
    }
}

public class MarkNotificationsReadCommandHandler(IApplicationDbContext db)
    : IRequestHandler<MarkNotificationsReadCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(MarkNotificationsReadCommand request, CancellationToken ct)
    {
        if (request.Id is not null)
        {
            var notification = await db.Notifications.FirstOrDefaultAsync(
                n => n.Id == request.Id && n.UserId == request.UserId, ct);
            if (notification is null)
                return ApiResponse<bool>.Fail("الإشعار غير موجود");
            notification.ReadAt = DateTime.UtcNow;
        }
        else
        {
            var unread = await db.Notifications
                .Where(n => n.UserId == request.UserId && n.ReadAt == null)
                .ToListAsync(ct);
            foreach (var n in unread)
                n.ReadAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}
