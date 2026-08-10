using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;

namespace MrSiam.Application.Features.Teacher;

public record GetTeacherProfileQuery : IRequest<ApiResponse<TeacherProfileDto>>;

public class GetTeacherProfileQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetTeacherProfileQuery, ApiResponse<TeacherProfileDto>>
{
    public async Task<ApiResponse<TeacherProfileDto>> Handle(GetTeacherProfileQuery request, CancellationToken ct)
    {
        var teacher = await db.Teachers
            .AsNoTracking()
            .Include(t => t.Courses)
            .OrderBy(t => t.Id)
            .FirstOrDefaultAsync(ct);

        if (teacher is null)
            return ApiResponse<TeacherProfileDto>.Fail("ملف الأستاذ غير متاح");

        var studentsCount = await db.Students.CountAsync(s => s.IsActive, ct);
        var attempts = await db.ExamAttempts.AsNoTracking().ToListAsync(ct);
        var successRate = attempts.Count > 0 ? Math.Round(attempts.Count(a => a.Passed) / (decimal)attempts.Count * 100, 1) : 0;

        var milestones = new List<TeacherMilestoneDto>
        {
            new() { Year = teacher.ExperienceYears >= 20 ? DateTime.UtcNow.Year - 20 : DateTime.UtcNow.Year - teacher.ExperienceYears, Title = "البداية", Description = $"بدأ رحلة التدريس بعد تخرجه من {teacher.GraduatedFrom}" },
            new() { Year = DateTime.UtcNow.Year - teacher.ExperienceYears + 8, Title = "منتصف الرحلة", Description = "أسس أسلوباً تعليمياً يجمع بين القصة والخريطة في تدريس التاريخ والجغرافيا" },
            new() { Year = DateTime.UtcNow.Year - teacher.ExperienceYears + 15, Title = "آلاف الطلاب", Description = "مرّ على حصصه آلاف الطلاب من الإعدادية والثانوية" },
            new() { Year = DateTime.UtcNow.Year, Title = "المستقبل", Description = "يطلق منصته التعليمية الرقمية لتكون الأطلس الرقمي لكل طالب" }
        };

        return ApiResponse<TeacherProfileDto>.Ok(new TeacherProfileDto
        {
            Id = teacher.Id,
            FullName = teacher.FullName,
            Title = teacher.Title,
            Bio = teacher.Bio,
            Philosophy = teacher.Philosophy,
            ExperienceYears = teacher.ExperienceYears,
            GraduatedFrom = teacher.GraduatedFrom,
            PortraitUrl = teacher.PortraitUrl,
            Milestones = milestones,
            Stats = new TeacherStatsDto
            {
                StudentsCount = studentsCount,
                CoursesCount = teacher.Courses.Count,
                ExamsCount = await db.Exams.CountAsync(e => e.IsPublished, ct),
                SuccessRate = successRate
            }
        });
    }
}
