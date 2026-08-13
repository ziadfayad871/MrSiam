using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MrSiam.Application.Common;
using MrSiam.Application.Features.Ai;
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

    [HttpPost("ai/exams/generate")]
    public async Task<ActionResult<ApiResponse<AiExamDraftDto>>> GenerateAiExam(GenerateAiExamCommand command, CancellationToken ct)
        => Ok(await mediator.Send(command, ct));

    [HttpPost("ai/exams/generate-from-pdf")]
    [RequestSizeLimit(30 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<AiExamDraftDto>>> GenerateAiExamFromPdf([FromForm] GenerateAiExamFromPdfRequest request, CancellationToken ct)
    {
        if (request.Pdf is null || request.Pdf.Length == 0)
            return BadRequest(ApiResponse<AiExamDraftDto>.Fail("ارفع ملف PDF الأول"));

        if (request.Pdf.Length > 20 * 1024 * 1024)
            return BadRequest(ApiResponse<AiExamDraftDto>.Fail("حجم ملف الـ PDF أكبر من 20 ميجابايت"));

        if (Path.GetExtension(request.Pdf.FileName).ToLowerInvariant() != ".pdf")
            return BadRequest(ApiResponse<AiExamDraftDto>.Fail("صيغة الملف لازم تكون PDF"));

        using var ms = new MemoryStream();
        await request.Pdf.CopyToAsync(ms, ct);

        var command = new GenerateAiExamFromPdfCommand(
            request.CourseId,
            request.LessonIds ?? [],
            request.Topic ?? "",
            request.QuestionCount,
            request.Difficulty ?? "متوسط",
            ms.ToArray());

        return Ok(await mediator.Send(command, ct));
    }

    [HttpPost("ai/exams/save")]
    public async Task<ActionResult<ApiResponse<int>>> SaveAiExam(SaveAiExamCommand command, CancellationToken ct)
        => Ok(await mediator.Send(command, ct));

    public record GenerateAiExamFromPdfRequest(
        int CourseId,
        List<int>? LessonIds,
        string? Topic,
        int QuestionCount,
        string? Difficulty,
        IFormFile? Pdf);
}
