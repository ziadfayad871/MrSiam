using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Application.Features.Ai;
using MrSiam.Application.Features.Content;
using MrSiam.Domain.Enums;

namespace MrSiam.Api.Controllers;

[ApiController]
[Route("api/teacher-content")]
[Authorize(Roles = nameof(Role.Teacher) + "," + nameof(Role.Admin))]
public class TeacherContentController(IMediator mediator, IApplicationDbContext db, IWebHostEnvironment env) : ControllerBase
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

    [HttpPost("lessons/{lessonId:int}/resources")]
    [RequestSizeLimit(30 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<int>>> UploadLessonResource(int lessonId, [FromForm] UploadResourceRequest request, CancellationToken ct)
    {
        if (request.File is null || request.File.Length == 0)
            return BadRequest(ApiResponse<int>.Fail("ارفع ملف الأول"));

        if (request.File.Length > 20 * 1024 * 1024)
            return BadRequest(ApiResponse<int>.Fail("حجم الملف أكبر من 20 ميجابايت"));

        var ext = Path.GetExtension(request.File.FileName).ToLowerInvariant();
        if (ext is not ".pdf" and not ".doc" and not ".docx" and not ".ppt" and not ".pptx")
            return BadRequest(ApiResponse<int>.Fail("صيغة الملف غير مدعومة — PDF أو مستندات Word/PowerPoint"));

        var name = $"{Guid.NewGuid():N}{ext}";
        var dir = Path.Combine(env.ContentRootPath, "app_data", "resources");
        Directory.CreateDirectory(dir);
        await using (var stream = System.IO.File.Create(Path.Combine(dir, name)))
            await request.File.CopyToAsync(stream, ct);

        var fileUrl = $"/uploads/resources/{name}";
        var title = string.IsNullOrWhiteSpace(request.Title) ? request.File.FileName : request.Title.Trim();
        return Ok(await mediator.Send(new UploadLessonResourceCommand(lessonId, title, "file", fileUrl), ct));
    }

    [HttpPost("courses/{id:int}/image")]
    [RequestSizeLimit(15 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<bool>>> UploadCourseImage(int id, [FromForm] UploadCourseImageRequest request, CancellationToken ct)
    {
        if (request.File is null || request.File.Length == 0)
            return BadRequest(ApiResponse<bool>.Fail("ارفع صورة الأول"));

        if (request.File.Length > 10 * 1024 * 1024)
            return BadRequest(ApiResponse<bool>.Fail("حجم الصورة أكبر من 10 ميجابايت"));

        var ext = Path.GetExtension(request.File.FileName).ToLowerInvariant();
        if (ext is not ".jpg" and not ".jpeg" and not ".png" and not ".webp")
            return BadRequest(ApiResponse<bool>.Fail("صيغة الصورة غير مدعومة — JPG أو PNG أو WebP"));

        var course = await db.Courses.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (course is null)
            return BadRequest(ApiResponse<bool>.Fail("الكورس غير موجود"));

        var name = $"{Guid.NewGuid():N}{ext}";
        var dir = Path.Combine(env.ContentRootPath, "app_data", "courses");
        Directory.CreateDirectory(dir);
        await using (var stream = System.IO.File.Create(Path.Combine(dir, name)))
            await request.File.CopyToAsync(stream, ct);

        var oldUrl = course.ImageUrl;
        course.ImageUrl = $"/uploads/courses/{name}";
        await db.SaveChangesAsync(ct);

        if (oldUrl is not null && oldUrl.StartsWith("/uploads/courses/", StringComparison.OrdinalIgnoreCase))
        {
            var oldPath = Path.Combine(env.ContentRootPath, "app_data", "courses", Path.GetFileName(oldUrl));
            if (System.IO.File.Exists(oldPath))
                System.IO.File.Delete(oldPath);
        }

        return Ok(ApiResponse<bool>.Ok(true, "تم تحديث صورة الكورس"));
    }

    [HttpPost("lessons/{id:int}/image")]
    [RequestSizeLimit(15 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<bool>>> UploadLessonImage(int id, [FromForm] UploadCourseImageRequest request, CancellationToken ct)
    {
        if (request.File is null || request.File.Length == 0)
            return BadRequest(ApiResponse<bool>.Fail("ارفع صورة الأول"));

        if (request.File.Length > 10 * 1024 * 1024)
            return BadRequest(ApiResponse<bool>.Fail("حجم الصورة أكبر من 10 ميجابايت"));

        var ext = Path.GetExtension(request.File.FileName).ToLowerInvariant();
        if (ext is not ".jpg" and not ".jpeg" and not ".png" and not ".webp")
            return BadRequest(ApiResponse<bool>.Fail("صيغة الصورة غير مدعومة — JPG أو PNG أو WebP"));

        var lesson = await db.Lessons.FirstOrDefaultAsync(l => l.Id == id, ct);
        if (lesson is null)
            return BadRequest(ApiResponse<bool>.Fail("الحصة غير موجودة"));

        var name = $"{Guid.NewGuid():N}{ext}";
        var dir = Path.Combine(env.ContentRootPath, "app_data", "lessons");
        Directory.CreateDirectory(dir);
        await using (var stream = System.IO.File.Create(Path.Combine(dir, name)))
            await request.File.CopyToAsync(stream, ct);

        var oldUrl = lesson.ImageUrl;
        lesson.ImageUrl = $"/uploads/lessons/{name}";
        await db.SaveChangesAsync(ct);

        if (oldUrl is not null && oldUrl.StartsWith("/uploads/lessons/", StringComparison.OrdinalIgnoreCase))
        {
            var oldPath = Path.Combine(env.ContentRootPath, "app_data", "lessons", Path.GetFileName(oldUrl));
            if (System.IO.File.Exists(oldPath))
                System.IO.File.Delete(oldPath);
        }

        return Ok(ApiResponse<bool>.Ok(true, "تم تحديث صورة الحصة"));
    }

    [HttpDelete("resources/{id:int}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteResource(int id, CancellationToken ct)
    {
        var url = await db.LessonResources.AsNoTracking().Where(r => r.Id == id).Select(r => r.FileUrl).FirstOrDefaultAsync(ct);
        var result = await mediator.Send(new DeleteLessonResourceCommand(id), ct);
        if (result.Success && url is not null && url.StartsWith("/uploads/resources/", StringComparison.OrdinalIgnoreCase))
        {
            var path = Path.Combine(env.ContentRootPath, "app_data", "resources", Path.GetFileName(url));
            if (System.IO.File.Exists(path))
                System.IO.File.Delete(path);
        }
        return Ok(result);
    }

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

    public record UploadResourceRequest(string? Title, IFormFile? File);

    public record UploadCourseImageRequest(IFormFile? File);
}
