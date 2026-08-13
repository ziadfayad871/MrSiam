using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Entities;
using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Payments;

public record PaymentDto
{
    public int Id { get; init; }
    public int StudentId { get; init; }
    public required string StudentName { get; init; }
    public decimal Amount { get; init; }
    public required string Month { get; init; }
    public PaymentStatus Status { get; init; }
    public DateTime? PaidAt { get; init; }
    public string? Method { get; init; }
}

public record ListPaymentsQuery(string? Month = null, PaymentStatus? Status = null, int Page = 1, int PageSize = 20)
    : IRequest<ApiResponse<PagedResult<PaymentDto>>>;

public record MarkPaymentPaidCommand(int PaymentId, string? Method = null) : IRequest<ApiResponse<bool>>;

public record CreatePaymentCommand(int StudentId, decimal Amount, string Month) : IRequest<ApiResponse<int>>;

public record PaymentReceiptDto
{
    public int Id { get; init; }
    public int StudentId { get; init; }
    public required string StudentName { get; init; }
    public required string Username { get; init; }
    public required string StudentCode { get; init; }
    public required string StageAr { get; init; }
    public decimal Amount { get; init; }
    public required string Month { get; init; }
    public string? Method { get; init; }
    public DateTime PaidAt { get; init; }
}

public record CreatePaidPaymentCommand(int StudentId, decimal Amount, string Month, string? Method = null)
    : IRequest<ApiResponse<PaymentReceiptDto>>;

public class ListPaymentsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<ListPaymentsQuery, ApiResponse<PagedResult<PaymentDto>>>
{
    public async Task<ApiResponse<PagedResult<PaymentDto>>> Handle(ListPaymentsQuery request, CancellationToken ct)
    {
        var query = db.Payments.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Month))
            query = query.Where(p => p.Month == request.Month);
        if (request.Status is not null)
            query = query.Where(p => p.Status == request.Status);

        var projected = query
            .OrderByDescending(p => p.Id)
            .Select(p => new PaymentDto
            {
                Id = p.Id,
                StudentId = p.StudentId,
                StudentName = p.Student != null ? p.Student.FullName : string.Empty,
                Amount = p.Amount,
                Month = p.Month,
                Status = p.Status,
                PaidAt = p.PaidAt,
                Method = p.Method
            });

        var paged = PagedResult<PaymentDto>.From(projected, request.Page, request.PageSize);
        return ApiResponse<PagedResult<PaymentDto>>.Ok(paged);
    }
}

public class MarkPaymentPaidCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<MarkPaymentPaidCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(MarkPaymentPaidCommand request, CancellationToken ct)
    {
        var payment = await db.Payments.FirstOrDefaultAsync(p => p.Id == request.PaymentId, ct);
        if (payment is null)
            return ApiResponse<bool>.Fail("الدفعة غير موجودة");

        payment.Status = PaymentStatus.Paid;
        payment.PaidAt = DateTime.UtcNow;
        payment.Method = request.Method ?? "نقدي";

        await db.SaveChangesAsync(ct);

        AuditLogWriter.Add(db, currentUser, "update", "Payment", payment.Id.ToString(), $"تأكيد دفعة {payment.Month} بمبلغ {payment.Amount:N0}");
        await db.SaveChangesAsync(ct);

        return ApiResponse<bool>.Ok(true, "تم تأكيد الدفعة");
    }
}

public class CreatePaymentCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<CreatePaymentCommand, ApiResponse<int>>
{
    public async Task<ApiResponse<int>> Handle(CreatePaymentCommand request, CancellationToken ct)
    {
        var studentExists = await db.Students.AnyAsync(s => s.Id == request.StudentId, ct);
        if (!studentExists)
            return ApiResponse<int>.Fail("الطالب غير موجود");

        var payment = new Payment
        {
            StudentId = request.StudentId,
            Amount = request.Amount,
            Month = request.Month,
            Status = PaymentStatus.Pending
        };

        db.Payments.Add(payment);
        await db.SaveChangesAsync(ct);

        AuditLogWriter.Add(db, currentUser, "create", "Payment", payment.Id.ToString(), $"إضافة دفعة {payment.Month} بمبلغ {payment.Amount:N0}");
        await db.SaveChangesAsync(ct);

        return ApiResponse<int>.Ok(payment.Id, "تم إضافة الدفعة");
    }
}

public class CreatePaidPaymentCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<CreatePaidPaymentCommand, ApiResponse<PaymentReceiptDto>>
{
    public async Task<ApiResponse<PaymentReceiptDto>> Handle(CreatePaidPaymentCommand request, CancellationToken ct)
    {
        var student = await db.Students.AsNoTracking()
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == request.StudentId, ct);
        if (student is null)
            return ApiResponse<PaymentReceiptDto>.Fail("الطالب غير موجود");

        var payment = new Payment
        {
            StudentId = request.StudentId,
            Amount = request.Amount,
            Month = request.Month,
            Status = PaymentStatus.Paid,
            PaidAt = DateTime.UtcNow,
            Method = request.Method ?? "نقدي"
        };

        db.Payments.Add(payment);
        await db.SaveChangesAsync(ct);

        AuditLogWriter.Add(db, currentUser, "create", "Payment", payment.Id.ToString(),
            $"سداد {payment.Month} بمبلغ {payment.Amount:N0} — طريقة: {payment.Method}");
        await db.SaveChangesAsync(ct);

        var receipt = new PaymentReceiptDto
        {
            Id = payment.Id,
            StudentId = student.Id,
            StudentName = student.FullName,
            Username = student.User?.Username ?? string.Empty,
            StudentCode = student.StudentCode,
            StageAr = student.Stage.ToArabic(),
            Amount = payment.Amount,
            Month = payment.Month,
            Method = payment.Method,
            PaidAt = payment.PaidAt!.Value
        };

        return ApiResponse<PaymentReceiptDto>.Ok(receipt, "تم السداد وتسجيل الإيصال");
    }
}
