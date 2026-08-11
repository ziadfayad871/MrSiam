using System.Text;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;

namespace MrSiam.Application.Features.StudentEngagement;

public record ExplainMistakeCommand(int StudentId, int MistakeId) : IRequest<ApiResponse<string>>;

public class ExplainMistakeCommandHandler(IApplicationDbContext db, IGeminiService gemini)
    : IRequestHandler<ExplainMistakeCommand, ApiResponse<string>>
{
    public async Task<ApiResponse<string>> Handle(ExplainMistakeCommand request, CancellationToken ct)
    {
        var mistake = await db.MistakeNotebook
            .AsNoTracking()
            .Include(m => m.Exam)
                .ThenInclude(e => e!.Course)
            .Include(m => m.Exam)
                .ThenInclude(e => e!.Lesson)
            .FirstOrDefaultAsync(m => m.Id == request.MistakeId && m.StudentId == request.StudentId, ct);

        if (mistake is null)
            return ApiResponse<string>.Fail("ط§ظ„ط؛ظ„ط·ط© ط؛ظٹط± ظ…ظˆط¬ظˆط¯ط©");

        var exam = mistake.Exam;
        var course = exam?.Course;
        var lesson = exam?.Lesson;

        var systemInstruction =
            "ط£ظ†طھ ظ…ط³ط§ط¹ط¯ طھط¹ظ„ظٹظ…ظٹ ظ„ظ…ظ†طµط© آ«ظ…ط¹ ط£ط¨ظˆ ظƒظٹط§ظ† .. ط§ظ„ط¯ط±ط§ط³ط§طھ ظپظٹ ط£ظ…ط§ظ†آ». ط£ط¬ط¨ ط¨ط§ظ„ظ„ط؛ط© ط§ظ„ط¹ط±ط¨ظٹط© ط§ظ„ظپطµط­ظ‰ ط§ظ„ط¨ط³ظٹط·ط© ظپظ‚ط·. " +
            "ط§ط³طھط®ط¯ظ… ط§ظ„ظ…ط­طھظˆظ‰ ط§ظ„ط¯ط±ط§ط³ظٹ ط§ظ„ظ…ظ‚ط¯ظ… ظپظٹ ط±ط³ط§ظ„ط© ط§ظ„ظ…ط³طھط®ط¯ظ… ظپظ‚ط·. " +
            "ط¥ط°ط§ ظƒط§ظ†طھ ط§ظ„ظ…ط¹ظ„ظˆظ…ط© ط؛ظٹط± ظ…ظˆط¬ظˆط¯ط© ظپظٹ ط§ظ„ظ…ط­طھظˆظ‰ ط§ظ„ظ…ظ‚ط¯ظ…طŒ ظ‚ظ„ ط­ط±ظپظٹط§ظ‹: آ«ط§ظ„ظ…ط¹ظ„ظˆظ…ط© ط¯ظٹ ظ…ط´ ظ…ظˆط¬ظˆط¯ط© ظپظٹ ط§ظ„ظ…ط­طھظˆظ‰ ط§ظ„ط¯ط±ط§ط³ظٹ ط§ظ„ظ…طھط§ط­ ط¹ظ„ظ‰ ط§ظ„ظ…ظ†طµط©.آ» " +
            "ظ„ط§ طھط®طھط±ط¹ ط£ط³ظ…ط§ط، ط£ظˆ طھظˆط§ط±ظٹط® ط£ظˆ ط­ظ‚ط§ط¦ظ‚ ط؛ظٹط± ظ…ظˆط¬ظˆط¯ط© ظپظٹ ط§ظ„ظ…ط­طھظˆظ‰. ط§ط¬ط¹ظ„ ط§ظ„ط´ط±ط­ ظ‚طµظٹط±ط§ظ‹ (ط¨ط­ط¯ ط£ظ‚طµظ‰ 120 ظƒظ„ظ…ط©) ظˆظˆط§ط¶ط­ط§ظ‹ ظ„ظ„ط·ط§ظ„ط¨.";

        var context = new StringBuilder();
        context.AppendLine("=== ط§ظ„ظ…ط­طھظˆظ‰ ط§ظ„ط¯ط±ط§ط³ظٹ ط§ظ„ظ…طھط§ط­ ط¹ظ„ظ‰ ط§ظ„ظ…ظ†طµط© ===");
        if (course is not null)
        {
            context.AppendLine($"ط§ظ„ظ…ط±ط­ظ„ط©: {course.Stage}");
            context.AppendLine($"ط§ظ„ظ…ط§ط¯ط©: {course.Subject}");
            context.AppendLine($"ط§ظ„ظƒظˆط±ط³: {course.Title}");
            context.AppendLine($"ظˆطµظپ ط§ظ„ظƒظˆط±ط³: {course.Description}");
        }
        if (lesson is not null)
        {
            context.AppendLine($"ط§ظ„ط¯ط±ط³: {lesson.Title}");
            context.AppendLine($"ظ…ظ„ط®طµ ط§ظ„ط¯ط±ط³: {lesson.Summary}");
        }
        if (exam is not null)
            context.AppendLine($"ط§ظ„ط§ظ…طھط­ط§ظ†: {exam.Title}");
        context.AppendLine();
        context.AppendLine("=== ط³ط¤ط§ظ„ ط§ظ„ط·ط§ظ„ط¨ ===");
        context.AppendLine($"ط§ظ„ط³ط¤ط§ظ„: {mistake.QuestionText}");
        context.AppendLine($"ط¥ط¬ط§ط¨ط© ط§ظ„ط·ط§ظ„ط¨: {mistake.StudentAnswer}");
        context.AppendLine($"ط§ظ„ط¥ط¬ط§ط¨ط© ط§ظ„طµط­ظٹط­ط©: {mistake.CorrectAnswer}");
        context.AppendLine();
        context.AppendLine("ط§ط´ط±ط­ ظ„ظ„ط·ط§ظ„ط¨ ظ„ظ…ط§ط°ط§ ظƒط§ظ†طھ ط¥ط¬ط§ط¨طھظ‡ ط®ط§ط·ط¦ط©طŒ ظˆظ…ط§ ط§ظ„ط¥ط¬ط§ط¨ط© ط§ظ„طµط­ظٹط­ط©طŒ ظ…ط¹ ط¯ط¹ظ… ط§ظ„ط´ط±ط­ ط¨ظ…ط§ ظ…ظˆط¬ظˆط¯ ظپظٹ ط§ظ„ظ…ط­طھظˆظ‰ ط£ط¹ظ„ط§ظ‡ ظپظ‚ط·.");

        var explanation = await gemini.GenerateAsync(systemInstruction, context.ToString(), ct);
        if (string.IsNullOrWhiteSpace(explanation))
            return ApiResponse<string>.Fail("ط§ظ„طھظˆط¶ظٹط­ ظ…ط´ ظ…طھط§ط­ ط¯ظ„ظˆظ‚طھظٹ â€” ط¬ط±ط¨ طھط§ظ†ظٹ ط¨ط¹ط¯ ط´ظˆظٹط©");

        return ApiResponse<string>.Ok(explanation.Trim());
    }
}

