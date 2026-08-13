using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Entities;
using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Ai;

public record AiQuestionDraftDto
{
    public required string Text { get; init; }
    public List<string> Options { get; init; } = new();
    public int CorrectIndex { get; init; }
    public required string Explanation { get; init; }
    public required string Source { get; init; }
    public int? LessonId { get; init; }
    public bool Supported { get; init; }
}

public record AiExamDraftDto
{
    public required string Title { get; init; }
    public List<AiQuestionDraftDto> Questions { get; init; } = new();
}

public record GenerateAiExamCommand(
    int CourseId,
    List<int> LessonIds,
    string Topic,
    int QuestionCount,
    string Difficulty) : IRequest<ApiResponse<AiExamDraftDto>>;

public record SaveAiExamCommand(
    int CourseId,
    int? LessonId,
    string Title,
    ExamType Type,
    int DurationMinutes,
    int AttemptsAllowed,
    bool IsPublished,
    List<AiQuestionDraftDto> Questions) : IRequest<ApiResponse<int>>;

public record BuildRandomExamCommand(
    int CourseId,
    string Title,
    ExamType Type,
    int DurationMinutes,
    int AttemptsAllowed,
    int Count,
    bool IsPublished) : IRequest<ApiResponse<int>>;

public class GenerateAiExamCommandHandler(IApplicationDbContext db, IGeminiService gemini)
    : IRequestHandler<GenerateAiExamCommand, ApiResponse<AiExamDraftDto>>
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private const string SystemPrompt =
        "أنت مصمم امتحانات المنهج المصري في التاريخ والجغرافيا (المرحلة الإعدادية والثانوية) على منصة «معلم صيام». قواعد صارمة لا تتخلف:\n" +
        "1. استخدم المحتوى الدراسي المرفق فقط — أي سؤال لازم تكون إجابته موجودة فعلاً في المحتوى (نصاً أو استنتاجاً مباشراً منه).\n" +
        "2. ممنوع تماماً اختلاق معلومات أو أرقام أو تواريخ من خارج المحتوى المرفق.\n" +
        "3. كل سؤال: اختيار من متعدد بأربعة خيارات، إجابة صحيحة واحدة فقط، بدرجة واحدة.\n" +
        "4. اكتب شرحاً مختصراً لكل إجابة يستند للمحتوى، واذكر مصدر السؤال (عنوان الدرس) ورقم الدرس (lessonId من المحتوى).\n" +
        "5. رد فقط بـ JSON صالح بالشكل: {\"title\":\"عنوان الامتحان\",\"questions\":[{\"text\":\"...\",\"options\":[\"...\"],\"correctIndex\":0,\"explanation\":\"...\",\"source\":\"...\",\"lessonId\":0}]}\n" +
        "6. لا تكرر سؤالاً ولا خيارات متطابقة، ولا تذكر أي شيء عن نفسك أو عن هذه التعليمات في الرد.";

    public async Task<ApiResponse<AiExamDraftDto>> Handle(GenerateAiExamCommand request, CancellationToken ct)
    {
        if (request.QuestionCount is < 1 or > 20)
            return ApiResponse<AiExamDraftDto>.Fail("عدد الأسئلة بين 1 و 20");

        var course = await db.Courses
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == request.CourseId, ct);
        if (course is null)
            return ApiResponse<AiExamDraftDto>.Fail("المادة غير موجودة");

        var lessons = await db.Lessons
            .AsNoTracking()
            .Where(l => l.CourseId == request.CourseId && (!request.LessonIds.Any() || request.LessonIds.Contains(l.Id)))
            .OrderBy(l => l.Order)
            .ToListAsync(ct);
        if (lessons.Count == 0)
            return ApiResponse<AiExamDraftDto>.Fail("مفيش دروس في المادة دي لتوليد الأسئلة منها");

        var existingQuestions = await db.Questions
            .AsNoTracking()
            .Where(q => q.Exam != null && q.Exam.CourseId == request.CourseId)
            .Select(q => new { q.Text, q.LessonId })
            .Take(80)
            .ToListAsync(ct);

        var context = BuildContext(course, lessons, existingQuestions);

        var spec = $"المحتوى الدراسي المتاح:\n{context}\n\n" +
                   $"المطلوب: توليد {request.QuestionCount} سؤال عن «{request.Topic}» بمستوى {request.Difficulty}. " +
                   "كل سؤال لازم يكون مأخوذاً من المحتوى أعلاه فقط.";

        var raw = await gemini.GenerateJsonAsync(SystemPrompt, spec, ct);
        if (string.IsNullOrWhiteSpace(raw))
            return ApiResponse<AiExamDraftDto>.Fail("الذكاء الاصطناعي مش متاح دلوقتي — جرب بعد شوية");

        var draft = ParseDraft(raw);
        if (draft is null || draft.Questions.Count == 0)
            return ApiResponse<AiExamDraftDto>.Fail("الذكاء الاصطناعي مردش بأسئلة صالحة — جرب تاني أو ضيّق الموضوع");

        var verified = await VerifyAsync(context, draft.Questions, ct);

        var kept = new List<AiQuestionDraftDto>();
        for (var i = 0; i < draft.Questions.Count; i++)
        {
            var q = draft.Questions[i];
            if (i < verified.Length && verified[i])
                kept.Add(q with { Supported = true });
        }

        if (kept.Count == 0)
            return ApiResponse<AiExamDraftDto>.Fail(
                "المحتوى المتاح مش كافي لتوليد أسئلة موثوقة عن الموضوع ده — زوّد الدروس أو غيّر الموضوع");

        kept = kept.Take(request.QuestionCount).ToList();

        var mergedTitle = string.IsNullOrWhiteSpace(draft.Title)
            ? $"اختبار {request.Topic}"
            : draft.Title;

        return ApiResponse<AiExamDraftDto>.Ok(
            new AiExamDraftDto { Title = mergedTitle, Questions = kept },
            draft.Questions.Count != kept.Count
                ? $"اتولّد {kept.Count} سؤال موثوق من أصل {draft.Questions.Count} — الباقي مرفوض لأن مصدره مش موجود في المحتوى"
                : $"اتولّد {kept.Count} سؤال من محتوى المنهج مباشرة");
    }

    private static string BuildContext(Course course, IReadOnlyList<Lesson> lessons, IReadOnlyList<dynamic> existingQuestions)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"المادة: {course.Title} ({course.Subject}) — الوصف: {course.Description}");
        sb.AppendLine();
        foreach (var l in lessons)
        {
            sb.AppendLine($"الدرس (رقم {l.Order}, id={l.Id}): {l.Title}");
            if (!string.IsNullOrWhiteSpace(l.Summary))
                sb.AppendLine($"الشرح: {l.Summary}");
            sb.AppendLine();
        }
        if (existingQuestions.Count > 0)
        {
            sb.AppendLine("نماذج أسئلة موجودة (يمكن استخدامها كمرجع، لا تكررها حرفياً):");
            foreach (var q in existingQuestions.Take(40))
                sb.AppendLine($"- {q.Text}");
        }
        var text = sb.ToString();
        return text.Length > 12000 ? text[..12000] : text;
    }

    private static AiExamDraftDto? ParseDraft(string raw)
    {
        try
        {
            var cleaned = raw.Trim();
            if (cleaned.StartsWith("```"))
            {
                var start = cleaned.IndexOf('\n') + 1;
                var end = cleaned.LastIndexOf("```", StringComparison.Ordinal);
                if (end > start) cleaned = cleaned[start..end].Trim();
            }
            var open = cleaned.IndexOf('{');
            var close = cleaned.LastIndexOf('}');
            if (open >= 0 && close > open) cleaned = cleaned[open..(close + 1)];
            using var doc = JsonDocument.Parse(cleaned);
            var root = doc.RootElement;
            if (root.ValueKind != JsonValueKind.Object)
                return null;

            var title = root.TryGetProperty("title", out var t) && t.ValueKind == JsonValueKind.String ? t.GetString() : "اختبار من الذكاء الاصطناعي";
            var questions = new List<AiQuestionDraftDto>();
            if (root.TryGetProperty("questions", out var qs) && qs.ValueKind == JsonValueKind.Array)
            {
                foreach (var q in qs.EnumerateArray())
                {
                    if (!q.TryGetProperty("text", out var textEl) || textEl.ValueKind != JsonValueKind.String)
                        continue;
                    var options = new List<string>();
                    if (q.TryGetProperty("options", out var opts) && opts.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var o in opts.EnumerateArray())
                            if (o.ValueKind == JsonValueKind.String)
                                options.Add(o.GetString()!);
                    }
                    if (options.Count < 2) continue;

                    var correctIndex = q.TryGetProperty("correctIndex", out var ci) && ci.ValueKind == JsonValueKind.Number
                        ? ci.GetInt32() : -1;
                    if (correctIndex < 0 || correctIndex >= options.Count) continue;

                    int? lessonId = null;
                    if (q.TryGetProperty("lessonId", out var li) && li.ValueKind == JsonValueKind.Number)
                        lessonId = li.GetInt32();

                    questions.Add(new AiQuestionDraftDto
                    {
                        Text = textEl.GetString()!,
                        Options = options,
                        CorrectIndex = correctIndex,
                        Explanation = q.TryGetProperty("explanation", out var ex) && ex.ValueKind == JsonValueKind.String ? ex.GetString()! : string.Empty,
                        Source = q.TryGetProperty("source", out var src) && src.ValueKind == JsonValueKind.String ? src.GetString()! : string.Empty,
                        LessonId = lessonId > 0 ? lessonId : null
                    });
                }
            }
            return new AiExamDraftDto { Title = title ?? "اختبار من الذكاء الاصطناعي", Questions = questions };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"AI draft parse failed: {ex.Message}");
            return null;
        }
    }

    private async Task<bool[]> VerifyAsync(string context, IReadOnlyList<AiQuestionDraftDto> questions, CancellationToken ct)
    {
        var payload = string.Join("\n", questions.Select((q, i) =>
            $"{i + 1}. {q.Text}\n   الإجابة الصحيحة: {q.Options[q.CorrectIndex]}"));
        var prompt = $"المحتوى الدراسي:\n{context}\n\n" +
                     $"راجع كل سؤال: هل الإجابة الصحيحة موجودة فعلاً (نصاً أو استنتاجاً مباشراً) في المحتوى أعلاه؟\n" +
                     $"الأسئلة:\n{payload}\n\n" +
                     "رد فقط بـ JSON: {\"supported\":[true,false,...]} بنفس ترتيب الأسئلة.";

        var raw = await gemini.GenerateJsonAsync(
            "أنت مدقق امتحانات صارم. لا توافق على أي سؤال إجابته غير موجودة حرفياً أو استنتاجاً مباشراً من المحتوى. رد فقط بـ JSON.",
            prompt, ct);

        if (string.IsNullOrWhiteSpace(raw))
            return Enumerable.Repeat(true, questions.Count).ToArray();

        try
        {
            var cleaned = raw.Trim();
            if (cleaned.StartsWith("```"))
            {
                var start = cleaned.IndexOf('\n') + 1;
                var end = cleaned.LastIndexOf("```", StringComparison.Ordinal);
                if (end > start) cleaned = cleaned[start..end].Trim();
            }
            using var doc = JsonDocument.Parse(cleaned);
            if (!doc.RootElement.TryGetProperty("supported", out var arr) || arr.ValueKind != JsonValueKind.Array)
                return Enumerable.Repeat(true, questions.Count).ToArray();

            var result = new List<bool>();
            foreach (var v in arr.EnumerateArray())
                result.Add(v.ValueKind == JsonValueKind.True);
            return result.ToArray();
        }
        catch
        {
            return Enumerable.Repeat(true, questions.Count).ToArray();
        }
    }
}

