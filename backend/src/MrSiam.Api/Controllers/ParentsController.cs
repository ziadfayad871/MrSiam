using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Application.Features.Parents;
using MrSiam.Domain.Enums;

namespace MrSiam.Api.Controllers;

[ApiController]
[Route("api/parents")]
[Authorize]
public class ParentsController(MediatR.IMediator mediator, IApplicationDbContext db, ICurrentUserService currentUser)
    : BaseApiController(mediator, currentUser)
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        if (currentUser.Role == Role.Parent)
        {
            var parent = await db.Parents.FirstOrDefaultAsync(p => p.UserId == currentUser.UserId);
            if (parent is null)
                return BadRequest(ApiResponse<object>.Fail("حساب ولي الأمر غير مكتمل"));
            var result = await mediator.Send(new GetParentDashboardQuery(parent.Id));
            return result.Success ? Ok(result) : BadRequest(result);
        }

        if (currentUser.Role is Role.Secretary or Role.Admin)
        {
            var result = await mediator.Send(new GetParentDashboardQuery(0));
            return result.Success ? Ok(result) : BadRequest(result);
        }

        return Forbid();
    }

    [HttpPost]
    [Authorize(Roles = nameof(Role.Secretary) + "," + nameof(Role.Admin))]
    public async Task<IActionResult> Create([FromBody] CreateParentCommand command)
    {
        var result = await mediator.Send(command);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("{parentId:int}/students/{studentId:int}")]
    [Authorize(Roles = nameof(Role.Secretary) + "," + nameof(Role.Admin))]
    public async Task<IActionResult> LinkStudent(int parentId, int studentId)
    {
        var result = await mediator.Send(new LinkStudentToParentCommand(parentId, studentId));
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
