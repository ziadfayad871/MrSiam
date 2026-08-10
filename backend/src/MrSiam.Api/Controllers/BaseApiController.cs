using MediatR;
using Microsoft.AspNetCore.Mvc;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Enums;

namespace MrSiam.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    protected readonly IMediator Mediator;
    protected readonly ICurrentUserService CurrentUser;

    protected BaseApiController(IMediator mediator, ICurrentUserService currentUser)
    {
        Mediator = mediator;
        CurrentUser = currentUser;
    }

    protected IActionResult Ok<T>(ApiResponse<T> result) =>
        result.Success ? base.Ok(result) : BadRequest(result);

    protected async Task<int> ResolveStudentIdAsync(int? requestedStudentId, IApplicationDbContext db, CancellationToken ct)
    {
        if (CurrentUser.Role == Role.Student)
        {
            var student = await db.Students.FirstOrDefaultAsync(s => s.UserId == CurrentUser.UserId);
            return student?.Id ?? throw new BadHttpRequestException("حساب الطالب غير مكتمل");
        }

        if (requestedStudentId is null)
            throw new BadHttpRequestException("معرف الطالب مطلوب");

        return requestedStudentId.Value;
    }
}

public static class DbSetQueryableExtensions
{
    public static Task<T?> FirstOrDefaultAsync<T>(this Microsoft.EntityFrameworkCore.DbSet<T> set, System.Linq.Expressions.Expression<Func<T, bool>> predicate, CancellationToken ct = default)
        where T : class
        => Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(set, predicate, ct);
}
