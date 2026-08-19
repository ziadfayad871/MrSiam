using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Enums;
using MrSiam.Infrastructure.Messaging;

namespace MrSiam.Api.Controllers;

[ApiController]
[Route("api/whatsapp")]
[Authorize(Roles = nameof(Role.Secretary) + "," + nameof(Role.Admin))]
public class WhatsAppController(WhatsAppTunnelHub tunnel, IWhatsAppService whatsApp) : ControllerBase
{
    [HttpGet("status")]
    public IActionResult Status()
    {
        var s = tunnel.GetState();
        return Ok(ApiResponse<object>.Ok(new { reachable = s.Reachable, connected = s.Connected, phone = s.Connected ? s.Phone : null }));
    }

    [HttpGet("qr")]
    public IActionResult Qr()
    {
        var s = tunnel.GetState();
        return Ok(ApiResponse<object>.Ok(new { reachable = s.Reachable, qr = s.Connected ? null : s.Qr }));
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        var ok = await tunnel.LogoutAsync(ct);
        return ok
            ? Ok(ApiResponse<bool>.Ok(true, "تم تسجيل خروج الواتساب — امسح الـ QR الجديد لربط رقم آخر"))
            : BadRequest(ApiResponse<bool>.Fail("البوابة مش متصلة — شغّلها على جهاز السنتر ثم أعد المحاولة"));
    }

    [HttpPost("test-send")]
    public async Task<IActionResult> TestSend([FromBody] TestSendRequest request, CancellationToken ct)
    {
        var phone = request.Phone?.Trim();
        if (string.IsNullOrWhiteSpace(phone))
            return BadRequest(ApiResponse<bool>.Fail("اكتب رقم الموبايل اللي عايز تجرب عليه"));

        var message =
            "✅ رسالة تجريبية من منصة مستر محمد صيام\n" +
            "لو وصلتك الرسالة دي يبقى ربط الواتساب شغال تمام.";

        var ok = await whatsApp.SendAsync(phone, message, ct);
        return ok
            ? Ok(ApiResponse<bool>.Ok(true, "تم إرسال الرسالة التجريبية"))
            : BadRequest(ApiResponse<bool>.Fail("الرسالة التجريبية متبعتتش — شوف اللوج على الاستضافة (مفيش اتصال نفق / غير مفعّل / فشل)"));
    }
}

public record TestSendRequest(string? Phone);