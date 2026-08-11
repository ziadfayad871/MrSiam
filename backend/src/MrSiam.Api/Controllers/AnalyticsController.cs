using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MrSiam.Application.Common;
using MrSiam.Application.Features.Analytics;
using MrSiam.Domain.Enums;

namespace MrSiam.Api.Controllers;

[ApiController]
[Route("api/analytics")]
[Authorize(Roles = nameof(Role.Teacher) + "," + nameof(Role.Secretary) + "," + nameof(Role.Admin))]
public class AnalyticsController(IMediator mediator) : ControllerBase
{
    [HttpGet("overview")]
    public async Task<ActionResult<ApiResponse<AnalyticsOverviewDto>>> Overview(CancellationToken ct)
        => Ok(await mediator.Send(new GetAnalyticsOverviewQuery(), ct));

    [HttpGet("students/{studentId:int}")]
    public async Task<ActionResult<ApiResponse<StudentAnalyticsDto>>> Student(int studentId, CancellationToken ct)
        => Ok(await mediator.Send(new GetStudentAnalyticsQuery(studentId), ct));
}
