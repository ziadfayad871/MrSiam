using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MrSiam.Application.Abstractions;
using MrSiam.Infrastructure.Background;
using MrSiam.Infrastructure.Messaging;
using MrSiam.Infrastructure.Pdf;
using MrSiam.Infrastructure.Persistence;
using MrSiam.Infrastructure.Security;

namespace MrSiam.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default")
                               ?? "Data Source=mrsiam.db";

        var useSqlServer = connectionString.StartsWith("Server=", StringComparison.OrdinalIgnoreCase)
                           || connectionString.Contains("databaseasp", StringComparison.OrdinalIgnoreCase);

        services.AddDbContext<AppDbContext>(options =>
        {
            if (useSqlServer)
                options.UseSqlServer(connectionString);
            else
                options.UseSqlite(connectionString);

            options.ConfigureWarnings(w =>
                w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
        });

        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<AppDbContext>());
        services.AddScoped<IPasswordHasher, PasswordHasherService>();

        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.AddSingleton<IJwtTokenService, JwtTokenService>();

        services.AddHttpClient("whatsapp", client =>
        {
            client.Timeout = TimeSpan.FromSeconds(15);
        });
        services.AddScoped<IWhatsAppService, WhatsAppService>();
        services.AddSingleton<WhatsAppTunnelHub>();
        services.AddHostedService<WhatsAppKeepAliveService>();
        services.AddHostedService<DeadlineNotifierService>();
        services.AddScoped<IAppEnvironment, AppEnvironmentService>();
        services.AddScoped<IReceiptPdfBuilder, ReceiptPdfBuilder>();

        return services;
    }
}
