using MrSiam.Domain.Common;
using MrSiam.Domain.Enums;

namespace MrSiam.Domain.Entities;

public class Payment : Entity
{
    public int StudentId { get; set; }
    public decimal Amount { get; set; }
    public required string Month { get; set; }
    public PaymentStatus Status { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? Method { get; set; }
    public string? Notes { get; set; }

    public Student? Student { get; set; }
}
