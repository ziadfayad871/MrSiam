using System.Text.Json;
using System.Text.Json.Serialization;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Entities;

namespace MrSiam.Application.Features.Study;

public record StudySummaryResultDto
{
    public required string Title { get; init; }
    public List<string> Bullets { get; init; } = new();
}

public record FlashcardDto
{
    public required string Front { get; init; }
    public required string Back { get; init; }
}

public record ComparePointDto
{
    public required string Aspect { get; init; }
    public required string First { get; init; }
    public required string Second { get; init; }
}

public record CompareResultDto
{
    public required string TopicA { get; init; }
    public required string TopicB { get; init; }
    public List<ComparePointDto> Points { get; init; } = new();
}

public record BuildLessonSummaryCommand(int LessonId, int MaxWords) : IRequest<ApiResponse<StudySummaryResultDto>>;

public record BuildFlashcardsCommand(int LessonId, int Count) : IRequest<ApiResponse<List<FlashcardDto>>>;

public record CompareTopicsCommand(int CourseId, string TopicA, string TopicB) : IRequest<ApiResponse<CompareResultDto>>;

public abstract class StudyAssistantBase(IGeminiService gemini)
{
    protected static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    protected static string LessonContext(Lesson lesson) =>
        $"الدرس: {lesson.Title}\nالمحتوى: {lesson.Summary}";

    protected static string CourseContext(IEnumerable<Lesson> lessons)
    {
        var parts = new List<string>();
        foreach (var l in lessons.OrderBy(x => x.Order))
            parts.Add($"[{l.Title}]\n{l.Summary}");
        return string.Join("\n\n", parts);
    }

    protected static string? CleanJson(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        var cleaned = raw.Trim();
        if (cleaned.StartsWith("```"))
        {
            var start = cleaned.IndexOf('\n') + 1;
            var end = cleaned.LastIndexOf("```", StringComparison.Ordinal);
            if (end > start) cleaned = cleaned[start..end].Trim();
        }
        return cleaned;
    }
}

public class BuildLessonSummaryCommandHandler(IApplicationDbContext db, IGeminiService gemini)
    : StudyAssistantBase(gemini), IRequestHandler<BuildLessonSummaryCommand, ApiResponse<StudySummaryResultDto>>
{
    public async Task<ApiResponse<StudySummaryResultDto>> Handle(BuildLessonSummaryCommand request, CancellationToken ct)
    {
        var lesson = await db.Lessons.AsNoTracking().FirstOrDefaultAsync(l => l.Id == request.LessonId, ct);
        if (lesson is null)
            return ApiResponse<StudySummaryResultDto>.Fail("الدرس غير موجود");

        var maxWords = Math.Clamp(request.MaxWords, 30, 500);
        var system = "أنت مدرّس تاريخ وجغرافيا. لخّص الدرس في نقاط عربية واضحة تعتمد كلياً على المحتوى المقدم فقط، ولا تضيف أي معلومة من خارج المحتوى. التزم حد الكلمات المطلوب.";
        var prompt = $"المحتوى:\n{LessonContext(lesson)}\n\n" +
                     $"اكتب ملخصاً في مدة أقصاها {maxWords} كلمة مقسمة لنقاط. رد فقط بـ JSON: {{\"title\":\"...\",\"bullets\":[\"...\"]}}";

        var raw = await gemini.GenerateJsonAsync(system, prompt, ct);
        var cleaned = CleanJson(raw);
        if (cleaned is null)
            return ApiResponse<StudySummaryResultDto>.Fail("الذكاء الاصطناعي مش متاح دلوقتي — جرب بعد شوية");

        try
        {
            using var doc = JsonDocument.Parse(cleaned);
            var root = doc.RootElement;
            var title = root.TryGetProperty("title", out var t) && t.ValueKind == JsonValueKind.String ? t.GetString()! : lesson.Title;
            var bullets = new List<string>();
            if (root.TryGetProperty("bullets", out var arr) && arr.ValueKind == JsonValueKind.Array)
            {
                foreach (var b in arr.EnumerateArray())
                    if (b.ValueKind == JsonValueKind.String) bullets.Add(b.GetString()!);
            }
            if (bullets.Count == 0)
                return ApiResponse<StudySummaryResultDto>.Fail("الذكاء الاصطناعي مش عارف يلخص الدرس ده — جرب تاني");

            return ApiResponse<StudySummaryResultDto>.Ok(new StudySummaryResultDto { Title = title, Bullets = bullets });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Study summary parse failed: {ex.Message}");
            return ApiResponse<StudySummaryResultDto>.Fail("الذكاء الاصطناعي رجع رد مش مفهوم — جرب تاني");
        }
    }
}

