using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Entities;

namespace MrSiam.Application.Features.StudentEngagement;

public record ToggleBookmarkCommand(int StudentId, string Kind, int? LessonId, int? ExamId) : IRequest<ApiResponse<bool>>;

public record GetBookmarksQuery(int StudentId, string? Kind, int? CourseId) : IRequest<ApiResponse<IReadOnlyList<BookmarkDto>>>;

public class ToggleBookmarkCommandHandler(IApplicationDbContext db)
    : IRequestHandler<ToggleBookmarkCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(ToggleBookmarkCommand request, CancellationToken ct)
    {
        var existing = await db.Bookmarks.FirstOrDefaultAsync(
            b => b.StudentId == request.StudentId && b.Kind == request.Kind
                 && b.LessonId == request.LessonId && b.ExamId == request.ExamId, ct);

        if (existing is not null)
        {
            db.Bookmarks.Remove(existing);
            await db.SaveChangesAsync(ct);
            return ApiResponse<bool>.Ok(false, "اتشالت من الإشارات المرجعية");
        }

        if (request.Kind == "lesson" && request.LessonId is not null
            && !await db.Lessons.AnyAsync(l => l.Id == request.LessonId, ct))
            return ApiResponse<bool>.Fail("الدرس غير موجود");

        if (request.Kind == "exam" && request.ExamId is not null
            && !await db.Exams.AnyAsync(e => e.Id == request.ExamId, ct))
            return ApiResponse<bool>.Fail("الامتحان غير موجود");

        db.Bookmarks.Add(new Bookmark
        {
            StudentId = request.StudentId,
            Kind = request.Kind,
            LessonId = request.LessonId,
            ExamId = request.ExamId,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true, "اتضافت للإشارات المرجعية");
    }
}

public class GetBookmarksQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetBookmarksQuery, ApiResponse<IReadOnlyList<BookmarkDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<BookmarkDto>>> Handle(GetBookmarksQuery request, CancellationToken ct)
    {
        var query = db.Bookmarks.AsNoTracking().Where(b => b.StudentId == request.StudentId);
        if (!string.IsNullOrEmpty(request.Kind))
            query = query.Where(b => b.Kind == request.Kind);
        if (request.CourseId is not null)
            query = query.Where(b => b.Lesson != null && b.Lesson.CourseId == request.CourseId);

        var bookmarks = await query
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new BookmarkDto
            {
                Id = b.Id,
                Kind = b.Kind,
                LessonId = b.LessonId,
                LessonTitle = b.Lesson != null ? b.Lesson.Title : string.Empty,
                LessonType = b.Lesson != null ? b.Lesson.ContentType : null,
                ExamId = b.ExamId,
                ExamTitle = b.Exam != null ? b.Exam.Title : null,
                CreatedAt = b.CreatedAt
            })
            .ToListAsync(ct);

        return ApiResponse<IReadOnlyList<BookmarkDto>>.Ok(bookmarks);
    }
}
