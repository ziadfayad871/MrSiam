using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;

namespace MrSiam.Api.Controllers;

public record SearchHitDto(int Id, string Title, string Subtitle, string Kind);

public record SearchResultsDto
{
    public List<SearchHitDto> Courses { get; init; } = new();
    public List<SearchHitDto> Lessons { get; init; } = new();
    public List<SearchHitDto> Exams { get; init; } = new();
    public List<SearchHitDto> Questions { get; init; } = new();
}

[ApiController]
[Route("api/search")]
[Authorize]
public class SearchController(IApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<SearchResultsDto>>> Search([FromQuery] string q, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(q))
            return Ok(ApiResponse<SearchResultsDto>.Ok(new SearchResultsDto()));

        var term = q.Trim();

        var courses = await db.Courses
            .AsNoTracking()
            .Where(c => c.Title.Contains(term) || c.Description.Contains(term) || c.Subject.ToString().Contains(term))
            .Take(5)
            .Select(c => new SearchHitDto(c.Id, c.Title, c.Description, "course"))
            .ToListAsync(ct);

        var lessons = await db.Lessons
            .AsNoTracking()
            .Where(l => l.Title.Contains(term) || l.Summary.Contains(term))
            .Take(8)
            .Select(l => new SearchHitDto(l.Id, l.Title, l.Course != null ? l.Course.Title : string.Empty, "lesson"))
            .ToListAsync(ct);

        var exams = await db.Exams
            .AsNoTracking()
            .Where(e => e.IsPublished && e.Title.Contains(term))
            .Take(8)
            .Select(e => new SearchHitDto(e.Id, e.Title, e.Course != null ? e.Course.Title : string.Empty, "exam"))
            .ToListAsync(ct);

        var questionRows = await db.Questions
            .AsNoTracking()
            .Where(x => x.Text.Contains(term))
            .Take(8)
            .Select(x => new { x.Id, x.Text, LessonTitle = x.Lesson != null ? x.Lesson.Title : string.Empty })
            .ToListAsync(ct);

        var questions = questionRows
            .Select(x => new SearchHitDto(x.Id, x.Text.Length > 90 ? x.Text[..90] + "…" : x.Text, x.LessonTitle, "question"))
            .ToList();

        return Ok(ApiResponse<SearchResultsDto>.Ok(new SearchResultsDto
        {
            Courses = courses,
            Lessons = lessons,
            Exams = exams,
            Questions = questions
        }));
    }
}
