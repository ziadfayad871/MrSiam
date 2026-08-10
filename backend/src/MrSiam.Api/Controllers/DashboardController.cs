using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Features.Dashboard;
using MrSiam.Domain.Enums;

namespace MrSiam.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController(MediatR.IMediator mediator, IApplicationDbContext db, ICurrentUserService currentUser)
    : BaseApiController(mediator, currentUser)
{
    [HttpGet("student")]
    public async Task<IActionResult> GetStudentDashboard([FromQuery] int? studentId)
    {
        var resolved = await ResolveStudentIdAsync(studentId, db, HttpContext.RequestAborted);
        var result = await mediator.Send(new GetStudentDashboardQuery(resolved), HttpContext.RequestAborted);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("teacher")]
    [Authorize(Roles = nameof(Role.Teacher) + "," + nameof(Role.Admin))]
    public async Task<IActionResult> GetTeacherDashboard()
    {
        var result = await mediator.Send(new GetTeacherDashboardQuery(), HttpContext.RequestAborted);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("secretary")]
    [Authorize(Roles = nameof(Role.Secretary) + "," + nameof(Role.Admin))]
    public async Task<IActionResult> GetSecretaryDashboard()
    {
        var result = await mediator.Send(new GetSecretaryDashboardQuery(), HttpContext.RequestAborted);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
