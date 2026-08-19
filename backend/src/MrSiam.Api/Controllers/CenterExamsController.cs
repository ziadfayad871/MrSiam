using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MrSiam.Application.Common;
using MrSiam.Application.Features.CenterExams;
using MrSiam.Domain.Enums;

namespace MrSiam.Api.Controllers;

[ApiController]
[Route("api/center-exams")]
[Authorize(Roles = nameof(Role.Teacher) + "," + nameof(Role.Secretary) + "," + nameof(Role.Admin))]
public class CenterExamsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? courseId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetCenterExamsQuery(courseId), ct);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<int>>> Create(CreateCenterExamCommand command, CancellationToken ct)
        => Ok(await mediator.Send(command, ct));

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<bool>>> Update(int id, UpdateCenterExamCommand command, CancellationToken ct)
        => Ok(await mediator.Send(command with { Id = id }, ct));

    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id, CancellationToken ct)
        => Ok(await mediator.Send(new DeleteCenterExamCommand(id), ct));

    [HttpGet("{id:int}/results")]
    public async Task<IActionResult> GetResults(int id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetCenterExamResultsQuery(id), ct);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("{id:int}/results")]
    public async Task<IActionResult> SaveResults(int id, SaveCenterExamResultsCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command with { CenterExamId = id }, ct);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}

[ApiController]
[Route("api/center-exams/my")]
[Authorize(Roles = nameof(Role.Student))]
public class MyCenterExamsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetMyResults(CancellationToken ct)
    {
        var result = await mediator.Send(new GetMyCenterExamResultsQuery(), ct);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}