using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Application.Features.StudentEngagement;
using MrSiam.Domain.Entities;
using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.CenterExams;

public record CenterExamDto
{
    public int Id { get; init; }
    public int CourseId { get; init; }
    public required string CourseTitle { get; init; }
    public required string Title { get; init; }
    public DateOnly ExamDate { get; init; }
    public decimal TotalMarks { get; init; }
    public decimal PassMark { get; init; }
    public string? Notes { get; init; }
    public int ResultsCount { get; init; }
    public decimal AveragePercentage { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record CenterExamResultRowDto
{
    public int StudentId { get; init; }
    public required string StudentName { get; init; }
    public required string StudentCode { get; init; }
    public int? GroupId { get; init; }
    public string? GroupName { get; init; }
    public decimal? Score { get; init; }
    public bool IsAbsent { get; init; }
    public string? Notes { get; init; }
}

public record CenterExamResultInputDto(int StudentId, decimal Score, bool IsAbsent, string? Notes = null);

public record MyCenterExamResultDto
{
    public int ExamId { get; init; }
    public int CourseId { get; init; }
    public required string CourseTitle { get; init; }
    public required string ExamTitle { get; init; }
    public DateOnly ExamDate { get; init; }
    public decimal Score { get; init; }
    public decimal TotalMarks { get; init; }
    public decimal Percentage { get; init; }
    public bool Passed { get; init; }
    public string? Notes { get; init; }
}

public record CreateCenterExamCommand(
    int CourseId,
    string Title,
    DateOnly ExamDate,
    decimal TotalMarks = 100,
    decimal PassMark = 50,
    string? Notes = null) : IRequest<ApiResponse<int>>;

public record UpdateCenterExamCommand(
    int Id,
    string? Title,
    DateOnly? ExamDate,
    decimal? TotalMarks,
    decimal? PassMark,
    string? Notes) : IRequest<ApiResponse<bool>>;

public record DeleteCenterExamCommand(int Id) : IRequest<ApiResponse<bool>>;

public record GetCenterExamsQuery(int? CourseId = null) : IRequest<ApiResponse<IReadOnlyList<CenterExamDto>>>;

public record GetCenterExamResultsQuery(int CenterExamId) : IRequest<ApiResponse<IReadOnlyList<CenterExamResultRowDto>>>;

public record SaveCenterExamResultsCommand(int CenterExamId, List<CenterExamResultInputDto> Items)
    : IRequest<ApiResponse<bool>>;

public record GetMyCenterExamResultsQuery : IRequest<ApiResponse<IReadOnlyList<MyCenterExamResultDto>>>;

public class CreateCenterExamCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CreateCenterExamCommand, ApiResponse<int>>
{
    public async Task<ApiResponse<int>> Handle(CreateCenterExamCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return ApiResponse<int>.Fail("اسم الامتحان مطلوب");
        if (request.TotalMarks <= 0)
            return ApiResponse<int>.Fail("الدرجة الكلية لازم تكون أكبر من صفر");
        if (request.PassMark < 0 || request.PassMark > request.TotalMarks)
            return ApiResponse<int>.Fail("درجة النجاح لازم تكون من 0 لحد الدرجة الكلية");

        if (!await db.Courses.AnyAsync(c => c.Id == request.CourseId, ct))
            return ApiResponse<int>.Fail("المادة غير موجودة");

        var exam = new CenterExam
        {
            CourseId = request.CourseId,
            Title = request.Title.Trim(),
            ExamDate = request.ExamDate,
            TotalMarks = request.TotalMarks,
            PassMark = request.PassMark,
            Notes = request.Notes?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        db.CenterExams.Add(exam);
        await db.SaveChangesAsync(ct);
        return ApiResponse<int>.Ok(exam.Id, "تمت إضافة امتحان السنتر");
    }
}

public class UpdateCenterExamCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateCenterExamCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(UpdateCenterExamCommand request, CancellationToken ct)
    {
        var exam = await db.CenterExams.FirstOrDefaultAsync(x => x.Id == request.Id, ct);
        if (exam is null)
            return ApiResponse<bool>.Fail("امتحان السنتر غير موجود");

        if (!string.IsNullOrWhiteSpace(request.Title))
            exam.Title = request.Title.Trim();
        if (request.ExamDate is not null)
            exam.ExamDate = request.ExamDate.Value;
        if (request.TotalMarks is not null)
        {
            if (request.TotalMarks <= 0)
                return ApiResponse<bool>.Fail("الدرجة الكلية لازم تكون أكبر من صفر");
            exam.TotalMarks = request.TotalMarks.Value;
        }
        if (request.PassMark is not null)
        {
            if (request.PassMark < 0 || request.PassMark > exam.TotalMarks)
                return ApiResponse<bool>.Fail("درجة النجاح لازم تكون من 0 لحد الدرجة الكلية");
            exam.PassMark = request.PassMark.Value;
        }
        if (request.Notes is not null)
            exam.Notes = request.Notes.Trim();

        await db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true, "تم تعديل امتحان السنتر");
    }
}

public class DeleteCenterExamCommandHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteCenterExamCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(DeleteCenterExamCommand request, CancellationToken ct)
    {
        var exam = await db.CenterExams.FirstOrDefaultAsync(x => x.Id == request.Id, ct);
        if (exam is null)
            return ApiResponse<bool>.Fail("امتحان السنتر غير موجود");

