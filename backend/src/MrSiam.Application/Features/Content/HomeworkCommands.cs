using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Application.Features.StudentEngagement;
using MrSiam.Domain.Entities;
using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Content;

public record AssignmentAnswerInput(int Order, int? SelectedIndex);

public record AssignmentQuestionDto
{
    public int Order { get; init; }
    public int CorrectIndex { get; init; }
    public string Label { get; init; } = string.Empty;
    public IReadOnlyList<string> Options { get; init; } = Array.Empty<string>();
}

public record AssignmentSubmissionAnswerDto
{
    public int Order { get; init; }
    public int? SelectedIndex { get; init; }
    public int CorrectIndex { get; init; }
    public bool IsCorrect { get; init; }
    public bool IsSkipped { get; init; }
    public string CorrectLetter { get; init; } = string.Empty;
    public string? SelectedLetter { get; init; }
}

public record AssignmentSubmissionResultDto
{
    public int SubmissionId { get; init; }
    public int Score { get; init; }
    public int TotalQuestions { get; init; }
    public decimal Percentage { get; init; }
    public bool Passed { get; init; }
    public IReadOnlyList<AssignmentSubmissionAnswerDto> Answers { get; init; } = Array.Empty<AssignmentSubmissionAnswerDto>();
}

public record AssignmentDetailDto
{
    public int Id { get; init; }
    public int CourseId { get; init; }
    public int? LessonId { get; init; }
    public required string Title { get; init; }
    public required string Description { get; init; }
    public DateTime? DueDate { get; init; }
    public int QuestionCount { get; init; }
    public int ChoicesPerQuestion { get; init; }
    public IReadOnlyList<AssignmentQuestionDto> Questions { get; set; } = Array.Empty<AssignmentQuestionDto>();
    public bool Submitted { get; set; }
    public AssignmentSubmissionResultDto? MySubmission { get; set; }
}

public record AssignmentSubmissionListItemDto
{
    public int StudentId { get; init; }
    public required string StudentName { get; init; }
    public required string StudentCode { get; init; }
    public DateTime SubmittedAt { get; init; }
    public int Score { get; init; }
    public int TotalQuestions { get; init; }
    public decimal Percentage { get; init; }
    public bool Passed { get; init; }
}

public record GetAssignmentDetailQuery(int AssignmentId) : IRequest<ApiResponse<AssignmentDetailDto>>;

public record SubmitAssignmentCommand(int AssignmentId, IReadOnlyList<AssignmentAnswerInput> Answers) : IRequest<ApiResponse<AssignmentSubmissionResultDto>>;

public record GetAssignmentSubmissionsQuery(int AssignmentId) : IRequest<ApiResponse<IReadOnlyList<AssignmentSubmissionListItemDto>>>;

public class GetAssignmentDetailQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetAssignmentDetailQuery, ApiResponse<AssignmentDetailDto>>
{
    public async Task<ApiResponse<AssignmentDetailDto>> Handle(GetAssignmentDetailQuery request, CancellationToken ct)
    {
        var assignment = await db.Assignments
            .AsNoTracking()
            .Where(a => a.Id == request.AssignmentId)
            .Select(a => new AssignmentDetailDto
            {
                Id = a.Id,
                CourseId = a.CourseId,
                LessonId = a.LessonId,
                Title = a.Title,
                Description = a.Description,
                DueDate = a.DueDate,
                QuestionCount = a.QuestionCount ?? 0,
                ChoicesPerQuestion = a.ChoicesPerQuestion ?? 0
            })
            .FirstOrDefaultAsync(ct);

        if (assignment is null)
            return ApiResponse<AssignmentDetailDto>.Fail("الواجب غير موجود");

        if (assignment.QuestionCount <= 0)
            return ApiResponse<AssignmentDetailDto>.Fail("الواجب ده من غير أسئلة");

        var questions = await db.AssignmentQuestions
            .AsNoTracking()
            .Where(q => q.AssignmentId == request.AssignmentId)
            .OrderBy(q => q.Order)
            .Select(q => new { q.Order, q.CorrectIndex })
            .ToListAsync(ct);

        if (questions.Count == 0)
            return ApiResponse<AssignmentDetailDto>.Fail("الواجب ده من غير أسئلة");

        var isStudent = currentUser.Role == Role.Student;
        int? studentId = null;
        AssignmentSubmission? mySubmission = null;

        if (isStudent && currentUser.UserId is int userId)
        {
            studentId = await db.Students
                .Where(s => s.UserId == userId)
                .Select(s => (int?)s.Id)
                .FirstOrDefaultAsync(ct);

            if (studentId is int sid)
                mySubmission = await db.AssignmentSubmissions
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s => s.AssignmentId == request.AssignmentId && s.StudentId == sid, ct);
        }

