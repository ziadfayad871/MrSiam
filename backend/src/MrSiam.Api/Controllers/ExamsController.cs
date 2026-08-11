using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MrSiam.Application.Features.Exams;

namespace MrSiam.Api.Controllers;

[ApiController]
[Route("api/exams")]
[Authorize]
public class ExamsController(MediatR.IMediator mediator) : ControllerBase
{
    [HttpGet("course/{courseId:int}")]
    public async Task<IActionResult> GetByCourse(int courseId, [FromQuery] int? studentId, [FromQuery] bool includeUnpublished = false)
    {
        var result = await mediator.Send(new GetCourseExamsQuery(courseId, studentId, includeUnpublished));
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("{examId:int}")]
    public async Task<IActionResult> GetDetail(int examId)
    {
        var result = await mediator.Send(new GetExamDetailQuery(examId));
        return result.Success ? Ok(result) : NotFound(result);
    }
}