        db.CenterExams.Remove(exam);
        await db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true, "تم حذف امتحان السنتر");
    }
}

public class GetCenterExamsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetCenterExamsQuery, ApiResponse<IReadOnlyList<CenterExamDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<CenterExamDto>>> Handle(GetCenterExamsQuery request, CancellationToken ct)
    {
        var query = db.CenterExams.AsNoTracking();
        if (request.CourseId is not null)
            query = query.Where(x => x.CourseId == request.CourseId);

        var exams = await query
            .OrderByDescending(x => x.ExamDate)
            .Select(x => new
            {
                x.Id,
                x.CourseId,
                CourseTitle = x.Course != null ? x.Course.Title : string.Empty,
                x.Title,
                x.ExamDate,
                x.TotalMarks,
                x.PassMark,
                x.Notes,
                x.CreatedAt,
                ResultsCount = x.Results.Count,
                TotalScore = x.Results.Sum(r => r.Score)
            })
            .ToListAsync(ct);

        var result = exams.Select(x => new CenterExamDto
        {
            Id = x.Id,
            CourseId = x.CourseId,
            CourseTitle = x.CourseTitle,
            Title = x.Title,
            ExamDate = x.ExamDate,
            TotalMarks = x.TotalMarks,
            PassMark = x.PassMark,
            Notes = x.Notes,
            CreatedAt = x.CreatedAt,
            ResultsCount = x.ResultsCount,
            AveragePercentage = x.ResultsCount > 0
                ? Math.Round(x.TotalScore / x.ResultsCount / x.TotalMarks * 100m, 1)
                : 0
        }).ToList();

        return ApiResponse<IReadOnlyList<CenterExamDto>>.Ok(result);
    }
}

public class GetCenterExamResultsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetCenterExamResultsQuery, ApiResponse<IReadOnlyList<CenterExamResultRowDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<CenterExamResultRowDto>>> Handle(GetCenterExamResultsQuery request, CancellationToken ct)
    {
        if (!await db.CenterExams.AnyAsync(x => x.Id == request.CenterExamId, ct))
            return ApiResponse<IReadOnlyList<CenterExamResultRowDto>>.Fail("امتحان السنتر غير موجود");

        var students = await db.Students.AsNoTracking()
            .Where(s => s.IsActive)
            .OrderBy(s => s.Stage)
            .ThenBy(s => s.FullName)
            .ToListAsync(ct);

        var results = await db.CenterExamResults.AsNoTracking()
            .Where(r => r.CenterExamId == request.CenterExamId)
            .ToDictionaryAsync(r => r.StudentId, ct);

        var memberships = await db.StudyGroupMembers.AsNoTracking()
            .Where(m => m.Group != null && m.Group.IsActive)
            .Select(m => new { m.StudentId, m.Group!.Id, m.Group!.Name })
            .ToListAsync(ct);

        var groupByStudent = memberships
            .GroupBy(m => m.StudentId)
            .ToDictionary(g => g.Key, g => g.OrderBy(x => x.Id).First());

        var rows = students.Select(s =>
        {
            results.TryGetValue(s.Id, out var result);
            groupByStudent.TryGetValue(s.Id, out var group);
            return new CenterExamResultRowDto
            {
                StudentId = s.Id,
                StudentName = s.FullName,
                StudentCode = s.StudentCode,
                GroupId = group?.Id,
                GroupName = group?.Name,
                Score = result?.Score,
                IsAbsent = result?.IsAbsent ?? false,
                Notes = result?.Notes
            };
        }).ToList();

        return ApiResponse<IReadOnlyList<CenterExamResultRowDto>>.Ok(rows);
    }
}

