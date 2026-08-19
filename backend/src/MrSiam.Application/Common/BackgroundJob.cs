using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MrSiam.Application.Abstractions;

namespace MrSiam.Application.Common;

/// <summary>
/// يشغّل مهمة إشعارات في scope مستقل بعد انتهاء الطلب،
/// عشان رسايل واتساب والإشعارات متتأثرش بإغلاق قاعدة بيانات الطلب.
/// </summary>
internal static class BackgroundJob
{
public static void Run(
    IServiceScopeFactory scopeFactory,
    Func<IApplicationDbContext, IWhatsAppService, ILogger, CancellationToken, Task> work)
{
    _ = Task.Run(async () =>
    {
        ILogger? logger = null;
        try
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var sp = scope.ServiceProvider;
            logger = sp.GetService<ILoggerFactory>()?.CreateLogger("MrSiam.Background");
            var db = sp.GetRequiredService<IApplicationDbContext>();
            var whatsApp = sp.GetRequiredService<IWhatsAppService>();
            await work(db, whatsApp, logger, CancellationToken.None);
        }
        catch (Exception ex)
        {
            logger?.LogError(ex, "فشلت مهمة إشعارات خلفية");
        }
    });
}
}