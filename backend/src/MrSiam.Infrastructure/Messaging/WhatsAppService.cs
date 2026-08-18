using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MrSiam.Application.Abstractions;

namespace MrSiam.Infrastructure.Messaging;

/// <summary>
/// إرسال واتساب عبر بوابات HTTP بسيطة:
/// callmebot (مجاني — التجربة) / whapi (شغال مع أي رقم) / ultramsg
/// أو gateway محلي (بيتصل برقم واتساب زي واتساب ويب وبيتصل من غير مفاتيح).
/// كل حاجة بتتظبط من إعدادات `WhatsApp` في appsettings.
/// </summary>
public class WhatsAppService(IHttpClientFactory httpClientFactory, IConfiguration configuration, ILogger<WhatsAppService> logger)
    : IWhatsAppService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<bool> SendAsync(string phone, string message, CancellationToken ct = default)
    {
        try
        {
            var enabled = configuration.GetValue("WhatsApp:Enabled", false);
            var provider = (configuration["WhatsApp:Provider"] ?? "callmebot").ToLowerInvariant();
            var isLocalGateway = provider is "local" or "gateway";
            var apiKey = configuration["WhatsApp:ApiKey"];
            if (!enabled || (!isLocalGateway && string.IsNullOrWhiteSpace(apiKey)))
            {
                logger.LogWarning("WhatsApp غير مفعّل أو من غير مفتاح — الرسالة اتسجلت في اللوج بس. phone={Phone}", Mask(phone));
                return false;
            }

            var endpoint = configuration["WhatsApp:Endpoint"];
            var instanceId = configuration["WhatsApp:InstanceId"] ?? "default";
            var apiKeyValue = apiKey ?? string.Empty;
            var client = httpClientFactory.CreateClient("whatsapp");

            bool ok = provider switch
            {
                "whapi" => await SendWhapiAsync(client, endpoint, apiKeyValue, phone, message, ct),
                "ultramsg" => await SendUltraMsgAsync(client, endpoint, instanceId, apiKeyValue, phone, message, ct),
                "local" or "gateway" => await SendLocalGatewayAsync(client, phone, message, ct),
                _ => await SendCallMeBotAsync(client, endpoint, apiKeyValue, phone, message, ct)
            };

            logger.LogInformation("واتساب: {Result} → {Phone}", ok ? "تم الإرسال" : "فشل", Mask(phone));
            return ok;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "فشل إرسال واتساب لـ {Phone}", Mask(phone));
            return false;
        }
    }

    private async Task<bool> SendCallMeBotAsync(HttpClient client, string? endpoint, string apiKey, string phone, string message, CancellationToken ct)
    {
        var url = string.IsNullOrWhiteSpace(endpoint) ? "https://api.callmebot.com/whatsapp.php" : endpoint.TrimEnd('?', '&');
        var full = $"{url}?phone={Uri.EscapeDataString(WithoutPlus(phone))}&text={Uri.EscapeDataString(message)}&apikey={Uri.EscapeDataString(apiKey)}";
        using var res = await client.GetAsync(full, ct);
        var body = await res.Content.ReadAsStringAsync(ct);
        return res.IsSuccessStatusCode
               && (body.Contains("queued", StringComparison.OrdinalIgnoreCase)
                   || body.Contains("sent", StringComparison.OrdinalIgnoreCase)
                   || body.Contains("already sent", StringComparison.OrdinalIgnoreCase));
    }

    private async Task<bool> SendWhapiAsync(HttpClient client, string? endpoint, string apiKey, string phone, string message, CancellationToken ct)
    {
        var url = string.IsNullOrWhiteSpace(endpoint) ? "https://gate.whapi.cloud/messages/text" : endpoint;
        using var req = new HttpRequestMessage(HttpMethod.Post, url);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        var json = JsonSerializer.Serialize(new { recipient = phone, text = message }, JsonOptions);
        req.Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        using var res = await client.SendAsync(req, ct);
        return res.IsSuccessStatusCode;
    }

    private async Task<bool> SendUltraMsgAsync(HttpClient client, string? endpoint, string instanceId, string apiKey, string phone, string message, CancellationToken ct)
    {
        var url = string.IsNullOrWhiteSpace(endpoint)
            ? $"https://api.ultramsg.com/{Uri.EscapeDataString(instanceId)}/messages/chat"
            : endpoint;
        var form = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["token"] = apiKey,
            ["to"] = WithoutPlus(phone),
            ["body"] = message
        });
        using var res = await client.PostAsync(url, form, ct);
        return res.IsSuccessStatusCode;
    }

    private async Task<bool> SendLocalGatewayAsync(HttpClient client, string phone, string message, CancellationToken ct)
    {
        var endpoint = configuration["WhatsApp:GatewayUrl"] ?? "http://localhost:3002/send";
        var json = JsonSerializer.Serialize(new { phone, message }, JsonOptions);
        using var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
        {
            Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json")
        };
        using var res = await client.SendAsync(request, ct);
        if (!res.IsSuccessStatusCode)
        {
            logger.LogWarning("البوابة المحلية للواتساب فشلت: {Status}", res.StatusCode);
            return false;
        }
        var body = await res.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(body);
        return doc.RootElement.TryGetProperty("ok", out var ok) && ok.GetBoolean();
    }

    private static string WithoutPlus(string phone) => phone.TrimStart('+');

    private static string Mask(string phone)
    {
        var digits = new string(phone?.Where(char.IsDigit).ToArray() ?? Array.Empty<char>());
        if (digits.Length <= 7) return "•••";
        return digits[..3] + "••••" + digits[^2..];
    }
}