using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;

namespace MrSiam.Application.Features.StudentEngagement;

public record GetMistakesQuery(int StudentId, int? CourseId) : IRequest<ApiResponse<IReadOnlyList<MistakeDto>>>;

public record DeleteMistakeCommand(int Id, int StudentId) : IRequest<ApiResponse<bool>>;

public class GetMistakesQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetMistakesQuery, ApiResponse<IReadOnlyList<MistakeDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<MistakeDto>>> Handle(GetMistakesQuery request, CancellationToken ct)
    {
        var query = db.MistakeNotebook.AsNoTracking().Where(m => m.StudentId == request.StudentId);
        if (request.CourseId is not null)
            query = query.Where(m => m.Exam != null && m.Exam.CourseId == request.CourseId);

        var mistakes = await query
            .OrderByDescending(m => m.LastWrongAt)
            .Select(m => new MistakeDto
            {
                Id = m.Id,
                QuestionId = m.QuestionId,
                ExamId = m.ExamId,
                QuestionText = m.QuestionText,
                StudentAnswer = m.StudentAnswer,
                CorrectAnswer = m.CorrectAnswer,
                Explanation = m.Explanation,
                LessonTitle = m.LessonTitle,
                Topic = m.Topic,
                WrongCount = m.WrongCount,
                LastWrongAt = m.LastWrongAt
            })
            .ToListAsync(ct);

        return ApiResponse<IReadOnlyList<MistakeDto>>.Ok(mistakes);
    }
}

public class DeleteMistakeCommandHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteMistakeCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(DeleteMistakeCommand request, CancellationToken ct)
    {
        var mistake = await db.MistakeNotebook.FirstOrDefaultAsync(
            m => m.Id == request.Id && m.StudentId == request.StudentId, ct);
        if (mistake is null)
            return ApiResponse<bool>.Fail("الغلطة غير موجودة");

        db.MistakeNotebook.Remove(mistake);
        await db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true, "اتحذفت من الكراسة");
    }
}
