using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MrSiam.Application.Features.Students;
using MrSiam.Domain.Enums;

namespace MrSiam.Api.Controllers;

[ApiController]
[Route("api/students")]
[Authorize(Roles = nameof(Role.Teacher) + "," + nameof(Role.Secretary) + "," + nameof(Role.Admin))]
public class StudentsController(MediatR.IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string? search, [FromQuery] Stage? stage, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await mediator.Send(new SearchStudentsQuery(search, stage, page, pageSize));
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("{studentId:int}")]
    public async Task<IActionResult> Get(int studentId)
    {
        var result = await mediator.Send(new GetStudentDetailQuery(studentId));
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateStudentCommand command)
    {
        var result = await mediator.Send(command);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPut("{studentId:int}")]
    public async Task<IActionResult> Update(int studentId, [FromBody] UpdateStudentCommand command)
    {
        if (studentId != command.Id)
            return BadRequest();

        var result = await mediator.Send(command);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
