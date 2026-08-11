using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Entities;
using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Content;

public record ExamQuestionInput(
    string Text,
    QuestionType Type,
    decimal Marks,
    List<string> Options,
    int CorrectIndex);

public record CreateExamCommand(
    int CourseId,
    int? LessonId,
    string Title,
    ExamType Type,
    int DurationMinutes,
    int AttemptsAllowed,
    bool IsPublished,
    List<ExamQuestionInput> Questions) : IRequest<ApiResponse<int>>;

public record UpdateExamCommand(
    int Id,
    string? Title,
    ExamType? Type,
    int? DurationMinutes,
    int? AttemptsAllowed,
    bool? IsPublished,
    List<ExamQuestionInput>? Questions) : IRequest<ApiResponse<bool>>;

public record DeleteExamCommand(int Id) : IRequest<ApiResponse<bool>>;

public static class ExamBuilder
{
    public static (decimal totalMarks, decimal passMark) ComputeMarks(IEnumerable<ExamQuestionInput> questions)
    {
        var total = questions.Sum(q => q.Marks);
        return (total, total / 2m);
    }

    public static List<AnswerOption> BuildOptions(ExamQuestionInput q)
    {
        if (q.Type == QuestionType.TrueFalse)
        {
            var correct = q.CorrectIndex == 1;
            return
            [
                new AnswerOption { Text = "صواب", IsCorrect = !correct, Order = 1 },
                new AnswerOption { Text = "خطأ", IsCorrect = correct, Order = 2 }
            ];
        }

        return q.Options
            .Where(o => !string.IsNullOrWhiteSpace(o))
            .Select((text, i) => new AnswerOption
            {
                Text = text.Trim(),
                IsCorrect = i == q.CorrectIndex,
                Order = i + 1
            })
            .ToList();
    }
}

public class CreateExamCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CreateExamCommand, ApiResponse<int>>
{
    public async Task<ApiResponse<int>> Handle(CreateExamCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return ApiResponse<int>.Fail("اسم الاختبار مطلوب");

        if (!await db.Courses.AnyAsync(c => c.Id == request.CourseId, ct))
            return ApiResponse<int>.Fail("الكورس غير موجود");

        if (request.Questions is null || request.Questions.Count == 0)
            return ApiResponse<int>.Fail("الاختبار لازم يكون فيه سؤال واحد على الأقل");

        var (totalMarks, passMark) = ExamBuilder.ComputeMarks(request.Questions);
        var exam = new Exam
        {
            CourseId = request.CourseId,
            LessonId = request.LessonId,
            Title = request.Title.Trim(),
            Type = request.Type,
            DurationMinutes = request.DurationMinutes > 0 ? request.DurationMinutes : 10,
            TotalMarks = totalMarks,
            PassMark = passMark,
            IsPublished = request.IsPublished,
            AttemptsAllowed = request.AttemptsAllowed > 0 ? request.AttemptsAllowed : 3
        };

        var order = 1;
        foreach (var q in request.Questions)
        {
            if (string.IsNullOrWhiteSpace(q.Text))
                continue;

            var question = new Question
            {
                Text = q.Text.Trim(),
                Type = q.Type,
                Marks = q.Marks > 0 ? q.Marks : 1,
                Order = order++
            };
            question.Options = ExamBuilder.BuildOptions(q);
            exam.Questions.Add(question);
        }

        if (exam.Questions.Count == 0)
            return ApiResponse<int>.Fail("مفيش أسئلة صالحة");

        db.Exams.Add(exam);
        await db.SaveChangesAsync(ct);
        return ApiResponse<int>.Ok(exam.Id, "تم إنشاء الاختبار");
    }
}

public class UpdateExamCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateExamCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(UpdateExamCommand request, CancellationToken ct)
    {
        var exam = await db.Exams
            .Include(e => e.Questions)
            .ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(e => e.Id == request.Id, ct);
        if (exam is null)
            return ApiResponse<bool>.Fail("الاختبار غير موجود");

        if (!string.IsNullOrWhiteSpace(request.Title))
            exam.Title = request.Title.Trim();
        if (request.Type is not null)
            exam.Type = request.Type.Value;
        if (request.DurationMinutes is not null && request.DurationMinutes > 0)
            exam.DurationMinutes = request.DurationMinutes.Value;
        if (request.AttemptsAllowed is not null && request.AttemptsAllowed > 0)
            exam.AttemptsAllowed = request.AttemptsAllowed.Value;
        if (request.IsPublished is not null)
            exam.IsPublished = request.IsPublished.Value;

        if (request.Questions is not null)
        {
            db.AnswerOptions.RemoveRange(exam.Questions.SelectMany(q => q.Options));
            db.Questions.RemoveRange(exam.Questions);
            exam.Questions.Clear();

            var (totalMarks, passMark) = ExamBuilder.ComputeMarks(request.Questions);
            exam.TotalMarks = totalMarks;
            exam.PassMark = passMark;

            var order = 1;
            foreach (var q in request.Questions)
            {
                if (string.IsNullOrWhiteSpace(q.Text))
                    continue;

                var question = new Question
                {
                    Text = q.Text.Trim(),
                    Type = q.Type,
                    Marks = q.Marks > 0 ? q.Marks : 1,
                    Order = order++
                };
                question.Options = ExamBuilder.BuildOptions(q);
                exam.Questions.Add(question);
            }

            if (exam.Questions.Count == 0)
                return ApiResponse<bool>.Fail("مفيش أسئلة صالحة");
        }

        await db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true, "تم تعديل الاختبار");
    }
}

public class DeleteExamCommandHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteExamCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(DeleteExamCommand request, CancellationToken ct)
    {
        var exam = await db.Exams.FirstOrDefaultAsync(e => e.Id == request.Id, ct);
        if (exam is null)
            return ApiResponse<bool>.Fail("الاختبار غير موجود");

        db.Exams.Remove(exam);
        await db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true, "تم حذف الاختبار");
    }
}
