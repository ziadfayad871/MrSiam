using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MrSiam.Application.Features.Schedule;
using MrSiam.Domain.Enums;

namespace MrSiam.Api.Controllers;

[ApiController]
[Route("api/schedule")]
[Authorize(Roles = nameof(Role.Secretary) + "," + nameof(Role.Teacher) + "," + nameof(Role.Admin))]
public class ScheduleController(MediatR.IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] DayOfWeek? day, [FromQuery] Stage? stage, [FromQuery] int? groupId)
    {
        var result = await mediator.Send(new ListScheduleQuery(day, stage, groupId));
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost]
    [Authorize(Roles = nameof(Role.Secretary) + "," + nameof(Role.Admin))]
    public async Task<IActionResult> Create([FromBody] CreateScheduleSlotCommand command)
    {
        var result = await mediator.Send(command);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPut("{slotId:int}")]
    [Authorize(Roles = nameof(Role.Secretary) + "," + nameof(Role.Admin))]
    public async Task<IActionResult> Update(int slotId, [FromBody] UpdateScheduleSlotCommand command)
    {
        var result = await mediator.Send(command with { SlotId = slotId });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("{slotId:int}")]
    [Authorize(Roles = nameof(Role.Secretary) + "," + nameof(Role.Admin))]
    public async Task<IActionResult> Delete(int slotId)
    {
        var result = await mediator.Send(new DeleteScheduleSlotCommand(slotId));
        return result.Success ? Ok(result) : BadRequest(result);
    }
}