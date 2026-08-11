using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Entities;

namespace MrSiam.Application.Features.StudentEngagement;

public record CreateNoteCommand(int StudentId, int LessonId, string Text, int? VideoTimestampSec) : IRequest<ApiResponse<int>>;

public record UpdateNoteCommand(int Id, int StudentId, string Text) : IRequest<ApiResponse<bool>>;

public record DeleteNoteCommand(int Id, int StudentId) : IRequest<ApiResponse<bool>>;

public record GetLessonNotesQuery(int StudentId, int LessonId) : IRequest<ApiResponse<IReadOnlyList<NoteDto>>>;

public class CreateNoteCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CreateNoteCommand, ApiResponse<int>>
{
    public async Task<ApiResponse<int>> Handle(CreateNoteCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Text))
            return ApiResponse<int>.Fail("اكتب الملاحظة الأول");

        if (!await db.Lessons.AnyAsync(l => l.Id == request.LessonId, ct))
            return ApiResponse<int>.Fail("الدرس غير موجود");

        var note = new StudentNote
        {
            StudentId = request.StudentId,
            LessonId = request.LessonId,
            Text = request.Text.Trim(),
            VideoTimestampSec = request.VideoTimestampSec,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.StudentNotes.Add(note);
        await db.SaveChangesAsync(ct);
        return ApiResponse<int>.Ok(note.Id, "اتسجلت ملاحظتك");
    }
}

public class UpdateNoteCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateNoteCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(UpdateNoteCommand request, CancellationToken ct)
    {
        var note = await db.StudentNotes.FirstOrDefaultAsync(n => n.Id == request.Id && n.StudentId == request.StudentId, ct);
        if (note is null)
            return ApiResponse<bool>.Fail("الملاحظة غير موجودة");

        note.Text = request.Text.Trim();
        note.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true, "تم التعديل");
    }
}

public class DeleteNoteCommandHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteNoteCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(DeleteNoteCommand request, CancellationToken ct)
    {
        var note = await db.StudentNotes.FirstOrDefaultAsync(n => n.Id == request.Id && n.StudentId == request.StudentId, ct);
        if (note is null)
            return ApiResponse<bool>.Fail("الملاحظة غير موجودة");

        db.StudentNotes.Remove(note);
        await db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true, "تم الحذف");
    }
}

public class GetLessonNotesQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetLessonNotesQuery, ApiResponse<IReadOnlyList<NoteDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<NoteDto>>> Handle(GetLessonNotesQuery request, CancellationToken ct)
    {
        var lessonTitle = await db.Lessons.AsNoTracking().Where(l => l.Id == request.LessonId).Select(l => l.Title).FirstOrDefaultAsync(ct) ?? string.Empty;

        var notes = await db.StudentNotes
            .AsNoTracking()
            .Where(n => n.StudentId == request.StudentId && n.LessonId == request.LessonId)
            .OrderByDescending(n => n.UpdatedAt)
            .Select(n => new NoteDto
            {
                Id = n.Id,
                LessonId = n.LessonId,
                LessonTitle = lessonTitle,
                Text = n.Text,
                VideoTimestampSec = n.VideoTimestampSec,
                CreatedAt = n.CreatedAt,
                UpdatedAt = n.UpdatedAt
            })
            .ToListAsync(ct);

        return ApiResponse<IReadOnlyList<NoteDto>>.Ok(notes);
    }
}
