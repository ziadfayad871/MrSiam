using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.StudentEngagement;

public record GetPassportQuery(int StudentId) : IRequest<ApiResponse<PassportDto>>;

public class GetPassportQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetPassportQuery, ApiResponse<PassportDto>>
{
    public async Task<ApiResponse<PassportDto>> Handle(GetPassportQuery request, CancellationToken ct)
    {
        var student = await db.Students
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == request.StudentId, ct);
        if (student is null)
            return ApiResponse<PassportDto>.Fail("الطالب غير موجود");

        var stamps = new List<PassportStampDto>();

        var achievements = await db.StudentAchievements
            .AsNoTracking()
            .Where(sa => sa.StudentId == request.StudentId)
            .Select(sa => new PassportStampDto
            {
                Kind = "badge",
                Title = sa.Achievement != null ? sa.Achievement.Title : "إنجاز",
                Detail = "شارة تحققت في الرحلة",
                Icon = sa.Achievement != null ? sa.Achievement.Icon : "award",
                Date = sa.UnlockedAt
            })
            .ToListAsync(ct);
        stamps.AddRange(achievements);

        var attempts = await db.ExamAttempts
            .AsNoTracking()
            .Where(a => a.StudentId == request.StudentId && a.SubmittedAt != null)
            .Select(a => new { a.Percentage, a.Passed, a.SubmittedAt, ExamTitle = a.Exam != null ? a.Exam.Title : string.Empty, CourseTitle = a.Exam != null && a.Exam.Course != null ? a.Exam.Course.Title : string.Empty })
            .ToListAsync(ct);

        foreach (var best in attempts
            .GroupBy(a => a.ExamTitle)
            .Select(g => g.OrderByDescending(x => x.Percentage).First()))
        {
            if (!best.Passed)
                continue;

            if (best.Percentage >= 99.5m)
            {
                stamps.Add(new PassportStampDto
                {
                    Kind = "perfect",
                    Title = best.ExamTitle,
                    Detail = "علامة كاملة 100%",
                    Icon = "award",
                    Date = best.SubmittedAt
                });
            }
            else
            {
                stamps.Add(new PassportStampDto
                {
                    Kind = "exam",
                    Title = best.ExamTitle,
                    Detail = $"نجاح بنسبة {best.Percentage}%",
                    Icon = "scroll",
                    Date = best.SubmittedAt
                });
            }
        }

        var courseIds = attempts.Select(a => a.ExamTitle).Distinct().Count();
        var completedCourses = attempts
            .Where(a => a.Passed)
            .GroupBy(a => a.CourseTitle)
            .Where(g => g.Any())
            .Select(g => new PassportStampDto
            {
                Kind = "course",
                Title = g.Key,
                Detail = "أكملت مقرر كامل",
                Icon = "book",
                Date = g.Max(x => x.SubmittedAt)
            })
            .ToList();
        stamps.AddRange(completedCourses);

        stamps.Add(new PassportStampDto
        {
            Kind = "milestone",
            Title = "انطلاق الرحلة",
            Detail = $"انضممت للقافلة في {student.JoinedAt:dd/MM/yyyy}",
            Icon = "compass",
            Date = student.JoinedAt
        });

        stamps = stamps
            .GroupBy(s => new { s.Kind, s.Title })
            .Select(g => g.First())
            .OrderByDescending(s => s.Date)
            .ToList();

        return ApiResponse<PassportDto>.Ok(new PassportDto
        {
            StudentName = student.FullName,
            StudentCode = student.StudentCode,
            StageAr = student.Stage.ToArabic(),
            AcademicYear = student.AcademicYear,
            Stamps = stamps
        });
    }
}
