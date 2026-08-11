using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;

namespace MrSiam.Application.Features.StudentEngagement;

public record HeartbeatCommand(int StudentId) : IRequest<ApiResponse<XpInfoDto>>;

public class HeartbeatCommandHandler(IApplicationDbContext db)
    : IRequestHandler<HeartbeatCommand, ApiResponse<XpInfoDto>>
{
    public async Task<ApiResponse<XpInfoDto>> Handle(HeartbeatCommand request, CancellationToken ct)
    {
        var student = await db.Students.FirstOrDefaultAsync(s => s.Id == request.StudentId, ct);
        if (student is null)
            return ApiResponse<XpInfoDto>.Fail("الطالب غير موجود");

        var today = DateTime.UtcNow.Date;
        var gainedToday = 0;

        if (student.LastActiveDay != today)
        {
            if (student.LastActiveDay == today.AddDays(-1))
            {
                student.StreakCurrent++;
                student.StreakLongest = Math.Max(student.StreakLongest, student.StreakCurrent);
            }
            else if (student.LastActiveDay is null || student.LastActiveDay < today.AddDays(-1))
            {
                student.StreakCurrent = 1;
                student.StreakLongest = Math.Max(student.StreakLongest, 1);
            }

            student.LastActiveDay = today;
            gainedToday = await XpRules.AwardAsync(db, request.StudentId, XpRules.DailyLogin, $"daily:{today:yyyyMMdd}", ct: ct);
            await db.SaveChangesAsync(ct);
        }

        var total = await XpRules.GetTotalAsync(db, request.StudentId, ct);
        var (level, title, nextTitle, nextThreshold, progress) = XpRules.Resolve(total);

        return ApiResponse<XpInfoDto>.Ok(new XpInfoDto
        {
            Total = total,
            Level = level,
            LevelTitle = title,
            NextLevelTitle = nextTitle,
            NextThreshold = nextThreshold,
            ProgressPercent = progress
        }, gainedToday > 0 ? $"+{gainedToday} نقطة خبرة لتواجدك اليومي" : null);
    }
}