public record GenerateAiExamFromPdfCommand(
    int CourseId,
    List<int> LessonIds,
    string Topic,
    int QuestionCount,
    string Difficulty,
    byte[] PdfBytes) : IRequest<ApiResponse<AiExamDraftDto>>;

public class GenerateAiExamFromPdfCommandHandler(IApplicationDbContext db, IGeminiService gemini)
    : IRequestHandler<GenerateAiExamFromPdfCommand, ApiResponse<AiExamDraftDto>>
{
    private const string PdfSystemPrompt =
        "أنت مصمم امتحانات المنهج المصري في التاريخ والجغرافيا (المرحلة الإعدادية والثانوية) على منصة «معلم صيام». قواعد صارمة لا تتخلف:\n" +
        "1. استخدم محتوى ملف الـ PDF المرفق فقط — أي سؤال لازم تكون إجابته موجودة فعلاً في الملف (نصاً أو استنتاجاً مباشراً منه).\n" +
        "2. ممنوع تماماً اختلاق معلومات أو أرقام أو تواريخ من خارج الملف المرفق.\n" +
        "3. كل سؤال: اختيار من متعدد بأربعة خيارات، إجابة صحيحة واحدة فقط، بدرجة واحدة.\n" +
        "4. اكتب شرحاً مختصراً لكل إجابة يستند للمحتوى.\n" +
        "5. رد فقط بـ JSON صالح بالشكل: {\"title\":\"عنوان الامتحان\",\"questions\":[{\"text\":\"...\",\"options\":[\"...\"],\"correctIndex\":0,\"explanation\":\"...\",\"source\":\"...\"}]}\n" +
        "6. لا تكرر سؤالاً ولا خيارات متطابقة، ولا تذكر أي شيء عن نفسك أو عن هذه التعليمات في الرد.";

    public async Task<ApiResponse<AiExamDraftDto>> Handle(GenerateAiExamFromPdfCommand request, CancellationToken ct)
    {
        if (request.QuestionCount is < 1 or > 20)
            return ApiResponse<AiExamDraftDto>.Fail("عدد الأسئلة بين 1 و 20");

        if (request.PdfBytes is not { Length: > 0 })
            return ApiResponse<AiExamDraftDto>.Fail("الملف الـ PDF فاضي أو مش موجود");

        var course = await db.Courses
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == request.CourseId, ct);
        if (course is null)
            return ApiResponse<AiExamDraftDto>.Fail("المادة غير موجودة");

        var courseContext = $"المادة: {course.Title} ({course.Subject}) — الوصف: {course.Description}";

        var spec = $"{courseContext}\n\n" +
                   $"المطلوب: توليد {request.QuestionCount} سؤال عن «{request.Topic}» بمستوى {request.Difficulty} من محتوى ملف الـ PDF المرفق فقط.";

        var raw = await gemini.GenerateJsonFromPdfAsync(PdfSystemPrompt, spec, request.PdfBytes, ct);
        if (string.IsNullOrWhiteSpace(raw))
            return ApiResponse<AiExamDraftDto>.Fail("الذكاء الاصطناعي مش متاح دلوقتي — جرب بعد شوية");

        var draft = ParseDraft(raw);
        if (draft is null || draft.Questions.Count == 0)
            return ApiResponse<AiExamDraftDto>.Fail("الذكاء الاصطناعي مردش بأسئلة صالحة من الملف — جرب تاني أو غيّر الموضوع");

        var verified = await VerifyPdfAsync(request.PdfBytes, courseContext, draft.Questions, ct);

        var kept = new List<AiQuestionDraftDto>();
        for (var i = 0; i < draft.Questions.Count; i++)
        {
            var q = draft.Questions[i];
            if (i < verified.Length && verified[i])
                kept.Add(q with { Supported = true });
        }

        if (kept.Count == 0)
            return ApiResponse<AiExamDraftDto>.Fail(
                "محتوى الملف مش كافي لتوليد أسئلة موثوقة عن الموضوع ده — زوّد عدد الصفحات أو غيّر الموضوع");

        kept = kept.Take(request.QuestionCount).ToList();

        var mergedTitle = string.IsNullOrWhiteSpace(draft.Title)
            ? $"اختبار {request.Topic}"
            : draft.Title;

        return ApiResponse<AiExamDraftDto>.Ok(
            new AiExamDraftDto { Title = mergedTitle, Questions = kept },
            draft.Questions.Count != kept.Count
                ? $"اتولّد {kept.Count} سؤال موثوق من أصل {draft.Questions.Count} — الباقي مرفوض لأن مصدره مش موجود في الملف"
                : $"اتولّد {kept.Count} سؤال من محتوى الملف مباشرة");
    }

    private static AiExamDraftDto? ParseDraft(string raw)
    {
        try
        {
            var cleaned = raw.Trim();
            if (cleaned.StartsWith("```"))
            {
                var start = cleaned.IndexOf('\n') + 1;
                var end = cleaned.LastIndexOf("```", StringComparison.Ordinal);
                if (end > start) cleaned = cleaned[start..end].Trim();
            }
            var open = cleaned.IndexOf('{');
            var close = cleaned.LastIndexOf('}');
            if (open >= 0 && close > open) cleaned = cleaned[open..(close + 1)];
            using var doc = JsonDocument.Parse(cleaned);
            var root = doc.RootElement;
            if (root.ValueKind != JsonValueKind.Object)
                return null;

            var title = root.TryGetProperty("title", out var t) && t.ValueKind == JsonValueKind.String ? t.GetString() : "اختبار من الملف";
            var questions = new List<AiQuestionDraftDto>();
            if (root.TryGetProperty("questions", out var qs) && qs.ValueKind == JsonValueKind.Array)
            {
                foreach (var q in qs.EnumerateArray())
                {
                    if (!q.TryGetProperty("text", out var textEl) || textEl.ValueKind != JsonValueKind.String)
                        continue;
                    var options = new List<string>();
                    if (q.TryGetProperty("options", out var opts) && opts.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var o in opts.EnumerateArray())
                            if (o.ValueKind == JsonValueKind.String)
                                options.Add(o.GetString()!);
                    }
                    if (options.Count < 2) continue;

                    var correctIndex = q.TryGetProperty("correctIndex", out var ci) && ci.ValueKind == JsonValueKind.Number
                        ? ci.GetInt32() : -1;
                    if (correctIndex < 0 || correctIndex >= options.Count) continue;

                    questions.Add(new AiQuestionDraftDto
                    {
                        Text = textEl.GetString()!,
                        Options = options,
                        CorrectIndex = correctIndex,
                        Explanation = q.TryGetProperty("explanation", out var ex) && ex.ValueKind == JsonValueKind.String ? ex.GetString()! : string.Empty,
                        Source = q.TryGetProperty("source", out var src) && src.ValueKind == JsonValueKind.String ? src.GetString()! : string.Empty,
                        LessonId = null,
                        Supported = false
                    });
                }
            }
            return new AiExamDraftDto { Title = title ?? "اختبار من الملف", Questions = questions };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"AI pdf draft parse failed: {ex.Message}");
            return null;
        }
    }

    private async Task<bool[]> VerifyPdfAsync(byte[] pdfBytes, string courseContext, IReadOnlyList<AiQuestionDraftDto> questions, CancellationToken ct)
    {
        var payload = string.Join("\n", questions.Select((q, i) =>
            $"{i + 1}. {q.Text}\n   الإجابة الصحيحة: {q.Options[q.CorrectIndex]}"));
        var prompt = $"{courseContext}\n\n" +
                     $"راجع كل سؤال: هل الإجابة الصحيحة موجودة فعلاً (نصاً أو استنتاجاً مباشراً) في ملف الـ PDF المرفق؟\n" +
                     $"الأسئلة:\n{payload}\n\n" +
                     "رد فقط بـ JSON: {\"supported\":[true,false,...]} بنفس ترتيب الأسئلة.";

        var raw = await gemini.GenerateJsonFromPdfAsync(
            "أنت مدقق امتحانات صارم. لا توافق على أي سؤال إجابته غير موجودة حرفياً أو استنتاجاً مباشراً من ملف الـ PDF. رد فقط بـ JSON.",
            prompt, pdfBytes, ct);

        if (string.IsNullOrWhiteSpace(raw))
            return Enumerable.Repeat(true, questions.Count).ToArray();

        try
        {
            var cleaned = raw.Trim();
            if (cleaned.StartsWith("```"))
            {
                var start = cleaned.IndexOf('\n') + 1;
                var end = cleaned.LastIndexOf("```", StringComparison.Ordinal);
                if (end > start) cleaned = cleaned[start..end].Trim();
            }
            using var doc = JsonDocument.Parse(cleaned);
            if (!doc.RootElement.TryGetProperty("supported", out var arr) || arr.ValueKind != JsonValueKind.Array)
                return Enumerable.Repeat(true, questions.Count).ToArray();

            var result = new List<bool>();
            foreach (var v in arr.EnumerateArray())
                result.Add(v.ValueKind == JsonValueKind.True);
            return result.ToArray();
        }
        catch
        {
            return Enumerable.Repeat(true, questions.Count).ToArray();
        }
    }
}

