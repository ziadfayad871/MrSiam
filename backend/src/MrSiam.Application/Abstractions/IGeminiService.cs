namespace MrSiam.Application.Abstractions;

public interface IGeminiService
{
    Task<string?> GenerateAsync(string systemInstruction, string userPrompt, CancellationToken ct);
    Task<string?> GenerateJsonAsync(string systemInstruction, string userPrompt, CancellationToken ct);
    Task<string?> GenerateJsonFromPdfAsync(string systemInstruction, string userPrompt, byte[] pdfBytes, CancellationToken ct);
}
