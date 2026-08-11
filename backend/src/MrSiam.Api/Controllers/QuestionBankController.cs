using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Application.Features.Ai;
using MrSiam.Domain.Enums;

namespace MrSiam.Api.Controllers;

[ApiController]
[Route("api/question-bank")]
[Authorize(Roles = nameof(Role.Teacher) + "," + nameof(Role.Admin))]
public class QuestionBankController(IMediator mediator, IApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<QuestionBankItemDto>>>> Search(
        [FromQuery] int? courseId,
        [FromQuery] int? lessonId,
        [FromQuery] string? q,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var query = db.Questions
            .AsNoTracking()
            .Include(x => x.Options)
            .Include(x => x.Exam)
            .Include(x => x.Lesson)
            .AsQueryable();

        if (courseId is not null)
            query = query.Where(x => (x.Exam != null && x.Exam.CourseId == courseId) || (x.Lesson != null && x.Lesson.CourseId == courseId));
        if (lessonId is not null)
            query = query.Where(x => x.LessonId == lessonId);
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(x => x.Text.Contains(term) || (x.Lesson != null && x.Lesson.Title.Contains(term)));
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(x => x.Id)
            .Skip((Math.Max(page, 1) - 1) * Math.Min(pageSize, 50))
            .Take(Math.Min(pageSize, 50))
            .Select(x => new QuestionBankItemDto
            {
                Id = x.Id,
                Text = x.Text,
                Type = x.Type,
                Marks = x.Marks,
                LessonId = x.LessonId,
                LessonTitle = x.Lesson != null ? x.Lesson.Title : null,
                SourceExamTitle = x.Exam != null ? x.Exam.Title : null,
                Options = x.Options.Select(o => new QuestionBankOptionDto(o.Id, o.Text, o.IsCorrect)).ToList()
            })
            .ToListAsync(ct);

        return Ok(ApiResponse<PagedResult<QuestionBankItemDto>>.Ok(new PagedResult<QuestionBankItemDto>
        {
            Items = items,
            Page = Math.Max(page, 1),
            PageSize = Math.Min(pageSize, 50),
            TotalCount = total,
            TotalPages = (int)Math.Ceiling(total / (double)Math.Min(pageSize, 50))
        }));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<int>>> Create(CreateBankQuestionCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id, CancellationToken ct)
    {
        var question = await db.Questions.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (question is null)
            return BadRequest(ApiResponse<bool>.Fail("السؤال غير موجود"));

        if (question.ExamId is not null)
            return BadRequest(ApiResponse<bool>.Fail("السؤال ده تبع امتحان موجود — احذف الامتحان نفسه"));

        db.Questions.Remove(question);
        await db.SaveChangesAsync(ct);
        return Ok(ApiResponse<bool>.Ok(true, "اتحذف السؤال من البنك"));
    }

    [HttpPost("random-exam")]
    public async Task<ActionResult<ApiResponse<int>>> RandomExam(BuildRandomExamCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}

public record QuestionBankOptionDto(int Id, string Text, bool IsCorrect);

public class QuestionBankItemDto
{
    public int Id { get; init; }
    public required string Text { get; init; }
    public QuestionType Type { get; init; }
    public decimal Marks { get; init; }
    public int? LessonId { get; init; }
    public string? LessonTitle { get; init; }
    public string? SourceExamTitle { get; init; }
    public List<QuestionBankOptionDto> Options { get; init; } = new();
}
