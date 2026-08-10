using MrSiam.Application.Features.Attempts;

namespace MrSiam.Application.Features.Achievements;

public interface IAchievementService
{
    Task<IReadOnlyList<AchievementUnlockedDto>> CheckAndUnlockAsync(int studentId, CancellationToken ct);
}
