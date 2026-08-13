using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MrSiam.Application.Abstractions;

namespace MrSiam.Infrastructure.AI;

public class GeminiService(IHttpClientFactory httpClientFactory, IConfiguration configuration, ILogger<GeminiService> logger)
    : IGeminiService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private static readonly SemaphoreSlim Limiter = new(1, 1);

    public async Task<string?> GenerateAsync(string systemInstruction, string userPrompt, CancellationToken ct)
    {
        return await CallAsync(systemInstruction, userPrompt, null, 900, null, ct);
    }

    public async Task<string?> GenerateJsonAsync(string systemInstruction, string userPrompt, CancellationToken ct)
    {
        return await CallAsync(systemInstruction, userPrompt, "application/json", 4096, null, ct);
    }

    public async Task<string?> GenerateJsonFromPdfAsync(string systemInstruction, string userPrompt, byte[] pdfBytes, CancellationToken ct)
    {
        return await CallAsync(systemInstruction, userPrompt, "application/json", 4096, pdfBytes, ct);
    }

    private async Task<string?> CallAsync(string systemInstruction, string userPrompt, string? responseMimeType, int maxOutputTokens, byte[]? pdfBytes, CancellationToken ct)
    {
        var apiKey = configuration["AI:ApiKey"];
        var model = configuration["AI:Model"] ?? "gemini-2.5-flash";
        var endpoint = configuration["AI:Endpoint"] ?? "https://generativelanguage.googleapis.com/v1beta";

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            logger.LogWarning("AI:ApiKey غير مضبوطة — مش هقدر أجيب رد");
            return null;
        }

        await Limiter.WaitAsync(ct);
        try
        {
            var client = httpClientFactory.CreateClient("gemini");
            client.Timeout = TimeSpan.FromSeconds(120);

            var requestParts = new List<object>();
            if (pdfBytes is { Length: > 0 })
            {
                requestParts.Add(new
                {
                    inlineData = new
                    {
                        mimeType = "application/pdf",
                        data = Convert.ToBase64String(pdfBytes)
                    }
                });
            }
            requestParts.Add(new { text = userPrompt });

            var payload = new
            {
                systemInstruction = new { parts = new object[] { new { text = systemInstruction } } },
                contents = new object[] { new { role = "user", parts = requestParts } },
                generationConfig = new { temperature = 0.3, maxOutputTokens, responseMimeType }
            };

            var request = new HttpRequestMessage(HttpMethod.Post, $"{endpoint}/models/{model}:generateContent?key={Uri.EscapeDataString(apiKey)}")
            {
                Content = new StringContent(JsonSerializer.Serialize(payload, JsonOptions), Encoding.UTF8, "application/json")
            };

            using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("Gemini failed ({Status}): {Body}", (int)response.StatusCode, body[..Math.Min(500, body.Length)]);
                return null;
            }

            using var json = JsonDocument.Parse(body);
            if (json.RootElement.TryGetProperty("candidates", out var candidates)
                && candidates.GetArrayLength() > 0
                && candidates[0].TryGetProperty("content", out var content)
                && content.TryGetProperty("parts", out var parts)
                && parts.GetArrayLength() > 0)
            {
                return parts[0].GetProperty("text").GetString();
            }

            logger.LogWarning("Gemini returned unexpected shape: {Body}", body[..Math.Min(300, body.Length)]);
            return null;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Gemini call failed");
            return null;
        }
        finally
        {
            Limiter.Release();
        }
    }
}
