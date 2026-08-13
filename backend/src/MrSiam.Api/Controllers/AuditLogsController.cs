using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MrSiam.Application.Features.AuditLogs;
using MrSiam.Domain.Enums;

namespace MrSiam.Api.Controllers;

[ApiController]
[Route("api/audit-logs")]
[Authorize(Roles = nameof(Role.Admin))]
public class AuditLogsController(MediatR.IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int? userId, [FromQuery] string? action, [FromQuery] string? entity, [FromQuery] int page = 1, [FromQuery] int pageSize = 30)
    {
        var result = await mediator.Send(new ListAuditLogsQuery(userId, action, entity, page, pageSize));
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
