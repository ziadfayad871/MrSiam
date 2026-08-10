using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Students;

public record GetStudentDetailQuery(int StudentId) : IRequest<ApiResponse<StudentDetailDto>>;

public class GetStudentDetailQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetStudentDetailQuery, ApiResponse<StudentDetailDto>>
{
    public async Task<ApiResponse<StudentDetailDto>> Handle(GetStudentDetailQuery request, CancellationToken ct)
    {
        var student = await db.Students
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == request.StudentId, ct);

        if (student is null)
            return ApiResponse<StudentDetailDto>.Fail("الطالب غير موجود");

        var attempts = await db.ExamAttempts
            .AsNoTracking()
            .Where(a => a.StudentId == request.StudentId)
            .ToListAsync(ct);

        var rank = await GetRankAsync(request.StudentId, ct);

        var achievements = await db.StudentAchievements
            .AsNoTracking()
            .Where(sa => sa.StudentId == request.StudentId)
            .Include(sa => sa.Achievement)
            .Select(sa => sa.Achievement!.Title)
            .ToListAsync(ct);

        return ApiResponse<StudentDetailDto>.Ok(new StudentDetailDto
        {
            Id = student.Id,
            UserId = student.UserId,
            FullName = student.FullName,
            StudentCode = student.StudentCode,
            GuardianPhone = student.GuardianPhone,
            Stage = student.Stage,
            StageAr = student.Stage.ToArabic(),
            AcademicYear = student.AcademicYear,
            JoinedAt = student.JoinedAt,
            Average = attempts.Count > 0 ? Math.Round(attempts.Average(a => a.Percentage), 1) : 0,
            ExamsTaken = attempts.Count,
            PassedExams = attempts.Count(a => a.Passed),
            Rank = rank,
            Achievements = achievements
        });
    }

    private async Task<int> GetRankAsync(int studentId, CancellationToken ct)
    {
        var ranks = await db.ExamAttempts
            .AsNoTracking()
            .GroupBy(a => a.StudentId)
            .Select(g => new { StudentId = g.Key, Avg = g.Average(a => a.Percentage) })
            .OrderByDescending(x => x.Avg)
            .Select(x => x.StudentId)
            .ToListAsync(ct);

        var index = ranks.IndexOf(studentId);
        return index >= 0 ? index + 1 : ranks.Count + 1;
    }
}
