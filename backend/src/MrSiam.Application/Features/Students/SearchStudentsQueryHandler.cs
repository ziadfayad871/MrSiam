using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Students;

public class SearchStudentsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<SearchStudentsQuery, ApiResponse<PagedResult<StudentListItemDto>>>
{
    public async Task<ApiResponse<PagedResult<StudentListItemDto>>> Handle(SearchStudentsQuery request, CancellationToken ct)
    {
        var query = db.Students.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(s => s.FullName.Contains(search)
                                     || s.StudentCode.Contains(search)
                                     || s.GuardianPhone.Contains(search));
        }

        if (request.Stage is not null)
            query = query.Where(s => s.Stage == request.Stage);

        var attempts = await db.ExamAttempts
            .AsNoTracking()
            .GroupBy(a => a.StudentId)
            .Select(g => new { StudentId = g.Key, Avg = g.Average(a => a.Percentage), Count = g.Count() })
            .ToListAsync(ct);

        var projected = query
            .OrderBy(s => s.FullName)
            .Select(s => new StudentListItemDto
            {
                Id = s.Id,
                FullName = s.FullName,
                StudentCode = s.StudentCode,
                Stage = s.Stage,
                StageAr = s.Stage.ToArabic(),
                GuardianPhone = s.GuardianPhone,
                AcademicYear = s.AcademicYear,
                JoinedAt = s.JoinedAt,
                IsActive = s.IsActive
            });

        var paged = PagedResult<StudentListItemDto>.From(projected, request.Page, request.PageSize);

        foreach (var item in paged.Items)
        {
            var a = attempts.FirstOrDefault(x => x.StudentId == item.Id);
            item.Average = a is null ? 0 : Math.Round(a.Avg, 1);
            item.ExamsTaken = a?.Count ?? 0;
        }

        return ApiResponse<PagedResult<StudentListItemDto>>.Ok(paged);
    }
}
