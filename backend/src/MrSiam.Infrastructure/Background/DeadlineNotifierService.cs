using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Features.Content;

namespace MrSiam.Infrastructure.Background;

/// <summary>
/// فحص دوري كل 15 دقيقة: لما ديدلاين واجب أو امتحان يخلص والطالب ميسلمش/ميدخلش،
/// بيبعت رسالة لولي الأمر وإشعار داخل المنصة (مرة واحدة لكل واجب/امتحان).
/// </summary>
public sealed class DeadlineNotifierService(
    IServiceScopeFactory scopeFactory,
    ILogger<DeadlineNotifierService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(15);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("بدأ الفحص الدوري للمواعيد النهائية (كل {Minutes} دقيقة)", Interval.TotalMinutes);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
                var whatsApp = scope.ServiceProvider.GetRequiredService<IWhatsAppService>();
                await DeadlineNotifier.RunAsync(db, whatsApp, stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "فشل الفحص الدوري للمواعيد النهائية");
            }

            try
            {
                await Task.Delay(Interval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
}