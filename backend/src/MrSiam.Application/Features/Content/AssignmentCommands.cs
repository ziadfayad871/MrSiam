using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Entities;
using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Content;

public record AssignmentDto
{
    public int Id { get; init; }
    public int CourseId { get; init; }
    public int? LessonId { get; init; }
    public required string Title { get; init; }
    public required string Description { get; init; }
    public DateTime? DueDate { get; init; }
    public DateTime CreatedAt { get; init; }
    public int? QuestionCount { get; init; }
    public int? ChoicesPerQuestion { get; init; }
    public bool HasQuestions { get; init; }
    public bool Submitted { get; set; }
    public decimal? SubmissionPercentage { get; set; }
}

public record GetCourseAssignmentsQuery(int CourseId) : IRequest<ApiResponse<IReadOnlyList<AssignmentDto>>>;

public class GetCourseAssignmentsQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetCourseAssignmentsQuery, ApiResponse<IReadOnlyList<AssignmentDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<AssignmentDto>>> Handle(GetCourseAssignmentsQuery request, CancellationToken ct)
    {
        var assignments = await db.Assignments
            .AsNoTracking()
            .Where(a => a.CourseId == request.CourseId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new AssignmentDto
            {
                Id = a.Id,
                CourseId = a.CourseId,
                LessonId = a.LessonId,
                Title = a.Title,
                Description = a.Description,
                DueDate = a.DueDate,
                CreatedAt = a.CreatedAt,
                QuestionCount = a.QuestionCount,
                ChoicesPerQuestion = a.ChoicesPerQuestion,
                HasQuestions = a.QuestionCount != null && a.QuestionCount > 0
            })
            .ToListAsync(ct);

        if (currentUser.Role == Role.Student && currentUser.UserId is int userId)
        {
            var studentId = await db.Students
                .Where(s => s.UserId == userId)
                .Select(s => (int?)s.Id)
                .FirstOrDefaultAsync(ct);

            if (studentId is int sid && assignments.Count > 0)
            {
                var ids = assignments.Select(a => a.Id).ToList();
                var submissions = await db.AssignmentSubmissions
                    .AsNoTracking()
                    .Where(s => s.StudentId == sid && ids.Contains(s.AssignmentId))
                    .Select(s => new { s.AssignmentId, s.Score, s.TotalQuestions })
                    .ToListAsync(ct);

                foreach (var a in assignments)
                {
                    var sub = submissions.FirstOrDefault(x => x.AssignmentId == a.Id);
                    a.Submitted = sub is not null;
                    a.SubmissionPercentage = sub is null || sub.TotalQuestions <= 0
                        ? null
                        : Math.Round(sub.Score * 100m / sub.TotalQuestions, 1);
                }
            }
        }

        return ApiResponse<IReadOnlyList<AssignmentDto>>.Ok(assignments);
    }
}

public record CreateAssignmentCommand(
    int CourseId,
    int? LessonId,
    string Title,
    string Description,
    DateTime? DueDate,
    int? QuestionCount = null,
    int? ChoicesPerQuestion = null,
    IReadOnlyList<int>? CorrectAnswers = null) : IRequest<ApiResponse<int>>;

public record UpdateAssignmentCommand(
    int Id,
    int? LessonId,
    string? Title,
    string? Description,
    DateTime? DueDate,
    int? QuestionCount = null,
    int? ChoicesPerQuestion = null,
    IReadOnlyList<int>? CorrectAnswers = null) : IRequest<ApiResponse<bool>>;

public record DeleteAssignmentCommand(int Id) : IRequest<ApiResponse<bool>>;

public class CreateAssignmentCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CreateAssignmentCommand, ApiResponse<int>>
{
    public async Task<ApiResponse<int>> Handle(CreateAssignmentCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return ApiResponse<int>.Fail("عنوان الواجب مطلوب");

        var configError = HomeworkConfig.Validate(request.QuestionCount, request.ChoicesPerQuestion, request.CorrectAnswers);
        if (configError is not null)
            return ApiResponse<int>.Fail(configError);

        if (!await db.Courses.AnyAsync(c => c.Id == request.CourseId, ct))
            return ApiResponse<int>.Fail("الكورس غير موجود");

        if (request.LessonId is not null &&
            !await db.Lessons.AnyAsync(l => l.Id == request.LessonId && l.CourseId == request.CourseId, ct))
            return ApiResponse<int>.Fail("الحصة المختارة مش في الكورس ده");

        var assignment = new Assignment
        {
            CourseId = request.CourseId,
            LessonId = request.LessonId,
            Title = request.Title.Trim(),
            Description = (request.Description ?? string.Empty).Trim(),
            DueDate = request.DueDate,
            QuestionCount = request.QuestionCount is > 0 ? request.QuestionCount : null,
            ChoicesPerQuestion = request.QuestionCount is > 0 ? request.ChoicesPerQuestion : null,
            CreatedAt = DateTime.UtcNow
        };

        db.Assignments.Add(assignment);
        await db.SaveChangesAsync(ct);

        if (assignment.QuestionCount is > 0 && request.CorrectAnswers is not null)
            AssignmentQuestionWriter.AddQuestions(db, assignment.Id, assignment.QuestionCount.Value, request.CorrectAnswers);

        await db.SaveChangesAsync(ct);
        return ApiResponse<int>.Ok(assignment.Id, "تم إضافة الواجب");
    }
}

