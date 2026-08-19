using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Application.Features.Achievements;
using MrSiam.Application.Features.StudentEngagement;
using MrSiam.Domain.Entities;
using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Attempts;

public class SubmitAttemptCommandHandler(
    IApplicationDbContext db,
    IAchievementService achievementService,
    IWhatsAppService whatsApp,
    IAppEnvironment env)
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

        if (exam.Type == ExamType.Boss)
        {
            var lessonExamCounts = await db.Exams
                .AsNoTracking()
                .Where(e => e.CourseId == exam.CourseId && e.LessonId != null)
                .Select(e => e.LessonId!.Value)
                .ToListAsync(ct);

            if (lessonExamCounts.Count > 0)
            {
                var passedLessonExams = await db.ExamAttempts
                    .Where(a => a.StudentId == request.StudentId && a.Passed && a.Exam != null && a.Exam.CourseId == exam.CourseId)
                    .Select(a => a.Exam!.LessonId)
                    .Distinct()
                    .ToListAsync(ct);

                var remaining = lessonExamCounts.Except(passedLessonExams.Where(x => x.HasValue).Select(x => x!.Value)).ToList();
                if (remaining.Count > 0)
                    return ApiResponse<AttemptResultDto>.Fail(
                        $"بوس المادة لسه مقفول — خلص كل دروسك الأول ({lessonExamCounts.Count - remaining.Count}/{lessonExamCounts.Count} مكتمل)");
            }
        }

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

        var grader = await db.Students.AsNoTracking()
            .Where(s => s.Id == request.StudentId)
            .Select(s => new { s.FullName, s.GuardianPhone, s.UserId })
            .FirstOrDefaultAsync(ct);

        if (grader is not null)
        {
            var link = $"{env.BaseUrl}/results/{attempt.Id}";

            if (!string.IsNullOrWhiteSpace(grader.GuardianPhone))
            {
                var phone = NormalizeEgyptianPhone(grader.GuardianPhone);
                var message = BuildGradeMessage(grader.FullName, exam.Title, score, exam.TotalMarks, percentage, passed, link);
                _ = whatsApp.SendAsync(phone, message, CancellationToken.None);
            }

            if (grader.UserId > 0)
                await NotificationService.PushAsync(db, grader.UserId,
                    "نتيجة جديدة 🎯",
                    $"محاولتك في «{exam.Title}» = {percentage}% — افتح الشريحة للتفاصيل",
                    "grade", $"/results/{attempt.Id}", ct);
        }

        await CaptureMistakesAsync(request.StudentId, exam, attemptAnswers, attempt.Id, ct);

        if (passed && percentage >= 80)
            await GrantOrUpgradeCertificateAsync(request.StudentId, exam, percentage, ct);

        var unlocked = await achievementService.CheckAndUnlockAsync(request.StudentId, ct);

        if (unlocked.Count > 0)
        {
            var userId = await db.Students.AsNoTracking().Where(s => s.Id == request.StudentId).Select(s => s.UserId).FirstOrDefaultAsync(ct);
            foreach (var achievement in unlocked)
            {
                await XpRules.AwardAsync(db, request.StudentId, XpRules.AchievementUnlock, $"achievement:{achievement.Id}", ct: ct);
                if (userId > 0)
                    await NotificationService.PushAsync(db, userId,
                        "إنجاز جديد! 🏛️",
                        $"فتحت إنجاز «{achievement.Title}»",
                        "achievement", "/passport", ct);
            }
        }

        if (passed)
        {
            var perfect = percentage >= 99.5m;
            await XpRules.AwardAsync(db, request.StudentId, XpRules.ExamPass, $"exam-pass:{exam.Id}", examId: exam.Id, ct: ct);
            if (perfect)
                await XpRules.AwardAsync(db, request.StudentId, XpRules.PerfectExamBonus, $"exam-perfect:{exam.Id}", examId: exam.Id, ct: ct);
            if (exam.Type == ExamType.Boss)
                await XpRules.AwardAsync(db, request.StudentId, XpRules.BossPass, $"boss:{exam.Id}", examId: exam.Id, ct: ct);

            if (exam.LessonId is not null)
                await XpRules.AwardAsync(db, request.StudentId, XpRules.LessonComplete, $"lesson:{exam.LessonId}", courseId: exam.CourseId, ct: ct);

            var courseExamCount = await db.Exams.CountAsync(e => e.CourseId == exam.CourseId && e.IsPublished, ct);
            var passedInCourse = await db.ExamAttempts
                .Where(a => a.StudentId == request.StudentId && a.Passed && a.Exam != null && a.Exam.CourseId == exam.CourseId)
                .Select(a => a.ExamId)
                .Distinct()
                .CountAsync(ct);

            if (courseExamCount > 0 && passedInCourse >= courseExamCount)
                await XpRules.AwardAsync(db, request.StudentId, XpRules.CourseComplete, $"course:{exam.CourseId}", courseId: exam.CourseId, ct: ct);
        }

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

    private async Task GrantOrUpgradeCertificateAsync(int studentId, Exam exam, decimal percentage, CancellationToken ct)
    {
        var existing = await db.Certificates.FirstOrDefaultAsync(c => c.StudentId == studentId && c.ExamId == exam.Id, ct);
        if (existing is not null && existing.Percentage >= percentage)
            return;

        var studentName = await db.Students.AsNoTracking().Where(s => s.Id == studentId).Select(s => s.FullName).FirstOrDefaultAsync(ct) ?? string.Empty;

        var grade = percentage switch
        {
            >= 95 => "امتياز",
            >= 85 => "جيد جداً",
            _ => "جيد"
        };

        if (existing is not null)
        {
            existing.Percentage = percentage;
            existing.Grade = grade;
            existing.IssuedAt = DateTime.UtcNow;
            return;
        }

        db.Certificates.Add(new Certificate
        {
            StudentId = studentId,
            ExamId = exam.Id,
            CourseId = exam.CourseId,
            Title = exam.Title,
            Grade = grade,
            Percentage = percentage,
            Code = $"CERT-{studentName.GetHashCode():X8}-{exam.Id:D5}"
        });
    }

    private async Task CaptureMistakesAsync(int studentId, Exam exam, IReadOnlyList<AttemptAnswer> answers, int attemptId, CancellationToken ct)
    {
        var answersByQuestion = answers.ToDictionary(a => a.QuestionId);

        foreach (var question in exam.Questions)
        {
            var answer = answersByQuestion.GetValueOrDefault(question.Id);
            if (answer is null || answer.IsCorrect)
                continue;

            var selectedOption = answer.SelectedOptionId is not null
                ? question.Options.FirstOrDefault(o => o.Id == answer.SelectedOptionId.Value)
                : null;
            var correctOption = question.Options.FirstOrDefault(o => o.IsCorrect);

            var existing = await db.MistakeNotebook.FirstOrDefaultAsync(
                m => m.StudentId == studentId && m.QuestionId == question.Id, ct);

            if (existing is not null)
            {
                existing.WrongCount++;
                existing.LastWrongAt = DateTime.UtcNow;
                existing.AttemptId = attemptId;
                existing.ExamId = exam.Id;
            }
            else
            {
                db.MistakeNotebook.Add(new MistakeNotebook
                {
                    StudentId = studentId,
                    QuestionId = question.Id,
                    ExamId = exam.Id,
                    AttemptId = attemptId,
                    QuestionText = question.Text,
                    StudentAnswer = selectedOption?.Text ?? "لم يُجب",
                    CorrectAnswer = correctOption?.Text ?? string.Empty,
                    Explanation = exam.Lesson != null ? $"من درس: {exam.Lesson.Title}" : string.Empty,
                    LessonTitle = exam.Lesson?.Title ?? exam.Title,
                    Topic = exam.Course != null ? exam.Course.Subject.ToString() : null,
                    WrongCount = 1,
                    LastWrongAt = DateTime.UtcNow
                });
            }
        }

        await db.SaveChangesAsync(ct);
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

    private static string NormalizeEgyptianPhone(string phone)
    {
        var digits = new string(phone.Where(char.IsDigit).ToArray());
        if (digits.Length >= 12 && digits.StartsWith("20")) return "+" + digits;
        if (digits.Length >= 10 && digits.StartsWith("01")) return "+2" + digits;
        return string.IsNullOrWhiteSpace(digits) ? phone : "+" + digits;
    }

    private static string BuildGradeMessage(string studentName, string examTitle, decimal score, decimal totalMarks, decimal percentage, bool passed, string link)
    {
        var status = passed
            ? "🎉 النتيجة ممتازة ومبروك!"
            : "💪 محاولة محسوبة — الشريحة جاهزة";

        return $"مستر محمد سامي 🏫\n" +
               $"مع أبو كيان .. الدراسات في أمان 🙏\n\n" +
               $"عزيزي ولي أمر الطالب/ة {studentName} 👋\n\n" +
               $"تم احتساب نتيجة نجلكم في «{examTitle}»:\n" +
               $"📈 الدرجة: {ArabicText.ToArabicDigits(score.ToString("N1"))}/{ArabicText.ToArabicDigits(totalMarks.ToString("N1"))} — {ArabicText.ToArabicDigits(percentage.ToString("N1"))}%\n\n" +
               $"{status}\n" +
               $"للمراجعة عبر الرابط:\n{link}";
    }
}
