using MrSiam.Domain.Common;

namespace MrSiam.Domain.Entities;

public class LiveLesson : Entity
{
    public int? CourseId { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public DateTime ScheduledAt { get; set; }
    public int DurationMinutes { get; set; } = 60;
    public string? MeetUrl { get; set; }
    public bool IsCancelled { get; set; }

    public Course? Course { get; set; }
}
