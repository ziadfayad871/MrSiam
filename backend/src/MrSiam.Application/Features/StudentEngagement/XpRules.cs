using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Domain.Entities;

namespace MrSiam.Application.Features.StudentEngagement;

public static class XpRules
{
    public const int DailyLogin = 5;
    public const int ExamPass = 30;
    public const int PerfectExamBonus = 20;
    public const int LessonComplete = 10;
    public const int CourseComplete = 100;
    public const int AchievementUnlock = 25;
    public const int BossPass = 150;

    private static readonly (int Threshold, string Title)[] Levels =
    [
        (0, "مبتدئ"),
        (100, "طالب ملتزم"),
        (300, "باحث"),
        (700, "مؤرخ"),
        (1500, "خبير"),
        (3000, "نخبة أبو كيان")
    ];

    public static (int Level, string Title, string NextTitle, int NextThreshold, int ProgressPercent) Resolve(int totalXp)
    {
        int level = 1;
        string title = Levels[0].Title;
        string nextTitle = Levels[1].Title;
        int nextThreshold = Levels[1].Threshold;

        for (var i = 0; i < Levels.Length; i++)
        {
            if (totalXp >= Levels[i].Threshold)
            {
                level = i + 1;
                title = Levels[i].Title;
                nextTitle = i + 1 < Levels.Length ? Levels[i + 1].Title : "القمة";
                nextThreshold = i + 1 < Levels.Length ? Levels[i + 1].Threshold : Levels[i].Threshold;
            }
        }

        var progress = level >= Levels.Length ? 100
            : (int)Math.Min(100, (double)(totalXp - Levels[level - 1].Threshold) / (Levels[level].Threshold - Levels[level - 1].Threshold) * 100);

        return (level, title, nextTitle, nextThreshold, progress);
    }

    public static async Task<int> AwardAsync(IApplicationDbContext db, int studentId, int amount, string reason,
        int? courseId = null, int? examId = null, CancellationToken ct = default)
    {
        if (amount <= 0)
            return 0;

        var exists = await db.XPTransactions.AnyAsync(x => x.StudentId == studentId && x.Reason == reason, ct);
        if (exists)
            return 0;

        var transaction = new XPTransaction
        {
            StudentId = studentId,
            Amount = amount,
            Reason = reason,
            RelatedCourseId = courseId,
            RelatedExamId = examId,
            CreatedAt = DateTime.UtcNow
        };
        db.XPTransactions.Add(transaction);
        await db.SaveChangesAsync(ct);
        return amount;
    }

    public static async Task<int> GetTotalAsync(IApplicationDbContext db, int studentId, CancellationToken ct)
        => await db.XPTransactions.Where(x => x.StudentId == studentId).SumAsync(x => x.Amount, ct);
}
