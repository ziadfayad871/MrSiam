using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;

namespace MrSiam.Application.Features.Analytics;

public record GetStudentAnalyticsQuery(int StudentId) : IRequest<ApiResponse<StudentAnalyticsDto>>;

public class GetStudentAnalyticsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetStudentAnalyticsQuery, ApiResponse<StudentAnalyticsDto>>
{
    public async Task<ApiResponse<StudentAnalyticsDto>> Handle(GetStudentAnalyticsQuery request, CancellationToken ct)
    {
        var student = await db.Students
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == request.StudentId, ct);
        if (student is null)
            return ApiResponse<StudentAnalyticsDto>.Fail("الطالب غير موجود");

        var attempts = await db.ExamAttempts
            .AsNoTracking()
            .Where(a => a.StudentId == request.StudentId && a.SubmittedAt != null)
            .Select(a => new AttemptSummaryDto
            {
                ExamId = a.ExamId,
                ExamTitle = a.Exam != null ? a.Exam.Title : string.Empty,
                Score = a.Score,
                Percentage = a.Percentage,
                Passed = a.Passed,
                SubmittedAt = a.SubmittedAt
            })
            .ToListAsync(ct);

        var subjectData = await db.ExamAttempts
            .AsNoTracking()
            .Where(a => a.StudentId == request.StudentId && a.SubmittedAt != null)
            .Select(a => new
            {
                a.Percentage,
                Subject = a.Exam != null ? a.Exam.Course.Subject : 0,
                SubjectAr = a.Exam != null ? a.Exam.Course.Subject.ToString() : string.Empty
            })
            .ToListAsync(ct);

        var best = attempts.Count == 0 ? 0m : attempts.Max(a => a.Percentage);
        var avg = attempts.Count == 0 ? 0m : attempts.Average(a => a.Percentage);
        var passed = attempts.Count(a => a.Passed);
        var examsTaken = attempts.Select(a => a.ExamId).Distinct().Count();

        var subjects = subjectData
            .GroupBy(s => s.Subject)
            .Select(g => new SubjectAnalyticsDto
            {
                Subject = g.Key.ToString(),
                SubjectAr = g.First().SubjectAr,
                AttemptCount = g.Count(),
                AvgPercentage = g.Average(x => x.Percentage)
            })
            .OrderByDescending(s => s.AttemptCount)
            .ToList();

        var result = new StudentAnalyticsDto
        {
            StudentId = student.Id,
            FullName = student.FullName,
            StudentCode = student.StudentCode,
            StageAr = student.Stage.ToString(),
            AcademicYear = student.AcademicYear,
            JoinedAt = student.JoinedAt,
            ExamsTaken = examsTaken,
            TotalAttempts = attempts.Count,
            PassedExams = passed,
            BestPercentage = best,
            AvgPercentage = avg,
            Attempts = attempts.OrderByDescending(a => a.SubmittedAt).ToList(),
            Subjects = subjects
        };

        return ApiResponse<StudentAnalyticsDto>.Ok(result);
    }
}
