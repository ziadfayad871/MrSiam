using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MrSiam.Application.Features.Teacher;

namespace MrSiam.Api.Controllers;

[ApiController]
[Route("api/teacher")]
[AllowAnonymous]
public class TeacherController(MediatR.IMediator mediator) : ControllerBase
{
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var result = await mediator.Send(new GetTeacherProfileQuery());
        return result.Success ? Ok(result) : NotFound(result);
    }
}
