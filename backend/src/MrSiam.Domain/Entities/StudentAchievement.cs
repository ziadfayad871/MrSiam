using MrSiam.Domain.Common;

namespace MrSiam.Domain.Entities;

public class StudentAchievement : Entity
{
    public int StudentId { get; set; }
    public int AchievementId { get; set; }
    public DateTime UnlockedAt { get; set; } = DateTime.UtcNow;

    public Student? Student { get; set; }
    public Achievement? Achievement { get; set; }
}
