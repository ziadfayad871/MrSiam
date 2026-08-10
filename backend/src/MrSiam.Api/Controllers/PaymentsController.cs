using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MrSiam.Application.Features.Payments;
using MrSiam.Domain.Enums;

namespace MrSiam.Api.Controllers;

[ApiController]
[Route("api/payments")]
[Authorize(Roles = nameof(Role.Secretary) + "," + nameof(Role.Admin))]
public class PaymentsController(MediatR.IMediator mediator) : ControllerBase
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

    [HttpPatch("{paymentId:int}/paid")]
    public async Task<IActionResult> MarkPaid(int paymentId, [FromQuery] string? method)
    {
        var result = await mediator.Send(new MarkPaymentPaidCommand(paymentId, method));
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
