using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MrSiam.Application.Features.Live;
using MrSiam.Domain.Enums;

namespace MrSiam.Api.Controllers;

[ApiController]
[Route("api/live")]
[Authorize]
public class LiveLessonsController(MediatR.IMediator mediator) : ControllerBase
{
    [HttpGet("upcoming")]
    public async Task<IActionResult> GetUpcoming([FromQuery] bool includePast = false)
    {
        var result = await mediator.Send(new GetUpcomingLiveLessonsQuery(includePast));
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet]
    [Authorize(Roles = nameof(Role.Teacher) + "," + nameof(Role.Admin) + "," + nameof(Role.Secretary))]
    public async Task<IActionResult> GetAll()
    {
        var result = await mediator.Send(new ListAllLiveLessonsQuery());
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost]
    [Authorize(Roles = nameof(Role.Teacher) + "," + nameof(Role.Admin))]
    public async Task<IActionResult> Create([FromBody] CreateLiveLessonCommand command)
    {
        var result = await mediator.Send(command);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPatch("{liveLessonId:int}/cancel")]
    [Authorize(Roles = nameof(Role.Teacher) + "," + nameof(Role.Admin))]
    public async Task<IActionResult> ToggleCancel(int liveLessonId)
    {
        var result = await mediator.Send(new CancelLiveLessonCommand(liveLessonId));
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
