using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MrSiam.Application.Features.Payments;
using MrSiam.Domain.Enums;

namespace MrSiam.Api.Controllers;

[ApiController]
[Route("api/payments")]
[Authorize(Roles = nameof(Role.Secretary) + "," + nameof(Role.Admin))]
public class PaymentsController(
    MediatR.IMediator mediator,
    Microsoft.Extensions.Configuration.IConfiguration configuration) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? month, [FromQuery] PaymentStatus? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await mediator.Send(new ListPaymentsQuery(month, status, page, pageSize));
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePaymentCommand command)
    {
        var result = await mediator.Send(command);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("collect")]
    public async Task<IActionResult> Collect([FromBody] CreatePaidPaymentCommand command)
    {
        var result = await mediator.Send(command);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPatch("{paymentId:int}/paid")]
    public async Task<IActionResult> MarkPaid(int paymentId, [FromQuery] string? method)
    {
        var result = await mediator.Send(new MarkPaymentPaidCommand(paymentId, method));
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("{paymentId:int}/receipt")]
    public async Task<IActionResult> Receipt(int paymentId)
    {
        var receiptsDir = configuration["Storage:ReceiptsDirectory"]
                          ?? Path.Combine(Directory.GetCurrentDirectory(), "app_data", "receipts");
        var filePath = Path.Combine(receiptsDir, $"{paymentId}.pdf");
        if (!System.IO.File.Exists(filePath))
            return NotFound(new { success = false, message = "الإيصال غير متاح" });

        var bytes = await System.IO.File.ReadAllBytesAsync(filePath);
        return File(bytes, "application/pdf", $"receipt-{paymentId}.pdf");
    }
}