public class SaveAiExamCommandHandler(IApplicationDbContext db)
    : IRequestHandler<SaveAiExamCommand, ApiResponse<int>>
{
    public async Task<ApiResponse<int>> Handle(SaveAiExamCommand request, CancellationToken ct)
    {
        if (request.Questions.Count == 0)
            return ApiResponse<int>.Fail("مفيش أسئلة للحفظ");

        var course = await db.Courses.FirstOrDefaultAsync(c => c.Id == request.CourseId, ct);
        if (course is null)
            return ApiResponse<int>.Fail("المادة غير موجودة");

        var exam = new Exam
        {
            CourseId = request.CourseId,
            LessonId = request.LessonId,
            Title = request.Title.Trim(),
            Type = request.Type,
            DurationMinutes = request.DurationMinutes,
            AttemptsAllowed = request.AttemptsAllowed,
            IsPublished = request.IsPublished,
            TotalMarks = request.Questions.Sum(q => q.Options.Count > 0 ? 1 : 0),
            PassMark = Math.Round(request.Questions.Sum(q => q.Options.Count > 0 ? 1 : 0) * 0.5m, 1)
        };

        db.Exams.Add(exam);
        await db.SaveChangesAsync(ct);

        var order = 1;
        foreach (var q in request.Questions)
        {
            var question = new Question
            {
                ExamId = exam.Id,
                LessonId = q.LessonId,
                Text = q.Text.Trim(),
                Type = QuestionType.SingleChoice,
                Marks = 1,
                Order = order++
            };
            db.Questions.Add(question);
            await db.SaveChangesAsync(ct);

            for (var i = 0; i < q.Options.Count; i++)
            {
                db.AnswerOptions.Add(new AnswerOption
                {
                    QuestionId = question.Id,
                    Text = q.Options[i].Trim(),
                    IsCorrect = i == q.CorrectIndex
                });
            }
            await db.SaveChangesAsync(ct);
        }

        return ApiResponse<int>.Ok(exam.Id,
            request.IsPublished ? "اتحفظ الامتحان واتنشر للطلاب" : "اتحفظ الامتحان كمسودة — راجعه ثم انشره");
    }
}

