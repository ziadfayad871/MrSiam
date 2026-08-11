using MrSiam.Domain.Common;

namespace MrSiam.Domain.Entities;

public class SubscriptionPlan : Entity
{
    public required string Name { get; set; }
    public int Months { get; set; }
    public decimal Price { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}
