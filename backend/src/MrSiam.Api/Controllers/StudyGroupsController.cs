using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MrSiam.Application.Features.StudyGroups;
using MrSiam.Domain.Enums;

namespace MrSiam.Api.Controllers;

[ApiController]
[Route("api/study-groups")]
[Authorize(Roles = nameof(Role.Secretary) + "," + nameof(Role.Admin))]
public class StudyGroupsController(MediatR.IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool includeInactive = false, [FromQuery] Stage? stage = null)
    {
        var result = await mediator.Send(new ListStudyGroupsQuery(includeInactive, stage));
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("{groupId:int}")]
    public async Task<IActionResult> Get(int groupId)
    {
        var result = await mediator.Send(new GetStudyGroupQuery(groupId));
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateStudyGroupCommand command)
    {
        var result = await mediator.Send(command);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPut("{groupId:int}")]
    public async Task<IActionResult> Update(int groupId, [FromBody] UpdateStudyGroupCommand command)
    {
        var result = await mediator.Send(command with { GroupId = groupId });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("{groupId:int}")]
    public async Task<IActionResult> Delete(int groupId)
    {
        var result = await mediator.Send(new DeleteStudyGroupCommand(groupId));
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("{groupId:int}/members/{studentId:int}")]
    public async Task<IActionResult> AddMember(int groupId, int studentId)
    {
        var result = await mediator.Send(new AddMemberCommand(groupId, studentId));
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("{groupId:int}/members/{studentId:int}")]
    public async Task<IActionResult> RemoveMember(int groupId, int studentId)
    {
        var result = await mediator.Send(new RemoveMemberCommand(groupId, studentId));
        return result.Success ? Ok(result) : BadRequest(result);
    }
}