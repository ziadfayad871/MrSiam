using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Domain.Entities;
using MrSiam.Domain.Enums;

namespace MrSiam.Infrastructure.Persistence;

public static class SeedData
{
    public static async Task SeedAsync(IApplicationDbContext db, IPasswordHasher hasher)
    {
        if (await db.Users.AnyAsync())
            return;

        var ctx = (AppDbContext)db;

        // ---------- Users ----------
        var teacherUser = NewUser(hasher, "siam", "محمد صيام", Role.Teacher, "123456");
        var secretaryUser = NewUser(hasher, "secretary", "أمناء المعهد", Role.Secretary, "123456");
        var adminUser = NewUser(hasher, "admin", "مدير المنصة", Role.Admin, "123456");

        ctx.Users.AddRange(teacherUser, secretaryUser, adminUser);
        await ctx.SaveChangesAsync();

        // ---------- Teacher ----------
        var teacher = new Teacher
        {
            UserId = teacherUser.Id,
            FullName = "مستر محمد صيام",
            Title = "مدرس الدراسات الاجتماعية والتاريخ والجغرافيا",
            Bio = "مدرس دراسات اجتماعية للمرحلة الإعدادية، ومدرس تاريخ وجغرافيا للمرحلة الثانوية. يؤمن أن التاريخ حكاية تُروى، وأن الجغرافيا خريطة تُقرأ، وأن الطالب حين يمسك البوصلة يستطيع أن يجد طريقه في أي علم.",
            Philosophy = "المنهج الجيد لا يُحفظ، بل يُعاش. كل درس هو محطة، وكل امتحان هو تحدٍّ، وكل تفوق هو اكتشاف جديد في رحلة الطالب.",
            ExperienceYears = 18,
            GraduatedFrom = "كلية التربية - جامعة عين شمس",
            PortraitUrl = null
        };

        ctx.Teachers.Add(teacher);
        await ctx.SaveChangesAsync();

        // ---------- Achievements ----------
        var achievements = new[]
        {
            new Achievement { Code = "journey-started", Title = "بداية الرحلة", Description = "خطوتك الأولى في مملكة القيصر التعليمية", Icon = "compass", Order = 1 },
            new Achievement { Code = "first-pass", Title = "مؤرخ المستقبل", Description = "اجتزت أول امتحان في رحلتك", Icon = "scroll", RequiredExamsPassed = 1, Order = 2 },
            new Achievement { Code = "map-king", Title = "ملك الخرائط", Description = "اجتزت امتحانات الجغرافيا لثلاثة مقررات", Icon = "map", Order = 3 },
            new Achievement { Code = "history-hero", Title = "بطل التاريخ", Description = "اجتزت امتحانات التاريخ لثلاثة مقررات", Icon = "landmark", Order = 4 },
            new Achievement { Code = "perfect-100", Title = "علامة كاملة 100%", Description = "حصلت على 100% في امتحان كامل", Icon = "award", RequiredPerfectExams = 1, Order = 5 },
            new Achievement { Code = "five-passes", Title = "المتفوق", Description = "اجتزت خمسة امتحانات بنجاح", Icon = "star", RequiredExamsPassed = 5, Order = 6 },
            new Achievement { Code = "month-hero", Title = "بطل الشهر", Description = "تصدرت النتائج في أحد الامتحانات", Icon = "trophy", Order = 7 },
            new Achievement { Code = "ten-exams", Title = "المستكشف", Description = "اجتزت عشرة امتحانات في رحلتك", Icon = "route", RequiredExamsPassed = 10, Order = 8 },
        };

        ctx.Achievements.AddRange(achievements);
        await ctx.SaveChangesAsync();
    }

    private static AppUser NewUser(IPasswordHasher hasher, string username, string fullName, Role role, string password)
    {
        return new AppUser
        {
            Username = username,
            FullName = fullName,
            PasswordHash = hasher.Hash(password),
            Role = role,
            CreatedAt = DateTime.UtcNow.AddMonths(-Random.Shared.Next(1, 14))
        };
    }
}