        var questionsDto = questions.Select(q =>
        {
            // الطالب ما يشوفش الإجابة الصحيحة قبل التسليم
            var showCorrect = !isStudent || mySubmission is not null;
            return new AssignmentQuestionDto
            {
                Order = q.Order,
                CorrectIndex = showCorrect ? q.CorrectIndex : -1,
                Label = $"السؤال {ArabicOrdinalHelper.ArabicOrdinal(q.Order)}",
                Options = HomeworkFormat.BuildOptions(assignment.ChoicesPerQuestion)
            };
        }).ToList();

        AssignmentSubmissionResultDto? result = null;
        if (mySubmission is not null)
        {
            var answers = ParseAnswers(mySubmission.AnswersJson);
            var answerByOrder = answers.ToDictionary(a => a.Order, a => a.SelectedIndex);
            var correctByOrder = questions.ToDictionary(q => q.Order, q => q.CorrectIndex);

            result = new AssignmentSubmissionResultDto
            {
                SubmissionId = mySubmission.Id,
                Score = mySubmission.Score,
                TotalQuestions = mySubmission.TotalQuestions,
                Percentage = mySubmission.TotalQuestions > 0
                    ? Math.Round(mySubmission.Score * 100m / mySubmission.TotalQuestions, 1)
                    : 0,
                Passed = mySubmission.TotalQuestions > 0 &&
                         mySubmission.Score * 100m / mySubmission.TotalQuestions >= 50,
                Answers = questions.OrderBy(q => q.Order).Select(q =>
                {
                    var selected = answerByOrder.GetValueOrDefault(q.Order);
                    return new AssignmentSubmissionAnswerDto
                    {
                        Order = q.Order,
                        SelectedIndex = selected,
                        CorrectIndex = q.CorrectIndex,
                        IsCorrect = selected == q.CorrectIndex,
                        IsSkipped = selected is null,
                        CorrectLetter = HomeworkFormat.Letter(q.CorrectIndex),
                        SelectedLetter = selected is null ? null : HomeworkFormat.Letter(selected.Value)
                    };
                }).ToList()
            };
        }

        assignment.Questions = questionsDto;
        assignment.Submitted = mySubmission is not null;
        assignment.MySubmission = result;

        return ApiResponse<AssignmentDetailDto>.Ok(assignment);
    }

    private static List<AssignmentAnswerInput> ParseAnswers(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<List<AssignmentAnswerInput>>(json) ?? [];
        }
        catch
        {
            return [];
        }
    }
}

