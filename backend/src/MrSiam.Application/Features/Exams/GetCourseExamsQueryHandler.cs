using MediatR;
using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Application.Common;
using MrSiam.Domain.Enums;

namespace MrSiam.Application.Features.Exams;

public record GetCourseExamsQuery(int CourseId, int? StudentId = null, bool IncludeUnpublished = false) : IRequest<ApiResponse<IReadOnlyList<ExamListItemDto>>>;

public class GetCourseExamsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetCourseExamsQuery, ApiResponse<IReadOnlyList<ExamListItemDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<ExamListItemDto>>> Handle(GetCourseExamsQuery request, CancellationToken ct)
    {
        var exams = await db.Exams
            .AsNoTracking()
            .Where(e => e.CourseId == request.CourseId && (e.IsPublished || request.IncludeUnpublished))
            .OrderBy(e => e.LessonId == null ? 0 : e.LessonId).ThenBy(e => e.Id)
            .Select(e => new ExamListItemDto
            {
                Id = e.Id,
                CourseId = e.CourseId,
                LessonId = e.LessonId,
                CourseTitle = e.Course != null ? e.Course.Title : string.Empty,
                Title = e.Title,
                Type = e.Type,
                TypeAr = e.Type.ToString(),
                DurationMinutes = e.DurationMinutes,
                TotalMarks = e.TotalMarks,
                IsPublished = e.IsPublished,
                QuestionCount = e.Questions.Count
            })
            .ToListAsync(ct);

        if (request.StudentId is not null)
        {
            var lessonExamIds = await db.Exams.AsNoTracking()
                .Where(e => e.CourseId == request.CourseId && e.LessonId != null)
                .Select(e => e.LessonId!.Value)
                .Distinct()
                .ToListAsync(ct);

            var passedLessonExams = await db.ExamAttempts
                .Where(a => a.StudentId == request.StudentId && a.Passed && a.Exam != null && a.Exam.CourseId == request.CourseId)
                .Select(a => a.Exam!.LessonId)
                .Distinct()
                .ToListAsync(ct);
            var completedCount = passedLessonExams.Where(x => x.HasValue && lessonExamIds.Contains(x.Value)).Select(x => x!.Value).Distinct().Count();

            foreach (var exam in exams)
            {
                var attempts = await db.ExamAttempts
                    .Where(a => a.StudentId == request.StudentId && a.ExamId == exam.Id)
                    .OrderByDescending(a => a.Percentage)
                    .ToListAsync(ct);

                exam.HasAttempt = attempts.Count > 0;
                exam.BestPercentage = attempts.FirstOrDefault()?.Percentage;
                exam.AttemptsUsed = attempts.Count;
                exam.IsBoss = exam.Type == ExamType.Boss;
                exam.LessonsTotal = lessonExamIds.Count;
                exam.LessonsCompleted = completedCount;
                exam.BossLocked = exam.IsBoss && lessonExamIds.Count > 0 && completedCount < lessonExamIds.Count;
            }
        }

        return ApiResponse<IReadOnlyList<ExamListItemDto>>.Ok(exams);
    }
}