public class BuildFlashcardsCommandHandler(IApplicationDbContext db, IGeminiService gemini)
    : StudyAssistantBase(gemini), IRequestHandler<BuildFlashcardsCommand, ApiResponse<List<FlashcardDto>>>
{
    public async Task<ApiResponse<List<FlashcardDto>>> Handle(BuildFlashcardsCommand request, CancellationToken ct)
    {
        var lesson = await db.Lessons.AsNoTracking().FirstOrDefaultAsync(l => l.Id == request.LessonId, ct);
        if (lesson is null)
            return ApiResponse<List<FlashcardDto>>.Fail("الدرس غير موجود");

        var count = Math.Clamp(request.Count, 3, 20);
        var system = "أنت مدرّس تاريخ وجغرافيا. اصنع بطاقات تعلم من المحتوى المقدم فقط. كل بطاقة: سؤال/مصطلح في front وإجابة قصيرة دقيقة في back. ممنوع إضافة معلومات من خارج المحتوى.";
        var prompt = $"المحتوى:\n{LessonContext(lesson)}\n\n" +
                     $"اصنع {count} بطاقة. رد فقط بـ JSON: {{\"cards\":[{{\"front\":\"...\",\"back\":\"...\"}}]}}";

        var raw = await gemini.GenerateJsonAsync(system, prompt, ct);
        var cleaned = CleanJson(raw);
        if (cleaned is null)
            return ApiResponse<List<FlashcardDto>>.Fail("الذكاء الاصطناعي مش متاح دلوقتي — جرب بعد شوية");

        try
        {
            using var doc = JsonDocument.Parse(cleaned);
            var root = doc.RootElement;
            var cards = new List<FlashcardDto>();
            if (root.TryGetProperty("cards", out var arr) && arr.ValueKind == JsonValueKind.Array)
            {
                foreach (var c in arr.EnumerateArray())
                {
                    if (!c.TryGetProperty("front", out var f) || f.ValueKind != JsonValueKind.String) continue;
                    if (!c.TryGetProperty("back", out var b) || b.ValueKind != JsonValueKind.String) continue;
                    cards.Add(new FlashcardDto { Front = f.GetString()!, Back = b.GetString()! });
                }
            }
            if (cards.Count == 0)
                return ApiResponse<List<FlashcardDto>>.Fail("الذكاء الاصطناعي مش عارف يبني البطاقات — جرب تاني");

            return ApiResponse<List<FlashcardDto>>.Ok(cards);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Study flashcards parse failed: {ex.Message}");
            return ApiResponse<List<FlashcardDto>>.Fail("الذكاء الاصطناعي رجع رد مش مفهوم — جرب تاني");
        }
    }
}

public class CompareTopicsCommandHandler(IApplicationDbContext db, IGeminiService gemini)
    : StudyAssistantBase(gemini), IRequestHandler<CompareTopicsCommand, ApiResponse<CompareResultDto>>
{
    public async Task<ApiResponse<CompareResultDto>> Handle(CompareTopicsCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.TopicA) || string.IsNullOrWhiteSpace(request.TopicB))
            return ApiResponse<CompareResultDto>.Fail("اكتب الموضوعين اللي عايز تقارنهم");

        var course = await db.Courses.AsNoTracking().FirstOrDefaultAsync(c => c.Id == request.CourseId, ct);
        if (course is null)
            return ApiResponse<CompareResultDto>.Fail("المادة غير موجودة");

        var lessons = await db.Lessons.AsNoTracking()
            .Where(l => l.CourseId == request.CourseId)
            .ToListAsync(ct);

        var context = CourseContext(lessons);
        if (string.IsNullOrWhiteSpace(context))
            return ApiResponse<CompareResultDto>.Fail("المادة دي مفيش فيها دروس للمقارنة");

        var system = "أنت مدرّس تاريخ وجغرافيا. قارن بين الموضوعين بناءً على محتوى المادة المقدم فقط. إن كان أحد الموضوعين غير موجود في المحتوى قل ذلك بوضوح ولا تختلق معلومات.";
        var prompt = $"محتوى المادة:\n{context}\n\n" +
                     $"قارن بين: «{request.TopicA}» و «{request.TopicB}» في 4-6 جوانب. " +
                     "رد فقط بـ JSON: {\"points\":[{\"aspect\":\"...\",\"first\":\"...\",\"second\":\"...\"}]}";

        var raw = await gemini.GenerateJsonAsync(system, prompt, ct);
        var cleaned = CleanJson(raw);
        if (cleaned is null)
            return ApiResponse<CompareResultDto>.Fail("الذكاء الاصطناعي مش متاح دلوقتي — جرب بعد شوية");

        try
        {
            using var doc = JsonDocument.Parse(cleaned);
            var root = doc.RootElement;
            var points = new List<ComparePointDto>();
            if (root.TryGetProperty("points", out var arr) && arr.ValueKind == JsonValueKind.Array)
            {
                foreach (var p in arr.EnumerateArray())
                {
                    if (!p.TryGetProperty("aspect", out var a) || a.ValueKind != JsonValueKind.String) continue;
                    if (!p.TryGetProperty("first", out var f) || f.ValueKind != JsonValueKind.String) continue;
                    if (!p.TryGetProperty("second", out var s) || s.ValueKind != JsonValueKind.String) continue;
                    points.Add(new ComparePointDto { Aspect = a.GetString()!, First = f.GetString()!, Second = s.GetString()! });
                }
            }
            if (points.Count == 0)
                return ApiResponse<CompareResultDto>.Fail("الذكاء الاصطناعي مش عارف يقارن بين الموضوعين — جرب تاني");

            return ApiResponse<CompareResultDto>.Ok(new CompareResultDto
            {
                TopicA = request.TopicA,
                TopicB = request.TopicB,
                Points = points
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Study compare parse failed: {ex.Message}");
            return ApiResponse<CompareResultDto>.Fail("الذكاء الاصطناعي رجع رد مش مفهوم — جرب تاني");
        }
    }
}
