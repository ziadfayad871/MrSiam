using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Analytics;

public record GetEarlyWarningsQuery : IRequest<ApiResponse<IReadOnlyList<EarlyWarningDto>>>;

public class GetEarlyWarningsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetEarlyWarningsQuery, ApiResponse<IReadOnlyList<EarlyWarningDto>>>
{
    private const int InactiveDays = 14;
    private const decimal PassRateThreshold = 50m;
    private const decimal AttendanceThreshold = 60m;
    private const decimal DeclineThreshold = 10m;

    public async Task<ApiResponse<IReadOnlyList<EarlyWarningDto>>> Handle(GetEarlyWarningsQuery request, CancellationToken ct)
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
            .Select(s => new { s.Id, s.FullName, s.StudentCode, s.Stage, s.LastActiveDay, s.JoinedAt })
            .ToListAsync(ct);

        var now = DateTime.UtcNow;
        var warnings = new List<EarlyWarningDto>();

        foreach (var s in students)
        {
            var reasons = new List<string>();
            var mine = attempts
                .Where(a => a.StudentId == s.Id)
                .OrderByDescending(a => a.SubmittedAt)
                .ToList();

            var lastAttempt = mine.FirstOrDefault()?.SubmittedAt;
            var lastActive = s.LastActiveDay ?? lastAttempt;

            if (lastActive is null || (now - lastActive.Value).TotalDays >= InactiveDays)
            {
                var days = lastActive is null ? InactiveDays : (int)(now - lastActive.Value).TotalDays;
                reasons.Add($"مفيش نشاط من {days} يوم");
            }

            var exams = mine
                .GroupBy(a => a.ExamId)
                .Select(g => g.OrderByDescending(x => x.Percentage).First())
                .ToList();

            if (exams.Count >= 2)
            {
                var passRate = (decimal)exams.Count(x => x.Passed) / exams.Count * 100m;
                if (passRate < PassRateThreshold)
                    reasons.Add($"معدل النجاح {passRate:0}% — أقل من {PassRateThreshold:0}%");
            }

            if (exams.Count >= 3)
            {
                var recent = exams.Take(2).Average(x => x.Percentage);
                var earlier = exams.Skip(2).Average(x => x.Percentage);
                if (earlier - recent >= DeclineThreshold)
                    reasons.Add("أداؤه منخفض مؤخراً مقارنة بالفترة السابقة");
            }

            var att = attendance.Where(r => r.StudentId == s.Id).ToList();
            if (att.Count > 0)
            {
                var present = att.Count(r => r.Status == AttendanceStatus.Present || r.Status == AttendanceStatus.Late || r.Status == AttendanceStatus.Excused);
                var rate = (decimal)present / att.Count * 100m;
                if (rate < AttendanceThreshold)
                    reasons.Add($"الحضور {rate:0}% — أقل من {AttendanceThreshold:0}%");
            }

            var completedLessons = progress.Count(p =>
                p.StudentId == s.Id && p.DurationSeconds > 0 && p.PositionSeconds >= p.DurationSeconds * 0.9m);
            if (completedLessons == 0 && (now - s.JoinedAt).TotalDays >= 7)
                reasons.Add("لسه مبدأش المذاكرة (مفيش درس مكتمل)");

            if (reasons.Count == 0)
                continue;

            var avg = exams.Count == 0 ? 0m : exams.Average(x => x.Percentage);
            var severity = reasons.Count >= 2 || avg < 30m ? "Critical" : "Warning";

            warnings.Add(new EarlyWarningDto
            {
                StudentId = s.Id,
                FullName = s.FullName,
                StudentCode = s.StudentCode,
                StageAr = s.Stage.ToString(),
                Severity = severity,
                AvgPercentage = avg,
                LastActiveAt = lastActive,
                Reasons = reasons
            });
        }

        return ApiResponse<IReadOnlyList<EarlyWarningDto>>.Ok(
            warnings
                .OrderByDescending(w => w.Severity == "Critical")
                .ThenBy(w => w.LastActiveAt)
                .ToList());
    }
}