public class SaveCenterExamResultsCommandHandler(
    IApplicationDbContext db,
    IWhatsAppService whatsApp)
    : IRequestHandler<SaveCenterExamResultsCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(SaveCenterExamResultsCommand request, CancellationToken ct)
    {
        if (request.Items.Count == 0)
            return ApiResponse<bool>.Fail("اختر درجة لطالب واحد على الأقل");

        var exam = await db.CenterExams
            .AsNoTracking()
            .Where(x => x.Id == request.CenterExamId)
            .Select(x => new { x.Id, x.Title, x.TotalMarks, x.PassMark })
            .FirstOrDefaultAsync(ct);
        if (exam is null)
            return ApiResponse<bool>.Fail("امتحان السنتر غير موجود");

        var invalid = request.Items.FirstOrDefault(i => i.Score < 0 || i.Score > exam.TotalMarks);
        if (invalid is not null)
            return ApiResponse<bool>.Fail("في درجة أكبر من الدرجة الكلية أو سالبة");

        var studentIds = request.Items.Select(i => i.StudentId).ToHashSet();
        var existing = await db.CenterExamResults
            .Where(r => r.CenterExamId == request.CenterExamId && studentIds.Contains(r.StudentId))
            .ToDictionaryAsync(r => r.StudentId, ct);

        var notifiedIds = new List<int>();

        foreach (var item in request.Items)
        {
            if (existing.TryGetValue(item.StudentId, out var result))
            {
                var changed = result.Score != item.Score || result.IsAbsent != item.IsAbsent;
                result.Score = item.Score;
                result.IsAbsent = item.IsAbsent;
                result.Notes = item.Notes?.Trim();
                result.RecordedAt = DateTime.UtcNow;
                if (changed && !item.IsAbsent)
                    notifiedIds.Add(item.StudentId);
            }
            else
            {
                db.CenterExamResults.Add(new CenterExamResult
                {
                    CenterExamId = request.CenterExamId,
                    StudentId = item.StudentId,
                    Score = item.Score,
                    IsAbsent = item.IsAbsent,
                    Notes = item.Notes?.Trim(),
                    RecordedAt = DateTime.UtcNow
                });
                if (!item.IsAbsent)
                    notifiedIds.Add(item.StudentId);
            }
        }

        await db.SaveChangesAsync(ct);

        if (notifiedIds.Count > 0)
            _ = CenterExamNotifier.SendAsync(db, whatsApp, notifiedIds, exam.Title, exam.TotalMarks, exam.PassMark, ct);

        return ApiResponse<bool>.Ok(true, "تم حفظ درجات الامتحان");
    }
}

public class GetMyCenterExamResultsQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetMyCenterExamResultsQuery, ApiResponse<IReadOnlyList<MyCenterExamResultDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<MyCenterExamResultDto>>> Handle(GetMyCenterExamResultsQuery request, CancellationToken ct)
    {
        if (currentUser.Role != Role.Student || currentUser.UserId is not int userId)
            return ApiResponse<IReadOnlyList<MyCenterExamResultDto>>.Fail("الطالب فقط هو اللي يشوف نتايجه");

        var student = await db.Students
            .Where(s => s.UserId == userId)
            .Select(s => new { s.Id })
            .FirstOrDefaultAsync(ct);
        if (student is null)
            return ApiResponse<IReadOnlyList<MyCenterExamResultDto>>.Fail("سجل الطالب غير موجود");

        var list = await db.CenterExamResults
            .AsNoTracking()
            .Where(r => r.StudentId == student.Id)
            .OrderByDescending(r => r.Exam!.ExamDate)
            .Select(r => new MyCenterExamResultDto
            {
                ExamId = r.CenterExamId,
                CourseId = r.Exam!.CourseId,
                CourseTitle = r.Exam.Course != null ? r.Exam.Course.Title : string.Empty,
                ExamTitle = r.Exam.Title,
                ExamDate = r.Exam.ExamDate,
                Score = r.Score,
                TotalMarks = r.Exam.TotalMarks,
                Percentage = r.Exam.TotalMarks > 0 ? Math.Round(r.Score / r.Exam.TotalMarks * 100m, 1) : 0,
                Passed = r.Exam.TotalMarks > 0 && r.Score >= r.Exam.PassMark,
                Notes = r.Notes
            })
            .ToListAsync(ct);

        return ApiResponse<IReadOnlyList<MyCenterExamResultDto>>.Ok(list);
    }
}

