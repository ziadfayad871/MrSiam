using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MrSiam.Application.Features.Content;
using MrSiam.Application.Features.Courses;

namespace MrSiam.Api.Controllers;

[ApiController]
[Route("api/courses")]
[Authorize]
public class CoursesController(MediatR.IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Domain.Enums.Stage? stage, [FromQuery] Domain.Enums.Subject? subject)
    {
        var result = await mediator.Send(new GetCoursesQuery(stage, subject));
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("{courseId:int}/lessons")]
    public async Task<IActionResult> GetLessons(int courseId, [FromQuery] int? studentId)
    {
        var result = await mediator.Send(new GetCourseLessonsQuery(courseId, studentId));
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("{courseId:int}/assignments")]
    public async Task<IActionResult> GetAssignments(int courseId)
    {
        var result = await mediator.Send(new GetCourseAssignmentsQuery(courseId));
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("{courseId:int}/resources")]
    public async Task<IActionResult> GetResources(int courseId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetCourseResourcesQuery(courseId), ct);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
