using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;

namespace MrSiam.Application.Features.Students;

public class GetAllStudentsCredentialsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetAllStudentsCredentialsQuery, ApiResponse<IReadOnlyList<StudentCredentialsDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<StudentCredentialsDto>>> Handle(
        GetAllStudentsCredentialsQuery request,
        CancellationToken ct)
    {
        var items = await db.Students
            .AsNoTracking()
            .Include(s => s.User)
            .OrderBy(s => s.StudentCode)
            .ToListAsync(ct);

        var result = items
            .Where(s => !string.IsNullOrWhiteSpace(s.User?.StoredPassword))
            .Select(s => new StudentCredentialsDto(s.User!.Username, s.User!.StoredPassword!))
            .ToList();

        return ApiResponse<IReadOnlyList<StudentCredentialsDto>>.Ok(result);
    }
}