using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace MrSiam.Infrastructure.Messaging;

/// <summary>
/// بيفضل الضيافة مشغّلة بوابة الواتساب (لو مستضافة على IIS) عن طريق شوية اتصالات دورية
/// للنقطة /status — ممنوع اللوغات تشتهر من النفوس: بنضرسي بس، أي غلطة تُتجاهل.
/// </summary>
public sealed class WhatsAppKeepAliveService(
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration,
    ILogger<WhatsAppKeepAliveService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("بدأ بنبض حماية بوابة الواتساب (keep-alive)");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var baseUrl = configuration["WhatsApp:GatewayBaseUrl"];
                if (!string.IsNullOrWhiteSpace(baseUrl))
                {
                    using var client = httpClientFactory.CreateClient("whatsapp");
                    using var res = await client.GetAsync(baseUrl.TrimEnd('/') + "/status", stoppingToken);
                    if (!res.IsSuccessStatusCode)
                        logger.LogWarning("keep-alive للواتساب رجع {Status}", (int)res.StatusCode);
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "keep-alive للواتساب ما نجحش — نتجاهل");
            }

            try
            {
                await Task.Delay(TimeSpan.FromSeconds(90), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
}