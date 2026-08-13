using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Domain.Entities;
using MrSiam.Domain.Enums;

namespace MrSiam.Api.Controllers;

[ApiController]
[Route("api/testimonials")]
public class TestimonialsController(IApplicationDbContext db, IWebHostEnvironment env) : ControllerBase
{
    [HttpGet, AllowAnonymous]
    public async Task<IActionResult> List() => Ok(new { success = true, data = await db.StudentTestimonials.AsNoTracking().OrderByDescending(x => x.CreatedAt).Select(x => new TestimonialDto(x.Id, x.FullName, x.Quote, x.StageAr, x.PhotoUrl)).ToListAsync() });

    [HttpPost, Authorize(Roles = nameof(Role.Teacher) + "," + nameof(Role.Admin))]
    public async Task<IActionResult> Create([FromForm] CreateTestimonialRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.Quote)) return BadRequest(new { success = false, message = "الاسم والرأي مطلوبان" });
        string? photoUrl = null;
        if (request.Photo is not null) { var ext = Path.GetExtension(request.Photo.FileName).ToLowerInvariant(); if (ext is not ".jpg" and not ".jpeg" and not ".png" and not ".webp") return BadRequest(new { success = false, message = "صيغة الصورة غير مدعومة" }); var name = $"{Guid.NewGuid():N}{ext}"; var dir = Path.Combine(env.ContentRootPath, "app_data", "testimonials"); Directory.CreateDirectory(dir); await using var stream = System.IO.File.Create(Path.Combine(dir, name)); await request.Photo.CopyToAsync(stream); photoUrl = $"/uploads/testimonials/{name}"; }
        var item = new StudentTestimonial { FullName = request.FullName.Trim(), Quote = request.Quote.Trim(), StageAr = string.IsNullOrWhiteSpace(request.StageAr) ? null : request.StageAr.Trim(), PhotoUrl = photoUrl };
        db.StudentTestimonials.Add(item); await db.SaveChangesAsync(); return Ok(new { success = true, data = item.Id });
    }

    [HttpDelete("{id:int}"), Authorize(Roles = nameof(Role.Teacher) + "," + nameof(Role.Admin))]
    public async Task<IActionResult> Delete(int id) { var item = await db.StudentTestimonials.FindAsync(id); if (item is null) return NotFound(); db.StudentTestimonials.Remove(item); await db.SaveChangesAsync(); return Ok(new { success = true, data = true }); }

    public record CreateTestimonialRequest(string? FullName, string? Quote, string? StageAr, IFormFile? Photo);
    public record TestimonialDto(int Id, string FullName, string Quote, string? StageAr, string? PhotoUrl);
}
