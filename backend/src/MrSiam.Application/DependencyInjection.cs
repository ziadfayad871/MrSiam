using System.Reflection;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using MrSiam.Application.Features.Achievements;

namespace MrSiam.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly()));
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());
        services.AddScoped<IAchievementService, AchievementService>();
        return services;
    }
}