public class SubmitAssignmentCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser,
    IWhatsAppService whatsApp,
    IAppEnvironment env)
    : IRequestHandler<SubmitAssignmentCommand, ApiResponse<AssignmentSubmissionResultDto>>
{
    public async Task<ApiResponse<AssignmentSubmissionResultDto>> Handle(SubmitAssignmentCommand request, CancellationToken ct)
    {
        if (currentUser.Role != Role.Student || currentUser.UserId is not int userId)
            return ApiResponse<AssignmentSubmissionResultDto>.Fail("الطالب فقط هو اللي يقدر يسلم الواجب");

        var student = await db.Students
            .Where(s => s.UserId == userId)
            .Select(s => new { s.Id, s.FullName, s.GuardianPhone, s.UserId })
            .FirstOrDefaultAsync(ct);

        if (student is null)
            return ApiResponse<AssignmentSubmissionResultDto>.Fail("سجل الطالب غير موجود");

        var assignment = await db.Assignments
            .AsNoTracking()
            .Where(a => a.Id == request.AssignmentId)
            .Select(a => new { a.Id, a.Title, a.QuestionCount, a.ChoicesPerQuestion })
            .FirstOrDefaultAsync(ct);

        if (assignment is null)
            return ApiResponse<AssignmentSubmissionResultDto>.Fail("الواجب غير موجود");

        if (assignment.QuestionCount is not > 0 || assignment.ChoicesPerQuestion is not > 0)
            return ApiResponse<AssignmentSubmissionResultDto>.Fail("الواجب ده من غير أسئلة");

        if (await db.AssignmentSubmissions.AnyAsync(s => s.AssignmentId == request.AssignmentId && s.StudentId == student.Id, ct))
            return ApiResponse<AssignmentSubmissionResultDto>.Fail("سلمت الواجب ده قبل كده");

        var questions = await db.AssignmentQuestions
            .AsNoTracking()
            .Where(q => q.AssignmentId == request.AssignmentId)
            .OrderBy(q => q.Order)
            .Select(q => new { q.Order, q.CorrectIndex })
            .ToListAsync(ct);

        if (questions.Count != assignment.QuestionCount)
            return ApiResponse<AssignmentSubmissionResultDto>.Fail("الواجب فيه مشكلة في الأسئلة — كلم الأستاذ");

        var choices = assignment.ChoicesPerQuestion.Value;
        var answersByOrder = request.Answers.ToDictionary(a => a.Order, a => a.SelectedIndex);
        var valid = answersByOrder.Count == questions.Count &&
                    questions.All(q =>
                    {
                        var sel = answersByOrder.GetValueOrDefault(q.Order);
                        return sel is null || (sel >= 0 && sel < choices);
                    });
        if (!valid)
            return ApiResponse<AssignmentSubmissionResultDto>.Fail("أجبت عدد أسئلة غير مطابق");

        var score = questions.Count(q => answersByOrder.GetValueOrDefault(q.Order) == q.CorrectIndex);
        var total = questions.Count;
        var percentage = Math.Round(score * 100m / total, 1);
        var passed = percentage >= 50;

        var submission = new AssignmentSubmission
        {
            AssignmentId = request.AssignmentId,
            StudentId = student.Id,
            SubmittedAt = DateTime.UtcNow,
            Score = score,
            TotalQuestions = total,
            AnswersJson = JsonSerializer.Serialize(request.Answers
                .OrderBy(a => a.Order)
                .Select(a => new { a.Order, a.SelectedIndex }))
        };

        db.AssignmentSubmissions.Add(submission);
        await db.SaveChangesAsync(ct);

        if (student.UserId > 0)
            await NotificationService.PushAsync(db, student.UserId,
                "نتيجة واجب 🎯",
                $"سلمت واجب «{assignment.Title}» والنتيجة {ArabicText.ToArabicDigits(percentage.ToString("N1"))}%",
                "homework", $"/assignment/{request.AssignmentId}", ct);

        if (!string.IsNullOrWhiteSpace(student.GuardianPhone))
        {
            var phone = NormalizeEgyptianPhone(student.GuardianPhone);
            var message = BuildSubmissionMessage(student.FullName, assignment.Title, score, total, percentage, passed,
                $"{env.BaseUrl}/assignment/{request.AssignmentId}");
            _ = whatsApp.SendAsync(phone, message, CancellationToken.None);
        }

        var resultAnswers = questions.Select(q =>
        {
            var selected = answersByOrder.GetValueOrDefault(q.Order);
            return new AssignmentSubmissionAnswerDto
            {
                Order = q.Order,
                SelectedIndex = selected,
                CorrectIndex = q.CorrectIndex,
                IsCorrect = selected == q.CorrectIndex,
                IsSkipped = selected is null,
                CorrectLetter = HomeworkFormat.Letter(q.CorrectIndex),
                SelectedLetter = selected is null ? null : HomeworkFormat.Letter(selected.Value)
            };
        }).ToList();

        return ApiResponse<AssignmentSubmissionResultDto>.Ok(new AssignmentSubmissionResultDto
        {
            SubmissionId = submission.Id,
            Score = score,
            TotalQuestions = total,
            Percentage = percentage,
            Passed = passed,
            Answers = resultAnswers
        }, passed ? "الواجب اتحل صح!" : "كمل مراجعة وشد حيلك");
    }

    private static string BuildSubmissionMessage(string studentName, string title, int score, int total, decimal percentage, bool passed, string link)
    {
        var status = passed
            ? "🎉 عمل رائع — استمر!"
            : "💪 يحتاج مراجعة — جرب تاني في المحاضرة الجاية";

        return $"مستر محمد صيام 🏫\n" +
               $"مع أبو كيان .. الدراسات في أمان 🙏\n\n" +
               $"عزيزي ولي أمر الطالب/ة {studentName} 👋\n\n" +
               $"تم تسليم واجب «{title}» بنجاح ✅\n" +
               $"📈 النتيجة: {ArabicText.ToArabicDigits(score.ToString())}/{ArabicText.ToArabicDigits(total.ToString())} — {ArabicText.ToArabicDigits(percentage.ToString("N1"))}%\n\n" +
               $"{status}\n" +
               $"للمراجعة عبر الرابط:\n{link}";
    }

    private static string NormalizeEgyptianPhone(string phone)
    {
        var digits = new string(phone.Where(char.IsDigit).ToArray());
        if (digits.Length >= 12 && digits.StartsWith("20")) return "+" + digits;
        if (digits.Length >= 10 && digits.StartsWith("01")) return "+2" + digits;
        return string.IsNullOrWhiteSpace(digits) ? phone : "+" + digits;
    }
}

public class GetAssignmentSubmissionsQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetAssignmentSubmissionsQuery, ApiResponse<IReadOnlyList<AssignmentSubmissionListItemDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<AssignmentSubmissionListItemDto>>> Handle(GetAssignmentSubmissionsQuery request, CancellationToken ct)
    {
        if (currentUser.Role is not (Role.Teacher or Role.Admin))
            return ApiResponse<IReadOnlyList<AssignmentSubmissionListItemDto>>.Fail("مش مسموح تشوف النتايج دي");

        if (!await db.Assignments.AnyAsync(a => a.Id == request.AssignmentId, ct))
            return ApiResponse<IReadOnlyList<AssignmentSubmissionListItemDto>>.Fail("الواجب غير موجود");

        var list = await db.AssignmentSubmissions
            .AsNoTracking()
            .Where(s => s.AssignmentId == request.AssignmentId)
            .OrderByDescending(s => s.SubmittedAt)
            .Select(s => new AssignmentSubmissionListItemDto
            {
                StudentId = s.StudentId,
                StudentName = s.Student!.FullName,
                StudentCode = s.Student.StudentCode,
                SubmittedAt = s.SubmittedAt,
                Score = s.Score,
                TotalQuestions = s.TotalQuestions,
                Percentage = s.TotalQuestions > 0 ? Math.Round(s.Score * 100m / s.TotalQuestions, 1) : 0,
                Passed = s.TotalQuestions > 0 && s.Score * 100m / s.TotalQuestions >= 50
            })
            .ToListAsync(ct);

        return ApiResponse<IReadOnlyList<AssignmentSubmissionListItemDto>>.Ok(list);
    }
}

public static class HomeworkFormat
{
    private static readonly string[] Letters = ["أ", "ب", "ج", "د", "هـ"];

    public static string Letter(int index) =>
        index >= 0 && index < Letters.Length ? Letters[index] : (index + 1).ToString();

    public static IReadOnlyList<string> BuildOptions(int count)
    {
        if (count <= 0) return Array.Empty<string>();
        return Letters.Take(Math.Min(count, Letters.Length)).ToList();
    }
}

internal static class ArabicOrdinalHelper
{
    public static string ArabicOrdinal(int n) =>
        n switch
        {
            1 => "الأول",
            2 => "الثاني",
            3 => "الثالث",
            4 => "الرابع",
            5 => "الخامس",
            6 => "السادس",
            7 => "السابع",
            8 => "الثامن",
            9 => "التاسع",
            10 => "العاشر",
            _ => n.ToString()
        };
}