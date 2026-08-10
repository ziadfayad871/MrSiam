namespace MrSiam.Application.Features.Achievements;

public record AchievementDto
{
    public int Id { get; init; }
    public required string Code { get; init; }
    public required string Title { get; init; }
    public required string Description { get; init; }
    public required string Icon { get; init; }
    public int Order { get; init; }
    public bool IsUnlocked { get; set; }
    public DateTime? UnlockedAt { get; set; }
}
