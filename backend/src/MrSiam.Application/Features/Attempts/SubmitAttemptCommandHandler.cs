using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Application.Features.Achievements;
using MrSiam.Domain.Entities;

namespace MrSiam.Application.Features.Attempts;

public class SubmitAttemptCommandHandler(IApplicationDbContext db, IAchievementService achievementService)
    : IRequestHandler<SubmitAttemptCommand, ApiResponse<AttemptResultDto>>
{
    public async Task<ApiResponse<AttemptResultDto>> Handle(SubmitAttemptCommand request, CancellationToken ct)
    {
        var exam = await db.Exams
            .Include(e => e.Questions.OrderBy(q => q.Order))
                .ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(e => e.Id == request.ExamId && e.IsPublished, ct);

        if (exam is null)
            return ApiResponse<AttemptResultDto>.Fail("الامتحان غير موجود");

        var attemptsUsed = await db.ExamAttempts.CountAsync(a => a.ExamId == request.ExamId && a.StudentId == request.StudentId, ct);
        if (attemptsUsed >= exam.AttemptsAllowed)
            return ApiResponse<AttemptResultDto>.Fail("خلصت عدد المحاولات المسموحة لهذا الامتحان");

        var studentExists = await db.Students.AnyAsync(s => s.Id == request.StudentId, ct);
        if (!studentExists)
            return ApiResponse<AttemptResultDto>.Fail("الطالب غير موجود");

        var answersByQuestion = request.Answers.ToDictionary(a => a.QuestionId, a => a.SelectedOptionId);

        decimal score = 0;
        var correctCount = 0;
        var wrongCount = 0;
        var skippedCount = 0;
        var attemptAnswers = new List<AttemptAnswer>();

        foreach (var question in exam.Questions)
        {
            var selectedOptionId = answersByQuestion.GetValueOrDefault(question.Id);
            var answered = selectedOptionId.HasValue
                           && question.Options.Any(o => o.Id == selectedOptionId.Value);

            bool isCorrect;
            if (!answered)
            {
                isCorrect = false;
                skippedCount++;
            }
            else
            {
                isCorrect = question.Options.First(o => o.Id == selectedOptionId!.Value).IsCorrect;
                if (isCorrect)
                {
                    score += question.Marks;
                    correctCount++;
                }
                else
                {
                    wrongCount++;
                }
            }

            attemptAnswers.Add(new AttemptAnswer
            {
                QuestionId = question.Id,
                SelectedOptionId = answered ? selectedOptionId : null,
                IsCorrect = isCorrect,
                IsSkipped = !answered
            });
        }

        var percentage = exam.TotalMarks > 0 ? Math.Round(score / exam.TotalMarks * 100, 1) : 0;
        var passed = score >= exam.PassMark;

        var attempt = new ExamAttempt
        {
            ExamId = exam.Id,
            StudentId = request.StudentId,
            SubmittedAt = DateTime.UtcNow,
            Score = score,
            CorrectCount = correctCount,
            WrongCount = wrongCount,
            SkippedCount = skippedCount,
            Passed = passed,
            Percentage = percentage,
            Answers = attemptAnswers
        };

        db.ExamAttempts.Add(attempt);
        await db.SaveChangesAsync(ct);

        var unlocked = await achievementService.CheckAndUnlockAsync(request.StudentId, ct);

        var rank = await db.ExamAttempts
            .Where(a => a.ExamId == request.ExamId)
            .OrderByDescending(a => a.Percentage)
            .Select(a => a.StudentId)
            .ToListAsync(ct);

        var position = rank.IndexOf(request.StudentId) + 1;

        var nextStop = await GetNextStopAsync(request.StudentId, exam.CourseId, ct);

        return ApiResponse<AttemptResultDto>.Ok(new AttemptResultDto
        {
            AttemptId = attempt.Id,
            ExamId = exam.Id,
            ExamTitle = exam.Title,
            Score = score,
            TotalMarks = exam.TotalMarks,
            Percentage = percentage,
            CorrectCount = correctCount,
            WrongCount = wrongCount,
            SkippedCount = skippedCount,
            Passed = passed,
            Rank = position,
            UnlockedAchievements = unlocked,
            NextStop = nextStop
        }, passed ? "وصلت للمحطة!" : "كل محاولة بتقرّبك للهدف");
    }

    private async Task<string> GetNextStopAsync(int studentId, int courseId, CancellationToken ct)
    {
        var completedLessons = await db.ExamAttempts
            .Where(a => a.StudentId == studentId && a.Passed && a.Exam!.CourseId == courseId)
            .Select(a => a.Exam!.LessonId)
            .Distinct()
            .ToListAsync(ct);

        var lesson = await db.Lessons
            .AsNoTracking()
            .Where(l => l.CourseId == courseId && !completedLessons.Contains(l.Id))
            .OrderBy(l => l.Order)
            .FirstOrDefaultAsync(ct);

        return lesson is null
            ? "المرحلة القادمة — تبدأ رحلة جديدة"
            : lesson.Title;
    }
}