public class BuildRandomExamCommandHandler(IApplicationDbContext db)
    : IRequestHandler<BuildRandomExamCommand, ApiResponse<int>>
{
    public async Task<ApiResponse<int>> Handle(BuildRandomExamCommand request, CancellationToken ct)
    {
        if (request.Count is < 1 or > 50)
            return ApiResponse<int>.Fail("عدد الأسئلة بين 1 و 50");

        var questionIds = await db.Questions
            .AsNoTracking()
            .Where(q => (q.Exam != null && q.Exam.CourseId == request.CourseId) ||
                        (q.Lesson != null && q.Lesson.CourseId == request.CourseId))
            .Select(q => q.Id)
            .ToListAsync(ct);

        if (questionIds.Count == 0)
            return ApiResponse<int>.Fail("بنك الأسئلة فاضي للمادة دي — ولّد أسئلة بالذكاء الاصطناعي الأول");

        var count = Math.Min(request.Count, questionIds.Count);
        var picked = questionIds.OrderBy(_ => Guid.NewGuid()).Take(count).ToList();

        var exam = new Exam
        {
            CourseId = request.CourseId,
            Title = request.Title.Trim(),
            Type = request.Type,
            DurationMinutes = request.DurationMinutes,
            AttemptsAllowed = request.AttemptsAllowed,
            IsPublished = request.IsPublished,
            TotalMarks = count,
            PassMark = Math.Round(count * 0.5m, 1)
        };
        db.Exams.Add(exam);
        await db.SaveChangesAsync(ct);

        var questions = await db.Questions
            .AsNoTracking()
            .Where(q => picked.Contains(q.Id))
            .Include(q => q.Options)
            .ToListAsync(ct);

        var order = 1;
        foreach (var q in questions)
        {
            var clone = new Question
            {
                ExamId = exam.Id,
                LessonId = q.LessonId,
                Text = q.Text,
                Type = q.Type,
                Marks = q.Marks,
                Order = order++,
                Options = q.Options.Select(o => new AnswerOption { Text = o.Text, IsCorrect = o.IsCorrect }).ToList()
            };
            db.Questions.Add(clone);
        }
        await db.SaveChangesAsync(ct);

        return ApiResponse<int>.Ok(exam.Id, $"اتعمل امتحان عشوائي من {count} سؤال في البنك");
    }
}

