using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Features.Subscriptions;
using MrSiam.Domain.Enums;

namespace MrSiam.Api.Controllers;

[ApiController]
[Route("api/subscriptions")]
[Authorize]
public class SubscriptionsController(MediatR.IMediator mediator, IApplicationDbContext db, ICurrentUserService currentUser)
    : BaseApiController(mediator, currentUser)
{
    [HttpGet("plans")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPlans([FromQuery] bool includeInactive = false)
    {
        var result = await mediator.Send(new ListSubscriptionPlansQuery(includeInactive));
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("mine")]
    public async Task<IActionResult> GetMine()
    {
        var studentId = await ResolveStudentIdAsync(null, db, HttpContext.RequestAborted);
        var result = await mediator.Send(new GetMySubscriptionQuery(studentId));
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet]
    [Authorize(Roles = nameof(Role.Secretary) + "," + nameof(Role.Admin))]
    public async Task<IActionResult> GetAll()
    {
        var result = await mediator.Send(new ListSubscriptionsQuery());
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("coupons")]
    [Authorize(Roles = nameof(Role.Secretary) + "," + nameof(Role.Admin))]
    public async Task<IActionResult> GetCoupons()
    {
        var result = await mediator.Send(new ListCouponsQuery());
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("plans")]
    [Authorize(Roles = nameof(Role.Secretary) + "," + nameof(Role.Admin))]
    public async Task<IActionResult> CreatePlan([FromBody] CreateSubscriptionPlanCommand command)
    {
        var result = await mediator.Send(command);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("coupons")]
    [Authorize(Roles = nameof(Role.Secretary) + "," + nameof(Role.Admin))]
    public async Task<IActionResult> CreateCoupon([FromBody] CreateCouponCommand command)
    {
        var result = await mediator.Send(command);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("activate")]
    [Authorize(Roles = nameof(Role.Secretary) + "," + nameof(Role.Admin))]
    public async Task<IActionResult> Activate([FromBody] ActivateSubscriptionCommand command)
    {
        var result = await mediator.Send(command);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
