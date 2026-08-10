using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
}