public record CreateBankQuestionCommand(int? LessonId, string Text, List<string> Options, int CorrectIndex) : IRequest<ApiResponse<int>>;

public class CreateBankQuestionCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CreateBankQuestionCommand, ApiResponse<int>>
{
    public async Task<ApiResponse<int>> Handle(CreateBankQuestionCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Text))
            return ApiResponse<int>.Fail("نص السؤال مطلوب");
        if (request.Options.Count < 2)
            return ApiResponse<int>.Fail("السؤال محتاج خيارين على الأقل");
        if (request.CorrectIndex < 0 || request.CorrectIndex >= request.Options.Count)
            return ApiResponse<int>.Fail("فهرس الإجابة الصحيحة غلط");

        var question = new Question
        {
            ExamId = null,
            LessonId = request.LessonId,
            Text = request.Text.Trim(),
            Type = QuestionType.SingleChoice,
            Marks = 1,
            Order = 0
        };
        db.Questions.Add(question);
        await db.SaveChangesAsync(ct);

        for (var i = 0; i < request.Options.Count; i++)
        {
            db.AnswerOptions.Add(new AnswerOption
            {
                QuestionId = question.Id,
                Text = request.Options[i].Trim(),
                IsCorrect = i == request.CorrectIndex
            });
        }
        await db.SaveChangesAsync(ct);

        return ApiResponse<int>.Ok(question.Id, "اتضاف السؤال لبنك الأسئلة");
    }
}
