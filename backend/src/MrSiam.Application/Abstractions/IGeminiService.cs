namespace MrSiam.Application.Abstractions;

public interface IGeminiService
{
    Task<string?> GenerateAsync(string systemInstruction, string userPrompt, CancellationToken ct);
}
