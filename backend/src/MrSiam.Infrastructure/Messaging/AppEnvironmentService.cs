using Microsoft.Extensions.Configuration;
using MrSiam.Application.Abstractions;

namespace MrSiam.Infrastructure.Messaging;

public class AppEnvironmentService(IConfiguration configuration) : IAppEnvironment
{
    public string BaseUrl => (configuration["App:BaseUrl"] ?? "http://localhost:5173").TrimEnd('/');
}