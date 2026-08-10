using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MrSiam.Application.Features.Attendance;
using MrSiam.Domain.Enums;

namespace MrSiam.Api.Controllers;

[ApiController]
[Route("api/attendance")]
[Authorize(Roles = nameof(Role.Teacher) + "," + nameof(Role.Secretary) + "," + nameof(Role.Admin))]
public class AttendanceController(MediatR.IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] DateOnly? date, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var result = await mediator.Send(new GetAttendanceQuery(date, page, pageSize));
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost]
    public async Task<IActionResult> Mark([FromBody] MarkAttendanceCommand command)
    {
        var result = await mediator.Send(command);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
