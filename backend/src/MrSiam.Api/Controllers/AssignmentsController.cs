using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MrSiam.Application.Common;
using MrSiam.Application.Features.Content;
using MrSiam.Domain.Enums;

namespace MrSiam.Api.Controllers;

public record SubmitAssignmentRequest(IReadOnlyList<AssignmentAnswerInput> Answers);

[ApiController]
[Route("api/assignments")]
[Authorize]
public class AssignmentsController(IMediator mediator) : ControllerBase
{
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<AssignmentDetailDto>>> GetDetail(int id, CancellationToken ct)
        => Ok(await mediator.Send(new GetAssignmentDetailQuery(id), ct));

    [HttpPost("{id:int}/submit")]
    [Authorize(Roles = nameof(Role.Student))]
    public async Task<ActionResult<ApiResponse<AssignmentSubmissionResultDto>>> Submit(int id, SubmitAssignmentRequest request, CancellationToken ct)
        => Ok(await mediator.Send(new SubmitAssignmentCommand(id, request.Answers), ct));

    [HttpGet("{id:int}/submissions")]
    [Authorize(Roles = nameof(Role.Teacher) + "," + nameof(Role.Admin))]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AssignmentSubmissionListItemDto>>>> GetSubmissions(int id, CancellationToken ct)
        => Ok(await mediator.Send(new GetAssignmentSubmissionsQuery(id), ct));
}