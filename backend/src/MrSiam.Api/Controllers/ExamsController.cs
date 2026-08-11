using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Features.Exams;
using MrSiam.Domain.Enums;

namespace MrSiam.Api.Controllers;

[ApiController]
[Route("api/exams")]
[Authorize]
public class ExamsController(MediatR.IMediator mediator, IApplicationDbContext db, ICurrentUserService currentUser) : ControllerBase
{
    [HttpGet("course/{courseId:int}")]
    public async Task<IActionResult> GetByCourse(int courseId, [FromQuery] int? studentId, [FromQuery] bool includeUnpublished = false)
    {
        var resolvedStudentId = studentId;
        if (resolvedStudentId is null && currentUser.Role == Role.Student)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userId, out var id))
                resolvedStudentId = await db.Students.Where(s => s.UserId == id).Select(s => (int?)s.Id).FirstOrDefaultAsync();
        }
        var result = await mediator.Send(new GetCourseExamsQuery(courseId, resolvedStudentId, includeUnpublished));
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("{examId:int}")]
    public async Task<IActionResult> GetDetail(int examId)
    {
        var result = await mediator.Send(new GetExamDetailQuery(examId));
        return result.Success ? Ok(result) : NotFound(result);
    }
}
