using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;

namespace MrSiam.Application.Features.AuditLogs;

public record AuditLogListItemDto
{
    public int Id { get; init; }
    public int? UserId { get; init; }
    public string? Username { get; init; }
    public required string Action { get; init; }
    public required string Entity { get; init; }
    public string? EntityId { get; init; }
    public string? Details { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record ListAuditLogsQuery(int? UserId = null, string? Action = null, string? Entity = null, int Page = 1, int PageSize = 30)
    : IRequest<ApiResponse<PagedResult<AuditLogListItemDto>>>;

public class ListAuditLogsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<ListAuditLogsQuery, ApiResponse<PagedResult<AuditLogListItemDto>>>
{
    public async Task<ApiResponse<PagedResult<AuditLogListItemDto>>> Handle(ListAuditLogsQuery request, CancellationToken ct)
    {
        var query = db.AuditLogs.AsNoTracking();

        if (request.UserId is not null)
            query = query.Where(a => a.UserId == request.UserId);
        if (!string.IsNullOrWhiteSpace(request.Action))
            query = query.Where(a => a.Action == request.Action);
        if (!string.IsNullOrWhiteSpace(request.Entity))
            query = query.Where(a => a.Entity == request.Entity);

        var projected = query
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new AuditLogListItemDto
            {
                Id = a.Id,
                UserId = a.UserId,
                Username = a.Username,
                Action = a.Action,
                Entity = a.Entity,
                EntityId = a.EntityId,
                Details = a.Details,
                CreatedAt = a.CreatedAt
            });

        var paged = PagedResult<AuditLogListItemDto>.From(projected, request.Page, request.PageSize);
        return ApiResponse<PagedResult<AuditLogListItemDto>>.Ok(paged);
    }
}
