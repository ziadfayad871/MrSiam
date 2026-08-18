using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MrSiam.Application.Common;
using MrSiam.Domain.Enums;
using MrSiam.Infrastructure.Messaging;

namespace MrSiam.Api.Controllers;

[ApiController]
[Route("api/whatsapp")]
[Authorize(Roles = nameof(Role.Secretary) + "," + nameof(Role.Admin))]
public class WhatsAppController(WhatsAppTunnelHub tunnel) : ControllerBase
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
}