using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Domain.Entities;
using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Content;

/// <summary>
/// فحص دوري: لما ديدلاين الواجب أو امتحان المنصة يخلص والطالب ميسلمش/ميدخلش،
/// يبعت رسالة لولي الأمر وإشعار داخل المنصة للطالب (مرة واحدة فقط لكل واجب/امتحان).
/// </summary>
public static class DeadlineNotifier
{
    public static async Task RunAsync(IApplicationDbContext db, IWhatsAppService whatsApp, CancellationToken ct)
    {
        await NotifyLateAssignmentsAsync(db, whatsApp, ct);
        await NotifyMissedExamsAsync(db, whatsApp, ct);
    }

    private static async Task NotifyLateAssignmentsAsync(IApplicationDbContext db, IWhatsAppService whatsApp, CancellationToken ct)
    {
        var now = DateTime.UtcNow;

        var due = await db.Assignments.AsNoTracking()
            .Where(a => a.DueDate != null && a.DueDate <= now && a.DeadlineNotifiedAt == null)
            .Select(a => new
            {
                a.Id,
                a.Title,
                CourseStage = a.Course != null ? (Stage?)a.Course.Stage : null
            })
            .ToListAsync(ct);

        if (due.Count == 0)
            return;

        foreach (var assignment in due)
        {
            var students = await db.Students.AsNoTracking()
                .Where(s => s.IsActive && (assignment.CourseStage == null || s.Stage == assignment.CourseStage))
                .Select(s => new { s.Id, s.FullName, s.GuardianPhone, s.UserId })
                .ToListAsync(ct);

            var submittedIds = await db.AssignmentSubmissions.AsNoTracking()
                .Where(x => x.AssignmentId == assignment.Id)
                .Select(x => x.StudentId)
                .Distinct()
                .ToListAsync(ct);

            var late = students.Where(s => !submittedIds.Contains(s.Id)).ToList();
            if (late.Count == 0)
                continue;

            var notifications = late
                .Where(s => s.UserId > 0)
                .Select(s => new Notification
                {
                    UserId = s.UserId,
                    Title = "واجب متأخر ⏰",
                    Body = $"لم تسلم واجب «{assignment.Title}» — الموعد خلص، كلم الأستاذ",
                    Type = "homework",
                    Link = $"/assignment/{assignment.Id}",
                    CreatedAt = DateTime.UtcNow
                })
                .ToList();

            var sends = late
                .Where(s => !string.IsNullOrWhiteSpace(s.GuardianPhone))
                .Select(async s =>
                {
                    var msg =
                        $"مستر محمد صيام 🏫\n" +
                        $"مع أبو كيان .. الدراسات في أمان 🙏\n\n" +
                        $"عزيزي ولي أمر الطالب/ة {s.FullName} 👋\n\n" +
                        $"انتهى موعد تسليم واجب «{assignment.Title}» ولم يسلمه {s.FullName} بعد.\n" +
                        $"نرجو متابعته معنا حتى لا يتأخر في باقي الواجبات 🙏";
                    try
                    {
                        await whatsApp.SendAsync(NormalizeEgyptianPhone(s.GuardianPhone), msg, CancellationToken.None);
                    }
                    catch
                    {
                        // فشل الإرسال لا يؤثر على بقية الطلاب
                    }
                });

            await Task.WhenAll(sends);

            if (notifications.Count > 0)
            {
                db.Notifications.AddRange(notifications);
                await db.SaveChangesAsync(ct);
            }

            var entity = await db.Assignments.FirstAsync(a => a.Id == assignment.Id, ct);
            entity.DeadlineNotifiedAt = now;
        }

        await db.SaveChangesAsync(ct);
    }

    private static async Task NotifyMissedExamsAsync(IApplicationDbContext db, IWhatsAppService whatsApp, CancellationToken ct)
    {
        var now = DateTime.UtcNow;

        var due = await db.Exams.AsNoTracking()
            .Where(e => e.AvailableUntil != null && e.AvailableUntil <= now && e.DeadlineNotifiedAt == null && e.IsPublished)
            .Select(e => new
            {
                e.Id,
                e.Title,
                CourseStage = e.Course != null ? (Stage?)e.Course.Stage : null
            })
            .ToListAsync(ct);

        if (due.Count == 0)
            return;

        foreach (var exam in due)
        {
            var students = await db.Students.AsNoTracking()
                .Where(s => s.IsActive && (exam.CourseStage == null || s.Stage == exam.CourseStage))
                .Select(s => new { s.Id, s.FullName, s.GuardianPhone, s.UserId })
                .ToListAsync(ct);

            var attemptedIds = await db.ExamAttempts.AsNoTracking()
                .Where(x => x.ExamId == exam.Id)
                .Select(x => x.StudentId)
                .Distinct()
                .ToListAsync(ct);

            var missed = students.Where(s => !attemptedIds.Contains(s.Id)).ToList();
            if (missed.Count == 0)
                continue;

            var notifications = missed
                .Where(s => s.UserId > 0)
                .Select(s => new Notification
                {
                    UserId = s.UserId,
                    Title = "امتحان فاتك ⏰",
                    Body = $"لم تدخل امتحان «{exam.Title}» — الموعد خلص",
                    Type = "exam",
                    Link = "/courses",
                    CreatedAt = DateTime.UtcNow
                })
                .ToList();

            var sends = missed
                .Where(s => !string.IsNullOrWhiteSpace(s.GuardianPhone))
                .Select(async s =>
                {
                    var msg =
                        $"مستر محمد صيام 🏫\n" +
                        $"مع أبو كيان .. الدراسات في أمان 🙏\n\n" +
                        $"عزيزي ولي أمر الطالب/ة {s.FullName} 👋\n\n" +
                        $"انتهى موعد امتحان «{exam.Title}» على المنصة ولم يدخل {s.FullName} الامتحان.\n" +
                        $"نرجو متابعته معنا حتى لا يتأخر في باقي الامتحانات 🙏";
                    try
                    {
                        await whatsApp.SendAsync(NormalizeEgyptianPhone(s.GuardianPhone), msg, CancellationToken.None);
                    }
                    catch
                    {
                        // فشل الإرسال لا يؤثر على بقية الطلاب
                    }
                });

            await Task.WhenAll(sends);

            if (notifications.Count > 0)
            {
                db.Notifications.AddRange(notifications);
                await db.SaveChangesAsync(ct);
            }

            var entity = await db.Exams.FirstAsync(e => e.Id == exam.Id, ct);
            entity.DeadlineNotifiedAt = now;
        }

        await db.SaveChangesAsync(ct);
    }

    private static string NormalizeEgyptianPhone(string phone)
    {
        var digits = new string(phone.Where(char.IsDigit).ToArray());
        if (digits.Length >= 12 && digits.StartsWith("20")) return "+" + digits;
        if (digits.Length >= 10 && digits.StartsWith("01")) return "+2" + digits;
        return string.IsNullOrWhiteSpace(digits) ? phone : "+" + digits;
    }
}