namespace MrSiam.Application.Abstractions;

public interface IAppEnvironment
{
    string BaseUrl { get; }
    string ReceiptsDirectory { get; }
}