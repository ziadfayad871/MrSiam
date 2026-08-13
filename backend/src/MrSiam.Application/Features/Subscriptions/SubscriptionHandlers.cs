using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Entities;
using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Subscriptions;

public record SubscriptionPlanDto
{
    public int Id { get; init; }
    public required string Name { get; init; }
    public int Months { get; init; }
    public decimal Price { get; init; }
    public string? Description { get; init; }
    public bool IsActive { get; init; }
}

public record CouponDto
{
    public int Id { get; init; }
    public required string Code { get; init; }
    public int DiscountPercent { get; init; }
    public int MaxUses { get; init; }
    public int UsedCount { get; init; }
    public DateTime? ExpiresAt { get; init; }
    public bool IsActive { get; init; }
}

public record SubscriptionDto
{
    public int Id { get; init; }
    public int StudentId { get; init; }
    public required string StudentName { get; init; }
    public required string PlanName { get; init; }
    public decimal AmountPaid { get; init; }
    public string? CouponCode { get; init; }
    public DateTime StartsAt { get; init; }
    public DateTime EndsAt { get; init; }
    public SubscriptionStatus Status { get; init; }
}

public record MySubscriptionDto
{
    public bool HasActiveSubscription { get; init; }
    public string? PlanName { get; init; }
    public decimal AmountPaid { get; init; }
    public DateTime? StartsAt { get; init; }
    public DateTime? EndsAt { get; init; }
    public int DaysLeft { get; init; }
}

public record ListSubscriptionPlansQuery(bool IncludeInactive = false) : IRequest<ApiResponse<IReadOnlyList<SubscriptionPlanDto>>>;
public record ListCouponsQuery : IRequest<ApiResponse<IReadOnlyList<CouponDto>>>;
public record ListSubscriptionsQuery : IRequest<ApiResponse<IReadOnlyList<SubscriptionDto>>>;
public record GetMySubscriptionQuery(int StudentId) : IRequest<ApiResponse<MySubscriptionDto>>;

public record CreateSubscriptionPlanCommand(string Name, int Months, decimal Price, string? Description)
    : IRequest<ApiResponse<int>>;

public record CreateCouponCommand(int DiscountPercent, int MaxUses = 1, DateTime? ExpiresAt = null, string? Code = null)
    : IRequest<ApiResponse<int>>;

public record ActivateSubscriptionCommand(int StudentId, int PlanId, string? CouponCode = null, string? Method = null)
    : IRequest<ApiResponse<int>>;

public class ListSubscriptionPlansQueryHandler(IApplicationDbContext db)
    : IRequestHandler<ListSubscriptionPlansQuery, ApiResponse<IReadOnlyList<SubscriptionPlanDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<SubscriptionPlanDto>>> Handle(ListSubscriptionPlansQuery request, CancellationToken ct)
    {
        var query = db.SubscriptionPlans.AsNoTracking().Where(p => p.IsActive || request.IncludeInactive);
        var plans = await query.OrderBy(p => p.Months)
            .Select(p => new SubscriptionPlanDto
            {
                Id = p.Id,
                Name = p.Name,
                Months = p.Months,
                Price = p.Price,
                Description = p.Description,
                IsActive = p.IsActive
            })
            .ToListAsync(ct);

        return ApiResponse<IReadOnlyList<SubscriptionPlanDto>>.Ok(plans);
    }
}

public class ListCouponsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<ListCouponsQuery, ApiResponse<IReadOnlyList<CouponDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<CouponDto>>> Handle(ListCouponsQuery request, CancellationToken ct)
    {
        var coupons = await db.Coupons.AsNoTracking()
            .OrderByDescending(c => c.Id)
            .Select(c => new CouponDto
            {
                Id = c.Id,
                Code = c.Code,
                DiscountPercent = c.DiscountPercent,
                MaxUses = c.MaxUses,
                UsedCount = c.UsedCount,
                ExpiresAt = c.ExpiresAt,
                IsActive = c.IsActive
            })
            .ToListAsync(ct);

        return ApiResponse<IReadOnlyList<CouponDto>>.Ok(coupons);
    }
}

public class ListSubscriptionsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<ListSubscriptionsQuery, ApiResponse<IReadOnlyList<SubscriptionDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<SubscriptionDto>>> Handle(ListSubscriptionsQuery request, CancellationToken ct)
    {
        var subs = await db.Subscriptions.AsNoTracking()
            .OrderByDescending(s => s.Id)
            .Select(s => new SubscriptionDto
            {
                Id = s.Id,
                StudentId = s.StudentId,
                StudentName = s.Student != null ? s.Student.FullName : string.Empty,
                PlanName = s.Plan != null ? s.Plan.Name : string.Empty,
                AmountPaid = s.AmountPaid,
                CouponCode = s.Coupon != null ? s.Coupon.Code : null,
                StartsAt = s.StartsAt,
                EndsAt = s.EndsAt,
                Status = s.Status
            })
            .ToListAsync(ct);

        return ApiResponse<IReadOnlyList<SubscriptionDto>>.Ok(subs);
    }
}

public class GetMySubscriptionQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetMySubscriptionQuery, ApiResponse<MySubscriptionDto>>
{
    public async Task<ApiResponse<MySubscriptionDto>> Handle(GetMySubscriptionQuery request, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var sub = await db.Subscriptions.AsNoTracking()
            .Where(s => s.StudentId == request.StudentId && s.Status == SubscriptionStatus.Active)
            .OrderByDescending(s => s.EndsAt)
            .Select(s => new { s.AmountPaid, s.StartsAt, s.EndsAt, PlanName = s.Plan != null ? s.Plan.Name : string.Empty })
            .FirstOrDefaultAsync(ct);

        if (sub is null || sub.EndsAt < now)
            return ApiResponse<MySubscriptionDto>.Ok(new MySubscriptionDto { HasActiveSubscription = false });

        return ApiResponse<MySubscriptionDto>.Ok(new MySubscriptionDto
        {
            HasActiveSubscription = true,
            PlanName = sub.PlanName,
            AmountPaid = sub.AmountPaid,
            StartsAt = sub.StartsAt,
            EndsAt = sub.EndsAt,
            DaysLeft = (int)Math.Ceiling((sub.EndsAt - now).TotalDays)
        });
    }
}

public class CreateSubscriptionPlanCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<CreateSubscriptionPlanCommand, ApiResponse<int>>
{
    public async Task<ApiResponse<int>> Handle(CreateSubscriptionPlanCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return ApiResponse<int>.Fail("اسم الباقة مطلوب");
        if (request.Months <= 0)
            return ApiResponse<int>.Fail("المدة بالشهور مطلوبة");
        if (request.Price < 0)
            return ApiResponse<int>.Fail("السعر غير صالح");

        var plan = new SubscriptionPlan
        {
            Name = request.Name.Trim(),
            Months = request.Months,
            Price = request.Price,
            Description = request.Description?.Trim()
        };

        db.SubscriptionPlans.Add(plan);
        await db.SaveChangesAsync(ct);

        AuditLogWriter.Add(db, currentUser, "create", "SubscriptionPlan", plan.Id.ToString(), $"إضافة باقة {plan.Name} — {plan.Price:N0} ج.م");
        await db.SaveChangesAsync(ct);

        return ApiResponse<int>.Ok(plan.Id, "تم إضافة الباقة");
    }
}

public class CreateCouponCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<CreateCouponCommand, ApiResponse<int>>
{
    public async Task<ApiResponse<int>> Handle(CreateCouponCommand request, CancellationToken ct)
    {
        if (request.DiscountPercent <= 0 || request.DiscountPercent > 100)
            return ApiResponse<int>.Fail("نسبة الخصم بين 1 و 100");

        var code = (request.Code ?? GenerateCode()).ToUpperInvariant();
        if (await db.Coupons.AnyAsync(c => c.Code == code, ct))
            return ApiResponse<int>.Fail("الكود مستخدم من قبل");

        var coupon = new Coupon
        {
            Code = code,
            DiscountPercent = request.DiscountPercent,
            MaxUses = request.MaxUses > 0 ? request.MaxUses : 1,
            ExpiresAt = request.ExpiresAt
        };

        db.Coupons.Add(coupon);
        await db.SaveChangesAsync(ct);

        AuditLogWriter.Add(db, currentUser, "create", "Coupon", coupon.Id.ToString(), $"إضافة كود خصم {coupon.Code} — {coupon.DiscountPercent}%");
        await db.SaveChangesAsync(ct);

        return ApiResponse<int>.Ok(coupon.Id, "تم إضافة كود الخصم");
    }

    private static string GenerateCode()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, 8).Select(s => s[random.Next(s.Length)]).ToArray());
    }
}

public class ActivateSubscriptionCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<ActivateSubscriptionCommand, ApiResponse<int>>
{
    public async Task<ApiResponse<int>> Handle(ActivateSubscriptionCommand request, CancellationToken ct)
    {
        var student = await db.Students.FirstOrDefaultAsync(s => s.Id == request.StudentId, ct);
        if (student is null)
            return ApiResponse<int>.Fail("الطالب غير موجود");

        var plan = await db.SubscriptionPlans.FirstOrDefaultAsync(p => p.Id == request.PlanId && p.IsActive, ct);
        if (plan is null)
            return ApiResponse<int>.Fail("الباقة غير موجودة");

        decimal price = plan.Price;
        int? couponId = null;
        string? couponCode = null;

        if (!string.IsNullOrWhiteSpace(request.CouponCode))
        {
            var coupon = await db.Coupons.FirstOrDefaultAsync(c => c.Code == request.CouponCode.Trim().ToUpperInvariant(), ct);
            if (coupon is null || !coupon.IsActive)
                return ApiResponse<int>.Fail("كود الخصم غير صالح");
            if (coupon.ExpiresAt is not null && coupon.ExpiresAt < DateTime.UtcNow)
                return ApiResponse<int>.Fail("كود الخصم منتهي");
            if (coupon.UsedCount >= coupon.MaxUses)
                return ApiResponse<int>.Fail("كود الخصم استُنفد");

            price = decimal.Round(price * (100 - coupon.DiscountPercent) / 100, 2);
            couponId = coupon.Id;
            couponCode = coupon.Code;
            coupon.UsedCount++;
        }

        var now = DateTime.UtcNow;
        var subscription = new Subscription
        {
            StudentId = student.Id,
            PlanId = plan.Id,
            CouponId = couponId,
            AmountPaid = price,
            StartsAt = now,
            EndsAt = now.AddMonths(plan.Months),
            Status = SubscriptionStatus.Active
        };

        db.Subscriptions.Add(subscription);
        db.Payments.Add(new Payment
        {
            StudentId = student.Id,
            Amount = price,
            Month = $"{plan.Months} أشهر",
            Status = PaymentStatus.Paid,
            PaidAt = now,
            Method = request.Method ?? "اشتراك",
            Notes = couponCode is null ? null : $"كوبون {couponCode}"
        });

        await db.SaveChangesAsync(ct);

        AuditLogWriter.Add(db, currentUser, "create", "Subscription", subscription.Id.ToString(), $"تفعيل اشتراك {plan.Name} للطالب {student.FullName} — {price:N0} ج.م");
        await db.SaveChangesAsync(ct);

        return ApiResponse<int>.Ok(subscription.Id, "تم تفعيل الاشتراك بنجاح");
    }
}
