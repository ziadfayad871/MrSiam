using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MrSiam.Application.Features.Achievements;

namespace MrSiam.Api.Controllers;

[ApiController]
[Route("api/students")]
[Authorize]
public class AchievementsController(MediatR.IMediator mediator) : ControllerBase
{
    [HttpGet("{studentId:int}/achievements")]
    public async Task<IActionResult> GetAchievements(int studentId)
    {
        var result = await mediator.Send(new GetStudentAchievementsQuery(studentId));
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
