using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;

namespace MrSiam.Application.Features.StudentEngagement;

public record GetExamReviewQuery(int StudentId, int ExamId, int AttemptId) : IRequest<ApiResponse<ExamReviewDto>>;

public class GetExamReviewQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetExamReviewQuery, ApiResponse<ExamReviewDto>>
{
    public async Task<ApiResponse<ExamReviewDto>> Handle(GetExamReviewQuery request, CancellationToken ct)
    {
        var attempt = await db.ExamAttempts
            .AsNoTracking()
            .Include(a => a.Answers)
            .Include(a => a.Exam)
                .ThenInclude(e => e!.Questions.OrderBy(q => q.Order))
                .ThenInclude(q => q.Options)
            .Include(a => a.Exam)
                .ThenInclude(e => e!.Lesson)
            .FirstOrDefaultAsync(a => a.Id == request.AttemptId
                                      && a.StudentId == request.StudentId
                                      && a.ExamId == request.ExamId, ct);

        if (attempt is null)
            return ApiResponse<ExamReviewDto>.Fail("المحاولة غير موجودة");

        var exam = attempt.Exam!;
        var review = new ExamReviewDto
        {
            AttemptId = attempt.Id,
            ExamId = exam.Id,
            ExamTitle = exam.Title,
            Score = attempt.Score,
            Percentage = attempt.Percentage,
            Passed = attempt.Passed,
            SubmittedAt = attempt.SubmittedAt,
            AllowReview = exam.AllowReview,
            ShowCorrectAnswers = exam.ShowCorrectAnswers,
            Items = []
        };

        if (!exam.AllowReview)
            return ApiResponse<ExamReviewDto>.Ok(review);

        var answersByQuestion = attempt.Answers.ToDictionary(a => a.QuestionId);

        var items = new List<ExamReviewItemDto>();
        foreach (var question in exam.Questions.OrderBy(q => q.Order))
        {
            var answer = answersByQuestion.GetValueOrDefault(question.Id);
            var selected = answer?.SelectedOptionId is not null
                ? question.Options.FirstOrDefault(o => o.Id == answer.SelectedOptionId.Value)
                : null;
            var correct = question.Options.FirstOrDefault(o => o.IsCorrect);

            items.Add(new ExamReviewItemDto
            {
                QuestionId = question.Id,
                QuestionText = question.Text,
                StudentAnswer = selected?.Text ?? "لم يُجب",
                CorrectAnswer = correct?.Text ?? string.Empty,
                Explanation = exam.Lesson != null ? $"من درس: {exam.Lesson.Title}" : string.Empty,
                LessonTitle = exam.Lesson?.Title ?? string.Empty,
                IsCorrect = answer?.IsCorrect ?? false,
                IsSkipped = answer?.IsSkipped ?? true,
                Marks = question.Marks,
                StudentAnswerText = selected?.Text,
                CorrectAnswerText = correct?.Text
            });
        }

        review = review with { Items = items };
        return ApiResponse<ExamReviewDto>.Ok(review);
    }
}
