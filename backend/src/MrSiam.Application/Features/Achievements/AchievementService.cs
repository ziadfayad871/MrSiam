using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Features.Attempts;
using MrSiam.Domain.Entities;
using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Achievements;

public class AchievementService(IApplicationDbContext db) : IAchievementService
{
    public async Task<IReadOnlyList<AchievementUnlockedDto>> CheckAndUnlockAsync(int studentId, CancellationToken ct)
    {
        var achievements = await db.Achievements
            .Where(a => a.IsActive)
            .OrderBy(a => a.Order)
            .ToListAsync(ct);

        var unlockedIds = await db.StudentAchievements
            .Where(sa => sa.StudentId == studentId)
            .Select(sa => sa.AchievementId)
            .ToListAsync(ct);

        var attempts = await db.ExamAttempts
            .Where(a => a.StudentId == studentId)
            .Include(a => a.Exam)
                .ThenInclude(e => e!.Course)
            .ToListAsync(ct);

        var newlyUnlocked = new List<AchievementUnlockedDto>();

        foreach (var achievement in achievements)
        {
            if (unlockedIds.Contains(achievement.Id) || !IsSatisfied(achievement, attempts, studentId))
                continue;

            db.StudentAchievements.Add(new StudentAchievement
            {
                StudentId = studentId,
                AchievementId = achievement.Id,
                UnlockedAt = DateTime.UtcNow
            });

            unlockedIds.Add(achievement.Id);
            newlyUnlocked.Add(new AchievementUnlockedDto
            {
                Id = achievement.Id,
                Title = achievement.Title,
                Description = achievement.Description,
                Icon = achievement.Icon
            });
        }

        if (newlyUnlocked.Count > 0)
            await db.SaveChangesAsync(ct);

        return newlyUnlocked;
    }

    private bool IsSatisfied(Achievement achievement, IReadOnlyList<ExamAttempt> attempts, int studentId)
    {
        if (attempts.Count == 0)
            return false;

        if (achievement.RequiredExamsPassed is int passed && attempts.Count(a => a.Passed) < passed)
            return false;

        if (achievement.RequiredPerfectExams is int perfect && attempts.Count(a => a.Percentage >= 100) < perfect)
            return false;

        if (achievement.RequiredAverage is decimal avg && attempts.Average(a => a.Percentage) < avg)
            return false;

        if (achievement.Code == "history-hero" &&
            attempts.Where(a => a.Exam is { Course.Subject: Subject.History } && a.Passed).Select(a => a.Exam!.CourseId).Distinct().Count() < 3)
            return false;

        if (achievement.Code == "map-king" &&
            attempts.Where(a => a.Exam is { Course.Subject: Subject.Geography } && a.Passed).Select(a => a.Exam!.CourseId).Distinct().Count() < 3)
            return false;

        if (achievement.Code == "month-hero" && !IsTopOfAnyExam(attempts, studentId))
            return false;

        return true;
    }

    private bool IsTopOfAnyExam(IReadOnlyList<ExamAttempt> attempts, int studentId)
    {
        foreach (var examGroup in attempts.GroupBy(a => a.ExamId))
        {
            var examId = examGroup.Key;
            var myBest = examGroup.Where(a => a.StudentId == studentId).Max(a => a.Percentage);
            if (myBest <= 0)
                continue;

            var examTop = db.ExamAttempts
                .Where(a => a.ExamId == examId)
                .Max(a => (decimal?)a.Percentage);

            if (examTop.HasValue && myBest >= examTop.Value && myBest >= 50)
                return true;
        }

        return false;
    }
}
