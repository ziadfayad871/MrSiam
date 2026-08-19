namespace MrSiam.Application.Abstractions;

public sealed record ReceiptPdfData
{
    public required string ReceiptNumber { get; init; }
    public required string StudentName { get; init; }
    public required string StageAr { get; init; }
    public required string StudentCode { get; init; }
    public required string Username { get; init; }
    public required string Month { get; init; }
    public required string Method { get; init; }
    public required string AmountDigits { get; init; }
    public required string AmountWords { get; init; }
    public required string PaidAtText { get; init; }
}

public interface IReceiptPdfBuilder
{
    byte[] BuildReceiptPdf(ReceiptPdfData data);
}