/// <summary>
/// يبعت لولي الأمر نتيجة امتحان السنتر ويبلغ الطالب داخل المنصة.
/// </summary>
internal static class CenterExamNotifier
{
    public static async Task SendAsync(
        IApplicationDbContext db,
        IWhatsAppService whatsApp,
        IEnumerable<int> studentIds,
        string examTitle,
        decimal totalMarks,
        decimal passMark,
        CancellationToken ct)
    {
        var ids = studentIds.ToList();
        var students = await db.Students.AsNoTracking()
            .Where(s => ids.Contains(s.Id) && s.IsActive)
            .Select(s => new { s.Id, s.FullName, s.GuardianPhone, s.UserId })
            .ToListAsync(ct);

        var results = await db.CenterExamResults.AsNoTracking()
            .Where(r => ids.Contains(r.StudentId))
            .GroupBy(r => r.StudentId)
            .Select(g => new { StudentId = g.Key, Latest = g.OrderByDescending(r => r.RecordedAt).First() })
            .ToDictionaryAsync(x => x.StudentId, ct);

        foreach (var student in students)
        {
            if (!results.TryGetValue(student.Id, out var result) || result.Latest.IsAbsent)
                continue;

            var percentage = totalMarks > 0 ? Math.Round(result.Latest.Score / totalMarks * 100m, 1) : 0;
            var passed = result.Latest.Score >= passMark;

            if (student.UserId > 0)
            {
                await NotificationService.PushAsync(db, student.UserId,
                    "نتيجة امتحان السنتر 🏛️",
                    $"درجتك في «{examTitle}» = {ArabicText.ToArabicDigits(result.Latest.Score.ToString("N1"))}/{ArabicText.ToArabicDigits(totalMarks.ToString("N1"))}",
                    "grade", "/my-results", ct);
            }

            if (!string.IsNullOrWhiteSpace(student.GuardianPhone))
            {
                try
                {
                    var message = BuildResultMessage(student.FullName, examTitle, result.Latest.Score, totalMarks, percentage, passed);
                    _ = whatsApp.SendAsync(NormalizeEgyptianPhone(student.GuardianPhone), message, CancellationToken.None);
                }
                catch
                {
                    // فشل الإرسال مش بيوقف تسجيل الدرجات
                }
            }
        }
    }

    private static string BuildResultMessage(string studentName, string examTitle, decimal score, decimal totalMarks, decimal percentage, bool passed)
    {
        var status = passed
            ? "🎉 نتيجة ممتازة — مبروك!"
            : "💪 محتاجة مراجعة — حاول تاني";

        return $"مستر محمد صيام 🏫\n" +
               $"مع أبو كيان .. الدراسات في أمان 🙏\n\n" +
               $"عزيزي ولي أمر الطالب/ة {studentName} 👋\n\n" +
               $"نتيجة امتحان السنتر «{examTitle}»:\n" +
               $"📈 الدرجة: {ArabicText.ToArabicDigits(score.ToString("N1"))}/{ArabicText.ToArabicDigits(totalMarks.ToString("N1"))} — {ArabicText.ToArabicDigits(percentage.ToString("N1"))}%\n\n" +
               $"{status}";
    }

    private static string NormalizeEgyptianPhone(string phone)
    {
        var digits = new string(phone.Where(char.IsDigit).ToArray());
        if (digits.Length >= 12 && digits.StartsWith("20")) return "+" + digits;
        if (digits.Length >= 10 && digits.StartsWith("01")) return "+2" + digits;
        return string.IsNullOrWhiteSpace(digits) ? phone : "+" + digits;
    }
}