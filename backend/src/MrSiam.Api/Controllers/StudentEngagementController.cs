using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Application.Features.Dashboard;
using MrSiam.Application.Features.StudentEngagement;
using MrSiam.Domain.Enums;

namespace MrSiam.Api.Controllers;

[ApiController]
[Route("api/student")]
[Authorize(Roles = nameof(Role.Student))]
public class StudentEngagementController(IMediator mediator, IApplicationDbContext db) : ControllerBase
{
    private async Task<int?> GetStudentIdAsync(CancellationToken ct)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userId, out var id))
            return null;
        return await db.Students.Where(s => s.UserId == id).Select(s => (int?)s.Id).FirstOrDefaultAsync(ct);
    }

    [HttpPost("heartbeat")]
    public async Task<ActionResult<ApiResponse<XpInfoDto>>> Heartbeat(CancellationToken ct)
    {
        var studentId = await GetStudentIdAsync(ct);
        if (studentId is null)
            return Unauthorized(ApiResponse<XpInfoDto>.Fail("مفيش حساب طالب مرتبط"));
        return Ok(await mediator.Send(new HeartbeatCommand(studentId.Value), ct));
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponse<StudentDashboardV2Dto>>> Dashboard(CancellationToken ct)
    {
        var studentId = await GetStudentIdAsync(ct);
        if (studentId is null)
            return Unauthorized(ApiResponse<StudentDashboardV2Dto>.Fail("مفيش حساب طالب مرتبط"));
        return Ok(await mediator.Send(new GetStudentDashboardV2Query(studentId.Value), ct));
    }

    [HttpGet("passport")]
    public async Task<ActionResult<ApiResponse<PassportDto>>> Passport(CancellationToken ct)
    {
        var studentId = await GetStudentIdAsync(ct);
        if (studentId is null)
            return Unauthorized(ApiResponse<PassportDto>.Fail("مفيش حساب طالب مرتبط"));
        return Ok(await mediator.Send(new GetPassportQuery(studentId.Value), ct));
    }

    [HttpPost("notes")]
    public async Task<ActionResult<ApiResponse<int>>> CreateNote(CreateNoteCommand command, CancellationToken ct)
    {
        var studentId = await GetStudentIdAsync(ct);
        if (studentId is null)
            return Unauthorized(ApiResponse<int>.Fail("مفيش حساب طالب مرتبط"));
        return Ok(await mediator.Send(command with { StudentId = studentId.Value }, ct));
    }

    [HttpPut("notes/{id:int}")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateNote(int id, UpdateNoteCommand command, CancellationToken ct)
    {
        var studentId = await GetStudentIdAsync(ct);
        if (studentId is null)
            return Unauthorized(ApiResponse<bool>.Fail("مفيش حساب طالب مرتبط"));
        return Ok(await mediator.Send(command with { Id = id, StudentId = studentId.Value }, ct));
    }

    [HttpDelete("notes/{id:int}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteNote(int id, CancellationToken ct)
    {
        var studentId = await GetStudentIdAsync(ct);
        if (studentId is null)
            return Unauthorized(ApiResponse<bool>.Fail("مفيش حساب طالب مرتبط"));
        return Ok(await mediator.Send(new DeleteNoteCommand(id, studentId.Value), ct));
    }

    [HttpGet("lessons/{lessonId:int}/notes")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<NoteDto>>>> GetNotes(int lessonId, CancellationToken ct)
    {
        var studentId = await GetStudentIdAsync(ct);
        if (studentId is null)
            return Unauthorized(ApiResponse<IReadOnlyList<NoteDto>>.Fail("مفيش حساب طالب مرتبط"));
        return Ok(await mediator.Send(new GetLessonNotesQuery(studentId.Value, lessonId), ct));
    }

    [HttpPost("bookmarks/toggle")]
    public async Task<ActionResult<ApiResponse<bool>>> ToggleBookmark(ToggleBookmarkCommand command, CancellationToken ct)
    {
        var studentId = await GetStudentIdAsync(ct);
        if (studentId is null)
            return Unauthorized(ApiResponse<bool>.Fail("مفيش حساب طالب مرتبط"));
        return Ok(await mediator.Send(command with { StudentId = studentId.Value }, ct));
    }

    [HttpGet("bookmarks")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<BookmarkDto>>>> GetBookmarks([FromQuery] string? kind, [FromQuery] int? courseId, CancellationToken ct)
    {
        var studentId = await GetStudentIdAsync(ct);
        if (studentId is null)
            return Unauthorized(ApiResponse<IReadOnlyList<BookmarkDto>>.Fail("مفيش حساب طالب مرتبط"));
        return Ok(await mediator.Send(new GetBookmarksQuery(studentId.Value, kind, courseId), ct));
    }

    [HttpPut("watch/{lessonId:int}")]
    public async Task<ActionResult<ApiResponse<bool>>> SaveWatch(int lessonId, [FromBody] WatchPositionRequest body, CancellationToken ct)
    {
        var studentId = await GetStudentIdAsync(ct);
        if (studentId is null)
            return Unauthorized(ApiResponse<bool>.Fail("مفيش حساب طالب مرتبط"));
        return Ok(await mediator.Send(new SaveWatchProgressCommand(studentId.Value, lessonId, body.PositionSeconds, body.DurationSeconds), ct));
    }

    [HttpGet("mistakes")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<MistakeDto>>>> GetMistakes([FromQuery] int? courseId, CancellationToken ct)
    {
        var studentId = await GetStudentIdAsync(ct);
        if (studentId is null)
            return Unauthorized(ApiResponse<IReadOnlyList<MistakeDto>>.Fail("مفيش حساب طالب مرتبط"));
        return Ok(await mediator.Send(new GetMistakesQuery(studentId.Value, courseId), ct));
    }

    [HttpDelete("mistakes/{id:int}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteMistake(int id, CancellationToken ct)
    {
        var studentId = await GetStudentIdAsync(ct);
        if (studentId is null)
            return Unauthorized(ApiResponse<bool>.Fail("مفيش حساب طالب مرتبط"));
        return Ok(await mediator.Send(new DeleteMistakeCommand(id, studentId.Value), ct));
    }

    [HttpPost("mistakes/{id:int}/explain")]
    public async Task<ActionResult<ApiResponse<string>>> ExplainMistake(int id, CancellationToken ct)
    {
        var studentId = await GetStudentIdAsync(ct);
        if (studentId is null)
            return Unauthorized(ApiResponse<string>.Fail("مفيش حساب طالب مرتبط"));
        return Ok(await mediator.Send(new ExplainMistakeCommand(studentId.Value, id), ct));
    }

    [HttpGet("notifications")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<NotificationDto>>>> GetNotifications(CancellationToken ct, [FromQuery] int take = 20)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userId, out var id))
            return Unauthorized(ApiResponse<IReadOnlyList<NotificationDto>>.Fail("مش مصدق"));
        return Ok(await mediator.Send(new GetNotificationsQuery(id, take), ct));
    }

    [HttpPut("notifications/read")]
    public async Task<ActionResult<ApiResponse<bool>>> MarkAllRead(CancellationToken ct)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userId, out var id))
            return Unauthorized(ApiResponse<bool>.Fail("مش مصدق"));
        return Ok(await mediator.Send(new MarkNotificationsReadCommand(id, null), ct));
    }

    [HttpPut("notifications/{id:int}/read")]
    public async Task<ActionResult<ApiResponse<bool>>> MarkOneRead(int id, CancellationToken ct)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userId, out var userIdValue))
            return Unauthorized(ApiResponse<bool>.Fail("مش مصدق"));
        return Ok(await mediator.Send(new MarkNotificationsReadCommand(userIdValue, id), ct));
    }

    [HttpGet("exams/{examId:int}/attempts/{attemptId:int}/review")]
    public async Task<ActionResult<ApiResponse<ExamReviewDto>>> Review(int examId, int attemptId, CancellationToken ct)
    {
        var studentId = await GetStudentIdAsync(ct);
        if (studentId is null)
            return Unauthorized(ApiResponse<ExamReviewDto>.Fail("مفيش حساب طالب مرتبط"));
        return Ok(await mediator.Send(new GetExamReviewQuery(studentId.Value, examId, attemptId), ct));
    }
}

public record WatchPositionRequest(int PositionSeconds, int DurationSeconds);
