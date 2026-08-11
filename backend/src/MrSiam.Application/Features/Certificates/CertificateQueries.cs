using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;

namespace MrSiam.Application.Features.Certificates;

public record CertificateDto
{
    public int Id { get; init; }
    public required string StudentName { get; init; }
    public required string ExamTitle { get; init; }
    public required string CourseTitle { get; init; }
    public required string Grade { get; init; }
    public decimal Percentage { get; init; }
    public required string Code { get; init; }
    public DateTime IssuedAt { get; init; }
}

public record GetMyCertificatesQuery(int StudentId) : IRequest<ApiResponse<List<CertificateDto>>>;

public record GetCertificateQuery(int StudentId, int CertificateId) : IRequest<ApiResponse<CertificateDto>>;

public class GetMyCertificatesQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetMyCertificatesQuery, ApiResponse<List<CertificateDto>>>
{
    public async Task<ApiResponse<List<CertificateDto>>> Handle(GetMyCertificatesQuery request, CancellationToken ct)
    {
        var items = await db.Certificates
            .AsNoTracking()
            .Where(c => c.StudentId == request.StudentId)
            .OrderByDescending(c => c.IssuedAt)
            .Select(c => new CertificateDto
            {
                Id = c.Id,
                StudentName = c.Student!.FullName,
                ExamTitle = c.Exam!.Title,
                CourseTitle = c.Course!.Title,
                Grade = c.Grade,
                Percentage = c.Percentage,
                Code = c.Code,
                IssuedAt = c.IssuedAt
            })
            .ToListAsync(ct);

        return ApiResponse<List<CertificateDto>>.Ok(items);
    }
}

public class GetCertificateQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetCertificateQuery, ApiResponse<CertificateDto>>
{
    public async Task<ApiResponse<CertificateDto>> Handle(GetCertificateQuery request, CancellationToken ct)
    {
        var cert = await db.Certificates
            .AsNoTracking()
            .Where(c => c.Id == request.CertificateId && c.StudentId == request.StudentId)
            .Select(c => new CertificateDto
            {
                Id = c.Id,
                StudentName = c.Student!.FullName,
                ExamTitle = c.Exam!.Title,
                CourseTitle = c.Course!.Title,
                Grade = c.Grade,
                Percentage = c.Percentage,
                Code = c.Code,
                IssuedAt = c.IssuedAt
            })
            .FirstOrDefaultAsync(ct);

        return cert is null
            ? ApiResponse<CertificateDto>.Fail("الشهادة مش موجودة")
            : ApiResponse<CertificateDto>.Ok(cert);
    }
}
