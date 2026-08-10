using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Features.Attempts;
using MrSiam.Domain.Enums;

namespace MrSiam.Api.Controllers;

[ApiController]
[Route("api/exams")]
[Authorize]
public class AttemptsController(MediatR.IMediator mediator, IApplicationDbContext db, ICurrentUserService currentUser) : ControllerBase
{
    [HttpPost("{examId:int}/attempts")]
    public async Task<IActionResult> Submit(int examId, [FromBody] SubmitAttemptCommand command)
    {
        if (examId != command.ExamId)
            return BadRequest();

        var resolved = command;
        if (currentUser.Role == Role.Student)
        {
            var student = await db.Students.FirstOrDefaultAsync(s => s.UserId == currentUser.UserId);
            if (student is null)
                return BadRequest();
            resolved = command with { StudentId = student.Id };
        }

        var result = await mediator.Send(resolved);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
