using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;

namespace MrSiam.Application.Features.Exams;

public record GetExamDetailQuery(int ExamId) : IRequest<ApiResponse<ExamDetailDto>>;

public class GetExamDetailQueryHandler(IApplicationDbContext db) : IRequestHandler<GetExamDetailQuery, ApiResponse<ExamDetailDto>>
{
    public async Task<ApiResponse<ExamDetailDto>> Handle(GetExamDetailQuery request, CancellationToken ct)
    {
        var exam = await db.Exams
            .AsNoTracking()
            .Include(e => e.Questions.OrderBy(q => q.Order))
                .ThenInclude(q => q.Options.OrderBy(o => o.Order))
            .FirstOrDefaultAsync(e => e.Id == request.ExamId && e.IsPublished, ct);

        if (exam is null)
            return ApiResponse<ExamDetailDto>.Fail("الامتحان غير موجود");

        return ApiResponse<ExamDetailDto>.Ok(new ExamDetailDto
        {
            Id = exam.Id,
            CourseId = exam.CourseId,
            Title = exam.Title,
            Type = exam.Type,
            DurationMinutes = exam.DurationMinutes,
            TotalMarks = exam.TotalMarks,
            Questions = exam.Questions.Select(q => new QuestionDto
            {
                Id = q.Id,
                Text = q.Text,
                Type = q.Type,
                Marks = q.Marks,
                Options = q.Options.Select(o => new OptionDto { Id = o.Id, Text = o.Text }).ToList()
            }).ToList()
        });
    }
}
