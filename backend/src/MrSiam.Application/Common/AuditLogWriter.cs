using MrSiam.Application.Abstractions;
using MrSiam.Domain.Entities;

namespace MrSiam.Application.Common;

public static class AuditLogWriter
{
    /// <summary>يسجل عملية في سجل العمليات مع اسم منفذها (السكرتير/المستر).</summary>
    public static void Add(IApplicationDbContext db, ICurrentUserService currentUser, string action, string entity, string? entityId, string details)
    {
        db.AuditLogs.Add(new AuditLog
        {
            UserId = currentUser.UserId,
            Username = currentUser.Username,
            Action = action,
            Entity = entity,
            EntityId = entityId,
            Details = details,
            CreatedAt = DateTime.UtcNow
        });
    }
}
