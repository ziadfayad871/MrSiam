using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Domain.Entities;
using MrSiam.Domain.Enums;

namespace MrSiam.Api.Controllers;

[ApiController]
[Route("api/top-students")]
public class TopStudentsController(IApplicationDbContext db, IWebHostEnvironment env) : ControllerBase
{
    private const string UploadsRoot = "app_data/top-students";
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    private const long MaxFileSize = 5 * 1024 * 1024;

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> List()
    {
        var entries = await db.TopStudents
            .AsNoTracking()
            .Where(t => t.IsActive)
            .OrderBy(t => t.SortOrder)
            .ThenByDescending(t => t.CreatedAt)
            .Select(t => new TopStudentDto
            {
                Id = t.Id,
                FullName = t.FullName,
                StageAr = t.StageAr,
                Achievement = t.Achievement,
                Score = t.Score,
                Year = t.Year,
                PhotoUrl = t.PhotoUrl,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();

        return Ok(new { success = true, data = entries });
    }

    [HttpPost]
    [Authorize(Roles = nameof(Role.Teacher) + "," + nameof(Role.Admin))]
    [RequestSizeLimit(MaxFileSize + 1024 * 1024)]
    public async Task<IActionResult> Create([FromForm] CreateTopStudentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.StageAr) || string.IsNullOrWhiteSpace(request.Achievement))
            return BadRequest(new { success = false, message = "الاسم والمرحلة الدراسية والإنجاز مطلوبون" });

        string? photoUrl = null;

        if (request.Photo is not null)
        {
            var ext = Path.GetExtension(request.Photo.FileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(ext))
                return BadRequest(new { success = false, message = "صيغة الصورة غير مدعومة (jpg / png / webp)" });

            if (request.Photo.Length > MaxFileSize)
                return BadRequest(new { success = false, message = "حجم الصورة أكبر من 5 ميجابايت" });

            var uploadsDir = Path.Combine(env.ContentRootPath, UploadsRoot);
            Directory.CreateDirectory(uploadsDir);

            var fileName = $"{Guid.NewGuid():N}{ext}";
            var filePath = Path.Combine(uploadsDir, fileName);
            await using (var stream = System.IO.File.Create(filePath))
            {
                await request.Photo.CopyToAsync(stream);
            }

            photoUrl = $"/uploads/top-students/{fileName}";
        }

        var maxSort = await db.TopStudents.AnyAsync()
            ? await db.TopStudents.MaxAsync(t => (int?)t.SortOrder) ?? 0
            : 0;

        var entry = new TopStudent
        {
            FullName = request.FullName.Trim(),
            StageAr = request.StageAr.Trim(),
            Achievement = request.Achievement.Trim(),
            Score = request.Score,
            Year = string.IsNullOrWhiteSpace(request.Year) ? null : request.Year.Trim(),
            PhotoUrl = photoUrl,
            SortOrder = maxSort + 1,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        db.TopStudents.Add(entry);
        await db.SaveChangesAsync();

        return Ok(new { success = true, data = entry.Id });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = nameof(Role.Teacher) + "," + nameof(Role.Admin))]
    public async Task<IActionResult> Delete(int id)
    {
        var entry = await db.TopStudents.FirstOrDefaultAsync(t => t.Id == id);
        if (entry is null)
            return NotFound(new { success = false, message = "الطالب غير موجود" });

        if (!string.IsNullOrWhiteSpace(entry.PhotoUrl))
        {
            var filePath = Path.Combine(env.ContentRootPath, UploadsRoot, Path.GetFileName(entry.PhotoUrl));
            if (System.IO.File.Exists(filePath))
                System.IO.File.Delete(filePath);
        }

        db.TopStudents.Remove(entry);
        await db.SaveChangesAsync();

        return Ok(new { success = true, data = true });
    }

    public record CreateTopStudentRequest(
        string? FullName,
        string? StageAr,
        string? Achievement,
        decimal? Score,
        string? Year,
        IFormFile? Photo);

    public record TopStudentDto
    {
        public int Id { get; init; }
        public string FullName { get; init; } = "";
        public string StageAr { get; init; } = "";
        public string Achievement { get; init; } = "";
        public decimal? Score { get; init; }
        public string? Year { get; init; }
        public string? PhotoUrl { get; init; }
        public DateTime CreatedAt { get; init; }
    }
}
