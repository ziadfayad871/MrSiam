using MrSiam.Domain.Common;
using MrSiam.Domain.Enums;

namespace MrSiam.Domain.Entities;

public class Subscription : Entity
{
    public int StudentId { get; set; }
    public int PlanId { get; set; }
    public int? CouponId { get; set; }
    public decimal AmountPaid { get; set; }
    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }
    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;

    public Student? Student { get; set; }
    public SubscriptionPlan? Plan { get; set; }
    public Coupon? Coupon { get; set; }
}