public class UpdateAssignmentCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateAssignmentCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(UpdateAssignmentCommand request, CancellationToken ct)
    {
        var assignment = await db.Assignments.FirstOrDefaultAsync(a => a.Id == request.Id, ct);
        if (assignment is null)
            return ApiResponse<bool>.Fail("الواجب غير موجود");

        // LessonId null = فك الارتباط بالحصة (يظهر في "عام")
        if (request.LessonId is not null &&
            !await db.Lessons.AnyAsync(l => l.Id == request.LessonId && l.CourseId == assignment.CourseId, ct))
            return ApiResponse<bool>.Fail("الحصة المختارة مش في الكورس ده");
        assignment.LessonId = request.LessonId;

        if (!string.IsNullOrWhiteSpace(request.Title))
            assignment.Title = request.Title.Trim();
        if (request.Description is not null)
            assignment.Description = request.Description.Trim();
        if (request.DueDate is not null)
            assignment.DueDate = request.DueDate;

        var hwConfigProvided = request.QuestionCount is not null || request.ChoicesPerQuestion is not null || request.CorrectAnswers is not null;
        if (hwConfigProvided)
        {
            if (request.QuestionCount is null || request.ChoicesPerQuestion is null || request.CorrectAnswers is null)
                return ApiResponse<bool>.Fail("حدد عدد الأسئلة وعدد الاختيارات والإجابات الصحيحة كاملة");

var configError = HomeworkConfig.Validate(request.QuestionCount, request.ChoicesPerQuestion, request.CorrectAnswers);
            if (configError is not null)
                return ApiResponse<bool>.Fail(configError);

            // لو اتغيرت الأسئلة: نتايج قديمة تبقى باطلة
            var oldCorrect = await db.AssignmentQuestions
                .Where(q => q.AssignmentId == assignment.Id)
                .OrderBy(q => q.Order)
                .Select(q => q.CorrectIndex)
                .ToListAsync(ct);
            var changed =
                assignment.QuestionCount != request.QuestionCount ||
                assignment.ChoicesPerQuestion != request.ChoicesPerQuestion ||
                !oldCorrect.SequenceEqual(request.CorrectAnswers ?? []);
            if (changed)
            {
                var oldQuestions = await db.AssignmentQuestions.Where(q => q.AssignmentId == assignment.Id).ToListAsync(ct);
                var oldSubmissions = await db.AssignmentSubmissions.Where(s => s.AssignmentId == assignment.Id).ToListAsync(ct);
                db.AssignmentQuestions.RemoveRange(oldQuestions);
                db.AssignmentSubmissions.RemoveRange(oldSubmissions);
            }

            assignment.QuestionCount = request.QuestionCount is > 0 ? request.QuestionCount : null;
            assignment.ChoicesPerQuestion = request.QuestionCount is > 0 ? request.ChoicesPerQuestion : null;

            if (assignment.QuestionCount is > 0 && request.CorrectAnswers is not null)
                AssignmentQuestionWriter.AddQuestions(db, assignment.Id, assignment.QuestionCount.Value, request.CorrectAnswers);
        }

        await db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true, "تم تعديل الواجب");
    }
}

public class DeleteAssignmentCommandHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteAssignmentCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(DeleteAssignmentCommand request, CancellationToken ct)
    {
        var assignment = await db.Assignments.FirstOrDefaultAsync(a => a.Id == request.Id, ct);
        if (assignment is null)
            return ApiResponse<bool>.Fail("الواجب غير موجود");

        db.Assignments.Remove(assignment);
        await db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true, "تم حذف الواجب");
    }
}

public static class HomeworkConfig
{
    public static string? Validate(int? questionCount, int? choicesPerQuestion, IReadOnlyList<int>? correctAnswers)
    {
        if (questionCount is null or 0)
            return null;
        if (questionCount < 1 || questionCount > 30)
            return "عدد الأسئلة لازم يكون من 1 لـ 30";
        if (choicesPerQuestion is null || choicesPerQuestion < 2 || choicesPerQuestion > 5)
            return "عدد الاختيارات لازم يكون من 2 لـ 5";
        if (correctAnswers is null || correctAnswers.Count != questionCount)
            return "حدد الإجابة الصحيحة لكل سؤال";
        if (correctAnswers.Any(i => i < 0 || i >= choicesPerQuestion))
            return "الإجابات الصحيحة مش مطابقة لعدد الاختيارات";
        return null;
    }
}

internal static class AssignmentQuestionWriter
{
    public static void AddQuestions(IApplicationDbContext db, int assignmentId, int count, IReadOnlyList<int> correctAnswers)
    {
        for (var i = 0; i < count; i++)
        {
            db.AssignmentQuestions.Add(new AssignmentQuestion
            {
                AssignmentId = assignmentId,
                Order = i + 1,
                CorrectIndex = correctAnswers[i]
            });
        }
    }
}