using MrSiam.Domain.Common;

namespace MrSiam.Domain.Entities;

public class Coupon : Entity
{
    public required string Code { get; set; }
    public int DiscountPercent { get; set; }
    public int MaxUses { get; set; } = 1;
    public int UsedCount { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;
}
