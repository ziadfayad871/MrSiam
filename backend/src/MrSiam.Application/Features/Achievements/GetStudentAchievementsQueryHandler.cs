using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;

namespace MrSiam.Application.Features.Achievements;

public record GetStudentAchievementsQuery(int StudentId) : IRequest<ApiResponse<IReadOnlyList<AchievementDto>>>;

public class GetStudentAchievementsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetStudentAchievementsQuery, ApiResponse<IReadOnlyList<AchievementDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<AchievementDto>>> Handle(GetStudentAchievementsQuery request, CancellationToken ct)
    {
        var unlocked = await db.StudentAchievements
            .AsNoTracking()
            .Where(sa => sa.StudentId == request.StudentId)
            .ToDictionaryAsync(sa => sa.AchievementId, sa => sa.UnlockedAt, ct);

        var achievements = await db.Achievements
            .AsNoTracking()
            .Where(a => a.IsActive)
            .OrderBy(a => a.Order)
            .Select(a => new AchievementDto
            {
                Id = a.Id,
                Code = a.Code,
                Title = a.Title,
                Description = a.Description,
                Icon = a.Icon,
                Order = a.Order
            })
            .ToListAsync(ct);

        foreach (var achievement in achievements)
        {
            if (unlocked.TryGetValue(achievement.Id, out var at))
            {
                achievement.IsUnlocked = true;
                achievement.UnlockedAt = at;
            }
        }

        return ApiResponse<IReadOnlyList<AchievementDto>>.Ok(achievements);
    }
}
