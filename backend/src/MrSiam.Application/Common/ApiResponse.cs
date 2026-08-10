namespace MrSiam.Application.Common;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public T? Data { get; set; }
    public IReadOnlyList<string>? Errors { get; set; }

    public static ApiResponse<T> Ok(T data, string? message = null) => new()
    {
        Success = true,
        Data = data,
        Message = message
    };

    public static ApiResponse<T> Fail(string message, IReadOnlyList<string>? errors = null) => new()
    {
        Success = false,
        Message = message,
        Errors = errors
    };
}

public static class ApiResponse
{
    public static ApiResponse<object> Ok(object data, string? message = null) => ApiResponse<object>.Ok(data, message);
}
