using Microsoft.AspNetCore.Mvc;
using MrSiam.Application.Features.Auth;

namespace MrSiam.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(MediatR.IMediator mediator) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginCommand command)
    {
        var result = await mediator.Send(command);
        return result.Success ? Ok(result) : Unauthorized(result);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterStudentCommand command)
    {
        var result = await mediator.Send(command);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
