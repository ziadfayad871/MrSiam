using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MrSiam.Application.Common;
using MrSiam.Application.Features.Content;
using MrSiam.Domain.Enums;

namespace MrSiam.Api.Controllers;

[ApiController]
[Route("api/teacher-content")]
[Authorize(Roles = nameof(Role.Teacher) + "," + nameof(Role.Admin))]
public class TeacherContentController(IMediator mediator) : ControllerBase
{
    [HttpPost("courses")]
    public async Task<ActionResult<ApiResponse<int>>> CreateCourse(CreateCourseCommand command, CancellationToken ct)
        => Ok(await mediator.Send(command, ct));

    [HttpPut("courses/{id:int}")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateCourse(int id, UpdateCourseCommand command, CancellationToken ct)
        => Ok(await mediator.Send(command with { Id = id }, ct));

    [HttpDelete("courses/{id:int}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteCourse(int id, CancellationToken ct)
        => Ok(await mediator.Send(new DeleteCourseCommand(id), ct));

    [HttpPost("courses/{courseId:int}/lessons")]
    public async Task<ActionResult<ApiResponse<int>>> CreateLesson(int courseId, CreateLessonCommand command, CancellationToken ct)
        => Ok(await mediator.Send(command with { CourseId = courseId }, ct));

    [HttpPut("lessons/{id:int}")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateLesson(int id, UpdateLessonCommand command, CancellationToken ct)
        => Ok(await mediator.Send(command with { Id = id }, ct));

    [HttpDelete("lessons/{id:int}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteLesson(int id, CancellationToken ct)
        => Ok(await mediator.Send(new DeleteLessonCommand(id), ct));

    [HttpPost("courses/{courseId:int}/exams")]
    public async Task<ActionResult<ApiResponse<int>>> CreateExam(int courseId, CreateExamCommand command, CancellationToken ct)
        => Ok(await mediator.Send(command with { CourseId = courseId }, ct));

    [HttpPut("exams/{id:int}")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateExam(int id, UpdateExamCommand command, CancellationToken ct)
        => Ok(await mediator.Send(command with { Id = id }, ct));

    [HttpDelete("exams/{id:int}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteExam(int id, CancellationToken ct)
        => Ok(await mediator.Send(new DeleteExamCommand(id), ct));

    [HttpPost("courses/{courseId:int}/assignments")]
    public async Task<ActionResult<ApiResponse<int>>> CreateAssignment(int courseId, CreateAssignmentCommand command, CancellationToken ct)
        => Ok(await mediator.Send(command with { CourseId = courseId }, ct));

    [HttpPut("assignments/{id:int}")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateAssignment(int id, UpdateAssignmentCommand command, CancellationToken ct)
        => Ok(await mediator.Send(command with { Id = id }, ct));

    [HttpDelete("assignments/{id:int}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteAssignment(int id, CancellationToken ct)
        => Ok(await mediator.Send(new DeleteAssignmentCommand(id), ct));
}
