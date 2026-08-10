using MrSiam.Domain.Common;

namespace MrSiam.Domain.Entities;

public class Achievement : Entity
{
    public required string Code { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public required string Icon { get; set; }
    public int? RequiredExamsPassed { get; set; }
    public int? RequiredPerfectExams { get; set; }
    public decimal? RequiredAverage { get; set; }
    public int Order { get; set; }
    public bool IsActive { get; set; } = true;
}
