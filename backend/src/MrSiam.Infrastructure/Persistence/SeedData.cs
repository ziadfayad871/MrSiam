using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Domain.Entities;
using MrSiam.Domain.Enums;

namespace MrSiam.Infrastructure.Persistence;

public static class SeedData
{
    /// <summary>بيانات اعتماد حساب المستر (المالك) — أول تشغيل فقط.</summary>
    public const string MasterUsername = "master";
    public const string MasterPassword = "Master@123";

    public static async Task SeedAsync(IApplicationDbContext db, IPasswordHasher hasher)
    {
        // حساب المستر (Admin) هو الحساب الوحيد الذي يُنشأ تلقائيًا — لا توجد بيانات تجريبية.
        var master = await db.Users.FirstOrDefaultAsync(u => u.Username == MasterUsername);
        if (master is null)
        {
            master = new AppUser
            {
                Username = MasterUsername,
                FullName = "المستر",
                PasswordHash = hasher.Hash(MasterPassword),
                StoredPassword = MasterPassword,
                Role = Role.Admin,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            db.Users.Add(master);
            await db.SaveChangesAsync();
        }

        // المستر هو صاحب المحتوى — لازم يكون له حساب مدرس (Teacher) عشان يقدر ينشئ الكورسات والحصص.
        var teacherLinked = await db.Teachers.AnyAsync(t => t.UserId == master.Id);
        if (!teacherLinked)
        {
            var existing = await db.Teachers.FirstOrDefaultAsync();
            if (existing is not null)
            {
                existing.UserId = master.Id;
            }
            else
            {
                db.Teachers.Add(new Teacher
                {
                    UserId = master.Id,
                    FullName = master.FullName,
                    Title = "مدرس المواد الدراسية",
                    Bio = string.Empty,
                    Philosophy = string.Empty,
                    ExperienceYears = 0,
                    GraduatedFrom = string.Empty,
                    PortraitUrl = null
                });
            }
            await db.SaveChangesAsync();
        }
    }
}
