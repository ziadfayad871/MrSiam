using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Analytics;

public record GetClassAnalyticsQuery : IRequest<ApiResponse<ClassAnalyticsDto>>;

public class GetClassAnalyticsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetClassAnalyticsQuery, ApiResponse<ClassAnalyticsDto>>
{
    public async Task<ApiResponse<ClassAnalyticsDto>> Handle(GetClassAnalyticsQuery request, CancellationToken ct)
    {
        var attempts = await db.ExamAttempts
            .AsNoTracking()
            .Where(a => a.SubmittedAt != null)
            .Select(a => new { a.StudentId, a.ExamId, a.Percentage, a.Passed, a.SubmittedAt })
            .ToListAsync(ct);

        var attendance = await db.AttendanceRecords
            .AsNoTracking()
            .Select(r => new { r.StudentId, r.Status })
            .ToListAsync(ct);

        var progress = await db.WatchProgress
            .AsNoTracking()
            .Select(p => new { p.StudentId, p.PositionSeconds, p.DurationSeconds })
            .ToListAsync(ct);

        var students = await db.Students
            .AsNoTracking()
            .Select(s => new { s.Id, s.FullName, s.StudentCode, s.Stage, s.IsActive, s.LastActiveDay, s.JoinedAt })
            .ToListAsync(ct);

        var bestPerExam = attempts
            .GroupBy(a => new { a.StudentId, a.ExamId })
            .Select(g => g.OrderByDescending(x => x.Percentage).First())
            .ToList();

        var lastActive = attempts
            .GroupBy(a => a.StudentId)
            .Select(g => new { StudentId = g.Key, Last = g.Max(x => x.SubmittedAt) })
            .ToDictionary(x => x.StudentId, x => x.Last);

        var attendanceByStudent = attendance
            .GroupBy(r => r.StudentId)
            .Select(g => new
            {
                StudentId = g.Key,
                Total = g.Count(),
                Present = g.Count(r => r.Status == AttendanceStatus.Present || r.Status == AttendanceStatus.Late || r.Status == AttendanceStatus.Excused)
            })
            .ToDictionary(x => x.StudentId, x => x);

        var lessonsByStudent = progress
            .Where(p => p.DurationSeconds > 0)
            .GroupBy(p => p.StudentId)
            .Select(g => new
            {
                StudentId = g.Key,
                Completed = g.Count(p => p.PositionSeconds >= p.DurationSeconds * 0.9m)
            })
            .ToDictionary(x => x.StudentId, x => x.Completed);

        var rows = students.Select(s =>
        {
            var mine = bestPerExam.Where(a => a.StudentId == s.Id).ToList();
            var totalAttempts = attempts.Count(a => a.StudentId == s.Id);
            var last = lastActive.TryGetValue(s.Id, out var lastAtt) ? lastAtt : (DateTime?)null;
            var lastDay = s.LastActiveDay ?? last;
            var att = attendanceByStudent.TryGetValue(s.Id, out var a) ? a : null;
            var lessons = lessonsByStudent.TryGetValue(s.Id, out var c) ? c : 0;

            return new ClassStudentRowDto
            {
                StudentId = s.Id,
                FullName = s.FullName,
                StudentCode = s.StudentCode,
                StageAr = s.Stage.ToString(),
                IsActive = s.IsActive,
                AttemptCount = totalAttempts,
                ExamsTaken = mine.Count,
                PassedExams = mine.Count(a => a.Passed),
                AvgPercentage = mine.Count == 0 ? 0m : mine.Average(a => a.Percentage),
                BestPercentage = mine.Count == 0 ? 0m : mine.Max(a => a.Percentage),
                PassRate = mine.Count == 0 ? 0m : (decimal)mine.Count(a => a.Passed) / mine.Count() * 100m,
                LessonsCompleted = lessons,
                AttendanceRate = att is null ? 0m : (decimal)att.Present / att.Total * 100m,
                LastActiveAt = lastDay
            };
        }).ToList();

        var withAttempts = rows.Where(r => r.ExamsTaken > 0).ToList();
        var attended = rows.Where(r => r.AttendanceRate > 0).ToList();

        var result = new ClassAnalyticsDto
        {
            TotalStudents = rows.Count,
            ActiveStudents = rows.Count(s => s.IsActive),
            AttemptCount = bestPerExam.Count,
            AvgPercentage = withAttempts.Count == 0 ? 0m : withAttempts.Average(r => r.AvgPercentage),
            PassRate = withAttempts.Count == 0 ? 0m : withAttempts.Average(r => r.PassRate),
            AttendanceRate = attended.Count == 0 ? 0m : attended.Average(r => r.AttendanceRate),
            Students = rows
                .OrderByDescending(r => r.AvgPercentage)
                .ThenBy(r => r.FullName)
                .ToList()
        };

        return ApiResponse<ClassAnalyticsDto>.Ok(result);
    }
}
