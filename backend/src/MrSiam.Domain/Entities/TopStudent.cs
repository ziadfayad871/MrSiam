using MrSiam.Domain.Common;

namespace MrSiam.Domain.Entities;

public class TopStudent : Entity
{
    public required string FullName { get; set; }
    public required string StageAr { get; set; }
    public required string Achievement { get; set; }
    public decimal? Score { get; set; }
    public string? Year { get; set; }
    public string? PhotoUrl { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
