using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace MrSiam.Infrastructure.Messaging;

public sealed record TunnelState(bool Reachable, bool Connected, string? Phone, string? Qr);

/// <summary>
/// مَكّن للمستضاف يبعت رسايل واتساب عبر بوابة شغّالة عنده بعيد عن الضيافة:
/// البوابة (جهاز السنتر) بتفتح اتصال WebSocket اسمه نفق — وده باتصال خادم من جهازها،
/// فلازم ولا PORT مفتوح ولا نفق عام. الرسايل والحالة والـ QR بيمروا جوه الاتصال ده.
/// </summary>
public sealed class WhatsAppTunnelHub
{
    private readonly object _lock = new();
    private readonly ILogger<WhatsAppTunnelHub> _logger;
    private readonly string? _key;
    private readonly ConcurrentDictionary<string, TaskCompletionSource<bool>> _pending = new();

    private WebSocket? _socket;
    private bool _connected;
    private string? _phone;
    private string? _qr;
    private long _nextId;

    public WhatsAppTunnelHub(IConfiguration configuration, ILogger<WhatsAppTunnelHub> logger)
    {
        _logger = logger;
        _key = configuration["WhatsApp:TunnelKey"];
        if (string.IsNullOrWhiteSpace(_key))
            _logger.LogWarning("WhatsApp:TunnelKey مش مضبوط — النفق هيقبل أي اتصال. فضل الأمان بسيط");
    }

    public TunnelState GetState()
    {
        lock (_lock)
        {
            var reachable = _socket is { State: WebSocketState.Open };
            return new TunnelState(reachable, _connected, _phone, reachable && !_connected ? _qr : null);
        }
    }

    public async Task AcceptAsync(HttpContext context, CancellationToken ct)
    {
        if (!context.WebSockets.IsWebSocketRequest)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            return;
        }

        if (_key is not null)
        {
            var provided = context.Request.Query["key"].ToString();
            if (string.IsNullOrWhiteSpace(provided))
                provided = context.Request.Headers["X-Tunnel-Key"].ToString();
            if (!string.Equals(provided, _key, StringComparison.Ordinal))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return;
            }
        }

        try
        {
            var socket = await context.WebSockets.AcceptWebSocketAsync();

            lock (_lock)
            {
                TryCloseSocket(_socket);
                _socket = socket;
                _connected = false;
                _phone = null;
                _qr = null;
            }
            _logger.LogInformation("اتصال نفق واتساب جديد وصل");

            var buffer = new byte[8192];
            try
            {
                while (socket.State == WebSocketState.Open)
                {
                    var received = new MemoryStream();
                    WebSocketReceiveResult result;
                    do
                    {
                        result = await socket.ReceiveAsync(buffer, ct);
                        if (result.MessageType == WebSocketMessageType.Close)
                            break;
                        received.Write(buffer, 0, result.Count);
                    }
                    while (!result.EndOfMessage);

                    if (result.MessageType == WebSocketMessageType.Close)
                        break;

                    HandleMessage(Encoding.UTF8.GetString(received.ToArray()));
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException and not WebSocketException)
            {
                _logger.LogWarning(ex, "غلط جوه اتصال النفق");
            }
            finally
            {
                lock (_lock)
                {
                    if (ReferenceEquals(_socket, socket))
                    {
                        _socket = null;
                        _connected = false;
                        _phone = null;
                        _qr = null;
                    }
                }
                _logger.LogInformation("اتصال النفق اتقفل — البوابة الحين هتحاول توصل من تاني");
                TryCloseSocket(socket);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "فشل قبول اتصال النفق");
        }
    }

    public async Task<bool> SendAsync(string phone, string message, CancellationToken ct = default)
    {
        var id = Interlocked.Increment(ref _nextId).ToString();
        var payload = JsonSerializer.Serialize(new { type = "send", id, phone, message });
        return await SendPayloadAsync(id, payload, ct);
    }

    public async Task<bool> SendDocumentAsync(string phone, string caption, byte[] content, string fileName, string contentType, CancellationToken ct = default)
    {
        var id = Interlocked.Increment(ref _nextId).ToString();
        var payload = JsonSerializer.Serialize(new
        {
            type = "send_doc",
            id,
            phone,
            caption,
            fileName,
            contentType,
            base64 = Convert.ToBase64String(content)
        });
        return await SendPayloadAsync(id, payload, ct);
    }

    public async Task<bool> LogoutAsync(CancellationToken ct = default)
    {
        var id = Interlocked.Increment(ref _nextId).ToString();
        var payload = JsonSerializer.Serialize(new { type = "logout", id });
        return await SendPayloadAsync(id, payload, ct);
    }

    private async Task<bool> SendPayloadAsync(string id, string payload, CancellationToken ct)
    {
        WebSocket? socket;
        lock (_lock) socket = _socket;

        if (socket is null || socket.State != WebSocketState.Open)
        {
            _logger.LogWarning("مفيش اتصال نفق واتساب — الرسالة متبعتتش");
            return false;
        }

        var tcs = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        _pending[id] = tcs;

        try
        {
            await socket.SendAsync(Encoding.UTF8.GetBytes(payload), WebSocketMessageType.Text, true, ct);
            var timer = Task.Delay(TimeSpan.FromSeconds(25), ct);
            await Task.WhenAny(tcs.Task, timer);
            return tcs.Task.IsCompletedSuccessfully && tcs.Task.Result;
        }
        catch
        {
            return false;
        }
        finally
        {
            _pending.TryRemove(id, out _);
        }
    }

    private void HandleMessage(string text)
    {
        using var doc = JsonDocument.Parse(text);
        var root = doc.RootElement;
        if (!root.TryGetProperty("type", out var type)) return;

        switch (type.GetString())
        {
            case "update":
                lock (_lock)
                {
                    _connected = root.TryGetProperty("connected", out var c) && c.GetBoolean();
                    _phone = root.TryGetProperty("phone", out var p) && p.ValueKind == JsonValueKind.String
                        ? p.GetString()
                        : null;
                    if (_connected) _qr = null;
                }
                break;

            case "qr":
                lock (_lock)
                {
                    var qr = root.TryGetProperty("qr", out var q) && q.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(q.GetString())
                        ? q.GetString()
                        : null;
                    if (!_connected) _qr = qr;
                }
                break;

            case "sent":
                ResolveAck(root, "ok");
                break;

            case "logged_out":
                ResolveAck(root, "ok");
                break;
        }
    }

    private void ResolveAck(JsonElement root, string okProperty)
    {
        if (root.TryGetProperty("id", out var id) && id.ValueKind == JsonValueKind.String)
        {
            var ok = root.TryGetProperty(okProperty, out var o) && o.GetBoolean();
            if (_pending.TryRemove(id.GetString(), out var tcs))
                tcs.TrySetResult(ok);
        }
    }

    private static void TryCloseSocket(WebSocket? socket)
    {
        if (socket is null) return;
        try
        {
            if (socket.State is WebSocketState.Open or WebSocketState.CloseReceived)
                socket.Abort();
            socket.Dispose();
        }
        catch
        {
            // تجاهل — بنقفل socket مهجور
        }
    }
}